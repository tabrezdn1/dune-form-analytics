package interfaces

import (
	"context"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FormServiceInterface defines the contract for form-related operations
type FormServiceInterface interface {
	CreateForm(ctx context.Context, req *models.CreateFormRequest, ownerID *string) (*models.FormResponse, error)
	GetFormByID(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error)
	GetFormBySlug(ctx context.Context, slug string) (*models.PublicFormResponse, error)
	UpdateForm(ctx context.Context, formID string, req *models.UpdateFormRequest, ownerID *string) (*models.FormResponse, error)
	DeleteForm(ctx context.Context, formID string, ownerID *string) error
	ListForms(ctx context.Context, ownerID *string, page, limit int) ([]*models.FormResponse, int64, error)
	PublishForm(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error)
	UnpublishForm(ctx context.Context, formID string, ownerID *string) (*models.FormResponse, error)
}

// ResponseServiceInterface defines the contract for response-related operations
type ResponseServiceInterface interface {
	SubmitResponse(ctx context.Context, formID string, req *models.SubmitResponseRequest) (*models.ResponseData, []models.ValidationError, error)
	GetResponses(ctx context.Context, formID string, page, limit int, ownerID *string) ([]*models.ResponseData, int64, error)
	GetResponsesForExport(ctx context.Context, formID string, startDate, endDate *time.Time, ownerID *string) ([]*models.ResponseData, error)
}

// AnalyticsServiceInterface defines the contract for analytics-related operations
type AnalyticsServiceInterface interface {
	GetAnalytics(ctx context.Context, formID string, ownerID *string) (*models.AnalyticsResponse, error)
	ComputeAnalytics(ctx context.Context, formID string, startDate, endDate *time.Time, fields []string, ownerID *string) (*models.AnalyticsResponse, error)
	UpdateAnalyticsIncremental(ctx context.Context, formID primitive.ObjectID, response *models.Response, form *models.Form) (*models.Analytics, error)
	GetRealTimeMetrics(ctx context.Context, formID string, ownerID *string) (*models.RealTimeMetrics, error)
	GetAnalyticsSummary(ctx context.Context, ownerID *string) ([]*models.AnalyticsSummary, error)
	GetTrendAnalytics(ctx context.Context, formID string, period string, ownerID *string) (*models.TrendAnalytics, error)
}

// WebSocketManagerInterface defines the contract for WebSocket management
type WebSocketManagerInterface interface {
	HandleConnection(c *fiber.Ctx) error
	Broadcast(formID string, messageType string, data interface{})
	GetRoomCount(formID string) int
	GetTotalConnections() int
	Run()
}

// AuthServiceInterface defines the contract for authentication operations
type AuthServiceInterface interface {
	CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.User, error)
	LoginUser(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error)
	RefreshTokens(ctx context.Context, refreshToken string) (*models.AuthResponse, error)
	ValidateAccessToken(tokenString string) (*services.Claims, error)
	ValidateRefreshToken(tokenString string) (*services.Claims, error)
	GenerateTokens(user *models.User) (string, string, error)
	GetUserByID(ctx context.Context, userID string) (*models.User, error)
	HashPassword(password string) (string, error)
	VerifyPassword(hashedPassword, password string) error
}

// DatabaseInterface defines the contract for database operations
type DatabaseInterface interface {
	GetCollections() *database.Collections
	HealthCheck() error
	EnsureIndexes() error
	Close() error
	RunMigrations() error
}
