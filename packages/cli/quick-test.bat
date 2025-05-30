@echo off
echo Quick Test: W3Schools Modal with Performance Optimizations
echo =========================================================

echo Building CLI...
npm run build

echo.
echo Running quick test with optimized CLI...
node dist/index.js run --project-id 6832ac498153de9c85b03727 --test-id 68362689160c68e7f548621d --environment staging --mode local --optimize-ai --verbose

echo.
echo Test completed.
pause 