package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// ErrorHandler is a custom error handler for Fiber
func ErrorHandler(c *fiber.Ctx, err error) error {
	// Default error code
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a Fiber error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Log the error
	log.Printf("Error %d: %s - %s %s", code, err.Error(), c.Method(), c.Path())

	// Return appropriate error response
	switch code {
	case fiber.StatusNotFound:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Not Found",
			"message": "The requested resource was not found",
		})
	case fiber.StatusBadRequest:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request format or parameters",
		})
	case fiber.StatusUnauthorized:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "Authentication required",
		})
	case fiber.StatusForbidden:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Forbidden",
			"message": "Access denied",
		})
	case fiber.StatusTooManyRequests:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Too Many Requests",
			"message": "Rate limit exceeded",
		})
	default:
		return c.Status(code).JSON(fiber.Map{
			"error":   "Internal Server Error",
			"message": "An unexpected error occurred",
		})
	}
}
