# Dune Forms

**Dynamic, customizable form builder with real-time analytics and drag-and-drop interface.**

## Product Overview

Dune Forms is a form creation and analytics platform that enables users to build interactive forms with real-time data visualization. The platform provides a visual drag-and-drop form builder, analytics dashboard, and live response tracking through WebSocket connections.

**Key Features:**
- **Visual Form Builder**: Drag-and-drop interface for creating forms with custom form logic
- **Real-Time Analytics**: Live updates on form responses via WebSockets (built from scratch)
- **Shareable Form Links**: Generate unique public URLs for each form
- **User Authentication**: JWT-based authentication with refresh tokens
- **Multiple Field Types**: Text, multiple-choice, checkbox, and rating fields
- **Conditional Logic**: Dynamic field visibility based on responses
- **Data Export**: CSV and PDF export for responses and analytics
- **Dark Mode**: Toggle between light and dark themes
- **Custom State Management**: Built with React hooks without third-party form libraries
- **Unit Tests**: Comprehensive test coverage for frontend and backend
- **Development Tools**: Built-in monitoring and profiling tools

## Live Demo

🚀 **[📹 Watch Full Demo Video](https://drive.google.com/file/d/1oXj1Ejf_3iE8C-Lh4xrJIMNmPWKM4yoo/view)**

> **📺 Demo Video**: Click above to watch the complete walkthrough showing form building, real-time analytics, and all key features in action

### 🎯 Demo Highlights

- **🛠️ Drag & Drop Form Builder** - Visual form creation with live preview
- **📊 Real-Time Analytics** - Watch data update instantly as responses come in  
- **🔗 Public Form Sharing** - Generate shareable links for form distribution
- **📱 Mobile Responsive** - Works seamlessly across all devices
- **🌙 Dark Mode** - Toggle between light and dark themes
- **📈 Data Export** - CSV and PDF export functionality

### Quick Demo Walkthrough

1. **Visit the demo** and log in with: `test@test.com` / `Test@123`
2. **Create a form** using the drag-and-drop builder
3. **Share the form** using the generated public link
4. **Submit responses** and watch real-time analytics update instantly
5. **Export data** as CSV or PDF to see the export functionality

### Demo Highlights

- **Real-time analytics** updating without page refresh
- **Drag-and-drop form building** with live preview
- **Custom field types** with validation
- **Conditional logic** showing/hiding fields based on responses
- **Dark mode toggle** for improved UX
- **Mobile-responsive design** working across devices

> **Note**: The demo is deployed using Docker containers on a cloud provider, demonstrating the production-ready nature of the application.

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
        swagger[Swagger Docs<br/>:8082/swagger]
        monitor[Performance Monitor<br/>:8083/monitor]
        profiler[Go Profiler<br/>:8084/debug/pprof]
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

### Core Features
- **🎨 Visual Form Builder**: Custom drag-and-drop interface built from scratch for creating forms with field validation and draft saving → [docs/frontend/overview.md#form-builder](docs/frontend/overview.md#form-builder)
- **📊 Real-Time Analytics Dashboard**: Custom-built dashboard with live response tracking and trend visualization (no third-party analytics libraries) → [docs/backend/websockets.md](docs/backend/websockets.md)
- **🔗 Shareable Form Links**: Generate unique public URLs for each form that can be shared with respondents
- **🔐 Secure Authentication**: JWT-based auth with refresh tokens for personalized form management → [docs/backend/api-rest.md#authentication-endpoints](docs/backend/api-rest.md#authentication-endpoints)
- **🔄 Multiple Field Types**: Text, multiple-choice, checkboxes, and rating fields with custom validation → [docs/backend/api-rest.md#field-types](docs/backend/api-rest.md#field-types)

### Advanced Features  
- **⚡ Conditional Logic**: Show/hide fields based on previous answers (e.g., "If question 3 = 'Yes', show question 4") → [docs/architecture/data-model.md](docs/architecture/data-model.md)
- **📤 Data Export**: Export form responses as CSV files or PDF reports → [docs/backend/api-rest.md#export-responses-csv](docs/backend/api-rest.md#export-responses-csv)
- **📈 Survey Trends**: Analyze response patterns, average ratings, most common answers, and skipped questions
- **🌙 Dark Mode**: Toggle between light and dark themes for improved user experience
- **📱 Responsive Design**: Mobile-optimized user interface → [docs/frontend/overview.md](docs/frontend/overview.md)

### Technical Features
- **⚙️ Custom Form Logic**: Built without Formik or React Hook Form - implements custom state management using React hooks
- **🔄 Real-Time Updates**: WebSocket-based live data updates (no basic page reloading)
- **🧪 Unit Tests**: Comprehensive test coverage for both frontend (113 tests) and backend (62.1% by package) components
- **🚀 Performance Monitoring**: Built-in monitoring and profiling tools → [docs/backend/overview.md#development-tools-integration](docs/backend/overview.md#development-tools-integration)

### Development Practices
- **Container-First**: Docker-based development and deployment for consistency across environments  
- **Comprehensive Testing**: Unit tests for both frontend React components and backend Go services
- **API Documentation**: Auto-generated Swagger documentation with complete endpoint coverage
- **Performance Monitoring**: Built-in profiling and monitoring endpoints for production insights

This implementation showcases the ability to build complex, production-ready applications without relying on heavy third-party frameworks, demonstrating deep understanding of the underlying technologies.

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
- **API Documentation**: http://localhost:8082/swagger/index.html
- **Performance Monitor**: http://localhost:8083/monitor
- **Go Profiling**: http://localhost:8084/debug/pprof
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

1. **Port conflicts**: Ensure ports 3000, 8080, 8081, 8082, 8083, 8084, 27017 are available
   ```bash
   # Check port usage
   lsof -i :3000 -i :8080 -i :8081 -i :8082 -i :8083 -i :8084 -i :27017
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

## How to Test Real-Time Analytics

The application includes comprehensive real-time analytics that update live as form responses are submitted. Here's how to test this functionality:

### Testing Setup

1. **Start the application** and ensure all services are running:
   ```bash
   docker compose up --build
   ```

2. **Open multiple browser windows/tabs**:
   - **Tab 1**: Form Builder/Analytics Dashboard - http://localhost:3000
   - **Tab 2**: Public form submission - (you'll get this URL after creating a form)

### Step-by-Step Testing

**Step 1: Create a Test Form**
1. Log in with test credentials (test@test.com / Test@123)
2. Navigate to Form Builder and create a form with various field types:
   - Text field: "What's your name?"
   - Multiple choice: "How did you hear about us?" (Option A, Option B, Option C)
   - Rating: "Rate our service" (1-5 stars)
   - Checkbox: "Which features interest you?" (Feature X, Feature Y, Feature Z)

**Step 2: Set Up Real-Time Monitoring**
1. After creating the form, you will be navigated to the Analytics Dashboard of that form
2. Keep this tab open - you'll see live updates here
3. Copy the shareable link of the form/View form button

**Step 3: Test Live Updates**
1. In a new tab/window, open the shareable form URL
2. Submit responses while keeping the analytics dashboard visible
3. **Watch for immediate updates** without page refresh:
   - Response count increases instantly
   - Charts update with new data points
   - Field-specific analytics refresh in real-time
   - Trend analysis updates automatically

### What You Should See in Real-Time

- **Response Counter**: Increments immediately upon form submission
- **Field Distribution Charts**: Bar/pie charts updating with new response data
- **Rating Averages**: Recalculated and displayed instantly
- **Response Timeline**: New submissions appearing in chronological order
- **Trend Analysis**: Insights like "most common answer" updating live

### WebSocket Connection Verification

You can verify the WebSocket connection is working by:
1. Opening browser developer tools (F12)
2. Go to Network tab and filter by "WS" (WebSocket)
3. You should see an active WebSocket connection to `ws://localhost:8080`
4. When forms are submitted, you'll see WebSocket messages in the connection

### Multi-User Testing

For comprehensive testing:
1. Use multiple browser sessions or incognito windows
2. Have different users submit responses simultaneously
3. Watch how the dashboard aggregates data from multiple concurrent submissions

## Assumptions Made & Challenges Faced

### Design Assumptions

1. **User Experience Priority**: User is a Dune Security customer, so aligned the theme and UX with the same theme.
2. **Real-Time Requirements**: Assumed that if user edits the form and removes any field then analytics are reset/ analytics are not reset if new field is added or label is updated.

### Technical Assumptions

1. **Deployment Environment**: Assumed Docker-based deployment for consistency across environments
2. **API Design**: Assumed RESTful APIs with WebSocket supplements provide optimal architecture

### Challenges Faced & Solutions

**1. Custom Form State Management**
- **Challenge**: Building form state management from scratch without React Hook Form/Formik
- **Solution**: Implemented custom hooks with useReducer for complex form state, validation, and field updates
- **Learning**: Custom implementation provides better control but requires more comprehensive testing

**2. Real-Time Analytics Performance**
- **Challenge**: Ensuring WebSocket updates don't overwhelm the UI with high-frequency submissions
- **Solution**: Implemented debouncing and batch updates for analytics calculations
- **Learning**: Real-time doesn't mean instant - smart batching improves user experience

**3. Drag-and-Drop Implementation**
- **Challenge**: Creating smooth drag-and-drop without external libraries
- **Solution**: Used HTML5 Drag and Drop API with custom touch handling for mobile
- **Learning**: Native APIs provide better performance but require more cross-browser testing

**4. MongoDB Schema Design**
- **Challenge**: Balancing flexibility for dynamic forms with query performance
- **Solution**: Hybrid approach - structured metadata with flexible response storage
- **Learning**: Document databases require different optimization strategies than relational DBs

**5. Authentication Security**
- **Challenge**: Implementing secure JWT handling with refresh tokens
- **Solution**: HttpOnly cookies for refresh tokens, memory storage for access tokens
- **Learning**: Security vs UX requires careful balance and clear expiration handling

**6. Testing Strategy**
- **Challenge**: Implementing Unit test in monorepo for two different tech stacks and apps.
- **Solution**: Custom integration by seperating two process.
- **Learning**: Can run if case on jobs based on which directoy the code change occoured, for ex: if apps/web was changed then only trigger UI test cases vice-versa for apps/api.

**7. Dark Mode Implementation**
- **Challenge**: Ensuring consistent theming across complex UI components
- **Solution**: CSS custom properties with Tailwind's dark mode utilities
- **Learning**: Design systems need theme consistency from the start, not as an afterthought

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