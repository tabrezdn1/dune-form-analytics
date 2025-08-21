package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestAnalytics_ToResponse(t *testing.T) {
	t.Run("Convert analytics to response", func(t *testing.T) {
		analyticsID := primitive.NewObjectID()
		updatedAt := time.Date(2024, 8, 20, 15, 30, 0, 0, time.UTC)

		// Create test field analytics
		fieldAnalytics := map[string]FieldAnalytics{
			"field1": {
				Count: 100,
				Distribution: map[string]int{
					"option1": 40,
					"option2": 35,
					"option3": 25,
				},
				Average: floatPtr(4.2),
			},
			"field2": {
				Count: 80,
				Distribution: map[string]int{
					"yes": 60,
					"no":  20,
				},
				Average: nil,
			},
		}

		analytics := &Analytics{
			ID:             analyticsID,
			TotalResponses: 100,
			ByField:        fieldAnalytics,
			UpdatedAt:      updatedAt,
		}

		response := analytics.ToResponse()

		assert.NotNil(t, response)
		assert.Equal(t, analyticsID.Hex(), response.FormID)
		assert.Equal(t, 100, response.TotalResponses)
		assert.Equal(t, fieldAnalytics, response.ByField)
		assert.Equal(t, updatedAt, response.UpdatedAt)
	})

	t.Run("Convert analytics with empty field analytics", func(t *testing.T) {
		analyticsID := primitive.NewObjectID()

		analytics := &Analytics{
			ID:             analyticsID,
			TotalResponses: 0,
			ByField:        map[string]FieldAnalytics{},
			UpdatedAt:      time.Now(),
		}

		response := analytics.ToResponse()

		assert.NotNil(t, response)
		assert.Equal(t, analyticsID.Hex(), response.FormID)
		assert.Equal(t, 0, response.TotalResponses)
		assert.Empty(t, response.ByField)
	})
}

func TestFieldAnalytics_Structure(t *testing.T) {
	t.Run("Create field analytics with rating", func(t *testing.T) {
		avgRating := 4.5
		fieldAnalytics := FieldAnalytics{
			Count: 50,
			Distribution: map[string]int{
				"excellent": 20,
				"good":      15,
				"average":   10,
				"poor":      5,
			},
			Average: &avgRating,
		}

		assert.Equal(t, 50, fieldAnalytics.Count)
		assert.Len(t, fieldAnalytics.Distribution, 4)
		assert.Equal(t, 20, fieldAnalytics.Distribution["excellent"])
		assert.NotNil(t, fieldAnalytics.Average)
		assert.Equal(t, 4.5, *fieldAnalytics.Average)
	})

	t.Run("Create field analytics without rating", func(t *testing.T) {
		fieldAnalytics := FieldAnalytics{
			Count: 30,
			Distribution: map[string]int{
				"yes": 20,
				"no":  10,
			},
			Average: nil,
		}

		assert.Equal(t, 30, fieldAnalytics.Count)
		assert.Len(t, fieldAnalytics.Distribution, 2)
		assert.Nil(t, fieldAnalytics.Average)
	})

	t.Run("Create field analytics with empty distribution", func(t *testing.T) {
		fieldAnalytics := FieldAnalytics{
			Count:        0,
			Distribution: map[string]int{},
			Average:      nil,
		}

		assert.Equal(t, 0, fieldAnalytics.Count)
		assert.Empty(t, fieldAnalytics.Distribution)
		assert.Nil(t, fieldAnalytics.Average)
	})
}

func TestRealTimeMetrics_Structure(t *testing.T) {
	t.Run("Create real-time metrics", func(t *testing.T) {
		lastUpdate := time.Date(2024, 8, 20, 16, 45, 0, 0, time.UTC)
		metrics := RealTimeMetrics{
			ActiveUsers:       5,
			ResponsesToday:    150,
			ResponsesThisHour: 12,
			LastUpdate:        lastUpdate,
		}

		assert.Equal(t, 5, metrics.ActiveUsers)
		assert.Equal(t, 150, metrics.ResponsesToday)
		assert.Equal(t, 12, metrics.ResponsesThisHour)
		assert.Equal(t, lastUpdate, metrics.LastUpdate)
		assert.Equal(t, 2024, metrics.LastUpdate.Year())
	})

	t.Run("Create real-time metrics with zero values", func(t *testing.T) {
		metrics := RealTimeMetrics{
			ActiveUsers:       0,
			ResponsesToday:    0,
			ResponsesThisHour: 0,
			LastUpdate:        time.Time{},
		}

		assert.Equal(t, 0, metrics.ActiveUsers)
		assert.Equal(t, 0, metrics.ResponsesToday)
		assert.Equal(t, 0, metrics.ResponsesThisHour)
		assert.True(t, metrics.LastUpdate.IsZero())
	})
}

func TestAnalyticsSummary_Structure(t *testing.T) {
	t.Run("Create analytics summary", func(t *testing.T) {
		summary := AnalyticsSummary{
			FormID:         "507f1f77bcf86cd799439011",
			FormTitle:      "Customer Feedback",
			TotalResponses: 200,
			CompletionRate: 85.5,
			LastResponse:   timePtr(time.Now()),
		}

		assert.Equal(t, "507f1f77bcf86cd799439011", summary.FormID)
		assert.Equal(t, "Customer Feedback", summary.FormTitle)
		assert.Equal(t, 200, summary.TotalResponses)
		assert.Equal(t, 85.5, summary.CompletionRate)
		assert.NotNil(t, summary.LastResponse)
	})
}

func TestTrendAnalytics_Structure(t *testing.T) {
	t.Run("Create trend analytics", func(t *testing.T) {
		startDate := time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC)
		endDate := time.Date(2024, 8, 17, 23, 59, 59, 0, time.UTC)
		updatedAt := time.Date(2024, 8, 18, 9, 0, 0, 0, time.UTC)

		trendData := []TrendPoint{
			{
				Date:  time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC),
				Value: 4.2,
				Count: 25,
			},
			{
				Date:  time.Date(2024, 8, 16, 0, 0, 0, 0, time.UTC),
				Value: 4.5,
				Count: 30,
			},
			{
				Date:  time.Date(2024, 8, 17, 0, 0, 0, 0, time.UTC),
				Value: 4.1,
				Count: 20,
			},
		}

		trends := TrendAnalytics{
			FormID:    "507f1f77bcf86cd799439011",
			Period:    "daily",
			TrendData: trendData,
			StartDate: startDate,
			EndDate:   endDate,
			UpdatedAt: updatedAt,
		}

		assert.Equal(t, "507f1f77bcf86cd799439011", trends.FormID)
		assert.Equal(t, "daily", trends.Period)
		assert.Len(t, trends.TrendData, 3)
		assert.Equal(t, 4.2, trends.TrendData[0].Value)
		assert.Equal(t, 25, trends.TrendData[0].Count)
		assert.Equal(t, startDate, trends.StartDate)
		assert.Equal(t, endDate, trends.EndDate)
		assert.Equal(t, updatedAt, trends.UpdatedAt)
	})

	t.Run("Create empty trend analytics", func(t *testing.T) {
		trends := TrendAnalytics{
			FormID:    "507f1f77bcf86cd799439011",
			Period:    "weekly",
			TrendData: []TrendPoint{},
			StartDate: time.Time{},
			EndDate:   time.Time{},
			UpdatedAt: time.Now(),
		}

		assert.Equal(t, "507f1f77bcf86cd799439011", trends.FormID)
		assert.Equal(t, "weekly", trends.Period)
		assert.Empty(t, trends.TrendData)
		assert.True(t, trends.StartDate.IsZero())
		assert.True(t, trends.EndDate.IsZero())
	})
}

func TestTrendPoint_Structure(t *testing.T) {
	t.Run("Create trend point", func(t *testing.T) {
		date := time.Date(2024, 8, 20, 14, 30, 0, 0, time.UTC)
		point := TrendPoint{
			Date:  date,
			Value: 4.3,
			Count: 42,
		}

		assert.Equal(t, date, point.Date)
		assert.Equal(t, 4.3, point.Value)
		assert.Equal(t, 42, point.Count)
	})
}

func TestKeywordCount_Structure(t *testing.T) {
	t.Run("Create keyword count", func(t *testing.T) {
		keyword := KeywordCount{
			Keyword: "excellent",
			Count:   15,
		}

		assert.Equal(t, "excellent", keyword.Keyword)
		assert.Equal(t, 15, keyword.Count)
	})
}

func TestNewAnalyticsUpdate(t *testing.T) {
	t.Run("Create analytics update", func(t *testing.T) {
		formID := "507f1f77bcf86cd799439011"
		analytics := map[string]FieldAnalytics{
			"field1": {
				Count: 50,
				Distribution: map[string]int{
					"option1": 30,
					"option2": 20,
				},
			},
		}

		update := NewAnalyticsUpdate(formID, analytics)

		assert.NotNil(t, update)
		assert.Equal(t, "analytics:update", update.Type)
		assert.Equal(t, formID, update.FormID)
		assert.Equal(t, analytics, update.Payload)
	})
}

// Helper functions
func floatPtr(f float64) *float64 {
	return &f
}

func timePtr(t time.Time) *time.Time {
	return &t
}
