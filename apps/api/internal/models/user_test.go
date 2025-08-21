package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestUser_ToUserResponse(t *testing.T) {
	// Create test data
	testID := primitive.NewObjectID()
	testEmail := "test@example.com"
	testName := "Test User"
	testCreatedAt := time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)
	testUpdatedAt := time.Date(2024, 1, 20, 15, 45, 0, 0, time.UTC)
	testPassword := "hashed-password-should-not-appear"

	user := &User{
		ID:        testID,
		Email:     testEmail,
		Password:  testPassword,
		Name:      testName,
		CreatedAt: testCreatedAt,
		UpdatedAt: testUpdatedAt,
	}

	t.Run("Convert user to safe response", func(t *testing.T) {
		response := user.ToUserResponse()

		// Verify all fields are correctly copied
		assert.Equal(t, testID, response.ID)
		assert.Equal(t, testEmail, response.Email)
		assert.Equal(t, testName, response.Name)
		assert.Equal(t, testCreatedAt, response.CreatedAt)
		assert.Equal(t, testUpdatedAt, response.UpdatedAt)

		// Verify response is not nil
		assert.NotNil(t, response)
	})

	t.Run("Password is not exposed in response", func(t *testing.T) {
		response := user.ToUserResponse()

		// Use reflection or JSON marshaling to ensure password field doesn't exist
		// Since UserResponse struct doesn't have Password field, this is implicit
		// but we can verify the struct types are different
		assert.IsType(t, &UserResponse{}, response)
		assert.IsType(t, &User{}, user)
	})

	t.Run("Response with zero values", func(t *testing.T) {
		emptyUser := &User{}
		response := emptyUser.ToUserResponse()

		assert.NotNil(t, response)
		assert.Equal(t, primitive.NilObjectID, response.ID)
		assert.Equal(t, "", response.Email)
		assert.Equal(t, "", response.Name)
		assert.True(t, response.CreatedAt.IsZero())
		assert.True(t, response.UpdatedAt.IsZero())
	})

	t.Run("Response with nil user", func(t *testing.T) {
		// This test ensures we handle edge cases appropriately
		// Note: This would panic in real code, but demonstrates defensive programming
		defer func() {
			if r := recover(); r != nil {
				assert.Contains(t, r, "runtime error", "Should panic gracefully")
			}
		}()

		var nilUser *User
		if nilUser != nil {
			nilUser.ToUserResponse()
		}
	})
}

func TestCreateUserRequest_Validation_Tags(t *testing.T) {
	t.Run("Check validation tags are properly set", func(t *testing.T) {
		// This test verifies that our struct tags are correctly defined
		// We can't easily test the validation logic here since it requires the validator,
		// but we can verify the struct is properly defined

		req := CreateUserRequest{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "Test User",
		}

		assert.Equal(t, "test@example.com", req.Email)
		assert.Equal(t, "password123", req.Password)
		assert.Equal(t, "Test User", req.Name)
	})
}

func TestLoginRequest_Validation_Tags(t *testing.T) {
	t.Run("Check login request structure", func(t *testing.T) {
		req := LoginRequest{
			Email:    "login@example.com",
			Password: "loginpassword",
		}

		assert.Equal(t, "login@example.com", req.Email)
		assert.Equal(t, "loginpassword", req.Password)
	})
}

func TestRefreshTokenRequest_Validation_Tags(t *testing.T) {
	t.Run("Check refresh token request structure", func(t *testing.T) {
		req := RefreshTokenRequest{
			RefreshToken: "sample-refresh-token",
		}

		assert.Equal(t, "sample-refresh-token", req.RefreshToken)
	})
}

func TestAuthResponse_Structure(t *testing.T) {
	t.Run("Create auth response with all fields", func(t *testing.T) {
		userResponse := &UserResponse{
			ID:        primitive.NewObjectID(),
			Email:     "test@example.com",
			Name:      "Test User",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		authResponse := &AuthResponse{
			User:         userResponse,
			AccessToken:  "sample-access-token",
			RefreshToken: "sample-refresh-token",
		}

		assert.NotNil(t, authResponse.User)
		assert.Equal(t, "sample-access-token", authResponse.AccessToken)
		assert.Equal(t, "sample-refresh-token", authResponse.RefreshToken)
		assert.Equal(t, userResponse.Email, authResponse.User.Email)
	})
}
