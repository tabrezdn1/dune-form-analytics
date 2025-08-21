# GitHub Workflows

This directory contains automated CI/CD workflows for the Dune Form Analytics project.

## 🔄 Backend Service Workflow

### Main CI (`ci.yml`)
- **Trigger**: Pull requests to `main` or `develop` with backend changes
- **Purpose**: Orchestrates Backend service checks

### Backend Service (`backend-ci.yml`)
The Backend service runs 4 separate jobs in parallel:

#### 1. **Code Format** ✅
- Go code formatting (`gofmt`)
- Import organization (`goimports`)

#### 2. **Lint Check** ✅  
- Code linting (`golangci-lint` with `go vet` fallback)

#### 3. **Unit Tests and Code Coverage** ✅
- Test execution with race detection
- Code coverage reporting

#### 4. **Build App** ✅
- Application build verification

## 🔧 Local Development Integration

CI jobs use the exact same make commands as local development:

```bash
# 1. Code Format → make fmt-local
# 2. Lint Check → make lint-local  
# 3. Unit Tests and Code Coverage → make test-local
# 4. Build App → make build-local
```

Perfect consistency between local development and CI!

## 🚦 Status Badge

Add this badge to your README to show build status:

```markdown
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

1. **4 checks run in parallel**: Code Format, Lint Check, Unit Tests and Code Coverage, Build App
2. **All must be green** for the PR to be ready to merge
3. **Local fixes available**: Use `make fmt-local`, `make lint-local`, etc.
4. **Fast feedback**: Usually completes in 2-3 minutes

## 📁 Configuration Files

### Backend Linting (`apps/api/.golangci.yml`)
- Essential Go linters configuration
- Fallback to `go vet` when golangci-lint fails
- Optimized for development speed vs comprehensive analysis

### Dependencies (`apps/api/go.mod`)
- Added `testify v1.10.0` for unit testing framework
- Provides assertions, mocking, and test suites

## 🔒 Security

- Pinned action versions for security
- Minimal permissions for each job  
- PR-only triggers for enhanced security
