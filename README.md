# Dune Form Analytics

A dynamic, customizable form builder application with real-time analytics. Built with Next.js, Go Fiber, and MongoDB.

## Features

- **Form Builder**: Drag-and-drop interface with text, multiple choice, checkbox, and rating fields
- **Public Forms**: Generate shareable links for form submissions
- **Live Analytics**: Real-time dashboard with WebSocket updates
- **Custom Logic**: Built-in form state management without third-party libraries
- **Modern UI**: TailwindCSS with responsive design
- **Validation**: Client and server-side form validation
- **Mobile Ready**: Responsive design for all devices

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │────│  Go Fiber API   │────│    MongoDB      │
│                 │    │                 │    │                 │
│ • Form Builder  │    │ • REST APIs     │    │ • Forms         │
│ • Public Forms  │    │ • WebSocket     │    │ • Responses     │
│ • Analytics UI  │    │ • Validation    │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Go 1.21+ (for local development)

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/tabrezdn1/dune-form-analytics.git
cd dune-form-analytics

# Start the entire stack
make dev
```

This will start:
- **MongoDB** on `localhost:27017`
- **Go API** on `localhost:8080`
- **Next.js Web** on `localhost:3000`

### Manual Setup

```bash
# Copy environment variables
cp env.example .env

# Start services
docker compose up --build

# In separate terminals (optional - for local development)
cd apps/api && go run cmd/server/main.go
cd apps/web && npm run dev
```

## 📋 Available Commands

```bash
make dev          # Start development environment
make test         # Run all tests
make lint         # Run linters
make fmt          # Format code
make seed         # Seed database with sample data
make clean        # Clean up containers
make logs         # View logs
```

## Testing Real-Time Features

1. **Start the application**: `make dev`
2. **Seed sample data**: `make seed`
3. **Open two browser tabs**:
   - Tab 1: Analytics Dashboard - `http://localhost:3000/dashboard/[formId]`
   - Tab 2: Public Form - `http://localhost:3000/f/sample-feedback-form`
4. **Submit responses** in Tab 2 and watch **live updates** in Tab 1
5. **No page refresh needed** - data updates instantly via WebSocket

## Project Structure

```
dune-form-analytics/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   └── lib/              # Utilities & state management
│   └── api/                   # Go Fiber Backend
│       ├── cmd/              # Application entrypoints
│       ├── internal/         # Business logic
│       └── pkg/              # Shared packages
├── packages/
│   └── schemas/              # JSON schemas for validation
├── dev/
│   ├── mongo-init/          # Database initialization
│   └── seed/                # Sample data
└── docker-compose.yml       # Development environment
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **@dnd-kit** - Drag and drop functionality
- **Recharts** - Data visualization
- **Custom State Management** - useReducer + Context API

### Backend
- **Go Fiber** - Fast HTTP framework
- **WebSocket** - Real-time communication
- **MongoDB Driver** - Database operations
- **JWT** - Authentication (optional)
- **Validator** - Input validation

### Infrastructure
- **MongoDB** - Document database
- **Docker** - Containerization
- **Air** - Hot reload for Go development

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/forms` | Create new form |
| `GET` | `/api/forms/:id` | Get form by ID |
| `PATCH` | `/api/forms/:id` | Update form |
| `GET` | `/api/forms/slug/:slug` | Get public form |
| `POST` | `/api/forms/:id/submit` | Submit response |
| `GET` | `/api/forms/:id/analytics` | Get analytics |
| `GET` | `/api/forms/:id/export.csv` | Export responses |
| `WS` | `/ws/forms/:id` | Real-time updates |

## 🗄️ Database Schema

### Forms Collection
```javascript
{
  _id: ObjectId,
  title: "Form Title",
  status: "draft" | "published",
  shareSlug: "unique-slug",
  fields: [{
    id: "field-id",
    type: "text" | "mcq" | "checkbox" | "rating",
    label: "Field Label",
    required: boolean,
    options: [{ id, label }], // for mcq/checkbox
    validation: { min, max, pattern }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Responses Collection
```javascript
{
  _id: ObjectId,
  formId: ObjectId,
  answers: [{
    fieldId: "field-id",
    value: "answer-value"
  }],
  submittedAt: Date,
  meta: { ip, userAgent, referrer }
}
```

## 🎯 Design Decisions

### Custom Form State Management
- **Why**: Requirement to avoid third-party form libraries
- **How**: `useReducer` for complex state transitions + Context API for sharing
- **Benefits**: Full control, predictable updates, easy testing

### Materialized Analytics
- **Why**: O(1) real-time updates vs expensive aggregations
- **How**: Maintain separate `analytics` collection updated on each submission
- **Benefits**: Instant dashboard updates, better user experience

### WebSocket Architecture
- **Why**: True real-time updates without polling
- **How**: Hub pattern with room-based broadcasting per form
- **Benefits**: Efficient, scalable, immediate updates

### Monorepo Structure
- **Why**: Shared schemas, coordinated development
- **How**: Apps separated, shared packages for common logic
- **Benefits**: Type safety across stack, easier maintenance

## 🚢 Deployment

### Production Setup
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build

# Or deploy separately:
# Frontend: Vercel/Netlify
# Backend: Fly.io/Railway/Render
# Database: MongoDB Atlas
```

### Environment Variables
```bash
# Production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dune_forms
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

## 🧪 Testing

```bash
# Run all tests
make test

# Frontend tests only
make test-frontend

# Backend tests only  
make test-backend

# With coverage
docker-compose exec web npm run test:coverage
docker-compose exec api go test -cover ./...
```

## 🎨 Optional Features Implemented

- ✅ **CSV Export** - Download responses as CSV
- ✅ **Conditional Fields** - Show/hide fields based on answers
- ✅ **JWT Authentication** - User-scoped forms
- ✅ **Survey Trends** - Analytics with trend analysis
- ✅ **Dark Mode** - Theme toggle
- ✅ **Unit Tests** - Comprehensive test coverage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built as part of a full-stack development assessment, showcasing modern web development practices and real-time application architecture.

---

**🔗 Live Demo**: [Coming Soon]  
**📧 Contact**: [Your Email]  
**🐙 Repository**: https://github.com/tabrezdn1/dune-form-analytics
