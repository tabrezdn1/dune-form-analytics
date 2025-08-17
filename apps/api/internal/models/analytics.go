package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FieldAnalytics represents analytics data for a single field
type FieldAnalytics struct {
	Count        int                    `json:"count" bson:"count"`
	Distribution map[string]int         `json:"distribution,omitempty" bson:"distribution,omitempty"`
	Average      *float64               `json:"average,omitempty" bson:"average,omitempty"`
	Median       *float64               `json:"median,omitempty" bson:"median,omitempty"`
	Trend        []TrendPoint           `json:"trend,omitempty" bson:"trend,omitempty"`
	TopKeywords  []KeywordCount         `json:"topKeywords,omitempty" bson:"topKeywords,omitempty"`
}

// TrendPoint represents a single point in a trend analysis
type TrendPoint struct {
	Date  time.Time `json:"date" bson:"date"`
	Value float64   `json:"value" bson:"value"`
	Count int       `json:"count" bson:"count"`
}

// KeywordCount represents a keyword and its frequency
type KeywordCount struct {
	Keyword string `json:"keyword" bson:"keyword"`
	Count   int    `json:"count" bson:"count"`
}

// Analytics represents the analytics document in MongoDB
type Analytics struct {
	ID                    primitive.ObjectID        `json:"_id,omitempty" bson:"_id,omitempty"`
	ByField               map[string]FieldAnalytics `json:"byField" bson:"byField"`
	TotalResponses        int                       `json:"totalResponses" bson:"totalResponses"`
	CompletionRate        *float64                  `json:"completionRate,omitempty" bson:"completionRate,omitempty"`
	AverageTimeToComplete *float64                  `json:"averageTimeToComplete,omitempty" bson:"averageTimeToComplete,omitempty"`
	UpdatedAt             time.Time                 `json:"updatedAt" bson:"updatedAt"`
}

// AnalyticsResponse represents the response when returning analytics data
type AnalyticsResponse struct {
	FormID                string                    `json:"formId"`
	ByField               map[string]FieldAnalytics `json:"byField"`
	TotalResponses        int                       `json:"totalResponses"`
	CompletionRate        *float64                  `json:"completionRate,omitempty"`
	AverageTimeToComplete *float64                  `json:"averageTimeToComplete,omitempty"`
	UpdatedAt             time.Time                 `json:"updatedAt"`
}

// ToResponse converts an Analytics model to AnalyticsResponse
func (a *Analytics) ToResponse() *AnalyticsResponse {
	return &AnalyticsResponse{
		FormID:                a.ID.Hex(),
		ByField:               a.ByField,
		TotalResponses:        a.TotalResponses,
		CompletionRate:        a.CompletionRate,
		AverageTimeToComplete: a.AverageTimeToComplete,
		UpdatedAt:             a.UpdatedAt,
	}
}

// AnalyticsUpdate represents an update to analytics data for real-time broadcasting
type AnalyticsUpdate struct {
	Type    string                    `json:"type"`
	FormID  string                    `json:"formId"`
	Payload map[string]FieldAnalytics `json:"payload"`
}

// NewAnalyticsUpdate creates a new analytics update for broadcasting
func NewAnalyticsUpdate(formID string, analytics map[string]FieldAnalytics) *AnalyticsUpdate {
	return &AnalyticsUpdate{
		Type:    "analytics:update",
		FormID:  formID,
		Payload: analytics,
	}
}

// AnalyticsSummary represents a summary of analytics for dashboard overview
type AnalyticsSummary struct {
	FormID         string  `json:"formId"`
	FormTitle      string  `json:"formTitle"`
	TotalResponses int     `json:"totalResponses"`
	CompletionRate float64 `json:"completionRate"`
	LastResponse   *time.Time `json:"lastResponse,omitempty"`
}

// RealTimeMetrics represents real-time metrics for live updates
type RealTimeMetrics struct {
	ActiveUsers       int       `json:"activeUsers"`
	ResponsesToday    int       `json:"responsesToday"`
	ResponsesThisHour int       `json:"responsesThisHour"`
	LastUpdate        time.Time `json:"lastUpdate"`
}

// AggregationResult represents the result of a MongoDB aggregation pipeline
type AggregationResult struct {
	ID    interface{} `bson:"_id"`
	Count int         `bson:"count"`
	Value interface{} `bson:"value,omitempty"`
}

// AnalyticsComputeRequest represents a request to compute analytics
type AnalyticsComputeRequest struct {
	FormID    string     `json:"formId" validate:"required"`
	StartDate *time.Time `json:"startDate,omitempty"`
	EndDate   *time.Time `json:"endDate,omitempty"`
	Fields    []string   `json:"fields,omitempty"`
}

// InitializeAnalytics creates initial analytics structure for a new form
func InitializeAnalytics(formID primitive.ObjectID, fields []Field) *Analytics {
	byField := make(map[string]FieldAnalytics)
	
	for _, field := range fields {
		analytics := FieldAnalytics{
			Count: 0,
		}
		
		// Initialize distribution for MCQ and Checkbox fields
		if field.Type == FieldTypeMCQ || field.Type == FieldTypeCheckbox {
			analytics.Distribution = make(map[string]int)
			for _, option := range field.Options {
				analytics.Distribution[option.ID] = 0
			}
		}
		
		byField[field.ID] = analytics
	}
	
	return &Analytics{
		ID:             formID,
		ByField:        byField,
		TotalResponses: 0,
		UpdatedAt:      time.Now(),
	}
}
