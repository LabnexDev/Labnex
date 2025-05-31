# Labnex - AI-Powered Testing Automation Platform

<div align="center">

<img src="https://i.imgur.com/aPEVY5z.png" alt="Labnex Logo" title="Labnex Logo" width="180" style="margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">

<p style="color: #ccc; text-align: center;"><em>The Future of Test Case Management & Project Automation</em></p>

[![NPM Version](https://img.shields.io/npm/v/@labnex/cli.svg)](https://www.npmjs.com/package/@labnex/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb)](https://reactjs.org/)

[Live Demo](https://labnexdev.github.io/Labnex/) • [Documentation](https://labnexdev.github.io/Labnex/documentation) • [CLI Package](https://www.npmjs.com/package/@labnex/cli) • [Discord](https://discord.gg/Kx5HrvMB) • [Report Bug](https://github.com/LabnexDev/Labnex/issues)

</div>

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

### Test Case Management Interface

![Labnex Test Case Screenshot](https://i.imgur.com/pLpz3aK.jpeg)

Manage test steps, statuses, and expected results in a clean, intuitive UI.

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Overview

Labnex is a platform aimed at improving testing and project management workflows for developers and testers. Its core components include a command-line interface (CLI) for automated local test execution, AI-driven features for test generation and analysis, and Discord integration for AI assistance. Project and test case data are managed via a central backend service.

### Key Features

- **AI-Assisted Test Generation**: Helps create test steps from natural language.
- **CLI for Local Browser Testing**: Executes automated browser tests on your machine.
- **Detailed Console Logging**: Shows real-time test progress and actions in the terminal.
- **Backend for Test Case Storage**: Manages test case data through an API.
- **Discord Bot for AI Help**: Provides AI-driven assistance via Discord.
- **JWT-Based Authentication**: Secures access using JSON Web Tokens.

### What Makes Labnex Different

- **Focus on AI in Testing**: Aims to use AI to simplify aspects of the testing process.
- **Local-First Test Execution**: Prioritizes running tests directly on the developer's environment via CLI.
- **Developer-Oriented Tools**: Provides tools like the CLI designed for developer workflows.
- **Modular Components**: Built with separate frontend, backend, and CLI components.

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Architecture

Labnex follows a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   CLI Package   │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (TypeScript)   │
│                 │    │                 │    │                 │
│ • Modern UI     │    │ • REST APIs     │    │ • Enhanced      │
│ • Real-time     │    │ • WebSockets    │    │   Logging       │
│ • TypeScript    │    │ • AI Services   │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (MongoDB)     │
                    │                 │
                    │ • Projects      │
                    │ • Test Cases    │
                    │ • Test Runs     │
                    └─────────────────┘
```

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **MongoDB** (local or cloud)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LabnexDev/Labnex.git
   cd Labnex
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   
   # Install CLI dependencies
   cd ../packages/cli && npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   
   # Build CLI (from packages/cli directory)
   npm run build
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - CLI: `node dist/index.js --help`

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Powerful data synchronization
- **Framer Motion** - Smooth animations
- **Heroicons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Secure authentication
- **WebSockets** - Real-time communication

### CLI
- **Commander.js** - Command-line interface framework
- **Chalk** - Terminal string styling
- **Ora** - Elegant terminal spinners
- **TypeScript** - Type-safe CLI development

### AI & Integrations
- **OpenAI API** - AI-powered features
- **Discord.js** - Discord bot integration
- **WebSocket** - Real-time updates

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Documentation

All essential documentation is provided within this README. For further details on contributing, see [CONTRIBUTING.md](./CONTRIBUTING.md).

For advanced usage or troubleshooting, join our [Discord](https://discord.gg/Kx5HrvMB) community or [report bugs](https://github.com/LabnexDev/Labnex/issues).

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## CLI Usage

Labnex includes a powerful CLI. Install it globally or use with `npx`:

```bash
npm install -g @labnex/cli
# or
npx @labnex/cli <command>
```

Find the package on [npm: @labnex/cli](https://www.npmjs.com/package/@labnex/cli).

### Basic Commands
```bash
# Run tests with AI optimization
labnex run --project <project-id> --ai-optimize

# Run tests with detailed logging
labnex run --project <project-id> --ai-optimize --detailed

# Generate test cases with AI
labnex ai generate --description "User login functionality"

# Analyze test failures
labnex ai analyze <run-id> <failure-id>

# Check system status
labnex status
```

### Enhanced Output
With the `--detailed` flag, get comprehensive test execution logs:
- Real-time action tracking (navigation, clicks, typing)
- Performance metrics (page load times, response times)
- Visual progress bars and completion statistics
- Detailed error reporting and debugging information

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- Conventional commits

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Performance & Metrics

- **Fast**: Sub-second page loads with optimized bundling
- **Responsive**: Mobile-first design with 100% responsive layouts
- **Secure**: Enterprise-grade security with JWT and role-based access
- **Scalable**: Microservices architecture supporting thousands of users
- **Global**: CDN-optimized for worldwide performance

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Security

Labnex takes security seriously:
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- HTTPS enforcement
- Regular security audits
- OWASP compliance

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Acknowledgments

- Built with love by the Labnex team
- Powered by OpenAI for AI features
- Icons by Heroicons
- UI components inspired by modern design systems

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

## Support

- **Documentation**: [Visit our Documentation](https://labnexdev.github.io/Labnex/documentation)
- **Discord Community**: [Join our Discord](https://discord.gg/Kx5HrvMB)
- **GitHub Issues**: [Report bugs or request features](https://github.com/LabnexDev/Labnex/issues)
- **Email**: labnexcontact@gmail.com

<hr style="margin: 30px 0; border: 0; border-top: 1px solid #444;" />

<div align="center">

**[Star us on GitHub](https://github.com/LabnexDev/Labnex)**

Made with love for the developer community

</div>
