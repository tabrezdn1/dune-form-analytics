package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FormStatus represents the status of a form
type FormStatus string

const (
	FormStatusDraft     FormStatus = "draft"
	FormStatusPublished FormStatus = "published"
)

// FieldType represents the type of a form field
type FieldType string

const (
	FieldTypeText     FieldType = "text"
	FieldTypeMCQ      FieldType = "mcq"
	FieldTypeCheckbox FieldType = "checkbox"
	FieldTypeRating   FieldType = "rating"
)

// Option represents an option for MCQ or Checkbox fields
type Option struct {
	ID    string `json:"id" bson:"id" validate:"required,min=1,max=50"`
	Label string `json:"label" bson:"label" validate:"required,min=1,max=100"`
}

// Validation represents validation rules for a field
type Validation struct {
	MinLen  *int    `json:"minLen,omitempty" bson:"minLen,omitempty" validate:"omitempty,min=0,max=1000"`
	MaxLen  *int    `json:"maxLen,omitempty" bson:"maxLen,omitempty" validate:"omitempty,min=1,max=10000"`
	Min     *int    `json:"min,omitempty" bson:"min,omitempty" validate:"omitempty,min=1"`
	Max     *int    `json:"max,omitempty" bson:"max,omitempty" validate:"omitempty,max=10"`
	Pattern *string `json:"pattern,omitempty" bson:"pattern,omitempty"`
}

// VisibilityCondition represents conditional field visibility
type VisibilityCondition struct {
	WhenFieldID string      `json:"whenFieldId" bson:"whenFieldId" validate:"required"`
	Op          string      `json:"op" bson:"op" validate:"required,oneof=eq ne in gt lt"`
	Value       interface{} `json:"value" bson:"value" validate:"required"`
}

// Field represents a form field
type Field struct {
	ID         string               `json:"id" bson:"id" validate:"required,min=1,max=50"`
	Type       FieldType            `json:"type" bson:"type" validate:"required,oneof=text mcq checkbox rating"`
	Label      string               `json:"label" bson:"label" validate:"required,min=1,max=200"`
	Required   bool                 `json:"required" bson:"required"`
	Options    []Option             `json:"options,omitempty" bson:"options,omitempty"`
	Validation *Validation          `json:"validation,omitempty" bson:"validation,omitempty"`
	Visibility *VisibilityCondition `json:"visibility,omitempty" bson:"visibility,omitempty"`
}

// Form represents a form document in MongoDB
type Form struct {
	ID          primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	OwnerID     *string            `json:"ownerId,omitempty" bson:"ownerId,omitempty"`
	Title       string             `json:"title" bson:"title" validate:"required,min=1,max=200"`
	Description *string            `json:"description,omitempty" bson:"description,omitempty" validate:"omitempty,max=1000"`
	Status      FormStatus         `json:"status" bson:"status" validate:"required,oneof=draft published"`
	ShareSlug   string             `json:"shareSlug" bson:"shareSlug" validate:"required,min=3,max=50,alphanum"`
	Fields      []Field            `json:"fields" bson:"fields" validate:"required,min=1,max=50,dive"`
	CreatedAt   time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// CreateFormRequest represents the request to create a new form
type CreateFormRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=200"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=1000"`
	Fields      []Field `json:"fields" validate:"required,min=1,max=50,dive"`
}

// UpdateFormRequest represents the request to update a form
type UpdateFormRequest struct {
	Title       *string     `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Description *string     `json:"description,omitempty" validate:"omitempty,max=1000"`
	Status      *FormStatus `json:"status,omitempty" validate:"omitempty,oneof=draft published"`
	Fields      []Field     `json:"fields,omitempty" validate:"omitempty,min=1,max=50,dive"`
}

// FormResponse represents the response when returning form data
type FormResponse struct {
	ID          string    `json:"id"`
	OwnerID     *string   `json:"ownerId,omitempty"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Status      string    `json:"status"`
	ShareSlug   string    `json:"shareSlug"`
	Fields      []Field   `json:"fields"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PublicFormResponse represents the public form data (without sensitive info)
type PublicFormResponse struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	Fields      []Field `json:"fields"`
}

// ToResponse converts a Form model to FormResponse
func (f *Form) ToResponse() *FormResponse {
	return &FormResponse{
		ID:          f.ID.Hex(),
		OwnerID:     f.OwnerID,
		Title:       f.Title,
		Description: f.Description,
		Status:      string(f.Status),
		ShareSlug:   f.ShareSlug,
		Fields:      f.Fields,
		CreatedAt:   f.CreatedAt,
		UpdatedAt:   f.UpdatedAt,
	}
}

// ToPublicResponse converts a Form model to PublicFormResponse
func (f *Form) ToPublicResponse() *PublicFormResponse {
	return &PublicFormResponse{
		ID:          f.ID.Hex(),
		Title:       f.Title,
		Description: f.Description,
		Fields:      f.Fields,
	}
}
