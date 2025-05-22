# Labnex Local Development Guide

This guide provides information to help you set up the Labnex development environment locally and understand our coding standards.

## Getting Started

### Prerequisites

-   **Git**: For version control.
-   **Node.js & npm**: For both frontend and backend development (e.g., Node.js >= 18.x recommended).
-   **MongoDB**: Labnex uses MongoDB as its database. A local instance or a cloud-hosted instance (e.g., MongoDB Atlas free tier) will be needed.
-   **Docker (Optional but Recommended)**: For easily running MongoDB and other services in a containerized environment.
-   An IDE/Text Editor of your choice (e.g., VS Code).

### Setting Up the Development Environment

1.  **Clone the Repository**:
    -   Clone the Labnex repository locally: `git clone <labnex_repo_url>` (Replace with actual URL if public, otherwise assume local access).
    -   Navigate into the project directory: `cd Labnex`

2.  **Install Dependencies**:
    -   **Frontend**: Navigate to `frontend/` and run `npm install`.
    -   **Backend**: Navigate to `backend/` and run `npm install`.

3.  **Environment Variables**:
    -   In both `frontend/` and `backend/` directories, copy the `.env.example` file (if one exists) to a new file named `.env`.
    -   Review and fill in the necessary variables in each `.env` file:
        -   **Backend `.env`**: Crucially, set `MONGO_URI` to your MongoDB connection string. Also include `JWT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `OPENAI_API_KEY`, etc.
        -   **Frontend `.env`**: Typically `VITE_API_BASE_URL` (e.g., `http://localhost:5001/api/v1` if your backend runs on port 5001) and `BASE_URL` (e.g., `/` for local dev, or `/Labnex/` if mimicking GitHub Pages deployment).

4.  **Database Setup (MongoDB)**:
    -   If using Docker: A `docker-compose.yml` file might be provided at the root or in `backend/` to quickly start a MongoDB instance. Run `docker-compose up -d`.
    -   Alternatively, ensure your local or cloud MongoDB instance is running and accessible.
    -   No explicit database migration step is usually needed with Mongoose if schemas are defined to be flexible, but ensure your connection string in `backend/.env` is correct.

5.  **Running the Application Locally**:
    -   **Backend**: Navigate to `backend/` and run `npm run dev`. This typically starts the backend server on a port like `5000` or `5001` (check console output).
    -   **Frontend**: Navigate to `frontend/` and run `npm run dev`. This typically starts the Vite development server on a port like `5173` (check console output).
    -   Access the frontend application in your browser (e.g., `http://localhost:5173`).

## Codebase Overview

-   **`frontend/`**: Contains the React-based user interface (Vite, TypeScript).
    -   `src/api/`: Services for calling backend APIs.
    -   `src/components/`: Reusable UI components.
    -   `src/pages/`: Top-level page components and views.
    -   `src/hooks/`: Custom React hooks.
    -   `src/contexts/`: Global state and context providers.
-   **`backend/`**: Node.js, Express.js, TypeScript API.
    -   `src/config/`: Database connection, etc.
    -   `src/controllers/`: Request handlers.
    -   `src/middleware/`: Custom middleware (e.g., auth).
    -   `src/models/`: Mongoose schemas for MongoDB.
    -   `src/routes/`: API route definitions.
    -   `src/services/`: Business logic.
    -   `src/bots/`: Logic for the Discord bot.
-   **`frontend/public/documentation_md/`**: Markdown files for the in-app documentation.

## Coding Standards & Conventions

-   **Language Specifics**: Follow established best practices for TypeScript (frontend & backend).
-   **Formatting**: Prettier is used for code formatting. ESLint is used for linting.
    -   Run `npm run format` in `frontend/` and `backend/` to format code.
    -   Run `npm run lint` in `frontend/` and `backend/` to check for linting errors.
-   **Naming Conventions**: Adhere to the project's established naming conventions (generally PascalCase for components/classes, camelCase for functions/variables). Refer to the Global Development Rules provided.
-   **Testing**: Jest is used for testing.
    -   Run `npm test` in `frontend/` and `backend/` to execute tests.
    -   Write unit and integration tests for new features and bug fixes.
-   **Commit Messages**: Follow conventional commit guidelines (e.g., `feat: Add X feature`, `fix: Correct Y bug`).

## Contribution Process (Internal Development)

1.  **Discuss**: If planning a significant change, discuss with the team or lead.
2.  **Create a Branch**: Create a new feature or bugfix branch from `main` (or the current development branch): `git checkout -b feat/my-new-feature`.
3.  **Develop**: Implement your changes, including tests and any necessary documentation updates.
4.  **Test**: Run all tests (`npm test`).
5.  **Lint & Format**: Run `npm run lint` and `npm run format`.
6.  **Commit**: Commit your changes with clear messages.
7.  **Push**: Push your branch.
8.  **Create a Pull Request (PR)**: Open a PR for review against the target branch.
    -   Provide a clear description of changes and link any relevant issues/tasks.
9.  **Code Review**: Address feedback.
10. **Merge**: Once approved, the PR will be merged.

This guide should help you get Labnex running locally for development purposes. 