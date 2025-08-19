package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/models"
)

// CreateDefaultTestUser creates the default test user if it doesn't exist
func (d *Database) CreateDefaultTestUser() (*primitive.ObjectID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collections := d.GetCollections()

	// Check if test user already exists
	var existingUser models.User
	err := collections.Users.FindOne(ctx, bson.M{"email": "test@test.com"}).Decode(&existingUser)
	if err == nil {
		log.Printf("INFO: Test user already exists with ID: %s", existingUser.ID.Hex())
		return &existingUser.ID, nil
	}

	if err != mongo.ErrNoDocuments {
		return nil, fmt.Errorf("failed to check for existing test user: %w", err)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Test@123"), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash test user password: %w", err)
	}

	// Create test user
	testUser := models.User{
		ID:        primitive.NewObjectID(),
		Email:     "test@test.com",
		Password:  string(hashedPassword),
		Name:      "Test User",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Insert test user
	_, err = collections.Users.InsertOne(ctx, testUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create test user: %w", err)
	}

	log.Printf("INFO: Created test user with ID: %s", testUser.ID.Hex())
	return &testUser.ID, nil
}

// AssignExistingFormsToTestUser assigns all existing forms to the test user
func (d *Database) AssignExistingFormsToTestUser(testUserID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collections := d.GetCollections()
	testUserIDString := testUserID.Hex()

	// Find all forms that have ObjectID as ownerId (need to convert to string)
	filter := bson.M{
		"$or": []bson.M{
			{"ownerId": bson.M{"$exists": false}},
			{"ownerId": bson.M{"$eq": primitive.NilObjectID}},
			{"ownerId": bson.M{"$eq": ""}},
			{"ownerId": bson.M{"$type": "objectId"}}, // Find ObjectID types to convert
		},
	}

	// Update all forms to use string ownerId
	update := bson.M{
		"$set": bson.M{
			"ownerId":   testUserIDString,
			"updatedAt": time.Now(),
		},
	}

	result, err := collections.Forms.UpdateMany(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to assign existing forms to test user: %w", err)
	}

	log.Printf("INFO: Assigned %d existing forms to test user with string ID", result.ModifiedCount)
	return nil
}

// RunMigrations runs all necessary database migrations
func (d *Database) RunMigrations() error {
	log.Println("INFO: Running database migrations...")

	// Create default test user
	testUserID, err := d.CreateDefaultTestUser()
	if err != nil {
		return fmt.Errorf("failed to create default test user: %w", err)
	}

	// Assign existing forms to test user
	err = d.AssignExistingFormsToTestUser(*testUserID)
	if err != nil {
		return fmt.Errorf("failed to assign existing forms to test user: %w", err)
	}

	log.Println("INFO: Database migrations completed successfully")
	return nil
}
