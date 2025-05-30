@echo off
echo Testing Labnex CLI Help System
echo ===============================

echo Building CLI...
npm run build

echo.
echo === Main Help ===
node dist/index.js --help

echo.
echo === Run Command Help ===
node dist/index.js run --help

echo.
echo === List Command Help ===
node dist/index.js list --help

echo.
echo === Status Command Help ===
node dist/index.js status --help

echo.
echo Help test completed.
pause 