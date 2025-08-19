package services

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
)

// JWT Claims structure
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

// AuthService handles authentication operations
type AuthService struct {
	collections   *database.Collections
	accessSecret  string
	refreshSecret string
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

// NewAuthService creates a new authentication service
func NewAuthService(collections *database.Collections, accessSecret, refreshSecret string) *AuthService {
	return &AuthService{
		collections:   collections,
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		accessTTL:     15 * time.Minute, // 15 minutes for access token
		refreshTTL:    7 * 24 * time.Hour, // 7 days for refresh token
	}
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedBytes), nil
}

// VerifyPassword verifies a password against its hash
func (s *AuthService) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// GenerateTokens generates both access and refresh tokens for a user
func (s *AuthService) GenerateTokens(user *models.User) (string, string, error) {
	// Generate access token
	accessClaims := &Claims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		Name:   user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "dune-form-analytics",
			Subject:   user.ID.Hex(),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.accessSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshClaims := &Claims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		Name:   user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "dune-form-analytics",
			Subject:   user.ID.Hex(),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.refreshSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessTokenString, refreshTokenString, nil
}

// ValidateAccessToken validates an access token and returns the claims
func (s *AuthService) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.accessSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateRefreshToken validates a refresh token and returns the claims
func (s *AuthService) ValidateRefreshToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.refreshSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse refresh token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid refresh token")
}

// CreateUser creates a new user account
func (s *AuthService) CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := s.collections.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return nil, fmt.Errorf("user with this email already exists")
	}
	if err != mongo.ErrNoDocuments {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// Hash password
	hashedPassword, err := s.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		ID:        primitive.NewObjectID(),
		Email:     req.Email,
		Password:  hashedPassword,
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Insert user
	_, err = s.collections.Users.InsertOne(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// LoginUser authenticates a user and returns tokens
func (s *AuthService) LoginUser(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	// Find user by email
	var user models.User
	err := s.collections.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("invalid email or password")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Verify password
	err = s.VerifyPassword(user.Password, req.Password)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate tokens
	accessToken, refreshToken, err := s.GenerateTokens(&user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:         user.ToUserResponse(),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// RefreshTokens generates new tokens using a refresh token
func (s *AuthService) RefreshTokens(ctx context.Context, refreshToken string) (*models.AuthResponse, error) {
	// Validate refresh token
	claims, err := s.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Get user from database
	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID in token: %w", err)
	}

	var user models.User
	err = s.collections.Users.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Generate new tokens
	newAccessToken, newRefreshToken, err := s.GenerateTokens(&user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:         user.ToUserResponse(),
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// GetUserByID retrieves a user by their ID
func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	var user models.User
	err = s.collections.Users.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}
