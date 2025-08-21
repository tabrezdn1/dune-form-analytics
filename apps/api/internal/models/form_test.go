package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestFormStatus_Constants(t *testing.T) {
	t.Run("Form status constants", func(t *testing.T) {
		assert.Equal(t, FormStatus("draft"), FormStatusDraft)
		assert.Equal(t, FormStatus("published"), FormStatusPublished)

		// Test string conversion
		assert.Equal(t, "draft", string(FormStatusDraft))
		assert.Equal(t, "published", string(FormStatusPublished))
	})
}

func TestFieldType_Constants(t *testing.T) {
	t.Run("Field type constants", func(t *testing.T) {
		assert.Equal(t, FieldType("text"), FieldTypeText)
		assert.Equal(t, FieldType("mcq"), FieldTypeMCQ)
		assert.Equal(t, FieldType("checkbox"), FieldTypeCheckbox)
		assert.Equal(t, FieldType("rating"), FieldTypeRating)

		// Test string conversion
		assert.Equal(t, "text", string(FieldTypeText))
		assert.Equal(t, "mcq", string(FieldTypeMCQ))
		assert.Equal(t, "checkbox", string(FieldTypeCheckbox))
		assert.Equal(t, "rating", string(FieldTypeRating))
	})
}

func TestOption_Structure(t *testing.T) {
	t.Run("Create option with valid data", func(t *testing.T) {
		option := Option{
			ID:    "option1",
			Label: "Option One",
		}

		assert.Equal(t, "option1", option.ID)
		assert.Equal(t, "Option One", option.Label)
	})

	t.Run("Create option with edge case data", func(t *testing.T) {
		option := Option{
			ID:    "a", // minimum length
			Label: "A", // minimum length
		}

		assert.Equal(t, "a", option.ID)
		assert.Equal(t, "A", option.Label)
	})
}

func TestValidation_Structure(t *testing.T) {
	t.Run("Create validation with all fields", func(t *testing.T) {
		minLen := 5
		maxLen := 100
		min := 1
		max := 10
		pattern := "^[a-zA-Z]+$"

		validation := &Validation{
			MinLen:  &minLen,
			MaxLen:  &maxLen,
			Min:     &min,
			Max:     &max,
			Pattern: &pattern,
		}

		assert.NotNil(t, validation.MinLen)
		assert.Equal(t, 5, *validation.MinLen)
		assert.NotNil(t, validation.MaxLen)
		assert.Equal(t, 100, *validation.MaxLen)
		assert.NotNil(t, validation.Min)
		assert.Equal(t, 1, *validation.Min)
		assert.NotNil(t, validation.Max)
		assert.Equal(t, 10, *validation.Max)
		assert.NotNil(t, validation.Pattern)
		assert.Equal(t, "^[a-zA-Z]+$", *validation.Pattern)
	})

	t.Run("Create validation with nil fields", func(t *testing.T) {
		validation := &Validation{
			MinLen:  nil,
			MaxLen:  nil,
			Min:     nil,
			Max:     nil,
			Pattern: nil,
		}

		assert.Nil(t, validation.MinLen)
		assert.Nil(t, validation.MaxLen)
		assert.Nil(t, validation.Min)
		assert.Nil(t, validation.Max)
		assert.Nil(t, validation.Pattern)
	})
}

func TestVisibilityCondition_Structure(t *testing.T) {
	t.Run("Create visibility condition with string value", func(t *testing.T) {
		condition := VisibilityCondition{
			WhenFieldID: "field1",
			Op:          "eq",
			Value:       "expected_value",
		}

		assert.Equal(t, "field1", condition.WhenFieldID)
		assert.Equal(t, "eq", condition.Op)
		assert.Equal(t, "expected_value", condition.Value)
	})

	t.Run("Create visibility condition with numeric value", func(t *testing.T) {
		condition := VisibilityCondition{
			WhenFieldID: "rating_field",
			Op:          "gt",
			Value:       3,
		}

		assert.Equal(t, "rating_field", condition.WhenFieldID)
		assert.Equal(t, "gt", condition.Op)
		assert.Equal(t, 3, condition.Value)
	})

	t.Run("Create visibility condition with boolean value", func(t *testing.T) {
		condition := VisibilityCondition{
			WhenFieldID: "checkbox_field",
			Op:          "eq",
			Value:       true,
		}

		assert.Equal(t, "checkbox_field", condition.WhenFieldID)
		assert.Equal(t, "eq", condition.Op)
		assert.Equal(t, true, condition.Value)
	})
}

func TestField_Structure(t *testing.T) {
	t.Run("Create text field with validation", func(t *testing.T) {
		minLen := 5
		maxLen := 100
		validation := &Validation{
			MinLen: &minLen,
			MaxLen: &maxLen,
		}

		field := Field{
			ID:         "text_field_1",
			Type:       FieldTypeText,
			Label:      "Full Name",
			Required:   true,
			Options:    nil,
			Validation: validation,
			Visibility: nil,
		}

		assert.Equal(t, "text_field_1", field.ID)
		assert.Equal(t, FieldTypeText, field.Type)
		assert.Equal(t, "Full Name", field.Label)
		assert.True(t, field.Required)
		assert.Nil(t, field.Options)
		assert.NotNil(t, field.Validation)
		assert.Nil(t, field.Visibility)
	})

	t.Run("Create MCQ field with options", func(t *testing.T) {
		options := []Option{
			{ID: "opt1", Label: "Option 1"},
			{ID: "opt2", Label: "Option 2"},
			{ID: "opt3", Label: "Option 3"},
		}

		field := Field{
			ID:         "mcq_field_1",
			Type:       FieldTypeMCQ,
			Label:      "Choose your preference",
			Required:   false,
			Options:    options,
			Validation: nil,
			Visibility: nil,
		}

		assert.Equal(t, "mcq_field_1", field.ID)
		assert.Equal(t, FieldTypeMCQ, field.Type)
		assert.False(t, field.Required)
		assert.Len(t, field.Options, 3)
		assert.Equal(t, "opt1", field.Options[0].ID)
		assert.Equal(t, "Option 1", field.Options[0].Label)
	})

	t.Run("Create field with visibility condition", func(t *testing.T) {
		visibility := &VisibilityCondition{
			WhenFieldID: "previous_field",
			Op:          "eq",
			Value:       "show_this",
		}

		field := Field{
			ID:         "conditional_field",
			Type:       FieldTypeText,
			Label:      "Additional Info",
			Required:   false,
			Options:    nil,
			Validation: nil,
			Visibility: visibility,
		}

		assert.Equal(t, "conditional_field", field.ID)
		assert.NotNil(t, field.Visibility)
		assert.Equal(t, "previous_field", field.Visibility.WhenFieldID)
		assert.Equal(t, "eq", field.Visibility.Op)
		assert.Equal(t, "show_this", field.Visibility.Value)
	})
}

func TestCreateFormRequest_Structure(t *testing.T) {
	t.Run("Create form request with description", func(t *testing.T) {
		description := "This is a test form description"
		fields := []Field{
			{
				ID:       "field1",
				Type:     FieldTypeText,
				Label:    "Name",
				Required: true,
			},
		}

		request := CreateFormRequest{
			Title:       "Test Form",
			Description: &description,
			Fields:      fields,
		}

		assert.Equal(t, "Test Form", request.Title)
		assert.NotNil(t, request.Description)
		assert.Equal(t, "This is a test form description", *request.Description)
		assert.Len(t, request.Fields, 1)
		assert.Equal(t, "field1", request.Fields[0].ID)
	})

	t.Run("Create form request without description", func(t *testing.T) {
		fields := []Field{
			{ID: "field1", Type: FieldTypeText, Label: "Name", Required: true},
		}

		request := CreateFormRequest{
			Title:       "Simple Form",
			Description: nil,
			Fields:      fields,
		}

		assert.Equal(t, "Simple Form", request.Title)
		assert.Nil(t, request.Description)
		assert.Len(t, request.Fields, 1)
	})
}

func TestUpdateFormRequest_Structure(t *testing.T) {
	t.Run("Create update request with all fields", func(t *testing.T) {
		title := "Updated Form Title"
		description := "Updated description"
		status := FormStatusPublished
		fields := []Field{
			{ID: "field1", Type: FieldTypeText, Label: "Updated Field", Required: false},
		}

		request := UpdateFormRequest{
			Title:       &title,
			Description: &description,
			Status:      &status,
			Fields:      fields,
		}

		assert.NotNil(t, request.Title)
		assert.Equal(t, "Updated Form Title", *request.Title)
		assert.NotNil(t, request.Description)
		assert.Equal(t, "Updated description", *request.Description)
		assert.NotNil(t, request.Status)
		assert.Equal(t, FormStatusPublished, *request.Status)
		assert.Len(t, request.Fields, 1)
	})

	t.Run("Create partial update request", func(t *testing.T) {
		status := FormStatusDraft

		request := UpdateFormRequest{
			Title:       nil,
			Description: nil,
			Status:      &status,
			Fields:      nil,
		}

		assert.Nil(t, request.Title)
		assert.Nil(t, request.Description)
		assert.NotNil(t, request.Status)
		assert.Equal(t, FormStatusDraft, *request.Status)
		assert.Nil(t, request.Fields)
	})
}

func TestFormResponse_Structure(t *testing.T) {
	t.Run("Create form response with all fields", func(t *testing.T) {
		ownerID := "user123"
		description := "Form description"
		fields := []Field{
			{ID: "field1", Type: FieldTypeText, Label: "Name", Required: true},
		}
		createdAt := time.Date(2024, 8, 20, 10, 0, 0, 0, time.UTC)
		updatedAt := time.Date(2024, 8, 20, 15, 0, 0, 0, time.UTC)

		response := FormResponse{
			ID:          "507f1f77bcf86cd799439011",
			OwnerID:     &ownerID,
			Title:       "Test Form",
			Description: &description,
			Status:      "published",
			ShareSlug:   "test-form",
			Fields:      fields,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
		}

		assert.Equal(t, "507f1f77bcf86cd799439011", response.ID)
		assert.NotNil(t, response.OwnerID)
		assert.Equal(t, "user123", *response.OwnerID)
		assert.Equal(t, "Test Form", response.Title)
		assert.NotNil(t, response.Description)
		assert.Equal(t, "Form description", *response.Description)
		assert.Equal(t, "published", response.Status)
		assert.Equal(t, "test-form", response.ShareSlug)
		assert.Len(t, response.Fields, 1)
		assert.Equal(t, createdAt, response.CreatedAt)
		assert.Equal(t, updatedAt, response.UpdatedAt)
	})

	t.Run("Create minimal form response", func(t *testing.T) {
		response := FormResponse{
			ID:          "507f1f77bcf86cd799439011",
			OwnerID:     nil,
			Title:       "Minimal Form",
			Description: nil,
			Status:      "draft",
			ShareSlug:   "minimal-form",
			Fields:      []Field{},
			CreatedAt:   time.Time{},
			UpdatedAt:   time.Time{},
		}

		assert.Equal(t, "507f1f77bcf86cd799439011", response.ID)
		assert.Nil(t, response.OwnerID)
		assert.Equal(t, "Minimal Form", response.Title)
		assert.Nil(t, response.Description)
		assert.Equal(t, "draft", response.Status)
		assert.Empty(t, response.Fields)
	})
}

func TestForm_ToResponse(t *testing.T) {
	t.Run("Convert form to response", func(t *testing.T) {
		formID := primitive.NewObjectID()
		ownerID := "user123"
		description := "Test form description"
		createdAt := time.Date(2024, 8, 20, 10, 0, 0, 0, time.UTC)
		updatedAt := time.Date(2024, 8, 20, 15, 0, 0, 0, time.UTC)

		fields := []Field{
			{
				ID:       "field1",
				Type:     FieldTypeText,
				Label:    "Name",
				Required: true,
			},
			{
				ID:       "field2",
				Type:     FieldTypeMCQ,
				Label:    "Choice",
				Required: false,
				Options: []Option{
					{ID: "opt1", Label: "Option 1"},
					{ID: "opt2", Label: "Option 2"},
				},
			},
		}

		form := &Form{
			ID:          formID,
			OwnerID:     &ownerID,
			Title:       "Test Form",
			Description: &description,
			Status:      FormStatusPublished,
			ShareSlug:   "test-form",
			Fields:      fields,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
		}

		response := form.ToResponse()

		assert.NotNil(t, response)
		assert.Equal(t, formID.Hex(), response.ID)
		assert.NotNil(t, response.OwnerID)
		assert.Equal(t, "user123", *response.OwnerID)
		assert.Equal(t, "Test Form", response.Title)
		assert.NotNil(t, response.Description)
		assert.Equal(t, "Test form description", *response.Description)
		assert.Equal(t, "published", response.Status)
		assert.Equal(t, "test-form", response.ShareSlug)
		assert.Len(t, response.Fields, 2)
		assert.Equal(t, "field1", response.Fields[0].ID)
		assert.Equal(t, FieldTypeText, response.Fields[0].Type)
		assert.Equal(t, createdAt, response.CreatedAt)
		assert.Equal(t, updatedAt, response.UpdatedAt)
	})

	t.Run("Convert form without owner and description", func(t *testing.T) {
		formID := primitive.NewObjectID()

		form := &Form{
			ID:          formID,
			OwnerID:     nil,
			Title:       "Public Form",
			Description: nil,
			Status:      FormStatusDraft,
			ShareSlug:   "public-form",
			Fields:      []Field{},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		response := form.ToResponse()

		assert.NotNil(t, response)
		assert.Equal(t, formID.Hex(), response.ID)
		assert.Nil(t, response.OwnerID)
		assert.Equal(t, "Public Form", response.Title)
		assert.Nil(t, response.Description)
		assert.Equal(t, "draft", response.Status)
		assert.Empty(t, response.Fields)
	})
}

func TestForm_ToPublicResponse(t *testing.T) {
	t.Run("Convert form to public response", func(t *testing.T) {
		formID := primitive.NewObjectID()
		description := "Public form description"

		fields := []Field{
			{
				ID:       "public_field1",
				Type:     FieldTypeText,
				Label:    "Your Name",
				Required: true,
			},
			{
				ID:       "public_field2",
				Type:     FieldTypeRating,
				Label:    "Rate our service",
				Required: false,
			},
		}

		form := &Form{
			ID:          formID,
			OwnerID:     stringPtr("private_owner"),
			Title:       "Public Survey",
			Description: &description,
			Status:      FormStatusPublished,
			ShareSlug:   "public-survey",
			Fields:      fields,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		publicResponse := form.ToPublicResponse()

		assert.NotNil(t, publicResponse)
		assert.Equal(t, formID.Hex(), publicResponse.ID)
		assert.Equal(t, "Public Survey", publicResponse.Title)
		assert.NotNil(t, publicResponse.Description)
		assert.Equal(t, "Public form description", *publicResponse.Description)
		assert.Len(t, publicResponse.Fields, 2)
		assert.Equal(t, "public_field1", publicResponse.Fields[0].ID)
		assert.Equal(t, "Your Name", publicResponse.Fields[0].Label)

		// Note: Public response should not include OwnerID, Status, ShareSlug, dates
		// This is implicit in the PublicFormResponse struct definition
	})

	t.Run("Convert form to public response without description", func(t *testing.T) {
		formID := primitive.NewObjectID()

		form := &Form{
			ID:          formID,
			OwnerID:     stringPtr("owner"),
			Title:       "Simple Public Form",
			Description: nil,
			Status:      FormStatusPublished,
			ShareSlug:   "simple-public",
			Fields:      []Field{},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		publicResponse := form.ToPublicResponse()

		assert.NotNil(t, publicResponse)
		assert.Equal(t, formID.Hex(), publicResponse.ID)
		assert.Equal(t, "Simple Public Form", publicResponse.Title)
		assert.Nil(t, publicResponse.Description)
		assert.Empty(t, publicResponse.Fields)
	})
}

// Helper function for creating string pointers
func stringPtr(s string) *string {
	return &s
}
