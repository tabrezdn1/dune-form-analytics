package services

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
)

func TestAuthService_HashPassword(t *testing.T) {
	// Create auth service instance for testing
	authService := &AuthService{
		accessSecret:  "test-access-secret",
		refreshSecret: "test-refresh-secret",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "Valid password",
			password: "password123",
			wantErr:  false,
		},
		{
			name:     "Short password",
			password: "123",
			wantErr:  false,
		},
		{
			name:     "Long password",
			password: "this-is-a-very-long-password-with-special-chars!@#$%^&*()",
			wantErr:  false,
		},
		{
			name:     "Empty password",
			password: "",
			wantErr:  false, // bcrypt can handle empty strings
		},
		{
			name:     "Unicode password",
			password: "пароль123",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hashedPassword, err := authService.HashPassword(tt.password)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Empty(t, hashedPassword)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, hashedPassword)
				assert.NotEqual(t, tt.password, hashedPassword, "Hashed password should be different from original")
				assert.Greater(t, len(hashedPassword), 50, "Bcrypt hash should be reasonably long")
				assert.Contains(t, hashedPassword, "$2a$", "Should be a valid bcrypt hash")
			}
		})
	}
}

func TestAuthService_VerifyPassword(t *testing.T) {
	authService := &AuthService{
		accessSecret:  "test-access-secret",
		refreshSecret: "test-refresh-secret",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	// First, hash a known password
	password := "testpassword123"
	hashedPassword, err := authService.HashPassword(password)
	require.NoError(t, err)

	tests := []struct {
		name           string
		hashedPassword string
		password       string
		wantErr        bool
	}{
		{
			name:           "Correct password",
			hashedPassword: hashedPassword,
			password:       password,
			wantErr:        false,
		},
		{
			name:           "Wrong password",
			hashedPassword: hashedPassword,
			password:       "wrongpassword",
			wantErr:        true,
		},
		{
			name:           "Empty password against hash",
			hashedPassword: hashedPassword,
			password:       "",
			wantErr:        true,
		},
		{
			name:           "Invalid hash",
			hashedPassword: "invalid-hash",
			password:       password,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := authService.VerifyPassword(tt.hashedPassword, tt.password)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestAuthService_GenerateTokens(t *testing.T) {
	authService := &AuthService{
		accessSecret:  "test-access-secret-key-for-testing",
		refreshSecret: "test-refresh-secret-key-for-testing",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	// Create a test user
	testUser := &models.User{
		ID:        primitive.NewObjectID(),
		Email:     "test@example.com",
		Name:      "Test User",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Run("Generate valid tokens", func(t *testing.T) {
		accessToken, refreshToken, err := authService.GenerateTokens(testUser)

		assert.NoError(t, err)
		assert.NotEmpty(t, accessToken)
		assert.NotEmpty(t, refreshToken)
		assert.NotEqual(t, accessToken, refreshToken, "Access and refresh tokens should be different")

		// Check that tokens are valid JWT format (3 parts separated by dots)
		accessParts := strings.Split(accessToken, ".")
		refreshParts := strings.Split(refreshToken, ".")
		assert.Equal(t, 3, len(accessParts), "Access token should have 3 parts")
		assert.Equal(t, 3, len(refreshParts), "Refresh token should have 3 parts")
	})

	t.Run("Generate tokens for different users", func(t *testing.T) {
		user1 := &models.User{
			ID:    primitive.NewObjectID(),
			Email: "user1@example.com",
			Name:  "User One",
		}
		user2 := &models.User{
			ID:    primitive.NewObjectID(),
			Email: "user2@example.com",
			Name:  "User Two",
		}

		token1, _, err1 := authService.GenerateTokens(user1)
		token2, _, err2 := authService.GenerateTokens(user2)

		assert.NoError(t, err1)
		assert.NoError(t, err2)
		assert.NotEqual(t, token1, token2, "Tokens for different users should be different")
	})
}

func TestAuthService_ValidateAccessToken(t *testing.T) {
	authService := &AuthService{
		accessSecret:  "test-access-secret-key-for-testing",
		refreshSecret: "test-refresh-secret-key-for-testing",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	// Create a test user and generate tokens
	testUser := &models.User{
		ID:    primitive.NewObjectID(),
		Email: "test@example.com",
		Name:  "Test User",
	}

	accessToken, _, err := authService.GenerateTokens(testUser)
	require.NoError(t, err)

	t.Run("Valid access token", func(t *testing.T) {
		claims, err := authService.ValidateAccessToken(accessToken)

		assert.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, testUser.ID.Hex(), claims.UserID)
		assert.Equal(t, testUser.Email, claims.Email)
		assert.Equal(t, testUser.Name, claims.Name)
	})

	t.Run("Invalid token format", func(t *testing.T) {
		claims, err := authService.ValidateAccessToken("invalid-token")

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("Empty token", func(t *testing.T) {
		claims, err := authService.ValidateAccessToken("")

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("Token with wrong secret", func(t *testing.T) {
		wrongSecretService := &AuthService{
			accessSecret:  "wrong-secret",
			refreshSecret: "test-refresh-secret-key-for-testing",
			accessTTL:     60 * time.Minute,
			refreshTTL:    7 * 24 * time.Hour,
		}

		claims, err := wrongSecretService.ValidateAccessToken(accessToken)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})
}

func TestAuthService_ValidateRefreshToken(t *testing.T) {
	authService := &AuthService{
		accessSecret:  "test-access-secret-key-for-testing",
		refreshSecret: "test-refresh-secret-key-for-testing",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	// Create a test user and generate tokens
	testUser := &models.User{
		ID:    primitive.NewObjectID(),
		Email: "test@example.com",
		Name:  "Test User",
	}

	_, refreshToken, err := authService.GenerateTokens(testUser)
	require.NoError(t, err)

	t.Run("Valid refresh token", func(t *testing.T) {
		claims, err := authService.ValidateRefreshToken(refreshToken)

		assert.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, testUser.ID.Hex(), claims.UserID)
		assert.Equal(t, testUser.Email, claims.Email)
		assert.Equal(t, testUser.Name, claims.Name)
	})

	t.Run("Invalid refresh token", func(t *testing.T) {
		claims, err := authService.ValidateRefreshToken("invalid-refresh-token")

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("Access token used as refresh token", func(t *testing.T) {
		accessToken, _, err := authService.GenerateTokens(testUser)
		require.NoError(t, err)

		// Using access token as refresh token should fail due to different secret
		claims, err := authService.ValidateRefreshToken(accessToken)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})
}

// Benchmark tests
func BenchmarkHashPassword(b *testing.B) {
	authService := &AuthService{
		accessSecret:  "test-access-secret",
		refreshSecret: "test-refresh-secret",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	password := "benchmarkpassword123"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := authService.HashPassword(password)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkVerifyPassword(b *testing.B) {
	authService := &AuthService{
		accessSecret:  "test-access-secret",
		refreshSecret: "test-refresh-secret",
		accessTTL:     60 * time.Minute,
		refreshTTL:    7 * 24 * time.Hour,
	}

	password := "benchmarkpassword123"
	hashedPassword, err := authService.HashPassword(password)
	if err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		err := authService.VerifyPassword(hashedPassword, password)
		if err != nil {
			b.Fatal(err)
		}
	}
}
