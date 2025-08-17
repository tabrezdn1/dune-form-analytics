package main

import (
	"log"
	"os"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/handlers"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/middleware"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/websocket"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Get configuration from environment
	config := getConfig()

	// Connect to database
	db, err := database.Connect(config.MongoURI)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Ensure database indexes
	if err := db.EnsureIndexes(); err != nil {
		log.Fatalf("Failed to create database indexes: %v", err)
	}

	// Get collections
	collections := db.GetCollections()

	// Initialize services
	formService := services.NewFormService(collections)
	responseService := services.NewResponseService(collections)
	analyticsService := services.NewAnalyticsService(collections)

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize handlers
	formHandler := handlers.NewFormHandler(formService)
	responseHandler := handlers.NewResponseHandler(responseService, analyticsService, formService, wsHub)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} ${status} - ${method} ${path} (${latency})\n",
	}))
	
	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     config.CORSOrigin,
		AllowMethods:     "GET,POST,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		if err := db.HealthCheck(); err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status": "unhealthy",
				"error":  err.Error(),
			})
		}
		return c.JSON(fiber.Map{
			"status": "healthy",
			"service": "dune-form-analytics-api",
		})
	})

	// API routes
	api := app.Group("/api")
	
	// Form routes
	api.Post("/forms", formHandler.CreateForm)
	api.Get("/forms/:id", formHandler.GetForm)
	api.Patch("/forms/:id", formHandler.UpdateForm)
	api.Delete("/forms/:id", formHandler.DeleteForm)
	api.Get("/forms", formHandler.ListForms)
	api.Post("/forms/:id/publish", formHandler.PublishForm)
	api.Post("/forms/:id/unpublish", formHandler.UnpublishForm)
	
	// Public form routes
	api.Get("/forms/slug/:slug", formHandler.GetPublicForm)
	
	// Response routes
	api.Post("/forms/:id/submit", responseHandler.SubmitResponse)
	api.Get("/forms/:id/responses", responseHandler.GetResponses)
	api.Get("/forms/:id/export.csv", responseHandler.ExportCSV)
	
	// Analytics routes
	api.Get("/forms/:id/analytics", analyticsHandler.GetAnalytics)
	api.Post("/forms/:id/analytics/compute", analyticsHandler.ComputeAnalytics)
	api.Get("/forms/:id/metrics", analyticsHandler.GetRealTimeMetrics)
	api.Get("/analytics/summary", analyticsHandler.GetAnalyticsSummary)
	api.Get("/forms/:id/trends", analyticsHandler.GetTrendAnalytics)

	// WebSocket routes
	app.Get("/ws/forms/:id", wsHandler.HandleConnection)
	api.Get("/ws/stats", wsHandler.GetConnectionStats)

	// Start server
	port := config.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("MongoDB connected: %s", maskMongoURI(config.MongoURI))
	log.Printf("CORS origin: %s", config.CORSOrigin)
	
	log.Fatal(app.Listen(":" + port))
}

// Config holds application configuration
type Config struct {
	MongoURI   string
	JWTSecret  string
	CORSOrigin string
	Port       string
	Env        string
}

// getConfig loads configuration from environment variables
func getConfig() *Config {
	return &Config{
		MongoURI:   getEnv("MONGO_URI", "mongodb://admin:password123@localhost:27017/dune_forms?authSource=admin"),
		JWTSecret:  getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
		Port:       getEnv("PORT", "8080"),
		Env:        getEnv("ENV", "development"),
	}
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// maskMongoURI masks the password in MongoDB URI for logging
func maskMongoURI(uri string) string {
	if len(uri) > 20 {
		return uri[:10] + "***" + uri[len(uri)-10:]
	}
	return "***"
}
