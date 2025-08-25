@echo off
echo ============================================
echo Building Spinner Wheel Application
echo ============================================
echo.

:: Check required tools
echo [1/5] Checking build environment...

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    echo.
    echo Please install Node.js 18 or higher:
    echo https://nodejs.org/en/download/
    echo.
    pause
    exit /b 1
)

:: Check Go
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go not found
    echo.
    echo Please install Go 1.21 or higher:
    echo https://go.dev/dl/
    echo.
    pause
    exit /b 1
)

:: Check frontend directory
if not exist "frontend" (
    echo ERROR: frontend directory not found
    echo Please ensure you are running this script from the project root
    pause
    exit /b 1
)

:: Check package.json
if not exist "frontend\package.json" (
    echo ERROR: package.json not found in frontend directory
    echo Please ensure frontend is a valid React project
    pause
    exit /b 1
)

echo OK: Build environment check passed
echo.

:: Ensure necessary directories exist
echo [2/5] Creating necessary directories...
if not exist "data" mkdir data
if not exist "static" mkdir static
echo OK: Directories prepared
echo.

echo [3/5] Starting build process...
echo.

:: 1. Check and install frontend dependencies
echo Step 1: Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies for first time...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Dependency installation failed!
        echo Please check network connection and npm configuration
        cd ..
        pause
        exit /b 1
    )
    echo OK: Dependencies installed
    echo.
)

:: 2. Build frontend React application
echo Step 2: Building frontend React application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    echo.
    echo Common solutions:
    echo - Check Node.js version is 18+
    echo - Delete node_modules directory and try again
    echo - Check network connection
    cd ..
    pause
    exit /b 1
)
echo OK: Frontend build completed
echo.

:: 3. Copy frontend files to static directory
echo Step 3: Copying frontend files to static directory...
cd ..
xcopy /E /Y /Q frontend\build\* static\ >nul
if %errorlevel% neq 0 (
    echo ERROR: File copy failed!
    pause
    exit /b 1
)
echo OK: Static files copied
echo.

:: 4. Install Go dependencies
echo [4/5] Installing Go dependencies...
go mod tidy
if %errorlevel% neq 0 (
    echo ERROR: Go dependency installation failed!
    echo Please check network connection and Go proxy settings
    pause
    exit /b 1
)
echo OK: Go dependencies installed
echo.

:: 5. Build backend Go application
echo [5/5] Building backend Go application...
go build -o spinner-wheel.exe
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    echo Please check Go code for syntax errors
    pause
    exit /b 1
)
echo OK: Backend build completed
echo.

echo ============================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo Generated files:
echo   - spinner-wheel.exe (main program)
echo   - static\ (frontend resources)
echo   - data\ (data directory, created at runtime)
echo.
echo To run the application:
echo   Double-click START.bat for one-click start
echo   Or double-click spinner-wheel.exe
echo   Or use: run.bat for development
echo.
echo Access URLs:
echo   User interface: http://localhost:8080/user  
echo   Admin interface: http://localhost:8080/admin
echo.
echo Deployment note:
echo   To deploy on other machines, copy these files/directories:
echo   - spinner-wheel.exe
echo   - static\
echo   - START.bat (recommended)
echo.
pause