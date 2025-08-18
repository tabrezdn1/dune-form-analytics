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
