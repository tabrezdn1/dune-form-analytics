package services

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
)

func TestNewAuthService(t *testing.T) {
	t.Run("Create new auth service", func(t *testing.T) {
		collections := &database.Collections{}
		accessSecret := "test-access-secret-32-chars-min"
		refreshSecret := "test-refresh-secret-32-chars-min"

		service := NewAuthService(collections, accessSecret, refreshSecret)

		assert.NotNil(t, service)
		assert.Equal(t, collections, service.collections)
		assert.Equal(t, accessSecret, service.accessSecret)
		assert.Equal(t, refreshSecret, service.refreshSecret)
		assert.Equal(t, int64(60*60*1000000000), int64(service.accessTTL))       // 60 minutes in nanoseconds
		assert.Equal(t, int64(7*24*60*60*1000000000), int64(service.refreshTTL)) // 7 days in nanoseconds
	})

	t.Run("Create auth service with empty secrets", func(t *testing.T) {
		collections := &database.Collections{}

		service := NewAuthService(collections, "", "")

		assert.NotNil(t, service)
		assert.Equal(t, "", service.accessSecret)
		assert.Equal(t, "", service.refreshSecret)
		// TTL values should still be set correctly
		assert.Greater(t, service.accessTTL.Minutes(), 0.0)
		assert.Greater(t, service.refreshTTL.Hours(), 0.0)
	})
}

func TestNewFormService(t *testing.T) {
	t.Run("Create new form service", func(t *testing.T) {
		collections := &database.Collections{}

		service := NewFormService(collections)

		assert.NotNil(t, service)
		assert.Equal(t, collections, service.collections)
	})

	t.Run("Create form service with nil collections", func(t *testing.T) {
		service := NewFormService(nil)

		assert.NotNil(t, service)
		assert.Nil(t, service.collections)
	})
}

func TestNewResponseService(t *testing.T) {
	t.Run("Create new response service", func(t *testing.T) {
		collections := &database.Collections{}

		service := NewResponseService(collections)

		assert.NotNil(t, service)
		assert.Equal(t, collections, service.collections)
	})

	t.Run("Create response service with nil collections", func(t *testing.T) {
		service := NewResponseService(nil)

		assert.NotNil(t, service)
		assert.Nil(t, service.collections)
	})
}

func TestNewAnalyticsService(t *testing.T) {
	t.Run("Create new analytics service", func(t *testing.T) {
		collections := &database.Collections{}

		service := NewAnalyticsService(collections)

		assert.NotNil(t, service)
		assert.Equal(t, collections, service.collections)
	})

	t.Run("Create analytics service with nil collections", func(t *testing.T) {
		service := NewAnalyticsService(nil)

		assert.NotNil(t, service)
		assert.Nil(t, service.collections)
	})
}
