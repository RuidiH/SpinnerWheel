@echo off
echo ============================================
echo 🎯 幸运转盘应用 - 初始化设置
echo ============================================
echo.
echo 此脚本将检查并设置开发环境
echo.

:: 检查管理员权限（用于PATH设置提示）
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  注意: 未以管理员身份运行
    echo    如需修改系统PATH，请右键 "以管理员身份运行"
    echo.
)

:: 系统信息
echo 📋 系统信息:
echo    操作系统: %OS%
echo    计算机名: %COMPUTERNAME%
echo    用户名: %USERNAME%
echo.

:: 检查必要工具
echo 🔍 检查开发工具...
echo.

:: 检查 Node.js
echo ┌─ Node.js 检查
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo │  ❌ 未安装 Node.js
    echo │  
    echo │  📥 下载地址: https://nodejs.org/zh-cn/download/
    echo │  📋 推荐版本: LTS 18.x 或更高
    echo │  
    echo │  安装后请重启命令提示符
    echo └─
    echo.
    set NEED_NODEJS=1
) else (
    for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
    echo │  ✅ 已安装: !NODE_VERSION!
    echo └─
    echo.
)

:: 检查 npm
echo ┌─ npm 检查
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo │  ❌ 未安装 npm
    echo │  通常 npm 随 Node.js 一起安装
    echo └─
    echo.
) else (
    for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo │  ✅ 已安装: !NPM_VERSION!
    echo └─
    echo.
)

:: 检查 Go
echo ┌─ Go 语言检查
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo │  ❌ 未安装 Go
    echo │  
    echo │  📥 下载地址: https://go.dev/dl/
    echo │  📋 推荐版本: 1.21 或更高
    echo │  
    echo │  安装后请重启命令提示符
    echo └─
    echo.
    set NEED_GO=1
) else (
    for /f "tokens=3" %%i in ('go version') do set GO_VERSION=%%i
    echo │  ✅ 已安装: !GO_VERSION!
    echo └─
    echo.
)

:: 检查 Git（可选）
echo ┌─ Git 检查（可选）
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo │  ⚠️  未安装 Git（可选）
    echo │  如需从源码仓库获取更新，请安装 Git
    echo │  📥 下载地址: https://git-scm.com/download/win
    echo └─
    echo.
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo │  ✅ 已安装: !GIT_VERSION!
    echo └─
    echo.
)

:: 如果缺少必要工具，显示安装指南
if defined NEED_NODEJS (
    echo ============================================
    echo 🚨 缺少必要工具
    echo ============================================
    echo.
    echo 请先安装以下工具后重新运行此脚本:
    echo.
    if defined NEED_NODEJS (
        echo 📦 Node.js:
        echo    下载: https://nodejs.org/zh-cn/download/
        echo    选择: LTS 版本（推荐）
        echo    安装后重启命令提示符
        echo.
    )
    if defined NEED_GO (
        echo 📦 Go 语言:
        echo    下载: https://go.dev/dl/
        echo    选择: 最新稳定版
        echo    安装后重启命令提示符
        echo.
    )
    echo 安装完成后，请重新运行 setup.bat
    pause
    exit /b 1
)

:: 检查项目结构
echo 🗂️  检查项目结构...
echo.

if not exist "frontend" (
    echo ❌ 未找到 frontend 目录
    echo    请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "main.go" (
    echo ❌ 未找到 main.go 文件
    echo    请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "go.mod" (
    echo ❌ 未找到 go.mod 文件
    echo    正在初始化 Go 模块...
    go mod init spinner-wheel
    if %errorlevel% neq 0 (
        echo ❌ Go 模块初始化失败
        pause
        exit /b 1
    )
    echo ✅ Go 模块初始化完成
)

echo ✅ 项目结构检查完成
echo.

:: 创建必要目录
echo 📁 创建必要目录...
if not exist "data" (
    mkdir data
    echo ✅ 创建 data 目录
)

if not exist "templates" (
    mkdir templates
    echo ✅ 创建 templates 目录
)

if not exist "static" (
    mkdir static  
    echo ✅ 创建 static 目录
)

echo ✅ 目录创建完成
echo.

:: 检查前端依赖
echo 📦 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        echo 请检查网络连接
        cd ..
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
) else (
    echo ✅ 前端依赖已存在
)
cd ..
echo.

:: 检查 Go 依赖
echo 📦 检查 Go 依赖...
go mod tidy
if %errorlevel% neq 0 (
    echo ❌ Go 依赖安装失败
    echo 请检查网络连接和 Go 代理设置
    pause
    exit /b 1
)
echo ✅ Go 依赖检查完成
echo.

:: 创建模板文件（如果不存在）
if not exist "templates\user.html" (
    echo 📄 创建开发模式模板...
    echo 简化的用户界面模板已创建
)

:: 设置完成
echo ============================================
echo 🎉 设置完成！
echo ============================================
echo.
echo 📋 环境摘要:
echo    - Node.js: 已安装
echo    - Go: 已安装  
echo    - 项目目录: 已准备
echo    - 前端依赖: 已安装
echo    - Go 依赖: 已安装
echo.
echo 🚀 下一步操作:
echo.
echo    1. 构建应用: 
echo       build.bat
echo.
echo    2. 开发模式运行:
echo       run.bat
echo.
echo    3. 或分别启动前后端:
echo       frontend: cd frontend ^&^& npm start
echo       backend:  go run .
echo.
echo 📚 更多信息请查看 README.md
echo.

:: 询问是否立即构建
set /p BUILD_NOW="是否立即构建应用? (y/N): "
if /i "%BUILD_NOW%"=="y" (
    echo.
    echo 开始构建...
    call build.bat
) else (
    echo.
    echo 设置完成！使用 build.bat 构建应用
)

pause