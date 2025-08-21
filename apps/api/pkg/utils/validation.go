package utils

import (
	"regexp"
	"strings"

	validator "github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FormatValidationErrors formats validation errors into a readable format
func FormatValidationErrors(err error) []map[string]interface{} {
	var errors []map[string]interface{}

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			errors = append(errors, map[string]interface{}{
				"field":   strings.ToLower(e.Field()),
				"message": getValidationMessage(e),
				"value":   e.Value(),
			})
		}
	}

	return errors
}

// getValidationMessage returns a user-friendly validation error message
func getValidationMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Must be a valid email address"
	case "min":
		return "Must be at least " + e.Param() + " characters"
	case "max":
		return "Must be at most " + e.Param() + " characters"
	case "oneof":
		return "Must be one of: " + e.Param()
	case "alphanum":
		return "Must contain only letters and numbers"
	case "url":
		return "Must be a valid URL"
	case "datetime":
		return "Must be a valid date and time"
	default:
		return "Invalid value"
	}
}

// IsValidObjectID checks if a string is a valid MongoDB ObjectID
func IsValidObjectID(id string) bool {
	_, err := primitive.ObjectIDFromHex(id)
	return err == nil
}

// SanitizeString removes potentially harmful characters from a string
func SanitizeString(input string) string {
	// Remove HTML tags
	re := regexp.MustCompile(`<[^>]*>`)
	cleaned := re.ReplaceAllString(input, "")

	// Trim whitespace
	cleaned = strings.TrimSpace(cleaned)

	return cleaned
}

// IsValidSlug checks if a string is a valid URL slug
func IsValidSlug(slug string) bool {
	if len(slug) < 3 || len(slug) > 50 {
		return false
	}

	// Check if it contains only alphanumeric characters and hyphens
	re := regexp.MustCompile(`^[a-zA-Z0-9\-_]+$`)
	return re.MatchString(slug)
}

// ValidateFieldType checks if a field type is valid
func ValidateFieldType(fieldType string) bool {
	validTypes := []string{"text", "mcq", "checkbox", "rating"}
	for _, validType := range validTypes {
		if fieldType == validType {
			return true
		}
	}
	return false
}

// ValidateFormStatus checks if a form status is valid
func ValidateFormStatus(status string) bool {
	return status == "draft" || status == "published"
}

// CleanHTML removes or escapes HTML content from user input
func CleanHTML(input string) string {
	// Remove script tags and their content
	scriptRe := regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`)
	cleaned := scriptRe.ReplaceAllString(input, "")

	// Remove other potentially dangerous tags
	dangerousRe := regexp.MustCompile(`(?i)<(script|iframe|object|embed|form|input|button)[^>]*>`)
	cleaned = dangerousRe.ReplaceAllString(cleaned, "")

	return cleaned
}
