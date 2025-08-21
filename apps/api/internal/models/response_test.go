package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestResponse_ToResponseData(t *testing.T) {
	// Create test data
	responseID := primitive.NewObjectID()
	formID := primitive.NewObjectID()
	submittedAt := time.Date(2024, 8, 20, 15, 30, 0, 0, time.UTC)

	testAnswers := []Answer{
		{FieldID: "field1", Value: "answer1"},
		{FieldID: "field2", Value: 42},
		{FieldID: "field3", Value: true},
	}

	testMeta := &ResponseMeta{
		IP:        responseStringPtr("192.168.1.1"),
		UserAgent: responseStringPtr("Mozilla/5.0 Test Browser"),
		Referrer:  responseStringPtr("https://example.com"),
	}

	response := &Response{
		ID:          responseID,
		FormID:      formID,
		Answers:     testAnswers,
		SubmittedAt: submittedAt,
		Meta:        testMeta,
	}

	t.Run("Convert response to response data", func(t *testing.T) {
		data := response.ToResponseData()

		assert.NotNil(t, data)
		assert.Equal(t, responseID.Hex(), data.ID)
		assert.Equal(t, formID.Hex(), data.FormID)
		assert.Equal(t, testAnswers, data.Answers)
		assert.Equal(t, submittedAt, data.SubmittedAt)
		assert.Equal(t, testMeta, data.Meta)
	})

	t.Run("Convert response with nil meta", func(t *testing.T) {
		responseWithoutMeta := &Response{
			ID:          responseID,
			FormID:      formID,
			Answers:     testAnswers,
			SubmittedAt: submittedAt,
			Meta:        nil,
		}

		data := responseWithoutMeta.ToResponseData()

		assert.NotNil(t, data)
		assert.Equal(t, responseID.Hex(), data.ID)
		assert.Equal(t, formID.Hex(), data.FormID)
		assert.Nil(t, data.Meta)
	})

	t.Run("Convert response with empty answers", func(t *testing.T) {
		emptyResponse := &Response{
			ID:          responseID,
			FormID:      formID,
			Answers:     []Answer{},
			SubmittedAt: submittedAt,
			Meta:        nil,
		}

		data := emptyResponse.ToResponseData()

		assert.NotNil(t, data)
		assert.Empty(t, data.Answers)
		assert.Equal(t, responseID.Hex(), data.ID)
	})
}

func TestAnswer_Structure(t *testing.T) {
	t.Run("Create answer with string value", func(t *testing.T) {
		answer := Answer{
			FieldID: "text-field-1",
			Value:   "User response text",
		}

		assert.Equal(t, "text-field-1", answer.FieldID)
		assert.Equal(t, "User response text", answer.Value)
	})

	t.Run("Create answer with numeric value", func(t *testing.T) {
		answer := Answer{
			FieldID: "rating-field-1",
			Value:   5,
		}

		assert.Equal(t, "rating-field-1", answer.FieldID)
		assert.Equal(t, 5, answer.Value)
	})

	t.Run("Create answer with boolean value", func(t *testing.T) {
		answer := Answer{
			FieldID: "checkbox-field-1",
			Value:   true,
		}

		assert.Equal(t, "checkbox-field-1", answer.FieldID)
		assert.Equal(t, true, answer.Value)
	})

	t.Run("Create answer with slice value", func(t *testing.T) {
		answer := Answer{
			FieldID: "multi-checkbox-field",
			Value:   []string{"option1", "option2"},
		}

		assert.Equal(t, "multi-checkbox-field", answer.FieldID)
		assert.Equal(t, []string{"option1", "option2"}, answer.Value)
	})
}

func TestResponseMeta_Structure(t *testing.T) {
	t.Run("Create meta with all fields", func(t *testing.T) {
		meta := &ResponseMeta{
			IP:        responseStringPtr("192.168.1.100"),
			UserAgent: responseStringPtr("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
			Referrer:  responseStringPtr("https://google.com"),
		}

		assert.NotNil(t, meta.IP)
		assert.Equal(t, "192.168.1.100", *meta.IP)
		assert.NotNil(t, meta.UserAgent)
		assert.Contains(t, *meta.UserAgent, "Mozilla")
		assert.NotNil(t, meta.Referrer)
		assert.Equal(t, "https://google.com", *meta.Referrer)
	})

	t.Run("Create meta with nil fields", func(t *testing.T) {
		meta := &ResponseMeta{
			IP:        nil,
			UserAgent: nil,
			Referrer:  nil,
		}

		assert.Nil(t, meta.IP)
		assert.Nil(t, meta.UserAgent)
		assert.Nil(t, meta.Referrer)
	})
}

func TestSubmitResponseRequest_Structure(t *testing.T) {
	t.Run("Create submit request with meta", func(t *testing.T) {
		answers := []Answer{
			{FieldID: "field1", Value: "answer1"},
			{FieldID: "field2", Value: 42},
		}

		meta := &ResponseMeta{
			IP:        responseStringPtr("127.0.0.1"),
			UserAgent: responseStringPtr("Test Agent"),
		}

		request := SubmitResponseRequest{
			Answers: answers,
			Meta:    meta,
		}

		assert.Equal(t, answers, request.Answers)
		assert.Equal(t, meta, request.Meta)
		assert.Len(t, request.Answers, 2)
	})

	t.Run("Create submit request without meta", func(t *testing.T) {
		answers := []Answer{
			{FieldID: "field1", Value: "answer1"},
		}

		request := SubmitResponseRequest{
			Answers: answers,
			Meta:    nil,
		}

		assert.Equal(t, answers, request.Answers)
		assert.Nil(t, request.Meta)
	})
}

func TestValidationError_Structure(t *testing.T) {
	t.Run("Create validation error", func(t *testing.T) {
		validationErr := ValidationError{
			Field:   "email",
			Message: "Email is required",
		}

		assert.Equal(t, "email", validationErr.Field)
		assert.Equal(t, "Email is required", validationErr.Message)
	})
}

func TestSubmitResponseResponse_Structure(t *testing.T) {
	t.Run("Create successful response", func(t *testing.T) {
		id := "507f1f77bcf86cd799439011"
		response := SubmitResponseResponse{
			Success: true,
			ID:      &id,
			Errors:  nil,
			Message: "Response submitted successfully",
		}

		assert.True(t, response.Success)
		assert.NotNil(t, response.ID)
		assert.Equal(t, id, *response.ID)
		assert.Nil(t, response.Errors)
		assert.Equal(t, "Response submitted successfully", response.Message)
	})

	t.Run("Create error response", func(t *testing.T) {
		errors := []ValidationError{
			{Field: "field1", Message: "Field is required"},
			{Field: "field2", Message: "Invalid value"},
		}

		response := SubmitResponseResponse{
			Success: false,
			ID:      nil,
			Errors:  errors,
			Message: "Validation failed",
		}

		assert.False(t, response.Success)
		assert.Nil(t, response.ID)
		assert.Equal(t, errors, response.Errors)
		assert.Len(t, response.Errors, 2)
		assert.Equal(t, "Validation failed", response.Message)
	})
}

// Helper function for creating string pointers (for response tests)
func responseStringPtr(s string) *string {
	return &s
}
