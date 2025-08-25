# 部署指南 / Deployment Guide

## 🎯 部署方式选择 / Deployment Options

### 方式一: 一键部署 (推荐) / Option 1: One-Click Deployment (Recommended)
适合最终用户，无需开发环境

### 方式二: 源码构建部署 / Option 2: Source Build Deployment  
适合开发者和需要自定义的场景

## 🚀 方式一: 一键部署 / Option 1: One-Click Deployment

### 步骤 / Steps

1. **获取部署包**
   - 运行 `package.bat` 创建部署包
   - 或下载预构建的ZIP文件

2. **部署到目标机器**
   ```
   解压部署包到目标目录，例如:
   C:\SpinnerWheel\
   ├── spinner-wheel.exe
   ├── START.bat
   ├── static\
   └── data\ (空目录)
   ```

3. **启动应用**
   ```bash
   # 双击启动
   START.bat
   
   # 或命令行启动
   spinner-wheel.exe
   ```

4. **访问应用**
   - 用户界面: http://localhost:8080/user
   - 管理界面: http://localhost:8080/admin

### 部署包内容 / Package Contents
```
SpinnerWheel_Release_YYYYMMDD_HHMMSS/
├── spinner-wheel.exe              # 主程序
├── Start_Server.bat              # 启动脚本 (默认端口8080)  
├── Start_Server_Port_9000.bat    # 启动脚本 (端口9000)
├── static\                       # 前端资源文件
├── data\                         # 数据目录 (空)
├── Deployment_Instructions.txt   # 部署说明
├── Version_Info.txt              # 版本信息
└── README.md                     # 项目说明
```

## 🔧 方式二: 源码构建部署 / Option 2: Source Build Deployment

### 环境要求 / Requirements
- Windows 10/11
- Go 1.21+
- Node.js 18+
- Git (可选)

### 构建步骤 / Build Steps

1. **获取源码**
   ```bash
   git clone <repository>
   cd SpinnerWheel
   ```

2. **构建应用**
   ```bash
   build.bat
   ```

3. **验证构建**
   ```bash
   START.bat
   ```

4. **创建部署包**
   ```bash  
   package.bat
   ```

## 🌐 网络配置 / Network Configuration

### 端口设置 / Port Configuration

**默认端口**: 8080

**自定义端口**:
```bash
spinner-wheel.exe -port 9000
```

**防火墙设置**:
- Windows Defender会提示允许访问
- 选择"允许访问"以正常使用

### 局域网访问 / LAN Access
```bash
# 获取本机IP
ipconfig

# 局域网访问地址
http://192.168.x.x:8080/user
http://192.168.x.x:8080/admin
```

## 📁 文件结构 / File Structure

### 生产环境 / Production Environment
```
SpinnerWheel/
├── spinner-wheel.exe      # 主程序 (必需)
├── START.bat             # 启动脚本 (可选)
├── static\               # 前端资源 (必需)
│   ├── index.html
│   ├── static\js\
│   └── static\css\
└── data\                 # 数据目录 (运行时创建)
    ├── config.json       # 游戏配置
    ├── history.json      # 抽奖历史  
    └── restaurant.json   # 餐厅数据
```

### 可选文件 / Optional Files
- `README.md` - 项目说明
- `config.example.json` - 配置示例
- 启动脚本的其他端口版本

## 🔄 升级部署 / Upgrade Deployment

### 升级步骤 / Upgrade Steps

1. **备份数据**
   ```bash
   # 备份data目录
   xcopy /E /Y data data_backup
   ```

2. **停止服务**
   - Ctrl+C 停止正在运行的服务器
   - 或关闭命令行窗口

3. **替换文件**
   ```bash
   # 替换主程序和静态文件
   spinner-wheel.exe  (新版本)
   static\            (新版本)
   ```

4. **重启服务**
   ```bash
   START.bat
   ```

5. **验证功能**
   - 检查所有功能正常
   - 确认数据完整性

## 🛠️ 故障排除 / Troubleshooting

### 常见问题 / Common Issues

**1. 端口被占用**
```
错误: listen tcp :8080: bind: address already in use
解决: 
- 使用不同端口: spinner-wheel.exe -port 9000
- 或找到占用进程: netstat -ano | findstr :8080
```

**2. 静态文件404**
```
错误: 网页显示空白或404错误
解决:
- 检查static目录是否存在
- 重新运行build.bat构建
```

**3. WebSocket连接失败**
```
错误: 实时更新不工作
解决:
- 检查防火墙设置
- 确认程序有网络访问权限
```

**4. 数据文件损坏**
```
错误: 配置丢失或历史记录异常
解决:
- 删除data目录，程序会重新创建默认配置
- 或从备份恢复data目录
```

## 🔐 安全配置 / Security Configuration

### 访问控制 / Access Control
- 仅绑定本地地址 (127.0.0.1)
- 不开放外网访问
- 管理界面无密码保护 (内部使用)

### 数据安全 / Data Security
- 定期备份data目录
- 避免在data目录存储敏感信息
- 上传的图片文件自动重命名

## 📊 性能监控 / Performance Monitoring

### 资源使用 / Resource Usage
- 内存占用: ~20-50MB
- CPU占用: 空闲时<1%
- 磁盘占用: ~30MB + 数据文件

### 性能优化 / Performance Optimization
- 使用生产构建 (已优化)
- 静态文件压缩 (已启用)
- WebSocket连接池管理 (自动)

## 🔧 高级配置 / Advanced Configuration

### 环境变量 / Environment Variables
```bash
set PORT=9000                    # 自定义端口
set DATA_DIR=C:\CustomPath\data  # 自定义数据目录
```

### 命令行参数 / Command Line Arguments
```bash
spinner-wheel.exe -port 9000 -data ./custom_data
```

## 📋 部署检查清单 / Deployment Checklist

- [ ] 目标机器满足系统要求
- [ ] 主程序文件存在且可执行
- [ ] static目录完整复制
- [ ] 端口8080可用或已配置其他端口
- [ ] 防火墙允许程序访问网络
- [ ] 用户界面可正常访问
- [ ] 管理界面可正常访问
- [ ] WebSocket实时更新功能正常
- [ ] 抽奖功能测试通过
- [ ] 页面切换功能正常
- [ ] 数据文件自动创建

---

**联系支持**: 如遇问题请查看 `feedback.txt` 或开发文档  
**版本**: v1.0.0  
**最后更新**: 2025-08-24