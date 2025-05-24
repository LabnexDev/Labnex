# Labnex CLI

The command-line interface for Labnex - AI-Powered Testing Automation Platform.

## Installation

```bash
# Install globally
npm install -g @labnex/cli

# Or run directly with npx
npx @labnex/cli --help
```

## Quick Start

1. **Authenticate with Labnex**
   ```bash
   labnex auth login
   ```

2. **List your projects**
   ```bash
   labnex projects list
   ```

3. **Run tests**
   ```bash
   labnex test run --project MYAPP --ai
   ```

## Commands

### Authentication
```bash
labnex auth login           # Login to Labnex
labnex auth logout          # Logout from Labnex  
labnex auth status          # Check authentication status
```

### Projects
```bash
labnex projects list        # List all projects
labnex projects create      # Create a new project
labnex project show MYAPP   # Show project details
```

### Test Management
```bash
labnex test run --project MYAPP      # Run tests
labnex test run --ai --parallel 8    # Run with AI optimization
labnex test status <runId>           # Check test run status
labnex test results <runId>          # View test results
labnex test create --interactive     # Create new test case
```

### AI Features
```bash
labnex ai generate                   # Generate test case with AI
labnex ai optimize --project MYAPP   # Optimize test suite
labnex ai analyze <runId> <failureId> # Analyze test failure
```

## Advanced Usage

### Running Tests with AI Optimization
```bash
# Run optimized test suite based on code changes
labnex test run --project ECOM --ai --parallel 4 --env staging

# Watch mode for continuous testing
labnex test run --project ECOM --watch
```

### Generating Test Cases
```bash
# Generate test case from description
labnex ai generate --description "Test user login with valid credentials"

# Save directly to a project
labnex ai generate --project ECOM --description "Test checkout flow"
```

### Configuration

The CLI stores configuration in `~/.labnex/config.json`:

```json
{
  "apiUrl": "https://your-backend.onrender.com/api",
  "token": "your-jwt-token",
  "email": "user@example.com",
  "userId": "user-id"
}
```

### Environment Variables

- `LABNEX_API_URL`: Override API URL
- `LABNEX_VERBOSE`: Enable verbose output

## Examples

### Complete Workflow
```bash
# 1. Login
labnex auth login --email user@company.com

# 2. Create project
labnex projects create --name "My App" --code MYAPP

# 3. Generate test case with AI
labnex ai generate --description "Test user registration"

# 4. Run tests with AI optimization
labnex test run --project MYAPP --ai --parallel 4

# 5. Monitor results
labnex test status abc123
labnex test results abc123
```

### CI/CD Integration
```bash
# In your CI pipeline
export LABNEX_API_URL="https://your-backend.onrender.com/api"
echo "$LABNEX_TOKEN" | labnex auth login --token
labnex test run --project $PROJECT_CODE --env production --ai
```

## Features

- ✅ **Authentication**: Secure JWT-based authentication
- ✅ **Project Management**: Create and manage projects
- ✅ **Test Automation**: Run tests with real-time monitoring
- ✅ **AI-Powered**: Generate tests and optimize suites with AI
- ✅ **Real-time Updates**: WebSocket-based live test monitoring
- ✅ **Interactive Mode**: User-friendly prompts and wizards
- ✅ **Multiple Formats**: JSON and table output options

## Development

```bash
# Clone and setup
git clone <repo-url>
cd packages/cli
npm install

# Build
npm run build

# Run in development
npm run dev

# Test locally
npm link
labnex --help
```

## Support

- **Documentation**: [docs.labnex.io](https://docs.labnex.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/labnex/issues)
- **Discord**: [Join our community](https://discord.gg/labnex)

## License

MIT License - see [LICENSE](LICENSE) file for details. 