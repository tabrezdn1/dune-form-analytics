package handlers

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ResponseHandler handles response-related HTTP requests
type ResponseHandler struct {
	responseService  interfaces.ResponseServiceInterface
	analyticsService interfaces.AnalyticsServiceInterface
	formService      interfaces.FormServiceInterface
	wsManager        interfaces.WebSocketManagerInterface
	validator        *validator.Validate
}

// NewResponseHandler creates a new response handler
func NewResponseHandler(
	responseService interfaces.ResponseServiceInterface,
	analyticsService interfaces.AnalyticsServiceInterface,
	formService interfaces.FormServiceInterface,
	wsManager interfaces.WebSocketManagerInterface,
	validator *validator.Validate,
) *ResponseHandler {
	return &ResponseHandler{
		responseService:  responseService,
		analyticsService: analyticsService,
		formService:      formService,
		wsManager:        wsManager,
		validator:        validator,
	}
}

// SubmitResponse handles form response submission
// @Summary Submit form response
// @Description Submit a response to a published form
// @Tags Responses
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Param response body models.SubmitResponseRequest true "Form response data"
// @Success 201 {object} map[string]interface{} "Response submitted successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /forms/{id}/submit [post]
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
// @Summary Get form responses
// @Description Retrieve paginated responses for a specific form
// @Tags Responses
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} map[string]interface{} "Responses retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/responses [get]
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
// @Summary Export responses as CSV
// @Description Export all form responses as a CSV file
// @Tags Responses
// @Accept json
// @Produce text/csv
// @Param id path string true "Form ID"
// @Success 200 {string} string "CSV file content"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/export.csv [get]
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

// ExportAnalyticsCSV exports form analytics as CSV
// @Summary Export analytics as CSV
// @Description Export form analytics data as a CSV file
// @Tags Analytics
// @Accept json
// @Produce text/csv
// @Param id path string true "Form ID"
// @Success 200 {string} string "CSV file content"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/analytics.csv [get]
func (h *ResponseHandler) ExportAnalyticsCSV(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	// Get form details
	form, err := h.formService.GetFormByID(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Form not found",
		})
	}

	// Get analytics data
	analytics, err := h.analyticsService.GetAnalytics(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get analytics",
		})
	}

	// Set CSV headers
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s-analytics.csv"`, form.Title))

	// Create CSV writer
	writer := csv.NewWriter(c.Response().BodyWriter())
	defer writer.Flush()

	// Write Form Summary
	writer.Write([]string{"FORM ANALYTICS REPORT"})
	writer.Write([]string{""})
	writer.Write([]string{"Form Name", form.Title})
	writer.Write([]string{"Form Status", form.Status})
	writer.Write([]string{"Total Responses", fmt.Sprintf("%d", analytics.TotalResponses)})
	writer.Write([]string{"Export Date", time.Now().Format("2006-01-02 15:04:05")})
	writer.Write([]string{""})

	// Write Field Analytics Header
	writer.Write([]string{"FIELD-BY-FIELD ANALYTICS"})
	writer.Write([]string{""})
	writer.Write([]string{
		"Field Name", 
		"Field Type", 
		"Required", 
		"Total Responses", 
		"Response Rate (%)",
		"Skip Count",
		"Skip Rate (%)",
	})

	// Write field analytics data
	for _, field := range form.Fields {
		fieldAnalytics := analytics.ByField[field.ID]
		responseRate := float64(0)
		skipCount := 0
		skipRate := float64(0)
		
		if analytics.TotalResponses > 0 {
			responseRate = (float64(fieldAnalytics.Count) / float64(analytics.TotalResponses)) * 100
			skipCount = analytics.TotalResponses - fieldAnalytics.Count
			skipRate = (float64(skipCount) / float64(analytics.TotalResponses)) * 100
		}

		row := []string{
			field.Label,
			string(field.Type),
			fmt.Sprintf("%v", field.Required),
			fmt.Sprintf("%d", fieldAnalytics.Count),
			fmt.Sprintf("%.2f", responseRate),
			fmt.Sprintf("%d", skipCount),
			fmt.Sprintf("%.2f", skipRate),
		}
		writer.Write(row)
	}

	writer.Write([]string{""})

	// Write Distribution Data for MCQ/Checkbox fields
	writer.Write([]string{"RESPONSE DISTRIBUTION"})
	writer.Write([]string{""})
	
	for _, field := range form.Fields {
		if field.Type == "mcq" || field.Type == "checkbox" {
			fieldAnalytics := analytics.ByField[field.ID]
			if fieldAnalytics.Distribution != nil && len(fieldAnalytics.Distribution) > 0 {
				writer.Write([]string{fmt.Sprintf("%s (Distribution)", field.Label)})
				writer.Write([]string{"Option", "Count", "Percentage"})
				
				for option, count := range fieldAnalytics.Distribution {
					percentage := float64(0)
					if fieldAnalytics.Count > 0 {
						percentage = (float64(count) / float64(fieldAnalytics.Count)) * 100
					}
					writer.Write([]string{
						option,
						fmt.Sprintf("%d", count),
						fmt.Sprintf("%.2f%%", percentage),
					})
				}
				writer.Write([]string{""})
			}
		}
	}

	// Write Rating Averages
	writer.Write([]string{"RATING FIELDS"})
	writer.Write([]string{""})
	writer.Write([]string{"Field Name", "Average Rating", "Response Count"})
	
	for _, field := range form.Fields {
		if field.Type == "rating" {
			fieldAnalytics := analytics.ByField[field.ID]
			if fieldAnalytics.Average != nil && *fieldAnalytics.Average > 0 {
				writer.Write([]string{
					field.Label,
					fmt.Sprintf("%.2f", *fieldAnalytics.Average),
					fmt.Sprintf("%d", fieldAnalytics.Count),
				})
			}
		}
	}

	return nil
}

// updateAnalyticsAndBroadcast updates analytics and broadcasts to WebSocket clients
func (h *ResponseHandler) updateAnalyticsAndBroadcast(formID string, response *models.ResponseData) {
	// FormID should already be clean and valid - just validate it
	if len(formID) != 24 {
		log.Printf("ERROR: Invalid formID in updateAnalyticsAndBroadcast: '%s' (len:%d)", formID, len(formID))
		return
	}
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

	// Broadcast analytics update via WebSocket
	analyticsData := map[string]interface{}{
		"byField": analytics.ByField,
		"totalResponses": analytics.TotalResponses,
		"updatedAt": analytics.UpdatedAt,
	}
	
	// Broadcast analytics update via WebSocket
	h.wsManager.Broadcast(formID, "analytics:update", analyticsData)
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
