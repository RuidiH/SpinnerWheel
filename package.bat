@echo off
echo ============================================
echo Creating Deployment Package
echo ============================================
echo.

:: Check if build is completed
if not exist "spinner-wheel.exe" (
    echo WARNING: spinner-wheel.exe not found
    echo          Running build process...
    echo.
    call build.bat
    if %errorlevel% neq 0 (
        echo ERROR: Build failed, cannot create deployment package
        pause
        exit /b 1
    )
    echo.
)

:: Check required directories
if not exist "static" (
    echo ERROR: static directory not found
    echo        Please run build.bat first to build the application
    pause
    exit /b 1
)

:: Create timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

:: Set package name
set "PACKAGE_NAME=SpinnerWheel_Release_%timestamp%"
set "PACKAGE_DIR=releases\%PACKAGE_NAME%"

echo Package name: %PACKAGE_NAME%
echo Output directory: %PACKAGE_DIR%
echo.

:: Create release directory
if not exist "releases" mkdir releases
if exist "%PACKAGE_DIR%" (
    echo Cleaning old files...
    rmdir /s /q "%PACKAGE_DIR%"
)
mkdir "%PACKAGE_DIR%"

echo Copying files...

:: Copy main program
echo   spinner-wheel.exe
copy spinner-wheel.exe "%PACKAGE_DIR%\"

:: Copy static files
echo   static\ directory
xcopy /E /Y /Q static "%PACKAGE_DIR%\static\" >nul

:: Copy template files (optional)
if exist "templates" (
    echo   templates\ directory
    xcopy /E /Y /Q templates "%PACKAGE_DIR%\templates\" >nul
)

:: Create empty data directory
echo   data\ directory (empty)
mkdir "%PACKAGE_DIR%\data"

:: Copy configuration example
if exist "config.example.json" (
    echo   config.example.json
    copy config.example.json "%PACKAGE_DIR%\"
)

:: Create startup scripts
echo   startup scripts
echo @echo off > "%PACKAGE_DIR%\Start_Server.bat"
echo echo ============================================ >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo Spinner Wheel Application >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo ============================================ >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo. >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo Starting server... >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo. >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo Access URLs: >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo   User interface: http://localhost:8080/user >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo   Admin interface: http://localhost:8080/admin >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo. >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo Press Ctrl+C to stop server >> "%PACKAGE_DIR%\Start_Server.bat"
echo echo. >> "%PACKAGE_DIR%\Start_Server.bat"
echo spinner-wheel.exe >> "%PACKAGE_DIR%\Start_Server.bat"
echo pause >> "%PACKAGE_DIR%\Start_Server.bat"

:: Create alternative port startup script
echo @echo off > "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo echo Starting server on port 9000... >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo echo Access URLs: >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo echo   User interface: http://localhost:9000/user >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo echo   Admin interface: http://localhost:9000/admin >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo echo. >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo spinner-wheel.exe -port 9000 >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"
echo pause >> "%PACKAGE_DIR%\Start_Server_Port_9000.bat"

:: Create deployment instructions
echo   deployment_instructions.txt
echo ============================================ > "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Spinner Wheel Application - Deployment Package >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo ============================================ >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Package Contents: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - spinner-wheel.exe     Main program >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - static\               Frontend resources >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - templates\            Development mode templates (optional) >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - data\                 Data directory (for runtime use) >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - Start_Server.bat      Quick startup script >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - config.example.json   Configuration file example >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Quick Start: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   1. Double-click "Start_Server.bat" >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   2. Or double-click "spinner-wheel.exe" >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   3. Open browser and go to http://localhost:8080/user >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Port Configuration: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   Command line: spinner-wheel.exe -port 9000 >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   Or use: Start_Server_Port_9000.bat >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Data Files: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   Configuration: data\config.json >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   History: data\history.json >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Troubleshooting: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - If port is in use, try different port >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - Check firewall if program is blocked >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - Ensure sufficient disk space for data files >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo IMPORTANT NOTES: >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - This is a single-machine application, accessible only locally >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - Data files are automatically saved in data\ directory >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo   - Recommend regular backup of data\ directory >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo. >> "%PACKAGE_DIR%\Deployment_Instructions.txt"
echo Created: %date% %time% >> "%PACKAGE_DIR%\Deployment_Instructions.txt"

:: Get version information
echo   version_info.txt
echo Version: 1.0.0 > "%PACKAGE_DIR%\Version_Info.txt"
echo Build Date: %date% %time% >> "%PACKAGE_DIR%\Version_Info.txt"
echo. >> "%PACKAGE_DIR%\Version_Info.txt"

:: Copy README if it exists
if exist "README.md" (
    echo   README.md
    copy README.md "%PACKAGE_DIR%\"
)

echo OK: File copying completed
echo.

:: Calculate package statistics
for /f "usebackq" %%A in (`dir "%PACKAGE_DIR%" /s /-c ^| find "File(s)"`) do set "file_count=%%A"
for /f "usebackq" %%A in (`dir "%PACKAGE_DIR%" /s /-c ^| find "bytes"`) do set "total_size=%%A"

echo Package Statistics:
echo    File Count: %file_count%
echo    Total Size: %total_size%
echo.

:: Create ZIP archive (if PowerShell is available)
set /p CREATE_ZIP="Create ZIP archive? (y/N): "
if /i "%CREATE_ZIP%"=="y" (
    echo.
    echo Creating ZIP archive...
    
    powershell -command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath 'releases\%PACKAGE_NAME%.zip' -Force" 2>nul
    if %errorlevel% equ 0 (
        echo OK: ZIP created successfully: releases\%PACKAGE_NAME%.zip
        
        :: Ask if user wants to delete folder version
        set /p DELETE_FOLDER="Delete folder version, keep only ZIP? (y/N): "
        if /i "%DELETE_FOLDER%"=="y" (
            rmdir /s /q "%PACKAGE_DIR%"
            echo OK: Folder version deleted
        )
    ) else (
        echo WARNING: ZIP creation failed, possibly due to PowerShell version
        echo          Folder version available: %PACKAGE_DIR%
    )
)

echo.
echo ============================================
echo DEPLOYMENT PACKAGE CREATED SUCCESSFULLY!
echo ============================================
echo.
echo Output Location:
if exist "releases\%PACKAGE_NAME%.zip" (
    echo    ZIP Package: releases\%PACKAGE_NAME%.zip
)
if exist "%PACKAGE_DIR%" (
    echo    Folder: %PACKAGE_DIR%
)
echo.
echo Usage Instructions:
echo    1. Copy deployment package to target machine
echo    2. Extract (if ZIP)
echo    3. Double-click "Start_Server.bat"
echo    4. Access http://localhost:8080/user
echo.
echo For detailed instructions, see "Deployment_Instructions.txt" in the package
echo.

pause