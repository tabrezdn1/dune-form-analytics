package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// FormService handles form-related business logic
type FormService struct {
	collections *database.Collections
}

// NewFormService creates a new form service
func NewFormService(collections *database.Collections) *FormService {
	return &FormService{
		collections: collections,
	}
}

// CreateForm creates a new form
func (s *FormService) CreateForm(ctx context.Context, req *models.CreateFormRequest, ownerID *string) (*models.FormResponse, error) {
	// Generate form ID first
	formID := primitive.NewObjectID()

	// ALWAYS use Form ID suffix strategy for guaranteed uniqueness
	baseSlug := utils.GenerateSlug(req.Title)

	// Take last 8 characters of the ObjectID hex string
	// This guarantees uniqueness since ObjectIDs are unique
	idSuffix := formID.Hex()[len(formID.Hex())-8:]
	shareSlug := fmt.Sprintf("%s-%s", baseSlug, idSuffix)

	// No need to check for collisions - ObjectID suffix guarantees uniqueness

	// Create form document
	form := &models.Form{
		ID:          formID,
		OwnerID:     ownerID,
		Title:       req.Title,
		Description: req.Description,
		Status:      models.FormStatusDraft,
		ShareSlug:   shareSlug,
		Fields:      req.Fields,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Insert form into database
	_, err := s.collections.Forms.InsertOne(ctx, form)
	if err != nil {
		return nil, fmt.Errorf("failed to create form: %w", err)
	}

	// Initialize analytics for the form
	analytics := models.InitializeAnalytics(form.ID, form.Fields)
	_, err = s.collections.Analytics.InsertOne(ctx, analytics)
	if err != nil {
		// Log error but don't fail form creation
		log.Printf("WARN: Failed to initialize analytics for form %s: %v", form.ID.Hex(), err)
	}

	return form.ToResponse(), nil
}

// GetFormByID retrieves a form by its ID
func (s *FormService) GetFormByID(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error) {
	formObjectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	filter := bson.M{"_id": formObjectID}

	// If ownerID is provided, add it to filter for access control
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	var form models.Form
	err = s.collections.Forms.FindOne(ctx, filter).Decode(&form)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("form not found")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	return form.ToResponse(), nil
}

// GetFormBySlug retrieves a form by its share slug (public access)
func (s *FormService) GetFormBySlug(ctx context.Context, slug string) (*models.PublicFormResponse, error) {
	filter := bson.M{
		"shareSlug": slug,
		"status":    models.FormStatusPublished,
	}

	var form models.Form
	err := s.collections.Forms.FindOne(ctx, filter).Decode(&form)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("form not found or not published")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	return form.ToPublicResponse(), nil
}

// UpdateForm updates an existing form
func (s *FormService) UpdateForm(ctx context.Context, formID string, req *models.UpdateFormRequest, ownerID *string) (*models.FormResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Get existing form to compare field changes
	var existingForm models.Form
	filter := bson.M{"_id": objectID}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	err = s.collections.Forms.FindOne(ctx, filter).Decode(&existingForm)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("form not found")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	// Build update document
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if req.Title != nil {
		update["$set"].(bson.M)["title"] = *req.Title
	}
	if req.Description != nil {
		update["$set"].(bson.M)["description"] = *req.Description
	}
	if req.Status != nil {
		update["$set"].(bson.M)["status"] = *req.Status
	}
	if req.Fields != nil {
		update["$set"].(bson.M)["fields"] = req.Fields

		// Smart analytics preservation logic
		shouldResetAnalytics := false
		var incompatibleChanges []string

		// Check for incompatible field changes
		existingFieldMap := make(map[string]models.Field)
		for _, field := range existingForm.Fields {
			existingFieldMap[field.ID] = field
		}

		newFieldMap := make(map[string]models.Field)
		for _, field := range req.Fields {
			newFieldMap[field.ID] = field

			// Check if this field existed before and if the type changed
			if existingField, exists := existingFieldMap[field.ID]; exists {
				if existingField.Type != field.Type {
					shouldResetAnalytics = true
					incompatibleChanges = append(incompatibleChanges,
						fmt.Sprintf("Field '%s' type changed from %s to %s",
							field.ID, existingField.Type, field.Type))
				}
			}
		}

		// Check for deleted fields (fields that existed before but not in new update)
		for fieldID := range existingFieldMap {
			if _, exists := newFieldMap[fieldID]; !exists {
				shouldResetAnalytics = true
				incompatibleChanges = append(incompatibleChanges,
					fmt.Sprintf("Field '%s' was deleted", fieldID))
			}
		}

		// Update analytics based on the type of changes
		var existingAnalytics models.Analytics
		err = s.collections.Analytics.FindOne(ctx, bson.M{"_id": objectID}).Decode(&existingAnalytics)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				// Initialize analytics if they don't exist
				analytics := models.InitializeAnalytics(objectID, req.Fields)
				_, err = s.collections.Analytics.InsertOne(ctx, analytics)
				if err != nil {
					log.Printf("WARN: Failed to create analytics for form %s: %v", formID, err)
				}
			} else {
				log.Printf("WARN: Failed to get analytics for form %s: %v", formID, err)
			}
		} else {
			if shouldResetAnalytics {
				// Reset analytics due to incompatible changes
				log.Printf("INFO: Resetting analytics for form %s due to incompatible changes: %v",
					formID, incompatibleChanges)

				newAnalytics := models.InitializeAnalytics(objectID, req.Fields)
				newAnalytics.UpdatedAt = time.Now()

				upsert := true
				_, err = s.collections.Analytics.ReplaceOne(
					ctx,
					bson.M{"_id": objectID},
					newAnalytics,
					&options.ReplaceOptions{Upsert: &upsert},
				)
				if err != nil {
					log.Printf("WARN: Failed to reset analytics for form %s: %v", formID, err)
				}
			} else {
				// Preserve existing analytics data (compatible changes only)
				updatedByField := make(map[string]models.FieldAnalytics)

				// Keep existing field analytics and add new ones
				for _, field := range req.Fields {
					if existingFieldAnalytics, exists := existingAnalytics.ByField[field.ID]; exists {
						// Keep existing analytics for this field
						updatedByField[field.ID] = existingFieldAnalytics
					} else {
						// Initialize analytics for new field
						analytics := models.FieldAnalytics{
							Count: 0,
						}

						// Initialize distribution for MCQ and Checkbox fields
						if field.Type == models.FieldTypeMCQ || field.Type == models.FieldTypeCheckbox {
							analytics.Distribution = make(map[string]int)
							for _, option := range field.Options {
								analytics.Distribution[option.ID] = 0
							}
						}

						updatedByField[field.ID] = analytics
					}
				}

				// Update analytics with preserved data
				existingAnalytics.ByField = updatedByField
				existingAnalytics.UpdatedAt = time.Now()

				upsert := true
				_, err = s.collections.Analytics.ReplaceOne(
					ctx,
					bson.M{"_id": objectID},
					existingAnalytics,
					&options.ReplaceOptions{Upsert: &upsert},
				)
				if err != nil {
					log.Printf("WARN: Failed to update analytics for form %s: %v", formID, err)
				}
			}
		}
	}

	// Build filter for update
	filter = bson.M{"_id": objectID}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	// Update the form
	result, err := s.collections.Forms.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("failed to update form: %w", err)
	}

	if result.MatchedCount == 0 {
		return nil, fmt.Errorf("form not found")
	}

	// Return updated form
	return s.GetFormByID(ctx, formID, ownerID)
}

// DeleteForm deletes a form and its associated data
func (s *FormService) DeleteForm(ctx context.Context, formID string, ownerID *string) error {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return fmt.Errorf("invalid form ID: %w", err)
	}

	filter := bson.M{"_id": objectID}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	// Delete form
	result, err := s.collections.Forms.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete form: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("form not found")
	}

	// Delete associated responses
	_, err = s.collections.Responses.DeleteMany(ctx, bson.M{"formId": objectID})
	if err != nil {
		log.Printf("WARN: Failed to delete responses for form %s: %v", formID, err)
	}

	// Delete associated analytics
	_, err = s.collections.Analytics.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		log.Printf("WARN: Failed to delete analytics for form %s: %v", formID, err)
	}

	return nil
}

// ListForms lists forms for a user (with pagination)
func (s *FormService) ListForms(ctx context.Context, ownerID *string, page, limit int) ([]*models.FormResponse, int64, error) {
	filter := bson.M{}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	// Get total count
	total, err := s.collections.Forms.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count forms: %w", err)
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Find forms with pagination
	skipVal := int64(skip)
	limitVal := int64(limit)
	cursor, err := s.collections.Forms.Find(ctx, filter, &options.FindOptions{
		Skip:  &skipVal,
		Limit: &limitVal,
		Sort:  bson.M{"createdAt": -1},
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list forms: %w", err)
	}
	defer cursor.Close(ctx)

	var forms []models.Form
	if err := cursor.All(ctx, &forms); err != nil {
		return nil, 0, fmt.Errorf("failed to decode forms: %w", err)
	}

	// Convert to response format
	responses := make([]*models.FormResponse, len(forms))
	for i, form := range forms {
		responses[i] = form.ToResponse()
	}

	return responses, total, nil
}

// PublishForm publishes a draft form
func (s *FormService) PublishForm(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error) {
	req := &models.UpdateFormRequest{
		Status: &[]models.FormStatus{models.FormStatusPublished}[0],
	}
	return s.UpdateForm(ctx, formID, req, ownerID)
}

// UnpublishForm unpublishes a form (sets to draft)
func (s *FormService) UnpublishForm(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error) {
	req := &models.UpdateFormRequest{
		Status: &[]models.FormStatus{models.FormStatusDraft}[0],
	}
	return s.UpdateForm(ctx, formID, req, ownerID)
}

// slugExists checks if a share slug already exists
func (s *FormService) slugExists(ctx context.Context, slug string) (bool, error) {
	count, err := s.collections.Forms.CountDocuments(ctx, bson.M{"shareSlug": slug})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
