# Development Guide

## Frontend Development Setup

### Prerequisites
- Node.js 20+
- npm

### Quick Setup
```bash
# Install frontend dependencies
make install-frontend-deps
```

### Local Development Commands

```bash
# Code Quality (matches CI exactly)
make fmt-frontend-local         # Code format with Prettier
make lint-frontend-local        # ESLint check
make type-check-frontend-local  # TypeScript type checking
make test-frontend-local        # Unit tests with coverage
make build-frontend-local       # Build application

# Additional Commands
make run-frontend-local         # Run development server
```

### Development Workflow

**Simple 5-step process (matches CI exactly):**

```bash
make fmt-frontend-local         # 1. Code Format
make lint-frontend-local        # 2. Lint Check
make type-check-frontend-local  # 3. Type Check
make test-frontend-local        # 4. Unit Tests and Code Coverage  
make build-frontend-local       # 5. Build App
```

**All green? Ready to commit!** ✅

### GitHub Actions CI

Your PR will automatically run these same 5 checks:

```bash
✅ Frontend / Prettier Format Check
✅ Frontend / ESLint + Next.js Rules
✅ Frontend / TypeScript Compilation
✅ Frontend / Jest Tests with Coverage
✅ Frontend / Next.js Production Build
```

**All must be green to merge!**

## Backend Development Setup

### Prerequisites
- Go 1.23+
- Make

### Quick Setup
```bash
# Install development tools
make install-tools
```

### Local Development Commands

```bash
# Code Quality (matches CI exactly)
make fmt-local     # Code format + import organization
make lint-local    # Lint check with golangci-lint/go vet fallback
make test-local    # Unit tests with race detection + coverage
make build-local   # Build application

# Additional Commands
make run-local     # Run server locally (requires MongoDB)
make install-tools # Install required development tools
```

### Docker Commands (Alternative)
```bash
make lint     # Run linters in Docker
make fmt      # Format code in Docker  
make test     # Run tests in Docker
```

### Development Workflow

**Simple 4-step process (matches CI exactly):**

```bash
make fmt-local     # 1. Code Format
make lint-local    # 2. Lint Check  
make test-local    # 3. Unit Tests and Code Coverage
make build-local   # 4. Build App
```

**All green? Ready to commit!** ✅

### GitHub Actions CI

Your PR will automatically run these same 4 checks:

```bash
✅ Backend / Go Format (gofmt + goimports)
✅ Backend / Go Lint (golangci-lint + go vet)
✅ Backend / Go Tests with Coverage
✅ Backend / Go Build
```

**All must be green to merge!**

### Test Coverage

#### Backend Coverage (Go)
Current test coverage by package:
- **pkg/utils**: 62.1% (slug, validation utilities)
- **internal/models**: 40.0% (data models, transformations)  
- **internal/config**: 23.7% (configuration management)
- **internal/services**: 4.9% (auth service core functions)

#### Frontend Coverage (TypeScript/React)  
Current test coverage: Files with 100% coverage:
- **auth-utils.ts**: 100% (JWT validation & localStorage)
- **clipboard.ts**: 100% (browser clipboard utilities)
- **Button.tsx**: 100% (UI component with variants)
- **Loading.tsx**: 100% (spinner/dots/pulse + skeleton + overlay)
- **TextInput.tsx**: 100% (form input with validation)
- **form-change-analyzer.ts**: 95.58% (form analysis logic)

**Test Statistics:** 7 test suites, 113 tests passing

### Linting Configuration

Uses `golangci-lint` with essential linters in `apps/api/.golangci.yml`:
- Go formatting validation
- Go vet checks
- Error checking
- Import organization

### IDE Integration

For VS Code, add to your settings:
```json
{
  "go.lintTool": "golangci-lint",
  "go.lintFlags": ["--config", "apps/api/.golangci.yml"]
}
```

## 📁 Key Configuration Files

### `.golangci.yml` (NEW)
- **Location**: `apps/api/.golangci.yml` 
- **Purpose**: golangci-lint configuration for code quality
- **Features**: Essential linters (gofmt, vet, errcheck)
- **Fallback**: Uses go vet when golangci-lint fails

### `go.mod` Updates
- **Added**: `github.com/stretchr/testify v1.10.0` for unit testing
- **Purpose**: Enables comprehensive test assertions and mocking
- **Import**: Use as `"github.com/stretchr/testify/assert"` in tests

## 🧪 Testing Framework

**Testify** provides:
- `assert.*` - Test assertions (`assert.Equal`, `assert.NotNil`, etc.)
- `require.*` - Failing assertions that stop test execution
- `mock.*` - Mock generation for interfaces
- `suite.*` - Test suites for setup/teardown

Example test:
```go
func TestExample(t *testing.T) {
    result := MyFunction("input")
    assert.Equal(t, "expected", result)
    assert.NotEmpty(t, result)
}
```

### Troubleshooting

If you see `command not found` errors:
```bash
make install-tools  # Installs golangci-lint + goimports with full paths
```
# GitHub Workflows

This directory contains automated CI/CD workflows for the Dune Form Analytics project.

## 🔄 Frontend Service Workflow

### Main CI (`ci.yml`)
- **Trigger**: Pull requests to `main` or `develop` with frontend/backend/workflow changes
- **Smart Execution**: Only runs jobs for changed code paths
- **Purpose**: Orchestrates Frontend and Backend service checks

### Frontend Service (`frontend-ci.yml`)
The Frontend service runs 5 separate jobs in parallel:

#### 1. **Prettier Format Check** ✅
- Prettier code formatting validation
- Consistent code style across the project

#### 2. **ESLint + Next.js Rules** ✅  
- ESLint validation with Next.js and TypeScript rules
- Import organization and code quality checks

#### 3. **TypeScript Compilation** ✅
- TypeScript type checking and compilation
- Static type validation

#### 4. **Jest Tests with Coverage** ✅
- Jest test execution with coverage reporting
- React Testing Library component tests

#### 5. **Next.js Production Build** ✅
- Next.js production build verification

## 🔄 Backend Service Workflow

### Path-Based Execution (`ci.yml`)
- **Smart Triggers**: Only runs relevant CI jobs based on changed files
- **`apps/api/**` changes** → Backend CI only
- **`apps/web/**` changes** → Frontend CI only  
- **`.github/workflows/**` changes** → Both (safeguard)
- **Both paths change** → Both CI jobs run

### Backend Service (`backend-ci.yml`)
The Backend service runs 4 separate jobs in parallel:

#### 1. **Go Format (gofmt + goimports)** ✅
- Go code formatting (`gofmt`)
- Import organization (`goimports`)

#### 2. **Go Lint (golangci-lint + go vet)** ✅  
- Code linting (`golangci-lint` with `go vet` fallback)

#### 3. **Go Tests with Coverage** ✅
- Test execution with race detection
- Code coverage reporting

#### 4. **Go Build** ✅
- Application build verification

## 🔧 Local Development Integration

CI jobs use the exact same make commands as local development:

### Frontend Commands
```bash
# 1. Prettier Format Check → make fmt-frontend-local
# 2. ESLint + Next.js Rules → make lint-frontend-local
# 3. TypeScript Compilation → make type-check-frontend-local
# 4. Jest Tests with Coverage → make test-frontend-local
# 5. Next.js Production Build → make build-frontend-local
```

### Backend Commands
```bash
# 1. Go Format (gofmt + goimports) → make fmt-local
# 2. Go Lint (golangci-lint + go vet) → make lint-local  
# 3. Go Tests with Coverage → make test-local
# 4. Go Build → make build-local
```

Perfect consistency between local development and CI!

## 🚦 Status Badges

Add these badges to your README to show build status:

```markdown
![Frontend](https://github.com/tabrezdn1/dune-form-analytics/workflows/Frontend/badge.svg)
![Backend](https://github.com/tabrezdn1/dune-form-analytics/workflows/Backend/badge.svg)
```

## 🛠 Workflow Features

### Parallel Execution
- All 4 professional checks run simultaneously for speed
- Independent jobs for clear status reporting
- Fast feedback on specific failures

### Fallback Mechanisms  
- Linting falls back to `go vet` if `golangci-lint` fails
- Clear error messages with actionable fix instructions

### Developer-Friendly Output
- ✅ Clear success/failure status for each check
- 🔧 Consistent make commands for local testing
- 📋 Simple pass/fail results (no verbose coverage output)

## 🚀 PR Workflow

When you create a PR that touches backend code:

1. **4 checks run in parallel**: Go Format, Go Lint, Go Tests with Coverage, Go Build
2. **All must be green** for the PR to be ready to merge
3. **Local fixes available**: Use `make fmt-local`, `make lint-local`, etc.
4. **Fast feedback**: Usually completes in 2-3 minutes

## 📁 Configuration Files

### Frontend Configuration
- **ESLint** (`apps/web/.eslintrc.js`): Next.js + TypeScript linting rules
- **Prettier** (`apps/web/.prettierrc`): Code formatting configuration
- **Jest** (`apps/web/jest.config.js`): Testing framework with Next.js support
- **Jest Setup** (`apps/web/jest.setup.js`): Global test configuration and mocks

### Backend Configuration
- **Linting** (`apps/api/.golangci.yml`): Essential Go linters configuration
- **Dependencies** (`apps/api/go.mod`): Added `testify v1.10.0` for unit testing

## 🔒 Security

- Pinned action versions for security
- Minimal permissions for each job  
- PR-only triggers for enhanced security
