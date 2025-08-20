# Dune Form Analytics - Development Commands
.PHONY: help dev build test lint fmt clean seed logs

# Default target
help: ## Show this help message
	@echo "Dune Form Analytics - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment (docker compose up)
	@echo "🚀 Starting development environment..."
	docker compose up --build

dev-detached: ## Start development environment in background
	@echo "🚀 Starting development environment (detached)..."
	docker compose up --build -d

build: ## Build all containers
	@echo "🔨 Building containers..."
	docker compose build

test: ## Run all tests (frontend + backend)
	@echo "🧪 Running tests..."
	docker compose exec web npm test
	docker compose exec api go test ./...

test-frontend: ## Run frontend tests only
	@echo "🧪 Running frontend tests..."
	docker compose exec web npm test

test-backend: ## Run backend tests only
	@echo "🧪 Running backend tests..."
	docker compose exec api go test ./...

lint: ## Run linters (eslint + golangci-lint)
	@echo "🔍 Running linters..."
	docker compose exec web npm run lint
	docker compose exec api golangci-lint run

fmt: ## Format code (prettier + go fmt)
	@echo "✨ Formatting code..."
	docker compose exec web npm run format
	docker compose exec api go fmt ./...

seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	docker compose exec api go run cmd/seed/main.go

clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker compose down -v --remove-orphans
	docker system prune -f

logs: ## Show logs for all services
	docker compose logs -f

logs-api: ## Show API logs
	docker compose logs -f api

logs-web: ## Show Web logs
	docker compose logs -f web

logs-mongo: ## Show MongoDB logs
	docker compose logs -f mongo

shell-api: ## Open shell in API container
	docker compose exec api sh

shell-web: ## Open shell in Web container
	docker compose exec web sh

shell-mongo: ## Open MongoDB shell
	docker compose exec mongo mongosh -u admin -p password123 --authenticationDatabase admin dune_forms

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker compose restart

restart-api: ## Restart API service only
	docker compose restart api

restart-web: ## Restart Web service only
	docker compose restart web

status: ## Show container status
	docker compose ps



urls: ## Display all service URLs
	@echo "Dune Form Analytics - Service URLs:"
	@echo "=================================="
	@echo "Frontend:          http://localhost:3000"
	@echo "API:              http://localhost:8080"
	@echo "API Health:       http://localhost:8080/health"
	@echo ""
	@echo "Development Tools:"
	@echo "API Docs:         http://localhost:8080/swagger/index.html"
	@echo "API Monitor:      http://localhost:8080/monitor"
	@echo "API Profiler:     http://localhost:8080/debug/pprof"
	@echo ""
	@echo "Database UI:      http://localhost:8081"
	
	@echo ""
	@echo "Docker Desktop Users:"
	@echo "   - Click port 8082 for API Documentation"
	@echo "   - Click port 8083 for Performance Monitor"
	@echo "   - Click port 8084 for Performance Profiler"

# Development shortcuts
up: dev ## Alias for dev
down: ## Stop all services
	docker compose down

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd apps/web && npm install
	cd apps/api && go mod tidy
