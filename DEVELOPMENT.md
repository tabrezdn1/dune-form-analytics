# Development Guide

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
✅ Backend / Code Format
✅ Backend / Lint Check  
✅ Backend / Unit Tests and Code Coverage
✅ Backend / Build App
```

**All must be green to merge!**

### Test Coverage

Current test coverage by package:
- **pkg/utils**: 62.1% (slug, validation utilities)
- **internal/models**: 40.0% (data models, transformations)  
- **internal/config**: 23.7% (configuration management)
- **internal/services**: 4.9% (auth service core functions)

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
