package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Database holds the MongoDB client and database instance
type Database struct {
	Client *mongo.Client
	DB     *mongo.Database
}

// Collections holds references to MongoDB collections
type Collections struct {
	Forms     *mongo.Collection
	Responses *mongo.Collection
	Analytics *mongo.Collection
}

// Connect establishes a connection to MongoDB
func Connect(mongoURI string) (*Database, error) {
	// Set client options
	clientOptions := options.Client().ApplyURI(mongoURI)
	
	// Set connection timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}
	
	// Ping the database to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}
	
	log.Println("✅ Connected to MongoDB successfully")
	
	// Get database instance
	db := client.Database("dune_forms")
	
	return &Database{
		Client: client,
		DB:     db,
	}, nil
}

// GetCollections returns references to all collections
func (d *Database) GetCollections() *Collections {
	return &Collections{
		Forms:     d.DB.Collection("forms"),
		Responses: d.DB.Collection("responses"),
		Analytics: d.DB.Collection("analytics"),
	}
}

// Close closes the database connection
func (d *Database) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := d.Client.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
	}
	
	log.Println("🔌 Disconnected from MongoDB")
	return nil
}

// EnsureIndexes creates necessary indexes for better performance
func (d *Database) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	collections := d.GetCollections()
	
	// Forms collection indexes
	formsIndexes := []mongo.IndexModel{
		{
			Keys:    map[string]int{"shareSlug": 1},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: map[string]int{"ownerId": 1},
		},
		{
			Keys: map[string]int{"status": 1},
		},
		{
			Keys: map[string]int{"createdAt": 1},
		},
	}
	
	_, err := collections.Forms.Indexes().CreateMany(ctx, formsIndexes)
	if err != nil {
		return fmt.Errorf("failed to create forms indexes: %w", err)
	}
	
	// Responses collection indexes
	responsesIndexes := []mongo.IndexModel{
		{
			Keys: map[string]int{"formId": 1},
		},
		{
			Keys: map[string]int{"submittedAt": 1},
		},
		{
			Keys: map[string]int{"formId": 1, "submittedAt": -1},
		},
	}
	
	_, err = collections.Responses.Indexes().CreateMany(ctx, responsesIndexes)
	if err != nil {
		return fmt.Errorf("failed to create responses indexes: %w", err)
	}
	
	// Analytics collection indexes
	analyticsIndexes := []mongo.IndexModel{
		{
			Keys:    map[string]int{"_id": 1},
			Options: options.Index().SetUnique(true),
		},
	}
	
	_, err = collections.Analytics.Indexes().CreateMany(ctx, analyticsIndexes)
	if err != nil {
		return fmt.Errorf("failed to create analytics indexes: %w", err)
	}
	
	log.Println("📊 Database indexes created successfully")
	return nil
}

// HealthCheck performs a health check on the database connection
func (d *Database) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return d.Client.Ping(ctx, nil)
}
