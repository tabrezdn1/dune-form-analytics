package utils

import (
	"math/rand"
	"regexp"
	"strings"
	"time"
)

// GenerateSlug generates a URL-friendly slug from a string
func GenerateSlug(input string) string {
	// Convert to lowercase
	slug := strings.ToLower(input)
	
	// Replace spaces and special characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")
	
	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")
	
	// Limit length to 40 characters
	if len(slug) > 40 {
		slug = slug[:40]
	}
	
	// Ensure slug is not empty
	if slug == "" {
		slug = "form"
	}
	
	return slug
}

// GenerateRandomString generates a random string of specified length
func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	
	return string(b)
}

// SanitizeSlug ensures a slug is valid and safe
func SanitizeSlug(slug string) string {
	// Remove any remaining invalid characters
	reg := regexp.MustCompile(`[^a-zA-Z0-9\-_]`)
	slug = reg.ReplaceAllString(slug, "")
	
	// Ensure minimum length
	if len(slug) < 3 {
		slug = slug + GenerateRandomString(3-len(slug))
	}
	
	// Ensure maximum length
	if len(slug) > 50 {
		slug = slug[:50]
	}
	
	return slug
}
