# Labnex CLI Usage Guide

## Overview

The Labnex CLI is a powerful tool for automating testing workflows directly from your terminal. It allows you to run tests, generate test cases with AI, analyze failures, and more, all with a focus on local-first execution.

## Installation

You can install the Labnex CLI globally or use it via `npx` for a one-time execution:

```bash
# Install globally
npm install -g @labnex/cli

# Use with npx (no installation required)
npx @labnex/cli <command>
```

Find the package on [npm: @labnex/cli](https://www.npmjs.com/package/@labnex/cli).

## Available Commands

Below is a list of the primary commands available in the Labnex CLI, along with their descriptions and common options:

- **`labnex run`**
  - **Description**: Executes test cases for a specified project or test ID.
  - **Options**:
    - `-p, --project-id <id>`: Specifies the project ID to run tests for (required).
    - `-t, --test-id <id>`: Specifies a single test case ID to run.
    - `--optimize-ai`: Enables AI optimization for better selector suggestions and test execution.
    - `-e, --environment <env>`: Sets the environment (e.g., `staging`, `production`). Default: `staging`.
    - `-m, --mode <mode>`: Sets the execution mode (e.g., `local`, `cloud`). Default: `local`.
    - `--parallel <number>`: Number of parallel workers (cloud mode). Default: `4`.
    - `--headless`: Run in headless mode (local mode). Default: `false`.
    - `--timeout <ms>`: Test timeout in milliseconds. Default: `300000`.
    - `--verbose`: Enables detailed logging for debugging.
  - **Example**:
    ```bash
    labnex run --project-id 6832ac498153de9c85b03727 --optimize-ai --environment staging --mode local --verbose
    ```

- **`labnex auth login`**
  - **Description**: Authenticate with Labnex using your credentials.
  - **Example**:
    ```bash
    labnex auth login
    ```

- **`labnex auth status`**
  - **Description**: Check if you are currently authenticated with Labnex.
  - **Example**:
    ```bash
    labnex auth status
    ```

- **`labnex projects create`**
  - **Description**: Create a new project in Labnex.
  - **Options**:
    - `--name <name>`: Name of the project (required).
    - `--code <code>`: Unique project code (required).
    - `--description <description>`: Description of the project.
    - `--base-url <url>`: Base URL for the project.
  - **Example**:
    ```bash
    labnex projects create --name "My Project" --code PROJECT1 --description "Description" --base-url "https://example.com"
    ```

- **`labnex projects list`**
  - **Description**: List all projects in Labnex.
  - **Example**:
    ```bash
    labnex projects list
    ```

- **`labnex projects show`**
  - **Description**: Show details of a specific project.
  - **Options**:
    - `-i, --id <id>`: Project ID to display.
    - `-c, --code <code>`: Project code to display.
  - **Example**:
    ```bash
    labnex projects show --id 6832ac498153de9c85b03727
    ```

- **`labnex ai generate`**
  - **Description**: Generates test cases or steps using AI based on a provided description.
  - **Options**:
    - `--description <text>`: A natural language description of the feature or test scenario (required).
    - `--project-id <id>`: Specifies the project ID to associate the generated test with.
    - `--project-code <code>`: Specifies the project code to associate the generated test with.
  - **Example**:
    ```bash
    labnex ai generate --description "User login functionality" --project-id 6832ac498153de9c85b03727
    ```

- **`labnex ai optimize`**
  - **Description**: Optimize test selection with AI for a specific project.
  - **Options**:
    - `--project <code>`: Project code to optimize (required).
  - **Example**:
    ```bash
    labnex ai optimize --project LABX
    ```

- **`labnex analyze failure`**
  - **Description**: Analyzes test failures using AI to suggest fixes or identify issues.
  - **Options**:
    - `--run-id <id>`: The ID of the test run to analyze (required).
  - **Example**:
    ```bash
    labnex analyze failure --run-id 1234567890
    ```

- **`labnex status`**
  - **Description**: Checks and displays the system status, including connectivity to backend services.
  - **Options**:
    - `-r, --run-id <id>`: Check specific test run ID.
  - **Example**:
    ```bash
    labnex status
    labnex status --run-id 1234567890
    ```

- **`labnex list`**
  - **Description**: View available projects or list test cases for a specific project.
  - **Options**:
    - `-p, --projects`: List all projects.
    - `-t, --tests <projectId>`: List test cases for a project.
  - **Example**:
    ```bash
    labnex list --projects
    labnex list --tests 6832ac498153de9c85b03727
    ```

- **`labnex config set`**
  - **Description**: Configure Labnex CLI settings.
  - **Options**:
    - `--api-url <url>`: Set the API URL.
    - `--reset`: Reset configuration to default.
  - **Example**:
    ```bash
    labnex config set --api-url https://custom-api.labnex.com
    ```

- **`labnex config get`**
  - **Description**: Display current configuration settings.
  - **Example**:
    ```bash
    labnex config get
    ```

- **`labnex help`**
  - **Description**: Displays help information for the CLI and its commands.
  - **Example**:
    ```bash
    labnex help
    ```

## Usage Examples

### Running a Specific Test Case
To run a specific test case with AI optimization enabled:

```bash
labnex run --project-id 6832ac498153de9c85b03727 --test-id 68362689160c68e7f548621d --optimize-ai
```

### Generating Test Cases with AI
To generate test steps for a feature described in natural language:

```bash
labnex ai generate --description "User should be able to log in with valid credentials" --project-id 6832ac498153de9c85b03727
```

### Analyzing Test Failures
To analyze why a test failed and get AI suggestions for fixing it:

```bash
labnex analyze failure --run-id 1234567890
```

### Creating a New Project
To create a new project in Labnex:

```bash
labnex projects create --name "E-commerce Site" --code ECOM --description "Testing for our e-commerce platform"
```

### Listing Projects and Test Cases
To list all projects or test cases for a specific project:

```bash
labnex list --projects
labnex list --tests 6832ac498153de9c85b03727
```

## Advanced Options

- **`--verbose`**: When used with `run` or globally, provides comprehensive test execution logs including real-time action tracking, performance metrics, and detailed error reporting.
  - **Example**:
    ```bash
    labnex run --project-id 6832ac498153de9c85b03727 --verbose
    ```

## Troubleshooting

- If you encounter issues with selectors not being found, ensure `--optimize-ai` is enabled to leverage AI suggestions for element identification.
- Check your environment variables and configuration files if authentication or connectivity errors occur.
- For further assistance, join our [Discord](https://discord.gg/Kx5HrvMB) community or report issues on [GitHub](https://github.com/LabnexDev/Labnex/issues).

## Contributing

We welcome contributions to improve the Labnex CLI. See the [Contributing Guide](../CONTRIBUTING.md) for details on how to get involved. 