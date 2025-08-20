package handlers

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *services.AuthService
	validator   *validator.Validate
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *services.AuthService, validator *validator.Validate) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator,
	}
}

// Signup handles user registration
// @Summary User registration
// @Description Register a new user account
// @Tags Authentication
// @Accept json
// @Produce json
// @Param user body models.CreateUserRequest true "User registration data"
// @Success 201 {object} models.AuthResponse "User registered successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 409 {object} map[string]interface{} "User already exists"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /auth/signup [post]
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req models.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Invalid request body",
		})
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Validation failed",
			"details": err.Error(),
		})
	}

	// Create user
	user, err := h.authService.CreateUser(c.Context(), &req)
	if err != nil {
		return c.Status(409).JSON(fiber.Map{

			"error":   err.Error(),
		})
	}

	// Generate tokens
	accessToken, refreshToken, err := h.authService.GenerateTokens(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{

			"error":   "Failed to generate authentication tokens",
		})
	}

	// Return response
	return c.Status(201).JSON(fiber.Map{
		"success": true,
		"data": models.AuthResponse{
			User:         user.ToUserResponse(),
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	})
}

// Login handles user authentication
// @Summary User login
// @Description Authenticate user with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param credentials body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.AuthResponse "Login successful"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Invalid credentials"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Invalid request body",
		})
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Validation failed",
			"details": err.Error(),
		})
	}

	// Authenticate user
	authResponse, err := h.authService.LoginUser(c.Context(), &req)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{

			"error":   err.Error(),
		})
	}

	// Return response
	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"data":    authResponse,
	})
}

// RefreshToken handles token refresh
// @Summary Refresh JWT token
// @Description Refresh access token using refresh token
// @Tags Authentication  
// @Accept json
// @Produce json
// @Param token body models.RefreshTokenRequest true "Refresh token"
// @Success 200 {object} models.AuthResponse "Token refreshed successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Invalid token"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req models.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Invalid request body",
		})
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{

			"error":   "Validation failed",
			"details": err.Error(),
		})
	}

	// Refresh tokens
	authResponse, err := h.authService.RefreshTokens(c.Context(), req.RefreshToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{

			"error":   err.Error(),
		})
	}

	// Return response
	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"data":    authResponse,
	})
}

// GetMe returns current user information
// @Summary Get current user
// @Description Get information about the authenticated user
// @Tags Authentication
// @Accept json
// @Produce json
// @Success 200 {object} models.UserResponse "User information retrieved successfully"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Security BearerAuth
// @Router /auth/me [get]
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(401).JSON(fiber.Map{

			"error":   "User not authenticated",
		})
	}

	// Get user from database
	user, err := h.authService.GetUserByID(c.Context(), userID.(string))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{

			"error":   err.Error(),
		})
	}

	// Return user info
	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"data":    user.ToUserResponse(),
	})
}

// Logout handles user logout (for future token blacklisting)
// @Summary User logout
// @Description Log out the authenticated user
// @Tags Authentication
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Logged out successfully"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Security BearerAuth
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// For now, just return success
	// In the future, we could implement token blacklisting here
	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"message": "Logged out successfully",
	})
}
