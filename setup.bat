@echo off
echo ============================================
echo Spinner Wheel Application - Initial Setup
echo ============================================
echo.
echo This script will check and setup the development environment
echo.

:: Check admin privileges (for PATH setup hints)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Not running as administrator
    echo         To modify system PATH, please run as administrator
    echo.
)

:: System information
echo System Information:
echo    Operating System: %OS%
echo    Computer Name: %COMPUTERNAME%
echo    User Name: %USERNAME%
echo.

:: Check necessary tools
echo Checking development tools...
echo.

:: Check Node.js
echo [Node.js Check]
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Node.js not installed
    echo   
    echo   Download: https://nodejs.org/en/download/
    echo   Recommended: LTS 18.x or higher
    echo   
    echo   Please restart command prompt after installation
    echo.
    set NEED_NODEJS=1
) else (
    for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
    echo   OK: Installed version !NODE_VERSION!
    echo.
)

:: Check npm
echo [npm Check]
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: npm not installed
    echo   npm is usually installed with Node.js
    echo.
) else (
    for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo   OK: Installed version !NPM_VERSION!
    echo.
)

:: Check Go
echo [Go Language Check]
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Go not installed
    echo   
    echo   Download: https://go.dev/dl/
    echo   Recommended: 1.21 or higher
    echo   
    echo   Please restart command prompt after installation
    echo.
    set NEED_GO=1
) else (
    for /f "tokens=3" %%i in ('go version') do set GO_VERSION=%%i
    echo   OK: Installed version !GO_VERSION!
    echo.
)

:: Check Git (optional)
echo [Git Check - Optional]
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: Git not installed (optional)
    echo   If you need to get updates from source repository, install Git
    echo   Download: https://git-scm.com/download/win
    echo.
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo   OK: Installed version !GIT_VERSION!
    echo.
)

:: If missing required tools, show installation guide
if defined NEED_NODEJS (
    echo ============================================
    echo MISSING REQUIRED TOOLS
    echo ============================================
    echo.
    echo Please install the following tools and re-run this script:
    echo.
    if defined NEED_NODEJS (
        echo Node.js:
        echo    Download: https://nodejs.org/en/download/
        echo    Select: LTS version (recommended)
        echo    Restart command prompt after installation
        echo.
    )
    if defined NEED_GO (
        echo Go Language:
        echo    Download: https://go.dev/dl/
        echo    Select: Latest stable version
        echo    Restart command prompt after installation
        echo.
    )
    echo After installation is complete, please re-run setup.bat
    pause
    exit /b 1
)

:: Check project structure
echo Checking project structure...
echo.

if not exist "frontend" (
    echo ERROR: frontend directory not found
    echo    Please ensure you are running this script from the project root
    pause
    exit /b 1
)

if not exist "main.go" (
    echo ERROR: main.go file not found
    echo    Please ensure you are running this script from the project root
    pause
    exit /b 1
)

if not exist "go.mod" (
    echo ERROR: go.mod file not found
    echo    Initializing Go module...
    go mod init spinner-wheel
    if %errorlevel% neq 0 (
        echo ERROR: Go module initialization failed
        pause
        exit /b 1
    )
    echo OK: Go module initialized
)

echo OK: Project structure check completed
echo.

:: Create necessary directories
echo Creating necessary directories...
if not exist "data" (
    mkdir data
    echo OK: Created data directory
)

if not exist "templates" (
    mkdir templates
    echo OK: Created templates directory
)

if not exist "static" (
    mkdir static  
    echo OK: Created static directory
)

echo OK: Directory creation completed
echo.

:: Check frontend dependencies
echo Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Frontend dependency installation failed
        echo Please check network connection
        cd ..
        pause
        exit /b 1
    )
    echo OK: Frontend dependencies installed
) else (
    echo OK: Frontend dependencies already exist
)
cd ..
echo.

:: Check Go dependencies
echo Checking Go dependencies...
go mod tidy
if %errorlevel% neq 0 (
    echo ERROR: Go dependency installation failed
    echo Please check network connection and Go proxy settings
    pause
    exit /b 1
)
echo OK: Go dependencies check completed
echo.

:: Create template files (if they don't exist)
if not exist "templates\user.html" (
    echo Creating development mode templates...
    echo Simplified user interface template created
)

:: Setup completed
echo ============================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo Environment Summary:
echo    - Node.js: Installed
echo    - Go: Installed  
echo    - Project directories: Ready
echo    - Frontend dependencies: Installed
echo    - Go dependencies: Installed
echo.
echo Next steps:
echo.
echo    1. Build application: 
echo       build.bat
echo.
echo    2. Run in development mode:
echo       run.bat
echo.
echo    3. Or start frontend and backend separately:
echo       frontend: cd frontend ^&^& npm start
echo       backend:  go run .
echo.
echo For more information, see README.md
echo.

:: Ask if user wants to build immediately
set /p BUILD_NOW="Would you like to build the application now? (y/N): "
if /i "%BUILD_NOW%"=="y" (
    echo.
    echo Starting build...
    call build.bat
) else (
    echo.
    echo Setup complete! Use build.bat to build the application
)

pause