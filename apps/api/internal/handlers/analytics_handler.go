package handlers

import (
	"strconv"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// AnalyticsHandler handles analytics-related HTTP requests
type AnalyticsHandler struct {
	analyticsService interfaces.AnalyticsServiceInterface
	validator        *validator.Validate
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(analyticsService interfaces.AnalyticsServiceInterface, validator *validator.Validate) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
		validator:        validator,
	}
}

// GetAnalytics retrieves analytics for a form
// @Summary Get form analytics
// @Description Retrieve comprehensive analytics data for a specific form
// @Tags Analytics
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} map[string]interface{} "Analytics retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/analytics [get]
func (h *AnalyticsHandler) GetAnalytics(c *fiber.Ctx) error {
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

	analytics, err := h.analyticsService.GetAnalytics(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Analytics not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    analytics,
	})
}

// ComputeAnalytics computes analytics for a form
// @Summary Compute form analytics
// @Description Trigger computation of analytics data for a specific form
// @Tags Analytics
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} map[string]interface{} "Analytics computed successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/analytics/compute [post]
func (h *AnalyticsHandler) ComputeAnalytics(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	var req models.AnalyticsComputeRequest
	if err := c.BodyParser(&req); err != nil {
		// If no body provided, use default parameters
		req = models.AnalyticsComputeRequest{
			FormID: formID,
		}
	} else {
		// Validate request if body was provided
		if err := h.validator.Struct(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Validation failed",
				"details": utils.FormatValidationErrors(err),
			})
		}
	}

	// Parse date range from query parameters if not in body
	if req.StartDate == nil {
		if start := c.Query("startDate"); start != "" {
			if parsed, err := time.Parse("2006-01-02", start); err == nil {
				req.StartDate = &parsed
			}
		}
	}
	if req.EndDate == nil {
		if end := c.Query("endDate"); end != "" {
			if parsed, err := time.Parse("2006-01-02", end); err == nil {
				req.EndDate = &parsed
			}
		}
	}

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	analytics, err := h.analyticsService.ComputeAnalytics(
		c.Context(),
		formID,
		req.StartDate,
		req.EndDate,
		req.Fields,
		ownerID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to compute analytics",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    analytics,
		"message": "Analytics computed successfully",
	})
}

// GetRealTimeMetrics retrieves real-time metrics for a form
// @Summary Get real-time metrics
// @Description Retrieve real-time analytics metrics for a specific form
// @Tags Analytics
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} map[string]interface{} "Real-time metrics retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/metrics [get]
func (h *AnalyticsHandler) GetRealTimeMetrics(c *fiber.Ctx) error {
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

	metrics, err := h.analyticsService.GetRealTimeMetrics(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Failed to get real-time metrics",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    metrics,
	})
}

// GetAnalyticsSummary retrieves analytics summary for all forms
// @Summary Get analytics summary
// @Description Retrieve analytics summary across all user forms
// @Tags Analytics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Analytics summary retrieved successfully"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /analytics/summary [get]
func (h *AnalyticsHandler) GetAnalyticsSummary(c *fiber.Ctx) error {
	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	summaries, err := h.analyticsService.GetAnalyticsSummary(c.Context(), ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get analytics summary",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    summaries,
	})
}

// GetTrendAnalytics retrieves trend analytics for specific fields
// @Summary Get trend analytics
// @Description Retrieve trend analytics data for specific form fields over time
// @Tags Analytics
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Param field query string false "Specific field to analyze"
// @Param period query string false "Time period (7d, 30d, 90d)" default("30d")
// @Success 200 {object} map[string]interface{} "Trend analytics retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/trends [get]
func (h *AnalyticsHandler) GetTrendAnalytics(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Parse query parameters
	fieldID := c.Query("fieldId")
	if fieldID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Field ID is required",
		})
	}

	days, _ := strconv.Atoi(c.Query("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	// Calculate date range
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	// Compute analytics for the specific field and date range
	analytics, err := h.analyticsService.ComputeAnalytics(
		c.Context(),
		formID,
		&startDate,
		&endDate,
		[]string{fieldID},
		ownerID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get trend analytics",
		})
	}

	// Extract field-specific data
	fieldAnalytics, exists := analytics.ByField[fieldID]
	if !exists {
		return c.Status(404).JSON(fiber.Map{
			"error": "Field not found in analytics",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"fieldId":    fieldID,
			"dateRange": fiber.Map{
				"start": startDate.Format("2006-01-02"),
				"end":   endDate.Format("2006-01-02"),
			},
			"analytics": fieldAnalytics,
		},
	})
}
