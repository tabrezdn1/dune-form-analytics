package container

import (
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/config"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/handlers"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/middleware"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"

	"github.com/gofiber/fiber/v2"
)

// setupRoutes configures all application routes
func setupRoutes(
	app *fiber.App,
	cfg *config.Config,
	db interfaces.DatabaseInterface,
	formHandler *handlers.FormHandler,
	responseHandler *handlers.ResponseHandler,
	analyticsHandler *handlers.AnalyticsHandler,
	authHandler *handlers.AuthHandler,
	authService *services.AuthService,
	wsManager interfaces.WebSocketManagerInterface,
) {
	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		if err := db.HealthCheck(); err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status":      "unhealthy",
				"service":     "dune-form-analytics-api",
				"version":     "1.0.0",
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
				"environment": cfg.Environment,
				"error":       err.Error(),
			})
		}
		return c.JSON(fiber.Map{
			"status":      "healthy",
			"service":     "dune-form-analytics-api",
			"version":     "1.0.0",
			"timestamp":   time.Now().UTC().Format(time.RFC3339),
			"environment": cfg.Environment,
		})
	})

	// API info endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service":     "Dune Form Analytics API",
			"version":     "1.0.0",
			"description": "Professional form builder with real-time analytics",
			"environment": cfg.Environment,
			"status":      "operational",
			"endpoints": fiber.Map{
				"health":    "/health",
				"api":       "/api",
				"websocket": "/ws/forms/:id",
				"docs":      "See README.md for complete API documentation",
			},
		})
	})

	// API routes group
	api := app.Group("/api")

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(authService)

	// Authentication routes (public)
	auth := api.Group("/auth")
	auth.Post("/signup", authHandler.Signup)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", authMiddleware, authHandler.GetMe)

	// Protected form routes (require authentication)
	api.Post("/forms", authMiddleware, formHandler.CreateForm)
	api.Get("/forms/:id", authMiddleware, formHandler.GetForm)
	api.Patch("/forms/:id", authMiddleware, formHandler.UpdateForm)
	api.Delete("/forms/:id", authMiddleware, formHandler.DeleteForm)
	api.Get("/forms", authMiddleware, formHandler.ListForms)
	api.Post("/forms/:id/publish", authMiddleware, formHandler.PublishForm)
	api.Post("/forms/:id/unpublish", authMiddleware, formHandler.UnpublishForm)

	// Public form routes
	api.Get("/forms/slug/:slug", formHandler.GetPublicForm)

	// Response routes (submit is public, others require auth)
	api.Post("/forms/:id/submit", responseHandler.SubmitResponse)
	api.Get("/forms/:id/responses", authMiddleware, responseHandler.GetResponses)
	api.Get("/forms/:id/export.csv", authMiddleware, responseHandler.ExportCSV)

	// Analytics routes (require authentication)
	api.Get("/forms/:id/analytics", authMiddleware, analyticsHandler.GetAnalytics)
	api.Post("/forms/:id/analytics/compute", authMiddleware, analyticsHandler.ComputeAnalytics)
	api.Get("/forms/:id/metrics", authMiddleware, analyticsHandler.GetRealTimeMetrics)
	api.Get("/analytics/summary", authMiddleware, analyticsHandler.GetAnalyticsSummary)
	api.Get("/forms/:id/trends", authMiddleware, analyticsHandler.GetTrendAnalytics)

	// WebSocket routes for real-time analytics
	app.Get("/ws/forms/:id", wsManager.HandleConnection)
	api.Get("/ws/stats", func(c *fiber.Ctx) error {
		formID := c.Query("formId")

		stats := fiber.Map{
			"totalConnections": wsManager.GetTotalConnections(),
		}

		if formID != "" {
			stats["roomConnections"] = wsManager.GetRoomCount(formID)
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    stats,
		})
	})
}
