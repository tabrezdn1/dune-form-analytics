package services

import (
	"context"
	"fmt"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ResponseService handles response-related business logic
type ResponseService struct {
	collections *database.Collections
}

// NewResponseService creates a new response service
func NewResponseService(collections *database.Collections) *ResponseService {
	return &ResponseService{
		collections: collections,
	}
}

// SubmitResponse submits a new form response
func (s *ResponseService) SubmitResponse(ctx context.Context, formID string, req *models.SubmitResponseRequest) (*models.ResponseData, []models.ValidationError, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Get the form to validate against
	var form models.Form
	err = s.collections.Forms.FindOne(ctx, bson.M{
		"_id":    objectID,
		"status": models.FormStatusPublished,
	}).Decode(&form)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil, fmt.Errorf("form not found or not published")
		}
		return nil, nil, fmt.Errorf("failed to get form: %w", err)
	}

	// Validate the response
	validationErrors := s.validateResponse(&form, req.Answers)
	if len(validationErrors) > 0 {
		return nil, validationErrors, nil
	}

	// Create response document
	response := &models.Response{
		ID:          primitive.NewObjectID(),
		FormID:      objectID,
		Answers:     req.Answers,
		SubmittedAt: time.Now(),
		Meta:        req.Meta,
	}

	// Insert response into database
	_, err = s.collections.Responses.InsertOne(ctx, response)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to submit response: %w", err)
	}

	return response.ToResponseData(), nil, nil
}

// GetResponses retrieves responses for a form with pagination
func (s *ResponseService) GetResponses(ctx context.Context, formID string, page, limit int, ownerID *string) ([]*models.ResponseData, int64, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid form ID: %w", err)
	}

	// Verify form ownership if ownerID is provided
	if ownerID != nil {
		var form models.Form
		err = s.collections.Forms.FindOne(ctx, bson.M{
			"_id":     objectID,
			"ownerId": *ownerID,
		}).Decode(&form)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, 0, fmt.Errorf("form not found or access denied")
			}
			return nil, 0, fmt.Errorf("failed to verify form ownership: %w", err)
		}
	}

	filter := bson.M{"formId": objectID}

	// Get total count
	total, err := s.collections.Responses.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count responses: %w", err)
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Find responses with pagination
	cursor, err := s.collections.Responses.Find(ctx, filter, &options.FindOptions{
		Skip:  &[]int64{int64(skip)}[0],
		Limit: &[]int64{int64(limit)}[0],
		Sort:  bson.M{"submittedAt": -1},
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get responses: %w", err)
	}
	defer cursor.Close(ctx)

	var responses []models.Response
	if err := cursor.All(ctx, &responses); err != nil {
		return nil, 0, fmt.Errorf("failed to decode responses: %w", err)
	}

	// Convert to response format
	responseData := make([]*models.ResponseData, len(responses))
	for i, response := range responses {
		responseData[i] = response.ToResponseData()
	}

	return responseData, total, nil
}

// GetResponsesForExport retrieves all responses for a form (for export)
func (s *ResponseService) GetResponsesForExport(ctx context.Context, formID string, startDate, endDate *time.Time, ownerID *string) ([]*models.ResponseData, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Verify form ownership if ownerID is provided
	if ownerID != nil {
		var form models.Form
		err = s.collections.Forms.FindOne(ctx, bson.M{
			"_id":     objectID,
			"ownerId": *ownerID,
		}).Decode(&form)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, fmt.Errorf("form not found or access denied")
			}
			return nil, fmt.Errorf("failed to verify form ownership: %w", err)
		}
	}

	// Build filter
	filter := bson.M{"formId": objectID}

	// Add date range filter if provided
	if startDate != nil || endDate != nil {
		dateFilter := bson.M{}
		if startDate != nil {
			dateFilter["$gte"] = *startDate
		}
		if endDate != nil {
			dateFilter["$lte"] = *endDate
		}
		filter["submittedAt"] = dateFilter
	}

	// Find all responses
	cursor, err := s.collections.Responses.Find(ctx, filter, &options.FindOptions{
		Sort: bson.M{"submittedAt": 1},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}
	defer cursor.Close(ctx)

	var responses []models.Response
	if err := cursor.All(ctx, &responses); err != nil {
		return nil, fmt.Errorf("failed to decode responses: %w", err)
	}

	// Convert to response format
	responseData := make([]*models.ResponseData, len(responses))
	for i, response := range responses {
		responseData[i] = response.ToResponseData()
	}

	return responseData, nil
}

// validateResponse validates a response against form fields
func (s *ResponseService) validateResponse(form *models.Form, answers []models.Answer) []models.ValidationError {
	var errors []models.ValidationError

	// Create maps for quick lookup
	fieldMap := make(map[string]models.Field)
	answerMap := make(map[string]models.Answer)

	for _, field := range form.Fields {
		fieldMap[field.ID] = field
	}

	for _, answer := range answers {
		answerMap[answer.FieldID] = answer
	}

	// Check required fields
	for _, field := range form.Fields {
		if field.Required {
			answer, exists := answerMap[field.ID]
			if !exists {
				errors = append(errors, models.ValidationError{
					Field:   field.ID,
					Message: fmt.Sprintf("Field '%s' is required", field.Label),
				})
				continue
			}

			// Check if value is empty
			if s.isEmptyValue(answer.Value) {
				errors = append(errors, models.ValidationError{
					Field:   field.ID,
					Message: fmt.Sprintf("Field '%s' cannot be empty", field.Label),
				})
			}
		}
	}

	// Validate each answer
	for _, answer := range answers {
		field, exists := fieldMap[answer.FieldID]
		if !exists {
			errors = append(errors, models.ValidationError{
				Field:   answer.FieldID,
				Message: "Invalid field ID",
			})
			continue
		}

		// Validate based on field type
		if fieldErrors := s.validateFieldValue(field, answer.Value); len(fieldErrors) > 0 {
			errors = append(errors, fieldErrors...)
		}
	}

	return errors
}

// isEmptyValue checks if a value is considered empty
func (s *ResponseService) isEmptyValue(value interface{}) bool {
	if value == nil {
		return true
	}

	switch v := value.(type) {
	case string:
		return v == ""
	case []interface{}:
		return len(v) == 0
	case []string:
		return len(v) == 0
	default:
		return false
	}
}

// validateFieldValue validates a field value based on field type and validation rules
func (s *ResponseService) validateFieldValue(field models.Field, value interface{}) []models.ValidationError {
	var errors []models.ValidationError

	switch field.Type {
	case models.FieldTypeText:
		if str, ok := value.(string); ok {
			if field.Validation != nil {
				if field.Validation.MinLen != nil && len(str) < *field.Validation.MinLen {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: fmt.Sprintf("Minimum length is %d characters", *field.Validation.MinLen),
					})
				}
				if field.Validation.MaxLen != nil && len(str) > *field.Validation.MaxLen {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: fmt.Sprintf("Maximum length is %d characters", *field.Validation.MaxLen),
					})
				}
			}
		} else {
			errors = append(errors, models.ValidationError{
				Field:   field.ID,
				Message: "Invalid text value",
			})
		}

	case models.FieldTypeRating:
		if num, ok := value.(float64); ok {
			intVal := int(num)
			if field.Validation != nil {
				if field.Validation.Min != nil && intVal < *field.Validation.Min {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: fmt.Sprintf("Minimum rating is %d", *field.Validation.Min),
					})
				}
				if field.Validation.Max != nil && intVal > *field.Validation.Max {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: fmt.Sprintf("Maximum rating is %d", *field.Validation.Max),
					})
				}
			}
		} else {
			errors = append(errors, models.ValidationError{
				Field:   field.ID,
				Message: "Invalid rating value",
			})
		}

	case models.FieldTypeMCQ:
		if str, ok := value.(string); ok {
			// Check if the option exists
			validOption := false
			for _, option := range field.Options {
				if option.ID == str {
					validOption = true
					break
				}
			}
			if !validOption {
				errors = append(errors, models.ValidationError{
					Field:   field.ID,
					Message: "Invalid option selected",
				})
			}
		} else {
			errors = append(errors, models.ValidationError{
				Field:   field.ID,
				Message: "Invalid multiple choice value",
			})
		}

	case models.FieldTypeCheckbox:
		if arr, ok := value.([]interface{}); ok {
			// Convert to string array
			strArr := make([]string, len(arr))
			for i, v := range arr {
				if str, ok := v.(string); ok {
					strArr[i] = str
				} else {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: "Invalid checkbox value",
					})
					return errors
				}
			}

			// Check if all options exist
			optionMap := make(map[string]bool)
			for _, option := range field.Options {
				optionMap[option.ID] = true
			}

			for _, selected := range strArr {
				if !optionMap[selected] {
					errors = append(errors, models.ValidationError{
						Field:   field.ID,
						Message: "Invalid checkbox option selected",
					})
				}
			}
		} else {
			errors = append(errors, models.ValidationError{
				Field:   field.ID,
				Message: "Invalid checkbox value format",
			})
		}
	}

	return errors
}
