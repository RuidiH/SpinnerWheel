@echo off
echo ============================================
echo 🎯 构建幸运转盘应用
echo ============================================
echo.

:: 检查必要工具
echo 📋 检查构建环境...

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo.
    echo 请安装 Node.js 18 或更高版本:
    echo https://nodejs.org/zh-cn/download/
    echo.
    pause
    exit /b 1
)

:: 检查 Go
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Go
    echo.
    echo 请安装 Go 1.21 或更高版本:
    echo https://go.dev/dl/
    echo.
    pause
    exit /b 1
)

:: 检查 frontend 目录
if not exist "frontend" (
    echo ❌ 错误: 未找到 frontend 目录
    echo 请确保在正确的项目根目录运行此脚本
    pause
    exit /b 1
)

:: 检查 package.json
if not exist "frontend\package.json" (
    echo ❌ 错误: frontend 目录中未找到 package.json
    echo 请确保 frontend 是一个有效的 React 项目
    pause
    exit /b 1
)

echo ✅ 构建环境检查通过
echo.

:: 确保必要目录存在
echo 📁 创建必要目录...
if not exist "data" mkdir data
if not exist "templates" mkdir templates
if not exist "static" mkdir static
echo ✅ 目录准备完成
echo.

echo ⚡ 开始构建...
echo.

:: 1. 检查并安装前端依赖
echo 1️⃣ 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败！
        echo 请检查网络连接和 npm 配置
        cd ..
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

:: 2. 构建前端 React 应用
echo 2️⃣ 构建前端 React 应用...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败！
    echo.
    echo 常见解决方案:
    echo - 检查 Node.js 版本是否为 18+
    echo - 删除 node_modules 目录后重新运行
    echo - 检查网络连接
    cd ..
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

:: 3. 复制前端文件到静态目录
echo 3️⃣ 复制前端文件到静态目录...
cd ..
xcopy /E /Y /Q frontend\build\* static\ >nul
if %errorlevel% neq 0 (
    echo ❌ 文件复制失败！
    pause
    exit /b 1
)
echo ✅ 静态文件复制完成
echo.

:: 4. 安装 Go 依赖
echo 4️⃣ 安装 Go 依赖...
go mod tidy
if %errorlevel% neq 0 (
    echo ❌ Go 依赖安装失败！
    echo 请检查网络连接和 Go 代理设置
    pause
    exit /b 1
)
echo ✅ Go 依赖安装完成
echo.

:: 5. 构建后端 Go 应用
echo 5️⃣ 构建后端 Go 应用...
go build -o spinner-wheel.exe
if %errorlevel% neq 0 (
    echo ❌ 后端构建失败！
    echo 请检查 Go 代码是否有语法错误
    pause
    exit /b 1
)
echo ✅ 后端构建完成
echo.

echo ============================================
echo 🎉 构建完成！
echo ============================================
echo.
echo 📦 生成的文件:
echo   - spinner-wheel.exe (主程序)
echo   - static\ (前端资源)
echo   - templates\ (开发模式模板)
echo   - data\ (数据目录，运行时创建)
echo.
echo 🚀 运行应用:
echo   双击 spinner-wheel.exe 启动服务器
echo   或在命令行运行: spinner-wheel.exe
echo   或运行: run.bat
echo.
echo 🌐 访问地址:
echo   用户界面: http://localhost:8080/user  
echo   管理界面: http://localhost:8080/admin
echo.
echo 📋 部署提示:
echo   要在其他机器部署，复制以下文件/目录:
echo   - spinner-wheel.exe
echo   - static\
echo   - templates\ (可选，用于开发模式)
echo.
pause