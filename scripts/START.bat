@echo off
echo =============================================
echo Spinner Wheel Lottery System - Start Server
echo =============================================
echo.

:: Always expect to be run from project root directory
:: Change to project root if running from scripts directory
if exist "scripts\START.bat" (
    echo Running from project root directory
) else if exist "START.bat" (
    echo Running from scripts directory, changing to project root...
    cd ..
    if not exist "main.go" (
        echo ERROR: Could not find project root directory
        pause
        exit /b 1
    )
) else (
    echo ERROR: Please run this script from either:
    echo   - Project root directory: scripts\START.bat
    echo   - Scripts directory: START.bat
    pause
    exit /b 1
)

:: Check if executable exists
if not exist "spinner-wheel.exe" (
    echo First run detected - executable not found
    echo Running build process...
    echo.
    
    call scripts\build.bat
    if %errorlevel% neq 0 (
        echo.
        echo Build failed! Please check development environment.
        pause
        exit /b 1
    )
    echo.
    echo Build completed! Starting server...
    echo.
)

:: Verify executable exists
if not exist "spinner-wheel.exe" (
    echo ERROR: spinner-wheel.exe not found after build
    echo Please run scripts\build.bat manually to troubleshoot
    pause
    exit /b 1
)

echo Starting Spinner Wheel server...
echo.
echo Access URLs:
echo   User Interface:  http://localhost:8080/user
echo   Admin Interface: http://localhost:8080/admin
echo.
echo Press Ctrl+C to stop server
echo =============================================
echo.

spinner-wheel.exe

echo.
echo =============================================
echo Server stopped
echo =============================================
pause