package services

import (
	"context"
	"fmt"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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
	// Generate unique share slug
	shareSlug := utils.GenerateSlug(req.Title)
	
	// Ensure slug is unique
	for {
		exists, err := s.slugExists(ctx, shareSlug)
		if err != nil {
			return nil, fmt.Errorf("failed to check slug uniqueness: %w", err)
		}
		if !exists {
			break
		}
		shareSlug = utils.GenerateSlug(req.Title) + "-" + utils.GenerateRandomString(4)
	}
	
	// Create form document
	form := &models.Form{
		ID:          primitive.NewObjectID(),
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
		fmt.Printf("Warning: failed to initialize analytics for form %s: %v\n", form.ID.Hex(), err)
	}
	
	return form.ToResponse(), nil
}

// GetFormByID retrieves a form by its ID
func (s *FormService) GetFormByID(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}
	
	filter := bson.M{"_id": objectID}
	
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
		
		// If fields are updated, reinitialize analytics
		analytics := models.InitializeAnalytics(objectID, req.Fields)
		_, err = s.collections.Analytics.ReplaceOne(
			ctx,
			bson.M{"_id": objectID},
			analytics,
		)
		if err != nil {
			fmt.Printf("Warning: failed to update analytics for form %s: %v\n", formID, err)
		}
	}
	
	// Build filter
	filter := bson.M{"_id": objectID}
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
		fmt.Printf("Warning: failed to delete responses for form %s: %v\n", formID, err)
	}
	
	// Delete associated analytics
	_, err = s.collections.Analytics.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		fmt.Printf("Warning: failed to delete analytics for form %s: %v\n", formID, err)
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
	cursor, err := s.collections.Forms.Find(ctx, filter, &mongo.FindOptions{
		Skip:  &[]int64{int64(skip)}[0],
		Limit: &[]int64{int64(limit)}[0],
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
