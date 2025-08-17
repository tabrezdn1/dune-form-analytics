package handlers

import (
	"context"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/websocket"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ResponseHandler handles response-related HTTP requests
type ResponseHandler struct {
	responseService  *services.ResponseService
	analyticsService *services.AnalyticsService
	formService      *services.FormService
	wsHub            *websocket.Hub
	validator        *validator.Validate
}

// NewResponseHandler creates a new response handler
func NewResponseHandler(responseService *services.ResponseService, analyticsService *services.AnalyticsService, formService *services.FormService, wsHub *websocket.Hub) *ResponseHandler {
	return &ResponseHandler{
		responseService:  responseService,
		analyticsService: analyticsService,
		formService:      formService,
		wsHub:            wsHub,
		validator:        validator.New(),
	}
}

// SubmitResponse handles form response submission
func (h *ResponseHandler) SubmitResponse(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	var req models.SubmitResponseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": utils.FormatValidationErrors(err),
		})
	}

	// Add client metadata
	if req.Meta == nil {
		req.Meta = &models.ResponseMeta{}
	}
	req.Meta.IP = &[]string{c.IP()}[0]
	userAgent := c.Get("User-Agent")
	if userAgent != "" {
		req.Meta.UserAgent = &userAgent
	}
	referrer := c.Get("Referer")
	if referrer != "" {
		req.Meta.Referrer = &referrer
	}

	// Submit response
	response, validationErrors, err := h.responseService.SubmitResponse(c.Context(), formID, &req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to submit response",
		})
	}

	// If there are validation errors, return them
	if len(validationErrors) > 0 {
		return c.Status(400).JSON(models.SubmitResponseResponse{
			Success: false,
			Errors:  validationErrors,
			Message: "Validation failed",
		})
	}

	// Update analytics and broadcast real-time update
	go h.updateAnalyticsAndBroadcast(formID, response)

	return c.Status(201).JSON(models.SubmitResponseResponse{
		Success: true,
		ID:      &response.ID,
		Message: "Response submitted successfully",
	})
}

// GetResponses retrieves responses for a form
func (h *ResponseHandler) GetResponses(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	responses, total, err := h.responseService.GetResponses(c.Context(), formID, page, limit, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get responses",
		})
	}

	// Calculate pagination info
	totalPages := (int(total) + limit - 1) / limit
	hasNext := page < totalPages
	hasPrev := page > 1

	return c.JSON(fiber.Map{
		"success": true,
		"data":    responses,
		"pagination": fiber.Map{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": totalPages,
			"hasNext":    hasNext,
			"hasPrev":    hasPrev,
		},
	})
}

// ExportCSV exports form responses as CSV
func (h *ResponseHandler) ExportCSV(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Parse date range (optional)
	var startDate, endDate *time.Time
	if start := c.Query("startDate"); start != "" {
		if parsed, err := time.Parse("2006-01-02", start); err == nil {
			startDate = &parsed
		}
	}
	if end := c.Query("endDate"); end != "" {
		if parsed, err := time.Parse("2006-01-02", end); err == nil {
			endDate = &parsed
		}
	}

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	// Get form to understand field structure
	form, err := h.formService.GetFormByID(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Form not found",
		})
	}

	// Get responses for export
	responses, err := h.responseService.GetResponsesForExport(c.Context(), formID, startDate, endDate, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to export responses",
		})
	}

	// Set CSV headers
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s-responses.csv"`, form.Title))

	// Create CSV writer
	writer := csv.NewWriter(c.Response().BodyWriter())
	defer writer.Flush()

	// Write CSV header
	headers := []string{"Response ID", "Submitted At"}
	fieldMap := make(map[string]string)
	
	for _, field := range form.Fields {
		headers = append(headers, field.Label)
		fieldMap[field.ID] = field.Label
	}
	
	if err := writer.Write(headers); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to write CSV headers",
		})
	}

	// Write response data
	for _, response := range responses {
		row := []string{
			response.ID,
			response.SubmittedAt.Format("2006-01-02 15:04:05"),
		}

		// Create answer map for quick lookup
		answerMap := make(map[string]interface{})
		for _, answer := range response.Answers {
			answerMap[answer.FieldID] = answer.Value
		}

		// Add field values in order
		for _, field := range form.Fields {
			value := ""
			if answer, exists := answerMap[field.ID]; exists {
				value = h.formatAnswerForCSV(answer)
			}
			row = append(row, value)
		}

		if err := writer.Write(row); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to write CSV row",
			})
		}
	}

	return nil
}

// updateAnalyticsAndBroadcast updates analytics and broadcasts to WebSocket clients
func (h *ResponseHandler) updateAnalyticsAndBroadcast(formID string, response *models.ResponseData) {
	// Convert formID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return
	}

	// Get the form
	form, err := h.formService.GetFormByID(context.Background(), formID, nil)
	if err != nil {
		return
	}

	// Convert response back to internal format for analytics
	internalResponse := &models.Response{
		FormID:      objectID,
		Answers:     response.Answers,
		SubmittedAt: response.SubmittedAt,
	}

	// Convert form to internal format
	internalForm := &models.Form{
		Fields: form.Fields,
	}

	// Update analytics
	analytics, err := h.analyticsService.UpdateAnalyticsIncremental(
		context.Background(),
		objectID,
		internalResponse,
		internalForm,
	)
	if err != nil {
		return
	}

	// Broadcast update to WebSocket clients
	h.wsHub.BroadcastToForm(formID, "analytics:update", analytics.ByField)
}

// formatAnswerForCSV formats an answer value for CSV export
func (h *ResponseHandler) formatAnswerForCSV(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case float64:
		return fmt.Sprintf("%.0f", v)
	case []interface{}:
		var strs []string
		for _, item := range v {
			if str, ok := item.(string); ok {
				strs = append(strs, str)
			}
		}
		return strings.Join(strs, "; ")
	case []string:
		return strings.Join(v, "; ")
	default:
		return fmt.Sprintf("%v", v)
	}
}
