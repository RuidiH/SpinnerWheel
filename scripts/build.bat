@echo off
echo ============================================
echo Building Spinner Wheel Application
echo ============================================
echo.

:: Always expect to be run from project root directory
:: Change to project root if running from scripts directory
if exist "scripts\build.bat" (
    echo Running from project root directory
) else if exist "build.bat" (
    echo Running from scripts directory, changing to project root...
    cd ..
    if not exist "main.go" (
        echo ERROR: Could not find project root directory
        pause
        exit /b 1
    )
) else (
    echo ERROR: Please run this script from either:
    echo   - Project root directory: scripts\build.bat
    echo   - Scripts directory: build.bat
    pause
    exit /b 1
)

:: Verify we're in the correct directory
if not exist "main.go" (
    echo ERROR: main.go not found. Please run from project root.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found. Invalid project structure.
    pause
    exit /b 1
)

echo [1/4] Checking build environment...

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

:: Check Go
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go not found
    echo Please install Go 1.21 or higher
    pause
    exit /b 1
)

echo OK: Build environment ready
echo.

echo [2/4] Building frontend...

:: Install frontend dependencies if needed
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)

:: Build frontend
echo Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    cd ..
    pause
    exit /b 1
)

:: Return to project root
cd ..
echo OK: Frontend build completed
echo.

echo [3/4] Copying frontend build to static directory...

:: Clean and recreate static directory
if exist "static" rmdir /S /Q "static"
mkdir "static"

:: Copy build files
xcopy /E /I /Y /Q "frontend\build\*" "static\" >nul
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy frontend build files
    pause
    exit /b 1
)

echo OK: Static files ready
echo.

echo [4/4] Building Go application...

:: Prepare Go dependencies (use vendor for offline builds)
if exist "vendor" (
    echo Using vendored dependencies for offline build...
    :: No need for go mod tidy - use existing vendor
) else (
    echo Downloading Go dependencies...
    go mod tidy
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Go dependencies
        echo TIP: For offline builds, run 'go mod vendor' first
        pause
        exit /b 1
    )
)

:: Build executable (prefer vendor mode if available)
if exist "vendor" (
    go build -mod=vendor -o spinner-wheel.exe
) else (
    go build -o spinner-wheel.exe
)
if %errorlevel% neq 0 (
    echo ERROR: Go build failed
    pause
    exit /b 1
)

echo OK: Go application built
echo.

echo ============================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo Generated files:
echo   - spinner-wheel.exe
echo   - static\ directory
echo.
echo To start the application:
echo   scripts\START.bat
echo   OR: spinner-wheel.exe
echo   OR: npm run start
echo.
echo Access URLs:
echo   http://localhost:8080/user  (User Interface)
echo   http://localhost:8080/admin (Admin Interface)
echo.
pause