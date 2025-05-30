@echo off
echo Labnex CLI Helper
echo ================

REM Check if we're in the root directory
if not exist "packages\cli" (
    echo Error: This script must be run from the Labnex root directory
    echo Current directory: %CD%
    echo Expected: F:\VSC Projects\Labnex (or similar)
    pause
    exit /b 1
)

REM Navigate to CLI directory
cd packages\cli

REM Check if CLI is built
if not exist "dist\index.js" (
    echo CLI not built yet. Building now...
    npm run build
    if errorlevel 1 (
        echo Build failed! Please check for errors.
        pause
        exit /b 1
    )
    echo Build completed successfully!
    echo.
)

REM Run the CLI with all provided arguments
echo Running: node dist/index.js %*
echo.
node dist/index.js %*

REM Return to original directory
cd ..\..

echo.
echo CLI execution completed.
if not "%1"=="--no-pause" pause 