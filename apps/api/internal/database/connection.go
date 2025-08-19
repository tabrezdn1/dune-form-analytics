package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
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
	Users     *mongo.Collection
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
	
	log.Println("INFO: MongoDB connection established")
	
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
		Users:     d.DB.Collection("users"),
		Forms:     d.DB.Collection("forms"),
		Responses: d.DB.Collection("responses"),
		Analytics: d.DB.Collection("analytics"),
	}
}

// HealthCheck verifies the database connection is healthy
func (d *Database) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := d.Client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}
	
	return nil
}

// Close closes the database connection
func (d *Database) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := d.Client.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
	}
	
	log.Println("INFO: Disconnected from MongoDB")
	return nil
}

// EnsureIndexes creates necessary indexes for better performance
func (d *Database) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	collections := d.GetCollections()
	
	// Users collection indexes
	usersIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{"email", 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{"createdAt", 1}},
		},
	}
	
	_, err := collections.Users.Indexes().CreateMany(ctx, usersIndexes)
	if err != nil {
		return fmt.Errorf("failed to create users indexes: %w", err)
	}
	log.Println("INFO: Users collection indexes created")
	
	// Forms collection indexes
	formsIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{"shareSlug", 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{"ownerId", 1}},
		},
		{
			Keys: bson.D{{"status", 1}},
		},
		{
			Keys: bson.D{{"createdAt", 1}},
		},
	}
	
	_, err = collections.Forms.Indexes().CreateMany(ctx, formsIndexes)
	if err != nil {
		return fmt.Errorf("failed to create forms indexes: %w", err)
	}
	
	// Responses collection indexes
	responsesIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{"formId", 1}},
		},
		{
			Keys: bson.D{{"submittedAt", 1}},
		},
		{
			Keys: bson.D{{"formId", 1}, {"submittedAt", -1}},
		},
	}
	
	_, err = collections.Responses.Indexes().CreateMany(ctx, responsesIndexes)
	if err != nil {
		return fmt.Errorf("failed to create responses indexes: %w", err)
	}
	
	// Analytics collection - _id is already unique by default, no additional indexes needed
	
	log.Println("INFO: Database indexes verified")
	return nil
}


