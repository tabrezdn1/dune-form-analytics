package utils

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Simple text",
			input:    "Hello World",
			expected: "hello-world",
		},
		{
			name:     "Text with special characters",
			input:    "User Feedback Form!@#$%",
			expected: "user-feedback-form",
		},
		{
			name:     "Text with numbers",
			input:    "Survey 2024 v1.0",
			expected: "survey-2024-v1-0",
		},
		{
			name:     "Text with multiple spaces",
			input:    "Contact   Us    Form",
			expected: "contact-us-form",
		},
		{
			name:     "Text with leading/trailing spaces",
			input:    "   Newsletter Signup   ",
			expected: "newsletter-signup",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "form",
		},
		{
			name:     "Only special characters",
			input:    "!@#$%^&*()",
			expected: "form",
		},
		{
			name:     "Long text (over 40 chars)",
			input:    "This is a very long form title that exceeds forty characters",
			expected: "this-is-a-very-long-form-title-that-exce",
		},
		{
			name:     "Mixed case with underscores",
			input:    "User_Profile_Update_Form",
			expected: "user-profile-update-form",
		},
		{
			name:     "Unicode characters",
			input:    "Café Survey (French)",
			expected: "caf-survey-french",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GenerateSlug(tt.input)
			assert.Equal(t, tt.expected, result)

			// Additional validations
			assert.LessOrEqual(t, len(result), 40, "Slug should not exceed 40 characters")
			assert.NotEmpty(t, result, "Slug should never be empty")
			assert.NotContains(t, result, " ", "Slug should not contain spaces")
			assert.Regexp(t, "^[a-z0-9-]+$", result, "Slug should only contain lowercase letters, numbers, and hyphens")
		})
	}
}

func TestSanitizeSlug(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Valid slug",
			input:    "valid-slug-123",
			expected: "valid-slug-123",
		},
		{
			name:     "Slug with invalid characters",
			input:    "invalid@slug#123!",
			expected: "invalidslug123",
		},
		{
			name:     "Short slug (under 3 chars)",
			input:    "ab",
			expected: "ab", // Will be extended with random chars, so just check length
		},
		{
			name:     "Long slug (over 50 chars)",
			input:    "this-is-a-very-long-slug-that-exceeds-fifty-characters-limit",
			expected: "this-is-a-very-long-slug-that-exceeds-fifty-char",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "", // Will be extended with random chars
		},
		{
			name:     "Mixed valid and invalid chars",
			input:    "hello_world@123",
			expected: "hello_world123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeSlug(tt.input)

			// Basic validations
			assert.GreaterOrEqual(t, len(result), 3, "Sanitized slug should be at least 3 characters")
			assert.LessOrEqual(t, len(result), 50, "Sanitized slug should not exceed 50 characters")
			assert.Regexp(t, "^[a-zA-Z0-9_-]*$", result, "Sanitized slug should only contain valid characters")

			// Specific expected values (for deterministic cases)
			if tt.expected != "" && len(tt.input) >= 3 && len(tt.input) <= 50 {
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestGenerateRandomString(t *testing.T) {
	tests := []struct {
		name   string
		length int
	}{
		{"Length 5", 5},
		{"Length 10", 10},
		{"Length 20", 20},
		{"Length 1", 1},
		{"Length 0", 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GenerateRandomString(tt.length)

			assert.Equal(t, tt.length, len(result), "Generated string should have expected length")

			if tt.length > 0 {
				// Check that it only contains valid characters
				assert.Regexp(t, "^[a-z0-9]+$", result, "Generated string should only contain lowercase letters and numbers")
			}
		})
	}
}

func TestGenerateRandomStringUniqueness(t *testing.T) {
	// Generate multiple random strings and ensure they're different
	length := 10
	iterations := 100
	generated := make(map[string]bool)

	for i := 0; i < iterations; i++ {
		result := GenerateRandomString(length)
		assert.False(t, generated[result], "Generated string should be unique")
		generated[result] = true
	}
}

// Additional edge case tests to boost coverage
func TestGenerateSlugEdgeCases(t *testing.T) {
	t.Run("Slug with consecutive special characters", func(t *testing.T) {
		result := GenerateSlug("Hello!!!World")
		assert.Equal(t, "hello-world", result)
	})

	t.Run("Slug with mixed whitespace", func(t *testing.T) {
		result := GenerateSlug("Hello\t\nWorld\r")
		assert.Equal(t, "hello-world", result)
	})

	t.Run("Slug exactly 40 characters", func(t *testing.T) {
		input := "This is exactly forty characters long"
		result := GenerateSlug(input)
		assert.LessOrEqual(t, len(result), 40)
		assert.NotEmpty(t, result)
	})

	t.Run("Slug with only numbers", func(t *testing.T) {
		result := GenerateSlug("123456789")
		assert.Equal(t, "123456789", result)
	})

	t.Run("Slug with emoji and unicode", func(t *testing.T) {
		result := GenerateSlug("Hello 🌟 World café")
		assert.NotContains(t, result, "🌟")
		assert.Regexp(t, "^[a-z0-9-]+$", result)
	})
}

func TestSanitizeSlugEdgeCases(t *testing.T) {
	t.Run("Sanitize with only invalid characters", func(t *testing.T) {
		result := SanitizeSlug("!@#$%^&*()")
		assert.GreaterOrEqual(t, len(result), 3)
		assert.Regexp(t, "^[a-zA-Z0-9_-]*$", result)
	})

	t.Run("Sanitize exactly 50 characters", func(t *testing.T) {
		input := "12345678901234567890123456789012345678901234567890" // 50 chars
		result := SanitizeSlug(input)
		assert.Equal(t, 50, len(result))
		assert.Equal(t, input, result)
	})

	t.Run("Sanitize 51 characters (should truncate)", func(t *testing.T) {
		input := "123456789012345678901234567890123456789012345678901" // 51 chars
		result := SanitizeSlug(input)
		assert.Equal(t, 50, len(result))
		assert.Equal(t, input[:50], result)
	})

	t.Run("Sanitize single character", func(t *testing.T) {
		result := SanitizeSlug("a")
		assert.GreaterOrEqual(t, len(result), 3)
		assert.Contains(t, result, "a")
	})

	t.Run("Sanitize two characters", func(t *testing.T) {
		result := SanitizeSlug("ab")
		assert.GreaterOrEqual(t, len(result), 3)
		assert.Contains(t, result, "ab")
	})
}

func TestGenerateRandomStringBoundaries(t *testing.T) {
	t.Run("Generate negative length (edge case)", func(t *testing.T) {
		// This test demonstrates that negative length causes a panic
		// In production code, you might want to handle this gracefully
		defer func() {
			if r := recover(); r != nil {
				assert.Contains(t, fmt.Sprint(r), "makeslice", "Should panic with makeslice error")
			}
		}()

		GenerateRandomString(-1)
		t.Error("Expected panic but didn't get one")
	})

	t.Run("Generate very large length", func(t *testing.T) {
		result := GenerateRandomString(1000)
		assert.Equal(t, 1000, len(result))
		assert.Regexp(t, "^[a-z0-9]+$", result)
	})

	t.Run("Verify charset usage", func(t *testing.T) {
		// Generate many strings and verify all characters are from expected charset
		charset := "abcdefghijklmnopqrstuvwxyz0123456789"
		length := 50
		iterations := 10

		for i := 0; i < iterations; i++ {
			result := GenerateRandomString(length)
			for _, char := range result {
				assert.Contains(t, charset, string(char), "Character should be from valid charset")
			}
		}
	})
}
