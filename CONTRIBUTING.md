# Contributing to Dune Forms

Thank you for contributing to Dune Forms! This document provides guidelines for contributors.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Docker** (v20.0+) and **Docker Compose** (v2.0+)
- **Git** for version control
- **Make** (optional, for convenience commands)
- **Node.js** (v18+) and **Go** (v1.23+) if running without Docker

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/dune-forms.git
   cd dune-forms
   ```

2. **Start Development Environment**
   ```bash
   make dev
   # Or: docker-compose up --build
   ```

3. **Verify Setup**
   ```bash
   # Check all services are running
   make status
   
   # View service URLs
   make urls
   ```

**Development URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:8080
- API Documentation: http://localhost:8082/swagger/index.html
- Database UI: http://localhost:8081

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug Reports**: Found an issue? Please report it!
- 💡 **Feature Requests**: Have an idea? We'd love to hear it!
- 🔧 **Code Contributions**: Bug fixes, features, improvements
- 📚 **Documentation**: Improvements to docs, examples, tutorials
- 🎨 **Design**: UI/UX improvements and suggestions


### Before You Start

1. **Check Existing Issues**: Search [existing issues](https://github.com/tabrezdn1/dune-form-analytics/issues) to avoid duplicates
2. **Read Documentation**: Familiarize yourself with the [architecture](docs/architecture/overview.md)
3. **Start Small**: Consider starting with "good first issue" labels
4. **Discuss First**: For major changes, open an issue to discuss the approach

## 🔄 Development Workflow

### Branch Strategy

We use a simplified Git flow:

- **`main`**: Production-ready code
- **`develop`**: Integration branch (if used)
- **Feature branches**: `feature/your-feature-name`
- **Bug fixes**: `fix/bug-description`
- **Documentation**: `docs/documentation-topic`

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding standards (see below)
   - Update documentation as needed
   - Ensure all services start correctly

3. **Check Your Changes**
   ```bash
   # Lint code
   make lint
   
   # Format code
   make fmt
   
   # Ensure services start correctly
   make status
   ```

4. **Commit Your Changes**
   ```bash
   # Stage changes
   git add .
   
   # Commit with descriptive message
   git commit -m "feat: add form field validation for rating fields"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

## 📝 Coding Standards

### Backend (Go)

#### Code Style
```go
// Use clear, descriptive names
func CreateFormWithValidation(userID string, request *CreateFormRequest) (*Form, error) {
    // Validate input
    if err := validateCreateFormRequest(request); err != nil {
        return nil, fmt.Errorf("invalid form data: %w", err)
    }
    
    // Business logic here
    form := &Form{
        Title:    request.Title,
        OwnerID:  userID,
        Status:   FormStatusDraft,
        ShareSlug: generateShareSlug(request.Title),
    }
    
    return form, nil
}
```

#### Error Handling
```go
// Wrap errors with context
func (s *FormService) GetForm(ctx context.Context, formID string) (*Form, error) {
    form, err := s.repository.FindByID(ctx, formID)
    if err != nil {
        return nil, fmt.Errorf("failed to retrieve form %s: %w", formID, err)
    }
    return form, nil
}
```



### Frontend (TypeScript/React)

#### Component Structure
```typescript
// Use functional components with TypeScript
interface FormBuilderProps {
  initialForm?: Form;
  onSave?: (form: Form) => void;
}

export function FormBuilder({ initialForm, onSave }: FormBuilderProps) {
  const [form, setForm] = useState<Form>(initialForm || createEmptyForm());
  
  const handleFieldAdd = useCallback((fieldType: FieldType) => {
    const newField = createField(fieldType);
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  }, []);
  
  return (
    <div className="form-builder">
      <FieldPalette onFieldAdd={handleFieldAdd} />
      <FormCanvas fields={form.fields} />
    </div>
  );
}
```

#### Hooks
```typescript
// Custom hooks for reusable logic
export function useFormValidation(form: Form) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!form.title?.trim()) {
      newErrors.title = 'Form title is required';
    }
    
    if (form.fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);
  
  return { errors, validate };
}
```



### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect code meaning (formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect build system or dependencies
- `ci`: Changes to CI configuration files and scripts

#### Examples
```bash
feat: add drag-and-drop field reordering
fix: resolve WebSocket connection timeout issue
docs: update API documentation for analytics endpoints
refactor: extract form builder state logic into custom hook
```



## 📚 Documentation Guidelines

### Documentation Requirements

All contributions should include appropriate documentation updates:

- **New Features**: Add to relevant documentation sections
- **API Changes**: Update OpenAPI/Swagger specifications
- **Breaking Changes**: Update migration guides
- **Bug Fixes**: Update troubleshooting if applicable

### Documentation Standards

- **Clear and Concise**: Use simple, direct language
- **Examples**: Include practical code examples
- **Cross-References**: Link to related documentation
- **Up-to-date**: Ensure examples work with current codebase

### Architecture Decision Records (ADRs)

For significant architectural decisions, create an ADR:

```markdown
# ADR-005: WebSocket Authentication Strategy

## Status
Accepted

## Context
Need to secure WebSocket connections for real-time analytics...

## Decision
Implement token-based authentication with JWT validation...

## Consequences
- Improved security for real-time features
- Requires client-side token management
- Additional complexity in WebSocket handler
```

## 🔒 Security Guidelines

### Security Considerations

- **Input Validation**: Always validate and sanitize user input
- **Authentication**: Ensure proper authentication for protected routes
- **Authorization**: Verify user permissions for resources
- **SQL Injection**: Use parameterized queries (MongoDB equivalent)
- **XSS Prevention**: Sanitize output and use proper encoding
- **CORS**: Configure appropriate CORS policies

### Reporting Security Issues

**Do NOT create public issues for security vulnerabilities.**

Instead, email security concerns to: [security@duneanalytics.com](mailto:security@duneanalytics.com)

## 📊 Performance Guidelines

### Performance Considerations

- **Database Queries**: Optimize queries and use appropriate indexes
- **API Response Times**: Keep responses under 200ms for CRUD operations
- **Frontend Bundle Size**: Monitor and optimize bundle size
- **Memory Usage**: Prevent memory leaks in long-running connections
- **Caching**: Implement appropriate caching strategies



## 🎨 UI/UX Guidelines

### Design Principles

- **Accessibility**: Follow WCAG 2.1 AA guidelines
- **Responsive Design**: Support mobile, tablet, and desktop
- **Consistent**: Follow established design patterns
- **Intuitive**: Minimize cognitive load for users
- **Performance**: Optimize for fast loading and interactions

### Accessibility Checklist

- [ ] Proper semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus indicators

## 🐛 Bug Report Template

When reporting bugs, please include:

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Version: [e.g. v1.0.0]

## Additional Context
Screenshots, logs, or other context.
```

## 💡 Feature Request Template

```markdown
## Feature Description
A clear description of the feature you'd like to see.

## Problem Statement
What problem does this solve?

## Proposed Solution
How you envision this working.

## Alternatives Considered
Other approaches you've thought about.

## Additional Context
Mockups, examples, or other relevant information.
```

## 📋 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows style guidelines
- [ ] Self-review completed

- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] Related issues referenced
- [ ] Screenshots for UI changes

## ⚡ Quick Reference

### Common Commands

```bash
# Development
make dev          # Start development environment
make status       # Check service status
make logs         # View logs
make clean        # Clean up containers

# Code Quality
make lint         # Run linters
make fmt          # Format code

# Database
make shell-mongo  # Open MongoDB shell
```

### Useful Links

- [API Documentation](http://localhost:8082/swagger/index.html)
- [Architecture Overview](docs/architecture/overview.md)
- [Frontend Overview](docs/frontend/overview.md)
- [Database Schema](docs/architecture/data-model.md)


## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/tabrezdn1/dune-forms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tabrezdn1/dune-forms/discussions)
- **Email**: [contribute@duneanalytics.com](mailto:contribute@duneanalytics.com)

## 🎉 Recognition

Contributors will be recognized in:

- Release notes for significant contributions
- Special mentions for exceptional contributions

Thank you for contributing to Dune Forms! 🚀
