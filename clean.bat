@echo off
echo =============================================
echo Spinner Wheel - Clean Build Files
echo =============================================
echo.

echo Cleaning build files...
echo.

:: Remove executable
if exist "spinner-wheel.exe" (
    echo Deleting spinner-wheel.exe
    del spinner-wheel.exe
)

:: Remove static directory
if exist "static" (
    echo Deleting static\ directory
    rmdir /S /Q static
)

:: Remove frontend build directory
if exist "frontend\build" (
    echo Deleting frontend\build\ directory
    rmdir /S /Q "frontend\build"
)

:: Optional: Clean node_modules (commented out by default)
:: echo Deleting node_modules (optional)
:: if exist "frontend\node_modules" (
::     rmdir /S /Q "frontend\node_modules"
:: )

:: Optional: Clean data directory (commented out by default)
:: echo Deleting data files (use with caution)
:: if exist "data" (
::     rmdir /S /Q data
:: )

echo.
echo Cleanup completed!
echo.
echo Run build.bat to rebuild the application
echo.
pause