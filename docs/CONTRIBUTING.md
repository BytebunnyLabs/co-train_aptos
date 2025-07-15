# Contributing to CoTrain

We welcome contributions to CoTrain! This document provides guidelines for contributing to our collaborative AI training platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **pnpm** (v8.0.0 or higher)
- **Git** (v2.30.0 or higher)
- **Docker** and **Docker Compose** (for local development)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **Aptos CLI** (for smart contract development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/co-train_aptos.git
   cd co-train_aptos
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/BytebunnyLabs/co-train_aptos.git
   ```

## Development Setup

### Quick Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development environment
pnpm dev:setup
pnpm dev
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp .env.example .env.local
   cp apps/frontend/.env.example apps/frontend/.env.local
   cp apps/backend/.env.example apps/backend/.env.local
   ```

3. **Database Setup**
   ```bash
   # Start databases
   pnpm db:start
   
   # Run migrations
   pnpm db:migrate
   
   # Seed development data
   pnpm db:seed
   ```

4. **Smart Contract Setup**
   ```bash
   # Compile contracts
   pnpm contracts:build
   
   # Deploy to local network (optional)
   pnpm contracts:deploy:local
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm dev:frontend
   pnpm dev:backend
   ```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**
- **Feature implementations**
- **Documentation improvements**
- **Test coverage enhancements**
- **Performance optimizations**
- **UI/UX improvements**
- **Smart contract enhancements**
- **Translation and localization**

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Create an issue** for new features or significant changes
3. **Discuss your approach** in the issue before starting
4. **Keep changes focused** - one feature/fix per PR

## Pull Request Process

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

- Follow our [code standards](#code-standards)
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description
git commit -m "feat(frontend): add user dashboard component"
git commit -m "fix(backend): resolve authentication issue"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 4. Push and Create PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

### 5. PR Requirements

Your pull request must:

- [ ] Have a clear, descriptive title
- [ ] Include a detailed description of changes
- [ ] Reference related issues (e.g., "Closes #123")
- [ ] Pass all CI checks
- [ ] Include tests for new functionality
- [ ] Update documentation if needed
- [ ] Be reviewed by at least one maintainer

### PR Template

When creating a pull request, please use this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

## Performance Best Practices

### Frontend Optimization

```typescript
// ✅ Good: Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});

// ✅ Good: Use proper loading states
const DataComponent = () => {
  const { data, loading, error } = useQuery(GET_DATA);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <DataDisplay data={data} />;
};
```

### Backend Optimization

```typescript
// ✅ Good: Use proper caching
@Injectable()
export class DataService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly repository: DataRepository
  ) {}

  async getData(id: string): Promise<Data> {
    const cached = await this.redis.get(`data:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.repository.findById(id);
    await this.redis.setex(`data:${id}`, 3600, JSON.stringify(data));
    
    return data;
  }
}
```

## Testing Guidelines

### Unit Testing Examples

```typescript
// ✅ Good: Test component behavior
describe('Button Component', () => {
  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={jest.fn()} disabled>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Testing

```typescript
// ✅ Good: Test API endpoints
describe('Users API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/users')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(userData.email);
  });
});
```

## Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad: Avoid 'any' type
const userData: any = getUserData();

// ✅ Good: Use proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error('API call failed:', error);
  throw new Error('Failed to fetch data');
}
```

### React Component Guidelines

```tsx
// ✅ Good: Use proper component structure
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};
```

### API Development Guidelines

```typescript
// ✅ Good: Use proper validation
@Controller('users')
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe())
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

// ✅ Good: Use DTOs for validation
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Smart Contract Guidelines

```move
// ✅ Good: Use proper error handling
public fun transfer_tokens(
    account: &signer,
    to: address,
    amount: u64
) acquires TokenStore {
    assert!(amount > 0, ERROR_INVALID_AMOUNT);
    assert!(exists<TokenStore>(signer::address_of(account)), ERROR_NO_STORE);
    
    // Implementation...
}
```

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated

## Related Issues
Closes #(issue number)

## Screenshots (if applicable)
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, browser, Node.js version)
- **Screenshots or logs** if applicable

### Feature Requests

For feature requests, please provide:

- **Clear description** of the feature
- **Use case** and motivation
- **Proposed implementation** (if you have ideas)
- **Alternatives considered**

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development
- `fix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Release Process

1. Features merged to `develop`
2. Release candidate created from `develop`
3. Testing and bug fixes
4. Merge to `main` and tag release
5. Deploy to production

## Code Standards

### General Guidelines

- **Write clean, readable code**
- **Follow existing patterns** in the codebase
- **Use meaningful variable and function names**
- **Add comments for complex logic**
- **Keep functions small and focused**
- **Handle errors appropriately**

### TypeScript

- Use strict TypeScript configuration
- Define proper types and interfaces
- Avoid `any` type when possible
- Use type guards for runtime checks

### React/Next.js (Frontend)

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for props and state
- Implement proper error boundaries
- Optimize for performance (memo, useMemo, useCallback)

### NestJS (Backend)

- Follow NestJS conventions
- Use dependency injection
- Implement proper validation
- Use DTOs for data transfer
- Follow RESTful API principles

### Smart Contracts (Move)

- Follow Move language conventions
- Write comprehensive tests
- Document public functions
- Handle edge cases
- Optimize for gas efficiency

### Code Formatting

We use automated formatting tools:

```bash
# Format all code
pnpm format

# Lint and fix issues
pnpm lint:fix

# Type check
pnpm type-check
```

## Testing

### Test Types

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test API endpoints and services
3. **E2E Tests**: Test complete user workflows
4. **Contract Tests**: Test smart contract functionality

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:contracts

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Writing Tests

- Write tests for new functionality
- Maintain high test coverage (>80%)
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something when condition is met', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle error when invalid input provided', () => {
    // Test error cases
  });
});
```

## Documentation

### Types of Documentation

- **README files**: Project and package overviews
- **API documentation**: Swagger/OpenAPI specs
- **Code comments**: Inline documentation
- **Architecture docs**: System design and decisions
- **User guides**: How-to guides for users

### Documentation Standards

- Keep documentation up-to-date
- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Review documentation in PRs

### API Documentation

We use Swagger for API documentation:

```typescript
@ApiOperation({ summary: 'Create a new training session' })
@ApiResponse({ status: 201, description: 'Session created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input' })
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and community support
- **Twitter**: Project updates and announcements

### Getting Help

1. **Check existing documentation**
2. **Search GitHub issues**
3. **Ask in GitHub Discussions**
4. **Join our Discord community**

### Code Review Process

- All code must be reviewed before merging
- Reviewers check for:
  - Code quality and standards
  - Test coverage
  - Documentation updates
  - Security considerations
  - Performance implications

### Recognition

We recognize contributors through:

- **Contributors list** in README
- **Release notes** acknowledgments
- **Community highlights** on social media
- **Contributor badges** and achievements

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@cotrain.ai
2. Include detailed description
3. Provide steps to reproduce
4. Allow time for investigation

### Security Guidelines

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow security best practices
- Keep dependencies updated
- Validate all user inputs

## License

By contributing to CoTrain, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

If you have any questions about contributing, please:

1. Check this document first
2. Search existing GitHub issues
3. Create a new issue with the "question" label
4. Join our Discord community

Thank you for contributing to CoTrain! 🚀