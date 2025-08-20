package handlers

import (
	"strconv"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// FormHandler handles form-related HTTP requests
type FormHandler struct {
	formService interfaces.FormServiceInterface
	validator   *validator.Validate
}

// NewFormHandler creates a new form handler
func NewFormHandler(formService interfaces.FormServiceInterface, validator *validator.Validate) *FormHandler {
	return &FormHandler{
		formService: formService,
		validator:   validator,
	}
}

// CreateForm creates a new form
// @Summary Create a new form
// @Description Create a new form with the provided form data
// @Tags Forms
// @Accept json
// @Produce json
// @Param form body models.CreateFormRequest true "Form creation data"
// @Success 201 {object} models.FormResponse "Form created successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms [post]
func (h *FormHandler) CreateForm(c *fiber.Ctx) error {
	var req models.CreateFormRequest
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

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	// Create form
	form, err := h.formService.CreateForm(c.Context(), &req, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create form",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"data":    form,
	})
}

// GetForm retrieves a form by ID
// @Summary Get a form by ID
// @Description Retrieve form details by form ID
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} models.Form "Form retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id} [get]
func (h *FormHandler) GetForm(c *fiber.Ctx) error {
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

	form, err := h.formService.GetFormByID(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Form not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    form,
	})
}

// GetPublicForm retrieves a public form by slug
// @Summary Get public form by slug
// @Description Retrieve a published form using its slug (public access)
// @Tags Forms
// @Accept json
// @Produce json
// @Param slug path string true "Form slug"
// @Success 200 {object} models.Form "Form retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 404 {object} map[string]interface{} "Form not found or not published"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /forms/slug/{slug} [get]
func (h *FormHandler) GetPublicForm(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form slug is required",
		})
	}

	form, err := h.formService.GetFormBySlug(c.Context(), slug)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Form not found or not published",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    form,
	})
}

// UpdateForm updates an existing form
// @Summary Update form
// @Description Update an existing form's details
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Param form body models.UpdateFormRequest true "Form update data"
// @Success 200 {object} models.Form "Form updated successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id} [patch]
func (h *FormHandler) UpdateForm(c *fiber.Ctx) error {
	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	var req models.UpdateFormRequest
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

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	form, err := h.formService.UpdateForm(c.Context(), formID, &req, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update form",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    form,
	})
}

// DeleteForm deletes a form
// @Summary Delete form
// @Description Delete a form permanently
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} map[string]interface{} "Form deleted successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id} [delete]
func (h *FormHandler) DeleteForm(c *fiber.Ctx) error {
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

	err := h.formService.DeleteForm(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete form",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Form deleted successfully",
	})
}

// ListForms lists forms with pagination
// @Summary List user forms
// @Description Get paginated list of forms for the authenticated user
// @Tags Forms
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} map[string]interface{} "Forms retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms [get]
func (h *FormHandler) ListForms(c *fiber.Ctx) error {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Get owner ID from context (if authenticated)
	var ownerID *string
	if userID := c.Locals("userID"); userID != nil {
		if uid, ok := userID.(string); ok {
			ownerID = &uid
		}
	}

	forms, total, err := h.formService.ListForms(c.Context(), ownerID, page, limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to list forms",
		})
	}

	// Calculate pagination info
	totalPages := (int(total) + limit - 1) / limit
	hasNext := page < totalPages
	hasPrev := page > 1

	return c.JSON(fiber.Map{
		"success": true,
		"data":    forms,
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

// PublishForm publishes a form
// @Summary Publish form
// @Description Publish a form to make it accessible via public slug
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} models.Form "Form published successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/publish [post]
func (h *FormHandler) PublishForm(c *fiber.Ctx) error {
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

	form, err := h.formService.PublishForm(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to publish form",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    form,
		"message": "Form published successfully",
	})
}

// UnpublishForm unpublishes a form
// @Summary Unpublish form
// @Description Unpublish a form to remove public access via slug
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "Form ID"
// @Success 200 {object} models.Form "Form unpublished successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Form not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /forms/{id}/unpublish [post]
func (h *FormHandler) UnpublishForm(c *fiber.Ctx) error {
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

	form, err := h.formService.UnpublishForm(c.Context(), formID, ownerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to unpublish form",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    form,
		"message": "Form unpublished successfully",
	})
}
