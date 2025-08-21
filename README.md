# Dune Forms

**Professional form builder with real-time analytics and drag-and-drop interface.**

## Product Overview

Dune Forms is a form creation and analytics platform that enables users to build interactive forms with real-time data visualization. The platform provides a visual drag-and-drop form builder, analytics dashboard, and live response tracking through WebSocket connections.

**Key Features:**
- **Visual Form Builder**: Drag-and-drop interface for creating forms
- **Real-Time Analytics**: Live updates on form responses via WebSockets
- **User Authentication**: JWT-based authentication with refresh tokens
- **Multiple Field Types**: Text, multiple-choice, checkbox, and rating fields
- **Conditional Logic**: Dynamic field visibility based on responses
- **Data Export**: CSV and PDF export for responses and analytics
- **Development Tools**: Built-in monitoring and profiling tools

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, TypeScript, React 18 | Server-side rendered React application |
| | Tailwind CSS | Utility-first CSS framework |
| | HTML5 Drag & Drop | Native drag-and-drop functionality |
| | Recharts | Analytics data visualization |
| | WebSocket Client | Real-time communication |
| | React Hot Toast | User notifications |
| | html2canvas + jsPDF | PDF export functionality |
| | nanoid | Unique ID generation |
| | clsx | Conditional className composition |
| **Backend** | Go 1.23, Fiber v2 | High-performance HTTP framework |
| | JWT (golang-jwt/jwt/v5) | Authentication & authorization |
| | WebSocket (gofiber/websocket/v2) | Real-time communication |
| | Viper | Configuration management |
| | Fx | Dependency injection framework |
| **Database** | MongoDB 6 | Document-based data storage |
| | Mongo Express | Database administration UI |
| **Infrastructure** | Docker & Docker Compose | Containerization and orchestration |
| | Swagger/OpenAPI | API documentation |
| | Air | Live reload for Go development |
| **CI/CD** | Make | Build automation and development commands |

## Architecture Diagram

```mermaid
flowchart TB
    subgraph "Client Layer"
        browser[Web Browser]
        mobile[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        nextjs[Next.js Application<br/>Port: 3000]
        builder[Form Builder<br/>Drag & Drop]
        dashboard[Analytics Dashboard<br/>Real-time Charts]
    end
    
    subgraph "API Gateway Layer"
        api[Go Fiber API<br/>Port: 8080]
        auth[JWT Auth Middleware]
        ws[WebSocket Manager<br/>Real-time Updates]
    end
    
    subgraph "Service Layer"
        formSvc[Form Service<br/>CRUD Operations]
        respSvc[Response Service<br/>Submission Handling]
        analyticsSvc[Analytics Service<br/>Computation Engine]
        authSvc[Auth Service<br/>User Management]
    end
    
    subgraph "Data Layer"
        mongo[(MongoDB<br/>Port: 27017)]
        mongoUI[Mongo Express<br/>Port: 8081]
    end
    
    subgraph "Development Tools"
        swagger[Swagger Docs<br/>:8080/swagger]
        monitor[Performance Monitor<br/>:8080/monitor]
        profiler[Go Profiler<br/>:8080/debug/pprof]
    end
    
    %% Client connections
    browser --> nextjs
    mobile --> nextjs
    
    %% Frontend to API
    nextjs <--> api
    nextjs <--> ws
    builder --> nextjs
    dashboard --> nextjs
    
    %% API routing
    api --> auth
    api --> ws
    auth --> authSvc
    
    %% Service connections
    api --> formSvc
    api --> respSvc
    api --> analyticsSvc
    api --> authSvc
    
    %% Data connections
    formSvc --> mongo
    respSvc --> mongo
    analyticsSvc --> mongo
    authSvc --> mongo
    mongoUI --> mongo
    
    %% Development connections (dashed for optional)
    api -.-> swagger
    api -.-> monitor
    api -.-> profiler
```

**Links for nodes:**
- **Next.js Application** → [docs/frontend/overview.md](docs/frontend/overview.md)
- **Form Builder** → [docs/frontend/overview.md#form-builder](docs/frontend/overview.md#form-builder)
- **Analytics Dashboard** → [docs/frontend/overview.md#analytics-dashboard](docs/frontend/overview.md#analytics-dashboard)
- **Go Fiber API** → [docs/backend/overview.md](docs/backend/overview.md)
- **WebSocket Manager** → [docs/backend/websockets.md](docs/backend/websockets.md)
- **Form Service** → [docs/backend/overview.md#service-layer-architecture](docs/backend/overview.md#service-layer-architecture)
- **Response Service** → [docs/backend/overview.md#service-layer-architecture](docs/backend/overview.md#service-layer-architecture)
- **Analytics Service** → [docs/backend/overview.md#service-layer-architecture](docs/backend/overview.md#service-layer-architecture)
- **Auth Service** → [docs/backend/overview.md#authentication--authorization](docs/backend/overview.md#authentication--authorization)
- **MongoDB** → [docs/architecture/data-model.md](docs/architecture/data-model.md)
- **Development Tools** → [docs/backend/overview.md#development-tools-integration](docs/backend/overview.md#development-tools-integration)

## Features

- **🎨 Visual Form Builder**: Drag-and-drop interface for creating forms → [docs/frontend/overview.md#form-builder](docs/frontend/overview.md#form-builder)
- **📊 Real-Time Analytics**: Live response tracking and metrics → [docs/backend/websockets.md](docs/backend/websockets.md)
- **🔐 Secure Authentication**: JWT-based auth with refresh tokens → [docs/backend/api-rest.md#authentication-endpoints](docs/backend/api-rest.md#authentication-endpoints)
- **🔄 Field Types**: Text, MCQ, checkbox, and rating fields → [docs/backend/api-rest.md#field-types](docs/backend/api-rest.md#field-types)
- **⚡ Conditional Logic**: Dynamic field visibility → [docs/architecture/data-model.md](docs/architecture/data-model.md)
- **📤 Data Export**: CSV and PDF export for responses and analytics → [docs/backend/api-rest.md#export-responses-csv](docs/backend/api-rest.md#export-responses-csv)
- **📱 Responsive Design**: Mobile-optimized user interface → [docs/frontend/overview.md](docs/frontend/overview.md)
- **🚀 Performance Monitoring**: Built-in monitoring and profiling → [docs/backend/overview.md#development-tools-integration](docs/backend/overview.md#development-tools-integration)

## How to Set Up

### Prerequisites

- **Docker** (v20.0+) and **Docker Compose** (v2.0+)
- **Git** for version control

### Environment Variables

**No .env file needed for basic setup!** All environment variables are configured in `docker-compose.yml`.

For customization, you can optionally create a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `DUNE_DATABASE_URI` | MongoDB connection string | `mongodb://admin:password123@mongo:27017/dune_forms?authSource=admin` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:8080` |
| `NEXT_PUBLIC_WS_URL` | Frontend WebSocket URL | `ws://localhost:8080` |

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd dune-form-analytics

# 2. Start all services
docker compose up --build
```

**Service Endpoints:**
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **API Documentation**: http://localhost:8080/swagger/index.html
- **Performance Monitor**: http://localhost:8080/monitor
- **Database UI**: http://localhost:8081 (admin/admin123)

### Test Account

Use these credentials to test the application:
- **Email**: test@test.com
- **Password**: Test@123

### Build

```bash
# Build all containers
docker compose build

# Build for production (requires production docker-compose file)
docker compose -f docker-compose.prod.yml build
```

### Troubleshooting

**Common Issues:**

1. **Port conflicts**: Ensure ports 3000, 8080, 8081, 27017 are available
   ```bash
   # Check port usage
   lsof -i :3000 -i :8080 -i :8081 -i :27017
   ```

2. **Database connection issues**: Check MongoDB container status
   ```bash
   make logs-mongo
   make shell-mongo
   ```

3. **API not starting**: Check environment variables and logs
   ```bash
   make logs-api
   ```

**Useful Commands:**
```bash
make status          # Check container status
make logs           # View all logs
make restart        # Restart all services
make clean          # Clean up containers and volumes
```

## Links to Deep-Dive Documentation

### Architecture & System Design
- [System Overview](docs/architecture/overview.md) - High-level system architecture
- [Component Diagram](docs/architecture/component-diagram.md) - Detailed component relationships
- [Data Model](docs/architecture/data-model.md) - Database schema and relationships
- [Sequence Diagrams](docs/architecture/sequences/) - Critical flow documentation

### Frontend Documentation
- [Frontend Overview](docs/frontend/overview.md) - Next.js application structure and components

### Backend Documentation
- [Backend Overview](docs/backend/overview.md) - Go Fiber API architecture
- [REST API](docs/backend/api-rest.md) - Complete API endpoint documentation
- [WebSocket API](docs/backend/websockets.md) - Real-time communication protocols
- [Data Model](docs/architecture/data-model.md) - MongoDB schemas and relationships

### Additional Resources
- [Documentation Index](docs/index.md) - Complete documentation overview
- [Glossary](docs/glossary.md) - Technical terms and definitions
- [Coverage Report](docs/coverage.md) - Code-to-docs traceability

---

**For comprehensive code coverage and traceability, see [docs/coverage.md](docs/coverage.md)**

---

**Dune Forms** - Simple, powerful form building with real-time analytics.