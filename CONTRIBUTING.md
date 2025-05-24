# Contributing to Labnex

First off, thank you for considering contributing to Labnex! We welcome any help, whether it's reporting a bug, proposing a new feature, improving documentation, or writing code.

## How to Contribute

### Reporting Bugs

*   Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/LabnexDev/Labnex/issues).
*   If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/LabnexDev/Labnex/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

*   Open a new issue to discuss your enhancement. Please provide a clear description of the enhancement and its potential benefits.
*   Explain why this enhancement would be useful to Labnex users and contributors.

### Pull Requests

1.  **Fork the repository** to your own GitHub account.
2.  **Clone your fork** to your local machine:
    ```bash
    git clone https://github.com/YOUR_FORK_USERNAME/Labnex.git 
    cd Labnex
    ```
3.  **Create a new branch** for your changes:
    ```bash
    git checkout -b feature/your-feature-name 
    # or 
    git checkout -b fix/your-bug-fix-name
    ```
4.  **Make your changes** locally.
    *   Refer to the main `README.md` for instructions on setting up the development environment for both frontend and backend.
    *   Ensure your code adheres to any existing style guidelines (e.g., run linters).
5.  **Test your changes** thoroughly.
    *   For the frontend, you can run tests using `npm test` in the `frontend` directory.
    *   Ensure the application builds and runs correctly locally.
6.  **Commit your changes** with a clear and descriptive commit message:
    ```bash
    git add .
    git commit -m "feat: Implement X feature" 
    # or 
    git commit -m "fix: Resolve Y bug"
    ```
7.  **Push your branch** to your fork on GitHub:
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Open a Pull Request (PR)** from your fork's branch to the `main` (or `develop`) branch of the original `labnex` repository.
    *   Provide a clear title and description for your PR, explaining the changes and referencing any related issues.

## Development Setup

Please refer to the "Getting Started" section in the main [README.md](README.md) for detailed instructions on how to set up the frontend and backend development environments.

## Coding Conventions

*   **Follow existing code style:** Try to match the style of the surrounding code.
*   **Linting:**
    *   Frontend: Uses ESLint. Run `npm run lint` in the `frontend` directory to check for issues.
    *   Backend: Uses ESLint. Run `npm run lint` in the `backend` directory.
*   **TypeScript:** Both frontend and backend use TypeScript. Ensure your changes are type-safe.
*   **Commit Messages:** Use conventional commit messages (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `style: ...`, `refactor: ...`, `test: ...`, `chore: ...`).

## Questions?

If you have any questions, feel free to open an issue or reach out to the project maintainers.

Thank you for contributing! 