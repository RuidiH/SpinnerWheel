@echo off
echo =============================================
echo Spinner Wheel Lottery System - Start Server
echo =============================================
echo.

:: Check if executable exists
if not exist "spinner-wheel.exe" (
    echo First run detected or program missing, building application...
    echo.
    
    if exist "build.bat" (
        echo Running build script...
        call build.bat
        if %errorlevel% neq 0 (
            echo.
            echo Build failed! Please check development environment.
            pause
            exit /b 1
        )
        echo.
        echo Build completed! Starting server...
        echo.
    ) else (
        echo Error: Build script build.bat not found
        echo Please run this script from project root directory
        pause
        exit /b 1
    )
)

echo Starting server...
echo.
echo Access URLs:
echo   User Interface: http://localhost:8080/user
echo   Admin Interface: http://localhost:8080/admin
echo.
echo Press Ctrl+C to stop server
echo.

spinner-wheel.exe

echo.
echo Server stopped
pause