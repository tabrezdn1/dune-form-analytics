package services

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/database"
	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AnalyticsService handles analytics-related business logic
type AnalyticsService struct {
	collections *database.Collections
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(collections *database.Collections) *AnalyticsService {
	return &AnalyticsService{
		collections: collections,
	}
}

// GetAnalytics retrieves analytics for a form
func (s *AnalyticsService) GetAnalytics(ctx context.Context, formID string, ownerID *string) (*models.AnalyticsResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Verify form ownership if ownerID is provided
	if ownerID != nil {
		var form models.Form
		err = s.collections.Forms.FindOne(ctx, bson.M{
			"_id":     objectID,
			"ownerId": *ownerID,
		}).Decode(&form)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, fmt.Errorf("form not found or access denied")
			}
			return nil, fmt.Errorf("failed to verify form ownership: %w", err)
		}
	}

	// Get analytics from database
	var analytics models.Analytics
	err = s.collections.Analytics.FindOne(ctx, bson.M{"_id": objectID}).Decode(&analytics)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// If analytics don't exist, compute them
			return s.ComputeAnalytics(ctx, formID, nil, nil, nil, ownerID)
		}
		return nil, fmt.Errorf("failed to get analytics: %w", err)
	}

	return analytics.ToResponse(), nil
}

// ComputeAnalytics computes analytics for a form from responses
func (s *AnalyticsService) ComputeAnalytics(ctx context.Context, formID string, startDate, endDate *time.Time, fields []string, ownerID *string) (*models.AnalyticsResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Get the form
	var form models.Form
	filter := bson.M{"_id": objectID}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	err = s.collections.Forms.FindOne(ctx, filter).Decode(&form)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("form not found or access denied")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	// Build response filter
	responseFilter := bson.M{"formId": objectID}
	if startDate != nil || endDate != nil {
		dateFilter := bson.M{}
		if startDate != nil {
			dateFilter["$gte"] = *startDate
		}
		if endDate != nil {
			dateFilter["$lte"] = *endDate
		}
		responseFilter["submittedAt"] = dateFilter
	}

	// Get all responses
	cursor, err := s.collections.Responses.Find(ctx, responseFilter)
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}
	defer cursor.Close(ctx)

	var responses []models.Response
	if err := cursor.All(ctx, &responses); err != nil {
		return nil, fmt.Errorf("failed to decode responses: %w", err)
	}

	// Compute analytics
	analytics := s.computeAnalyticsFromResponses(form.Fields, responses, fields)
	analytics.ID = objectID
	analytics.UpdatedAt = time.Now()

	// Update analytics in database
	upsert := true
	_, err = s.collections.Analytics.ReplaceOne(
		ctx,
		bson.M{"_id": objectID},
		analytics,
		&options.ReplaceOptions{Upsert: &upsert},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update analytics: %w", err)
	}

	return analytics.ToResponse(), nil
}

// UpdateAnalyticsIncremental updates analytics incrementally when a new response is submitted
func (s *AnalyticsService) UpdateAnalyticsIncremental(ctx context.Context, formID primitive.ObjectID, response *models.Response, form *models.Form) (*models.Analytics, error) {
	// Get current analytics
	var analytics models.Analytics
	err := s.collections.Analytics.FindOne(ctx, bson.M{"_id": formID}).Decode(&analytics)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Initialize analytics if they don't exist
			analytics = *models.InitializeAnalytics(formID, form.Fields)
		} else {
			return nil, fmt.Errorf("failed to get analytics: %w", err)
		}
	}

	// Update analytics with new response
	analytics.TotalResponses++

	// Process each answer
	for _, answer := range response.Answers {
		fieldAnalytics, exists := analytics.ByField[answer.FieldID]
		if !exists {
			fieldAnalytics = models.FieldAnalytics{Count: 0}
		}

		fieldAnalytics.Count++

		// Find the field to determine type
		var field *models.Field
		for _, f := range form.Fields {
			if f.ID == answer.FieldID {
				field = &f
				break
			}
		}

		if field != nil {
			switch field.Type {
			case models.FieldTypeRating:
				if rating, ok := answer.Value.(float64); ok {
					s.updateRatingAnalytics(&fieldAnalytics, rating)
				}

			case models.FieldTypeMCQ:
				if option, ok := answer.Value.(string); ok {
					s.updateDistributionAnalytics(&fieldAnalytics, []string{option})
				}

			case models.FieldTypeCheckbox:
				if options, ok := answer.Value.([]interface{}); ok {
					strOptions := make([]string, len(options))
					for i, opt := range options {
						if str, ok := opt.(string); ok {
							strOptions[i] = str
						}
					}
					s.updateDistributionAnalytics(&fieldAnalytics, strOptions)
				}
			}
		}

		analytics.ByField[answer.FieldID] = fieldAnalytics
	}

	analytics.UpdatedAt = time.Now()

	// Update analytics in database
	_, err = s.collections.Analytics.ReplaceOne(
		ctx,
		bson.M{"_id": formID},
		analytics,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update analytics: %w", err)
	}

	return &analytics, nil
}

// computeAnalyticsFromResponses computes analytics from a list of responses
func (s *AnalyticsService) computeAnalyticsFromResponses(fields []models.Field, responses []models.Response, filterFields []string) *models.Analytics {
	analytics := &models.Analytics{
		ByField:        make(map[string]models.FieldAnalytics),
		TotalResponses: len(responses),
		UpdatedAt:      time.Now(),
	}

	// Create field filter map
	fieldFilter := make(map[string]bool)
	if filterFields != nil {
		for _, fieldID := range filterFields {
			fieldFilter[fieldID] = true
		}
	}

	// Initialize field analytics
	for _, field := range fields {
		if filterFields != nil && !fieldFilter[field.ID] {
			continue
		}

		fieldAnalytics := models.FieldAnalytics{
			Count: 0,
		}

		if field.Type == models.FieldTypeMCQ || field.Type == models.FieldTypeCheckbox {
			fieldAnalytics.Distribution = make(map[string]int)
			for _, option := range field.Options {
				fieldAnalytics.Distribution[option.ID] = 0
			}
		}

		analytics.ByField[field.ID] = fieldAnalytics
	}

	// Process responses
	ratingValues := make(map[string][]float64)

	for _, response := range responses {
		for _, answer := range response.Answers {
			if filterFields != nil && !fieldFilter[answer.FieldID] {
				continue
			}

			fieldAnalytics, exists := analytics.ByField[answer.FieldID]
			if !exists {
				continue
			}

			fieldAnalytics.Count++

			// Find the field to determine type
			var field *models.Field
			for _, f := range fields {
				if f.ID == answer.FieldID {
					field = &f
					break
				}
			}

			if field != nil {
				switch field.Type {
				case models.FieldTypeRating:
					if rating, ok := answer.Value.(float64); ok {
						ratingValues[answer.FieldID] = append(ratingValues[answer.FieldID], rating)
					}

				case models.FieldTypeMCQ:
					if option, ok := answer.Value.(string); ok {
						if fieldAnalytics.Distribution == nil {
							fieldAnalytics.Distribution = make(map[string]int)
						}
						fieldAnalytics.Distribution[option]++
					}

				case models.FieldTypeCheckbox:
					if options, ok := answer.Value.([]interface{}); ok {
						if fieldAnalytics.Distribution == nil {
							fieldAnalytics.Distribution = make(map[string]int)
						}
						for _, opt := range options {
							if str, ok := opt.(string); ok {
								fieldAnalytics.Distribution[str]++
							}
						}
					}
				}
			}

			analytics.ByField[answer.FieldID] = fieldAnalytics
		}
	}

	// Compute rating statistics
	for fieldID, values := range ratingValues {
		if len(values) > 0 {
			fieldAnalytics := analytics.ByField[fieldID]
			
			// Calculate average
			sum := 0.0
			for _, val := range values {
				sum += val
			}
			avg := sum / float64(len(values))
			fieldAnalytics.Average = &avg

			// Calculate median
			sort.Float64s(values)
			var median float64
			if len(values)%2 == 0 {
				median = (values[len(values)/2-1] + values[len(values)/2]) / 2
			} else {
				median = values[len(values)/2]
			}
			fieldAnalytics.Median = &median

			analytics.ByField[fieldID] = fieldAnalytics
		}
	}

	return analytics
}

// updateRatingAnalytics updates rating field analytics
func (s *AnalyticsService) updateRatingAnalytics(fieldAnalytics *models.FieldAnalytics, newRating float64) {
	if fieldAnalytics.Average == nil {
		fieldAnalytics.Average = &newRating
		fieldAnalytics.Median = &newRating
	} else {
		// Update average (simplified - for exact average, we'd need to store sum and count)
		currentAvg := *fieldAnalytics.Average
		newAvg := (currentAvg*float64(fieldAnalytics.Count-1) + newRating) / float64(fieldAnalytics.Count)
		fieldAnalytics.Average = &newAvg
	}
}

// updateDistributionAnalytics updates distribution analytics
func (s *AnalyticsService) updateDistributionAnalytics(fieldAnalytics *models.FieldAnalytics, options []string) {
	if fieldAnalytics.Distribution == nil {
		fieldAnalytics.Distribution = make(map[string]int)
	}

	for _, option := range options {
		fieldAnalytics.Distribution[option]++
	}
}

// GetRealTimeMetrics gets real-time metrics for a form
func (s *AnalyticsService) GetRealTimeMetrics(ctx context.Context, formID string, ownerID *string) (*models.RealTimeMetrics, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Verify form ownership if ownerID is provided
	if ownerID != nil {
		var form models.Form
		err = s.collections.Forms.FindOne(ctx, bson.M{
			"_id":     objectID,
			"ownerId": *ownerID,
		}).Decode(&form)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, fmt.Errorf("form not found or access denied")
			}
			return nil, fmt.Errorf("failed to verify form ownership: %w", err)
		}
	}

	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	hourStart := now.Truncate(time.Hour)

	// Count responses today
	responsesToday, err := s.collections.Responses.CountDocuments(ctx, bson.M{
		"formId": objectID,
		"submittedAt": bson.M{
			"$gte": todayStart,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count today's responses: %w", err)
	}

	// Count responses this hour
	responsesThisHour, err := s.collections.Responses.CountDocuments(ctx, bson.M{
		"formId": objectID,
		"submittedAt": bson.M{
			"$gte": hourStart,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count this hour's responses: %w", err)
	}

	return &models.RealTimeMetrics{
		ActiveUsers:       0, // This would require WebSocket tracking
		ResponsesToday:    int(responsesToday),
		ResponsesThisHour: int(responsesThisHour),
		LastUpdate:        now,
	}, nil
}

// GetAnalyticsSummary gets a summary of analytics for multiple forms
func (s *AnalyticsService) GetAnalyticsSummary(ctx context.Context, ownerID *string) ([]*models.AnalyticsSummary, error) {
	// Build filter for forms
	filter := bson.M{}
	if ownerID != nil {
		filter["ownerId"] = *ownerID
	}

	// Get forms
	cursor, err := s.collections.Forms.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get forms: %w", err)
	}
	defer cursor.Close(ctx)

	var forms []models.Form
	if err := cursor.All(ctx, &forms); err != nil {
		return nil, fmt.Errorf("failed to decode forms: %w", err)
	}

	summaries := make([]*models.AnalyticsSummary, 0, len(forms))

	for _, form := range forms {
		// Get analytics for this form
		var analytics models.Analytics
		err = s.collections.Analytics.FindOne(ctx, bson.M{"_id": form.ID}).Decode(&analytics)
		if err != nil && err != mongo.ErrNoDocuments {
			continue // Skip forms with analytics errors
		}

		summary := &models.AnalyticsSummary{
			FormID:         form.ID.Hex(),
			FormTitle:      form.Title,
			TotalResponses: analytics.TotalResponses,
			CompletionRate: 1.0, // Simplified - would need more complex calculation
		}

			// Get last response time
	var lastResponse models.Response
	err = s.collections.Responses.FindOne(ctx, bson.M{"formId": form.ID}, &options.FindOneOptions{
		Sort: bson.M{"submittedAt": -1},
	}).Decode(&lastResponse)
		if err == nil {
			summary.LastResponse = &lastResponse.SubmittedAt
		}

		summaries = append(summaries, summary)
	}

	return summaries, nil
}

// GetTrendAnalytics gets trend analytics for a form over a specific period
func (s *AnalyticsService) GetTrendAnalytics(ctx context.Context, formID string, period string, ownerID *string) (*models.TrendAnalytics, error) {
	objectID, err := primitive.ObjectIDFromHex(formID)
	if err != nil {
		return nil, fmt.Errorf("invalid form ID: %w", err)
	}

	// Verify form ownership if ownerID is provided
	if ownerID != nil {
		var form models.Form
		err = s.collections.Forms.FindOne(ctx, bson.M{
			"_id":     objectID,
			"ownerId": *ownerID,
		}).Decode(&form)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, fmt.Errorf("form not found or access denied")
			}
			return nil, fmt.Errorf("failed to verify form ownership: %w", err)
		}
	}

	// Calculate date range based on period
	endDate := time.Now()
	var startDate time.Time
	
	switch period {
	case "day":
		startDate = endDate.AddDate(0, 0, -1)
	case "week":
		startDate = endDate.AddDate(0, 0, -7)
	case "month":
		startDate = endDate.AddDate(0, -1, 0)
	case "year":
		startDate = endDate.AddDate(-1, 0, 0)
	default:
		startDate = endDate.AddDate(0, 0, -7) // Default to week
	}

	// Aggregate responses by time period
	pipeline := []bson.M{
		{"$match": bson.M{
			"formId": objectID,
			"submittedAt": bson.M{
				"$gte": startDate,
				"$lte": endDate,
			},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{
					"format": "%Y-%m-%d",
					"date":   "$submittedAt",
				},
			},
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	cursor, err := s.collections.Responses.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate trend data: %w", err)
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("failed to decode trend data: %w", err)
	}

	// Convert results to trend points
	trendData := make([]models.TrendPoint, 0, len(results))
	for _, result := range results {
		dateStr, ok := result["_id"].(string)
		if !ok {
			continue
		}
		
		count, ok := result["count"].(int32)
		if !ok {
			continue
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}

		trendData = append(trendData, models.TrendPoint{
			Date:  date,
			Value: float64(count),
			Count: int(count),
		})
	}

	return &models.TrendAnalytics{
		FormID:    formID,
		Period:    period,
		TrendData: trendData,
		StartDate: startDate,
		EndDate:   endDate,
		UpdatedAt: time.Now(),
	}, nil
}
