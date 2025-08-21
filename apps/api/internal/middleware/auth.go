package middleware

import (
	"strings"

	fiber "github.com/gofiber/fiber/v2"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"
)

// AuthMiddleware creates authentication middleware
func AuthMiddleware(authService *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{

				"error": "Authorization header required",
			})
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{

				"error": "Invalid authorization header format",
			})
		}

		// Extract token
		token := parts[1]
		if token == "" {
			return c.Status(401).JSON(fiber.Map{

				"error": "Token required",
			})
		}

		// Validate token
		claims, err := authService.ValidateAccessToken(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{

				"error": "Invalid or expired token",
			})
		}

		// Set user information in context
		c.Locals("userID", claims.UserID)
		c.Locals("userEmail", claims.Email)
		c.Locals("userName", claims.Name)

		// Continue to next handler
		return c.Next()
	}
}

// OptionalAuthMiddleware creates optional authentication middleware
// This middleware sets user context if token is provided but doesn't fail if missing
func OptionalAuthMiddleware(authService *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next() // Continue without authentication
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Next() // Continue without authentication
		}

		// Extract token
		token := parts[1]
		if token == "" {
			return c.Next() // Continue without authentication
		}

		// Validate token
		claims, err := authService.ValidateAccessToken(token)
		if err != nil {
			return c.Next() // Continue without authentication
		}

		// Set user information in context
		c.Locals("userID", claims.UserID)
		c.Locals("userEmail", claims.Email)
		c.Locals("userName", claims.Name)

		// Continue to next handler
		return c.Next()
	}
}
