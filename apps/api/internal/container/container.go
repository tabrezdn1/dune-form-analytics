package container

import (
	"context"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/config"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/handlers"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/interfaces"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/middleware"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/realtime"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"

	validator "github.com/go-playground/validator/v10"
	fiber "github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"go.uber.org/fx"
)

// Container holds all application dependencies
type Container struct {
	Config    *config.Config
	Database  interfaces.DatabaseInterface
	Services  *ServiceContainer
	Handlers  *HandlerContainer
	WSManager interfaces.WebSocketManagerInterface
	App       *fiber.App
}

// ServiceContainer holds all service interfaces
type ServiceContainer struct {
	FormService      interfaces.FormServiceInterface
	ResponseService  interfaces.ResponseServiceInterface
	AnalyticsService interfaces.AnalyticsServiceInterface
	AuthService      interfaces.AuthServiceInterface
}

// HandlerContainer holds all handlers
type HandlerContainer struct {
	FormHandler      *handlers.FormHandler
	ResponseHandler  *handlers.ResponseHandler
	AnalyticsHandler *handlers.AnalyticsHandler
	AuthHandler      *handlers.AuthHandler
}

// NewContainer creates a new dependency injection container
func NewContainer() *fx.App {
	return fx.New(
		// Configuration
		fx.Provide(config.Load),
		fx.Provide(validator.New),

		// Database
		fx.Provide(NewDatabase),

		// Services
		fx.Provide(NewFormService),
		fx.Provide(NewResponseService),
		fx.Provide(NewAnalyticsService),
		fx.Provide(NewAuthService),

		// WebSocket
		fx.Provide(NewWebSocketManager),

		// Handlers
		fx.Provide(NewFormHandler),
		fx.Provide(NewResponseHandler),
		fx.Provide(NewAnalyticsHandler),
		fx.Provide(NewAuthHandler),

		// Fiber App
		fx.Provide(NewFiberApp),

		// Start the application
		fx.Invoke(StartServer),

		// Explicitly invoke auth handler creation to ensure it's created
		fx.Invoke(func(*handlers.AuthHandler) {}),
	)
}

// NewDatabase creates a new database connection
func NewDatabase(cfg *config.Config) (interfaces.DatabaseInterface, error) {
	return database.Connect(cfg.Database.URI)
}

// NewFormService creates a new form service
func NewFormService(db interfaces.DatabaseInterface) interfaces.FormServiceInterface {
	return services.NewFormService(db.GetCollections())
}

// NewResponseService creates a new response service
func NewResponseService(db interfaces.DatabaseInterface) interfaces.ResponseServiceInterface {
	return services.NewResponseService(db.GetCollections())
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(db interfaces.DatabaseInterface) interfaces.AnalyticsServiceInterface {
	return services.NewAnalyticsService(db.GetCollections())
}

// NewWebSocketManager creates a new WebSocket manager
func NewWebSocketManager() interfaces.WebSocketManagerInterface {
	return realtime.NewWebSocketManager()
}

// NewFormHandler creates a new form handler
func NewFormHandler(formService interfaces.FormServiceInterface, validator *validator.Validate) *handlers.FormHandler {
	return handlers.NewFormHandler(formService, validator)
}

// NewResponseHandler creates a new response handler
func NewResponseHandler(
	responseService interfaces.ResponseServiceInterface,
	analyticsService interfaces.AnalyticsServiceInterface,
	formService interfaces.FormServiceInterface,
	wsManager interfaces.WebSocketManagerInterface,
	validator *validator.Validate,
) *handlers.ResponseHandler {
	return handlers.NewResponseHandler(responseService, analyticsService, formService, wsManager, validator)
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(analyticsService interfaces.AnalyticsServiceInterface, validator *validator.Validate) *handlers.AnalyticsHandler {
	return handlers.NewAnalyticsHandler(analyticsService, validator)
}

// NewFiberApp creates a new Fiber application with all middleware
func NewFiberApp(cfg *config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		BodyLimit:    cfg.Server.BodyLimit,
		AppName:      cfg.Server.AppName,
		ServerHeader: "Dune-API",
	})

	// Global middleware
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	// Production-level logging
	app.Use(logger.New(logger.Config{
		Format:     "${time} [${ip}] ${status} - ${method} ${path} (${latency}) ${error}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowOrigins,
		AllowMethods:     cfg.CORS.AllowMethods,
		AllowHeaders:     cfg.CORS.AllowHeaders,
		AllowCredentials: cfg.CORS.AllowCredentials,
	}))

	return app
}

// StartServer starts the HTTP server with all routes
func StartServer(
	lc fx.Lifecycle,
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
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			// Ensure database indexes
			if err := db.EnsureIndexes(); err != nil {
				return err
			}

			// Start WebSocket manager
			go wsManager.Run()

			// Run database migrations (create test user)
			if err := db.RunMigrations(); err != nil {
				return err
			}

			// Setup routes
			setupRoutes(app, cfg, db, formHandler, responseHandler, analyticsHandler, authHandler, authService, wsManager)

			// Start server in goroutine
			go func() {
				if err := app.Listen(":" + cfg.Server.Port); err != nil {
					panic(err)
				}
			}()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			if err := app.Shutdown(); err != nil {
				return err
			}
			return db.Close()
		},
	})
}

// NewAuthService creates a new authentication service
func NewAuthService(cfg *config.Config, db interfaces.DatabaseInterface) *services.AuthService {
	collections := db.GetCollections()
	return services.NewAuthService(collections, cfg.Auth.AccessTokenSecret, cfg.Auth.RefreshTokenSecret)
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *services.AuthService, validator *validator.Validate) *handlers.AuthHandler {
	return handlers.NewAuthHandler(authService, validator)
}
