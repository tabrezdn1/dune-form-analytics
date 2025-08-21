package utils

import (
	"errors"
	"testing"

	validator "github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestFormatValidationErrors(t *testing.T) {
	// Create a validator instance
	v := validator.New()

	// Test struct with validation tags
	type TestStruct struct {
		Email   string `validate:"required,email"`
		Name    string `validate:"required,min=2,max=50"`
		Age     int    `validate:"required,min=18"`
		Website string `validate:"omitempty,url"`
	}

	t.Run("Valid struct should return no errors", func(t *testing.T) {
		validStruct := TestStruct{
			Email:   "test@example.com",
			Name:    "John Doe",
			Age:     25,
			Website: "https://example.com",
		}

		err := v.Struct(validStruct)
		assert.NoError(t, err)

		errors := FormatValidationErrors(err)
		assert.Empty(t, errors)
	})

	t.Run("Invalid struct should return formatted errors", func(t *testing.T) {
		invalidStruct := TestStruct{
			Email:   "invalid-email",
			Name:    "",
			Age:     15,
			Website: "not-a-url",
		}

		err := v.Struct(invalidStruct)
		assert.Error(t, err)

		formattedErrors := FormatValidationErrors(err)
		assert.NotEmpty(t, formattedErrors)

		// Check that we have errors for each invalid field
		errorFields := make(map[string]bool)
		for _, errItem := range formattedErrors {
			field, ok := errItem["field"].(string)
			assert.True(t, ok, "Error should have a field name")
			errorFields[field] = true

			// Each error should have required fields
			assert.Contains(t, errItem, "field")
			assert.Contains(t, errItem, "message")
			assert.Contains(t, errItem, "value")

			// Messages should be human-readable
			message, ok := errItem["message"].(string)
			assert.True(t, ok, "Message should be a string")
			assert.NotEmpty(t, message, "Message should not be empty")
		}

		// Verify we have errors for the expected fields
		assert.True(t, errorFields["email"], "Should have error for email field")
		assert.True(t, errorFields["name"], "Should have error for name field")
		assert.True(t, errorFields["age"], "Should have error for age field")
		assert.True(t, errorFields["website"], "Should have error for website field")
	})

	t.Run("Non-validation error should return empty slice", func(t *testing.T) {
		nonValidationError := errors.New("this is not a validation error")

		formattedErrors := FormatValidationErrors(nonValidationError)
		assert.Empty(t, formattedErrors)
	})

	t.Run("Nil error should return empty slice", func(t *testing.T) {
		formattedErrors := FormatValidationErrors(nil)
		assert.Empty(t, formattedErrors)
	})
}

func TestValidationMessageGeneration(t *testing.T) {
	v := validator.New()

	type ValidationTestStruct struct {
		Email     string `validate:"required,email"`
		MinLength string `validate:"min=5"`
		MaxLength string `validate:"max=10"`
		MinValue  int    `validate:"min=18"`
		MaxValue  int    `validate:"max=100"`
		Required  string `validate:"required"`
		URL       string `validate:"url"`
	}

	tests := []struct {
		name           string
		testStruct     ValidationTestStruct
		expectedFields []string
		checkMessages  bool
	}{
		{
			name: "Multiple validation failures",
			testStruct: ValidationTestStruct{
				Email:     "invalid-email",
				MinLength: "123",         // too short (min=5)
				MaxLength: "12345678901", // too long (max=10)
				MinValue:  10,            // too small (min=18)
				MaxValue:  150,           // too large (max=100)
				Required:  "",            // required but empty
				URL:       "not-a-url",   // invalid URL
			},
			expectedFields: []string{"email", "minlength", "maxlength", "minvalue", "maxvalue", "required", "url"},
			checkMessages:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.Struct(tt.testStruct)
			assert.Error(t, err)

			formattedErrors := FormatValidationErrors(err)
			assert.NotEmpty(t, formattedErrors)

			// Verify expected fields have errors
			errorFields := make(map[string]string)
			for _, errItem := range formattedErrors {
				field := errItem["field"].(string)
				message := errItem["message"].(string)
				errorFields[field] = message
			}

			for _, expectedField := range tt.expectedFields {
				assert.Contains(t, errorFields, expectedField, "Should have error for field: %s", expectedField)

				if tt.checkMessages {
					message := errorFields[expectedField]
					assert.NotEmpty(t, message, "Error message should not be empty for field: %s", expectedField)
					assert.NotContains(t, message, "Key:", "Error message should be user-friendly")
				}
			}
		})
	}
}

func TestIsValidObjectID(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "Valid ObjectID",
			input:    primitive.NewObjectID().Hex(),
			expected: true,
		},
		{
			name:     "Invalid ObjectID - too short",
			input:    "123",
			expected: false,
		},
		{
			name:     "Invalid ObjectID - too long",
			input:    "507f1f77bcf86cd799439011extra",
			expected: false,
		},
		{
			name:     "Invalid ObjectID - invalid characters",
			input:    "507f1f77bcf86cd79943901g",
			expected: false,
		},
		{
			name:     "Empty string",
			input:    "",
			expected: false,
		},
		{
			name:     "Valid hex but wrong length",
			input:    "507f1f77bcf86cd7994390",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidObjectID(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Test edge cases for validation error formatting
func TestGetValidationMessage_EdgeCases(t *testing.T) {
	v := validator.New()

	type EdgeCaseStruct struct {
		Field string `validate:"len=5"`
	}

	// Create a validation error
	err := v.Struct(EdgeCaseStruct{Field: "123"})
	assert.Error(t, err)

	// Format the errors
	formattedErrors := FormatValidationErrors(err)
	assert.NotEmpty(t, formattedErrors)

	// Check that we get reasonable error messages
	for _, errItem := range formattedErrors {
		message, ok := errItem["message"].(string)
		assert.True(t, ok)
		assert.NotEmpty(t, message)
		assert.NotContains(t, message, "Key:", "Message should not contain validation tag internals")
	}
}
