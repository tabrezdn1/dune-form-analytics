package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Answer represents a single field answer in a form response
type Answer struct {
	FieldID string      `json:"fieldId" bson:"fieldId" validate:"required"`
	Value   interface{} `json:"value" bson:"value" validate:"required"`
}

// ResponseMeta represents metadata about a form submission
type ResponseMeta struct {
	IP        *string `json:"ip,omitempty" bson:"ip,omitempty"`
	UserAgent *string `json:"userAgent,omitempty" bson:"userAgent,omitempty"`
	Referrer  *string `json:"referrer,omitempty" bson:"referrer,omitempty"`
}

// Response represents a form response document in MongoDB
type Response struct {
	ID          primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	FormID      primitive.ObjectID `json:"formId" bson:"formId" validate:"required"`
	Answers     []Answer           `json:"answers" bson:"answers" validate:"required,min=1,dive"`
	SubmittedAt time.Time          `json:"submittedAt" bson:"submittedAt"`
	Meta        *ResponseMeta      `json:"meta,omitempty" bson:"meta,omitempty"`
}

// SubmitResponseRequest represents the request to submit a form response
type SubmitResponseRequest struct {
	Answers []Answer      `json:"answers" validate:"required,min=1,dive"`
	Meta    *ResponseMeta `json:"meta,omitempty"`
}

// ResponseData represents the response when returning response data
type ResponseData struct {
	ID          string        `json:"id"`
	FormID      string        `json:"formId"`
	Answers     []Answer      `json:"answers"`
	SubmittedAt time.Time     `json:"submittedAt"`
	Meta        *ResponseMeta `json:"meta,omitempty"`
}

// ToResponseData converts a Response model to ResponseData
func (r *Response) ToResponseData() *ResponseData {
	return &ResponseData{
		ID:          r.ID.Hex(),
		FormID:      r.FormID.Hex(),
		Answers:     r.Answers,
		SubmittedAt: r.SubmittedAt,
		Meta:        r.Meta,
	}
}

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// SubmitResponseResponse represents the response after submitting a form
type SubmitResponseResponse struct {
	Success bool              `json:"success"`
	ID      *string           `json:"id,omitempty"`
	Errors  []ValidationError `json:"errors,omitempty"`
	Message string            `json:"message"`
}

// ExportFormat represents the format for exporting responses
type ExportFormat string

const (
	ExportFormatCSV ExportFormat = "csv"
	ExportFormatPDF ExportFormat = "pdf"
)

// ExportRequest represents a request to export form responses
type ExportRequest struct {
	Format    ExportFormat `json:"format" validate:"required,oneof=csv pdf"`
	StartDate *time.Time   `json:"startDate,omitempty"`
	EndDate   *time.Time   `json:"endDate,omitempty"`
}
