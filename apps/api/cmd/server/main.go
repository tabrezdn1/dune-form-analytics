package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/container"
	"github.com/joho/godotenv"
)

func main() {
	// Initialize structured logging
	logPrefix := fmt.Sprintf("[DUNE-API] %s", time.Now().Format("2006-01-02 15:04:05"))
	log.SetPrefix(logPrefix + " ")
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("INFO: No .env file found, using system environment variables")
	}

	log.Println("INFO: Starting Dune Form Analytics API with dependency injection")

	// Create and start the application using dependency injection
	app := container.NewContainer()
	
	// Run the application
	if err := app.Start(context.Background()); err != nil {
		log.Fatalf("ERROR: Failed to start application: %v", err)
	}

	// Wait for the application to stop
	<-app.Done()
	log.Println("INFO: Application stopped")
}


