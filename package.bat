@echo off
echo ============================================
echo 📦 创建部署包
echo ============================================
echo.

:: 检查是否已构建
if not exist "spinner-wheel.exe" (
    echo ⚠️  未找到 spinner-wheel.exe
    echo    正在运行构建...
    echo.
    call build.bat
    if %errorlevel% neq 0 (
        echo ❌ 构建失败，无法创建部署包
        pause
        exit /b 1
    )
    echo.
)

:: 检查必要目录
if not exist "static" (
    echo ❌ 未找到 static 目录
    echo    请先运行 build.bat 构建应用
    pause
    exit /b 1
)

:: 创建时间戳
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

:: 设置包名称
set "PACKAGE_NAME=SpinnerWheel_Release_%timestamp%"
set "PACKAGE_DIR=releases\%PACKAGE_NAME%"

echo 📦 包名称: %PACKAGE_NAME%
echo 📁 输出目录: %PACKAGE_DIR%
echo.

:: 创建发布目录
if not exist "releases" mkdir releases
if exist "%PACKAGE_DIR%" (
    echo 🗑️  清理旧文件...
    rmdir /s /q "%PACKAGE_DIR%"
)
mkdir "%PACKAGE_DIR%"

echo 📋 复制文件...

:: 复制主程序
echo │  📄 spinner-wheel.exe
copy spinner-wheel.exe "%PACKAGE_DIR%\"

:: 复制静态文件
echo │  📁 static\
xcopy /E /Y /Q static "%PACKAGE_DIR%\static\" >nul

:: 复制模板文件（可选）
if exist "templates" (
    echo │  📁 templates\
    xcopy /E /Y /Q templates "%PACKAGE_DIR%\templates\" >nul
)

:: 创建空的 data 目录
echo │  📁 data\ (空目录)
mkdir "%PACKAGE_DIR%\data"

:: 复制配置示例
if exist "config.example.json" (
    echo │  📄 config.example.json
    copy config.example.json "%PACKAGE_DIR%\"
)

:: 创建运行脚本
echo │  📄 启动脚本
echo @echo off > "%PACKAGE_DIR%\启动服务器.bat"
echo echo ============================================ >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo 🎯 幸运转盘应用 >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo ============================================ >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo. >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo 🚀 启动服务器... >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo. >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo 访问地址: >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo   用户界面: http://localhost:8080/user >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo   管理界面: http://localhost:8080/admin >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo. >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo 按 Ctrl+C 停止服务器 >> "%PACKAGE_DIR%\启动服务器.bat"
echo echo. >> "%PACKAGE_DIR%\启动服务器.bat"
echo spinner-wheel.exe >> "%PACKAGE_DIR%\启动服务器.bat"
echo pause >> "%PACKAGE_DIR%\启动服务器.bat"

:: 创建不同端口的启动脚本
echo @echo off > "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo echo 🚀 在端口 9000 启动服务器... >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo echo 访问地址: >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo echo   用户界面: http://localhost:9000/user >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo echo   管理界面: http://localhost:9000/admin >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo echo. >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo spinner-wheel.exe -port 9000 >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"
echo pause >> "%PACKAGE_DIR%\启动服务器_9000端口.bat"

:: 创建部署说明
echo │  📄 部署说明.txt
echo ============================================ > "%PACKAGE_DIR%\部署说明.txt"
echo 🎯 幸运转盘应用 - 部署包 >> "%PACKAGE_DIR%\部署说明.txt"
echo ============================================ >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 📦 包内容: >> "%PACKAGE_DIR%\部署说明.txt"
echo   - spinner-wheel.exe     主程序 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - static\               前端资源目录 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - templates\            开发模式模板（可选） >> "%PACKAGE_DIR%\部署说明.txt"
echo   - data\                 数据目录（运行时使用） >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 启动服务器.bat        快速启动脚本 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - config.example.json   配置文件示例 >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 🚀 快速启动: >> "%PACKAGE_DIR%\部署说明.txt"
echo   1. 双击 "启动服务器.bat" >> "%PACKAGE_DIR%\部署说明.txt"
echo   2. 或双击 "spinner-wheel.exe" >> "%PACKAGE_DIR%\部署说明.txt"
echo   3. 打开浏览器访问 http://localhost:8080/user >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 🔧 端口修改: >> "%PACKAGE_DIR%\部署说明.txt"
echo   命令行运行: spinner-wheel.exe -port 9000 >> "%PACKAGE_DIR%\部署说明.txt"
echo   或使用: 启动服务器_9000端口.bat >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 📁 数据文件: >> "%PACKAGE_DIR%\部署说明.txt"
echo   配置文件: data\config.json >> "%PACKAGE_DIR%\部署说明.txt"
echo   历史记录: data\history.json >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 💡 故障排除: >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 如果端口被占用，使用不同端口启动 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 检查防火墙是否阻止程序 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 确保有足够的磁盘空间用于数据文件 >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo ⚠️  重要提示: >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 这是单机版应用，只能在本机访问 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 数据文件自动保存在 data\ 目录 >> "%PACKAGE_DIR%\部署说明.txt"
echo   - 建议定期备份 data\ 目录 >> "%PACKAGE_DIR%\部署说明.txt"
echo. >> "%PACKAGE_DIR%\部署说明.txt"
echo 📅 创建时间: %date% %time% >> "%PACKAGE_DIR%\部署说明.txt"

:: 获取版本信息
echo │  📊 版本信息
echo 版本: 1.0.0 > "%PACKAGE_DIR%\版本信息.txt"
echo 构建时间: %date% %time% >> "%PACKAGE_DIR%\版本信息.txt"
echo. >> "%PACKAGE_DIR%\版本信息.txt"

:: 如果有 README，复制它
if exist "README.md" (
    echo │  📖 README.md
    copy README.md "%PACKAGE_DIR%\"
)

echo ✅ 文件复制完成
echo.

:: 计算包大小
for /f "usebackq" %%A in (`dir "%PACKAGE_DIR%" /s /-c ^| find "个文件"`) do set "file_count=%%A"
for /f "usebackq" %%A in (`dir "%PACKAGE_DIR%" /s /-c ^| find "字节"`) do set "total_size=%%A"

echo 📊 统计信息:
echo    文件数量: %file_count%
echo    总大小: %total_size%
echo.

:: 创建 ZIP 压缩包（如果有 PowerShell）
set /p CREATE_ZIP="是否创建 ZIP 压缩包? (y/N): "
if /i "%CREATE_ZIP%"=="y" (
    echo.
    echo 📦 创建 ZIP 压缩包...
    
    powershell -command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath 'releases\%PACKAGE_NAME%.zip' -Force" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ ZIP 创建成功: releases\%PACKAGE_NAME%.zip
        
        :: 询问是否删除文件夹版本
        set /p DELETE_FOLDER="删除文件夹版本，只保留 ZIP? (y/N): "
        if /i "%DELETE_FOLDER%"=="y" (
            rmdir /s /q "%PACKAGE_DIR%"
            echo ✅ 文件夹版本已删除
        )
    ) else (
        echo ⚠️  ZIP 创建失败，可能是 PowerShell 版本问题
        echo    文件夹版本已创建: %PACKAGE_DIR%
    )
)

echo.
echo ============================================
echo 🎉 部署包创建完成！
echo ============================================
echo.
echo 📍 输出位置:
if exist "releases\%PACKAGE_NAME%.zip" (
    echo    📦 ZIP包: releases\%PACKAGE_NAME%.zip
)
if exist "%PACKAGE_DIR%" (
    echo    📁 文件夹: %PACKAGE_DIR%
)
echo.
echo 📋 使用说明:
echo    1. 将部署包复制到目标机器
echo    2. 解压（如果是ZIP）
echo    3. 双击 "启动服务器.bat"
echo    4. 访问 http://localhost:8080/user
echo.
echo 📚 详细说明请查看包内的 "部署说明.txt"
echo.

pause