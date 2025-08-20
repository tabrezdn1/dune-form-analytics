package container

import (
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/config"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/handlers"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/middleware"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/swagger"
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
	// @Summary Health check
	// @Description Check API health status and database connectivity
	// @Tags System
	// @Accept json
	// @Produce json
	// @Success 200 {object} map[string]interface{} "Service is healthy"
	// @Failure 503 {object} map[string]interface{} "Service is unhealthy"
	// @Router /health [get]
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

	// Configure development tools and port-based routing
	if cfg.Environment == "development" {
		setupDevelopmentTools(app)
		setupPortBasedRouting(app)
	}

	// API info endpoint
	// @Summary API information
	// @Description Get API service information and available endpoints
	// @Tags System
	// @Accept json
	// @Produce json
	// @Success 200 {object} map[string]interface{} "API information"
	// @Router / [get]
	app.Get("/", func(c *fiber.Ctx) error {
		response := fiber.Map{
			"service":     "Dune Form Analytics API",
			"version":     "1.0.0",
			"description": "Professional form builder with real-time analytics",
			"environment": cfg.Environment,
			"status":      "operational",
			"timestamp":   time.Now().UTC().Format(time.RFC3339),
			"endpoints": fiber.Map{
				"health":     "/health",
				"api":        "/api",
				"websocket":  "/ws/forms/:id",
			},
		}

		// Add development tools info only in development environment
		if cfg.Environment == "development" {
			response["development_tools"] = fiber.Map{
				"documentation": "/swagger/index.html",
				"monitoring":    "/monitor",
				"profiling":     "/debug/pprof",
			}
		}

		return c.JSON(response)
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
	api.Get("/forms/:id/analytics.csv", authMiddleware, responseHandler.ExportAnalyticsCSV)

	// Analytics routes (require authentication)
	api.Get("/forms/:id/analytics", authMiddleware, analyticsHandler.GetAnalytics)
	api.Post("/forms/:id/analytics/compute", authMiddleware, analyticsHandler.ComputeAnalytics)
	api.Get("/forms/:id/metrics", authMiddleware, analyticsHandler.GetRealTimeMetrics)
	api.Get("/analytics/summary", authMiddleware, analyticsHandler.GetAnalyticsSummary)
	api.Get("/forms/:id/trends", authMiddleware, analyticsHandler.GetTrendAnalytics)

	// WebSocket routes for real-time analytics
	// @Summary WebSocket connection
	// @Description Establish WebSocket connection for real-time form analytics
	// @Tags WebSocket
	// @Accept json
	// @Produce json
	// @Param id path string true "Form ID"
	// @Success 101 {string} string "WebSocket connection established"
	// @Failure 400 {object} map[string]interface{} "Bad request"
	// @Failure 404 {object} map[string]interface{} "Form not found"
	// @Router /ws/forms/{id} [get]
	app.Get("/ws/forms/:id", wsManager.HandleConnection)
	
	// @Summary WebSocket statistics
	// @Description Get WebSocket connection statistics
	// @Tags WebSocket
	// @Accept json
	// @Produce json
	// @Param formId query string false "Form ID to get room-specific stats"
	// @Success 200 {object} map[string]interface{} "WebSocket statistics"
	// @Failure 500 {object} map[string]interface{} "Internal server error"
	// @Router /ws/stats [get]
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

// setupDevelopmentTools configures development-only tools
func setupDevelopmentTools(app *fiber.App) {
	// Swagger API documentation
	app.Get("/swagger/*", swagger.HandlerDefault)
	
	// Application monitoring dashboard
	app.Get("/monitor", monitor.New(monitor.Config{
		Title: "Dune Form Analytics API Monitor",
	}))
	
	// Go pprof performance profiling
	app.Use("/debug/pprof", pprof.New())
}

// setupPortBasedRouting configures Docker Desktop port-based routing
func setupPortBasedRouting(app *fiber.App) {
	app.Use(func(c *fiber.Ctx) error {
		host := c.Get("Host")
		path := c.Path()
		
		// Redirect root requests from specific ports to their respective tools
		if path == "/" {
			switch host {
			case "localhost:8082":
				return c.Redirect("/swagger/index.html", 302)
			case "localhost:8083":
				return c.Redirect("/monitor", 302)
			case "localhost:8084":
				return c.Redirect("/debug/pprof/", 302)
			}
		}
		
		return c.Next()
	})
}
