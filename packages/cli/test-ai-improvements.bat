@echo off
echo Testing Labnex CLI with AI Improvements
echo ========================================
echo.
echo Project ID: 6832ac498153de9c85b03727
echo.
echo Starting test with AI optimization enabled...
echo.

REM Build the project first (allow it to fail due to type issues)
echo Building CLI...
call npm run build 2>nul

echo.
echo Running test automation with AI assistance...
echo.

REM Run the test with all AI features enabled
node dist/index.js run -p 6832ac498153de9c85b03727 --detailed --ai-optimize --local

echo.
echo Test completed. Check the logs above for AI assistance in action.
pause 