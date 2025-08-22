@echo off
echo 正在构建幸运转盘应用...

echo.
echo 1. 构建前端 React 应用...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败！
    pause
    exit /b 1
)

echo.
echo 2. 复制前端文件到静态目录...
cd ..
if not exist static mkdir static
xcopy /E /Y frontend\build\* static\

echo.
echo 3. 构建后端 Go 应用...
go build -o spinner-wheel.exe
if %errorlevel% neq 0 (
    echo 后端构建失败！
    pause
    exit /b 1
)

echo.
echo ✅ 构建完成！
echo.
echo 运行应用:
echo   双击 spinner-wheel.exe 启动服务器
echo   或在命令行运行: spinner-wheel.exe
echo.
echo 访问地址:
echo   用户界面: http://localhost:8080/user  
echo   管理界面: http://localhost:8080/admin
echo.
pause