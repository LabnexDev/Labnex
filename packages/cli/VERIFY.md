# Labnex CLI Verification Guide

This guide helps you verify that your Labnex CLI installation is working correctly.

## 1. Verify Installation

Run the following command to check that the CLI is installed:

```bash
labnex --version
```

You should see output similar to:
```
1.3.0
```

If you get a "command not found" error, try reinstalling the CLI:
```bash
npm install -g @labnex/cli
```

## 2. Check Help System

Run the help command to verify that the CLI help system is working:

```bash
labnex --help
```

You should see a detailed help output with all available commands.

## 3. Test Configuration

Verify your API configuration:

```bash
labnex config get
```

If your configuration is missing or incomplete, set it up:

```bash
labnex config set
```

## 4. Test Authentication

Check if you're authenticated:

```bash
labnex auth status
```

If not authenticated, log in:

```bash
labnex auth login
```

## 5. Test Basic Commands

Try listing projects to ensure API connectivity:

```bash
labnex list --projects
```

## 6. Test Run Command

If you have a project set up, try running a simple test:

```bash
labnex run --project-id <YOUR_PROJECT_ID> --verbose
```

## Troubleshooting

### API Connection Issues

If you can't connect to the API:

1. Check your internet connection
2. Verify your API configuration with `labnex config get`
3. Try setting a custom API URL with `labnex config set --api-url <URL>`

### Browser/WebDriver Issues

If you encounter browser automation errors:

1. Make sure you have the latest browser versions installed
2. Try running with `--headless` flag
3. Use `--verbose` for detailed logs

### Permission Issues

If you get permission errors:

1. Try running with administrator privileges
2. Check file permissions in your home directory
3. Verify that you have write access to the Labnex configuration directory

### Getting Help

If you continue to have issues, please contact support:

- Email: labnexcontact@gmail.com
- GitHub Issues: https://github.com/LabnexDev/Labnex/issues 