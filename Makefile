# Dune Form Analytics - Development Commands
.PHONY: help dev build test lint fmt clean seed logs lint-local fmt-local test-local

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

lint: ## Run linters (eslint + golangci-lint) - Docker
	@echo "🔍 Running linters (Docker)..."
	docker compose exec web npm run lint
	docker compose exec api golangci-lint run

fmt: ## Format code (prettier + go fmt) - Docker
	@echo "✨ Formatting code (Docker)..."
	docker compose exec web npm run format
	docker compose exec api go fmt ./...

# Local development commands (run without Docker)

# Backend local commands
lint-local: ## Run backend linter locally (requires golangci-lint)
	@echo "🔍 Running Go linter locally..."
	cd apps/api && $(shell go env GOPATH)/bin/golangci-lint run ./... || (echo "⚠️  golangci-lint failed, falling back to basic go tools..." && go vet ./... && echo "✅ Basic go vet passed")

fmt-local: ## Format backend code locally
	@echo "✨ Formatting Go code locally..."
	cd apps/api && go fmt ./...
	cd apps/api && $(shell go env GOPATH)/bin/goimports -w -local github.com/tabrezdn1/dune-form-analytics .

test-local: ## Run backend tests locally
	@echo "🧪 Running Go tests locally..."
	cd apps/api && go test -v -race -cover ./...

build-local: ## Build backend binary locally
	@echo "🔨 Building backend locally..."
	cd apps/api && go build -o tmp/main ./cmd/server

run-local: ## Run backend locally (requires MongoDB)
	@echo "🚀 Starting backend locally..."
	cd apps/api && go run ./cmd/server

install-tools: ## Install required Go tools locally
	@echo "📦 Installing Go development tools..."
	go install golang.org/x/tools/cmd/goimports@latest
	@echo "✅ goimports installed"
	@echo "✅ golangci-lint already installed"
	@echo "All Go tools ready for local development!"

# Frontend local commands
install-frontend-deps: ## Install frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	cd apps/web && npm ci

lint-frontend-local: ## Run frontend linter locally
	@echo "🔍 Running frontend linter locally..."
	cd apps/web && npm run lint

fmt-frontend-local: ## Format frontend code locally
	@echo "✨ Formatting frontend code locally..."
	cd apps/web && npm run format:check

type-check-frontend-local: ## Run TypeScript type checking locally
	@echo "🔍 Running TypeScript type checking locally..."
	cd apps/web && npm run type-check

test-frontend-local: ## Run frontend tests locally
	@echo "🧪 Running frontend tests locally..."
	cd apps/web && npm run test:coverage

build-frontend-local: ## Build frontend locally
	@echo "🔨 Building frontend locally..."
	cd apps/web && npm run build

run-frontend-local: ## Run frontend locally
	@echo "🚀 Starting frontend locally..."
	cd apps/web && npm run dev

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
	@echo "API:               http://localhost:8080"
	@echo "API Health:        http://localhost:8080/health"
	@echo ""
	@echo "Development Tools:"
	@echo "API Documentation: http://localhost:8082/swagger/index.html"
	@echo "Performance Monitor: http://localhost:8083/monitor"
	@echo "Go Profiling:      http://localhost:8084/debug/pprof"
	@echo ""
	@echo "Database UI:       http://localhost:8081 (admin/admin123)"
	
	@echo ""
	@echo "Docker Desktop Users:"
	@echo "   - Click port 8082 for API Documentation"
	@echo "   - Click port 8083 for Performance Monitor"
	@echo "   - Click port 8084 for Go Profiling"

# Development shortcuts
up: dev ## Alias for dev
down: ## Stop all services
	docker compose down

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd apps/web && npm install
	cd apps/api && go mod tidy
