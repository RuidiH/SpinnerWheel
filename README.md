# 幸运转盘抽奖系统 / Spinner Wheel Lottery System

一个支持实时更新的网页转盘抽奖应用，具备三页面切换、管理员配置和餐厅广告展示功能。

A real-time web-based spinner wheel lottery application with three-page system, admin configuration, and restaurant advertisement display.

## 🚀 快速开始 / Quick Start

### 简单三步启动 / Simple 3-Step Start

1. **首次构建 / First Build**
   ```bash
   # 双击或运行 / Double-click or run
   scripts/build.bat
   ```

2. **启动应用 / Start Application** 
   ```bash
   # 双击或运行 / Double-click or run
   scripts/START.bat
   ```

3. **打开浏览器 / Open Browser**
   - 用户界面 User: http://localhost:8080/user
   - 管理界面 Admin: http://localhost:8080/admin

## 🎯 系统功能 / System Features

### 三页面系统 / Three-Page System
- **抽奖模式1** - 自定义12个奖品和概率
- **抽奖模式2** - 固定5%中奖率模式  
- **广告展示页** - 餐厅菜单、推荐和广告轮播

### 实时控制 / Real-Time Control
- 后台页面切换控制
- 数字键盘1+2+3组合触发抽奖
- WebSocket实时同步所有界面

### 餐厅管理 / Restaurant Management
- 30项菜单管理
- 今日推荐设置
- 广告图片轮播

## 📁 项目结构 / Project Structure

```
SpinnerWheel/
├── main.go                # 后端入口
├── handlers/              # API处理器
├── models/               # 数据模型
├── storage/              # 数据存储
├── frontend/             # React前端源码
├── static/              # 生产构建文件
├── data/                # 运行时数据文件
├── scripts/             # 构建和启动脚本
│   ├── build.bat        # 构建脚本
│   └── START.bat        # 一键启动脚本
├── docs/               # 项目文档
│   ├── DEVELOPMENT.md   # 开发指南
│   └── DEPLOYMENT.md    # 部署指南
└── examples/           # 配置示例
    └── config.example.json
```

## 🔧 系统要求 / System Requirements

- Windows 10/11
- 首次构建需要: Go 1.21+ 和 Node.js 18+
- 生产运行只需要生成的exe文件

## 🌐 离线部署 / Offline Deployment

**适用于网络受限环境 / For Network-Restricted Environments**

此项目包含所有Go依赖的本地副本，支持完全离线构建和部署。
This project includes local copies of all Go dependencies for complete offline build and deployment.

### 离线构建 / Offline Build

#### Windows 用户 / Windows Users
```cmd
# 使用完整构建脚本 (推荐) / Use complete build script (recommended)
scripts\build.bat        # 自动检测并使用vendor模式 / Auto-detects and uses vendor mode

# 或仅构建Go应用 / Or build Go application only  
npm run build:exe        # 自动检测vendor并选择模式 / Auto-detects vendor and chooses mode
```

#### Linux/Mac 用户 / Linux/Mac Users  
```bash
# 完整构建 / Complete build
scripts/build.bat         # Cross-platform compatible

# 仅构建Go应用 / Go application only
npm run build:exe         # 自动检测vendor并选择模式 / Auto-detects vendor and chooses mode
```

**预期输出 / Expected Output:**
```
> npm run build:exe
Using vendor mode...
✓ Build completed successfully! Created: spinner-wheel.exe
```

### 网络问题解决方案 / Network Issues Solutions

#### 1. 使用备用Go代理 / Alternative Go Proxies
```bash
# 中国用户 / For China users
set GOPROXY=https://goproxy.cn,direct

# 其他地区 / Other regions  
set GOPROXY=https://goproxy.io,direct
set GOPROXY=https://athens.azurefd.net,direct

# 然后重新下载依赖 / Then re-download dependencies
go mod download
```

#### 2. 完全离线模式 / Complete Offline Mode
如果vendor目录存在，构建脚本将自动使用离线模式，无需网络连接。
If vendor directory exists, build scripts automatically use offline mode with no network required.

**验证步骤 / Verification Steps:**
```bash
# 1. 检查vendor目录是否存在 / Check if vendor directory exists
ls vendor/ | head -5    # 应显示依赖包 / Should show dependency packages

# 2. 验证离线构建 / Verify offline build  
go build -mod=vendor -o test-offline.exe

# 3. 测试可执行文件 / Test executable
./test-offline.exe      # 应正常启动服务器 / Should start server normally
```

#### 3. 手动创建vendor / Manual Vendor Creation
如果需要重新创建vendor目录：
If you need to recreate the vendor directory:

```bash
go mod vendor      # 下载并创建vendor目录 / Download and create vendor directory
go mod verify      # 验证依赖完整性 / Verify dependencies integrity
```

### 依赖信息 / Dependencies Info
- **Vendor目录大小 / Vendor Size**: ~33MB
- **主要依赖 / Main Dependencies**: 
  - Gin Web框架 / Gin Web Framework
  - WebSocket支持 / WebSocket Support  
  - CORS中间件 / CORS Middleware
- **离线兼容性 / Offline Compatibility**: ✅ 完全支持 / Fully Supported

### 离线部署故障排除 / Offline Deployment Troubleshooting

**问题1: 构建脚本出错 / Issue 1: Build script errors**
```bash
# 检查vendor目录 / Check vendor directory
dir vendor      # Windows
ls vendor/      # Linux/Mac

# 如果vendor不存在，重新创建 / If vendor missing, recreate
go mod vendor
```

**问题2: 权限错误 / Issue 2: Permission errors**
```bash
# Windows: 以管理员运行 / Run as administrator
# Linux/Mac: 检查权限 / Check permissions
chmod +x scripts/build.bat
```

**问题3: 路径问题 / Issue 3: Path issues**
```bash
# 确保从项目根目录运行 / Ensure running from project root
cd SpinnerWheel
scripts/build.bat    # Use forward slashes on Linux/Mac
scripts\build.bat    # Use backslashes on Windows
```

## 📖 常用操作 / Common Operations

### 开发模式 / Development Mode
```bash
npm run dev          # 开发服务器 (推荐)
npm run dev:backend  # 仅后端服务器
npm run dev:frontend # 仅前端服务器 (端口3000)
npm run clean        # 清理构建文件
```

> 💡 **开发提示**: 开发时访问 `http://localhost:3000` 可实现热重载，API自动代理到8080端口  
> 💡 **Dev Tip**: Access `http://localhost:3000` during development for hot reload, API calls auto-proxy to port 8080

### 生产部署 / Production Deployment  
```bash
npm run build:full  # 完整构建 (前端+后端)
npm run start        # 启动生产服务器
```

## 🛠️ 故障排除 / Troubleshooting

### 端口被占用 / Port in Use
- 关闭其他使用8080端口的程序
- 或使用: `spinner-wheel.exe -port 9000`

### 构建失败 / Build Failed
- **Go依赖问题**: 项目已包含vendor目录，支持离线构建
- **网络限制**: 使用 `go build -mod=vendor` 进行离线构建
- **前端构建**: 删除 `frontend\node_modules` 重新构建
- 确保 Node.js 版本 18+
- 尝试使用替代Go代理 (见离线部署章节)

### 数据丢失 / Data Loss
- 数据自动保存在 `data/` 目录
- 建议定期备份此目录

## 🎨 自定义背景 / Customizing Background

### 更换背景图片 / Changing Background Image

应用程序使用 `bg.png` 作为背景图片。要更换背景，请按以下步骤操作：
The application uses `bg.png` as the background image. To change the background, follow these steps:

#### 开发模式 / Development Mode
1. **替换图片文件 / Replace Image File**
   ```bash
   # 将新背景图片复制到public目录 / Copy new background to public directory
   cp your-new-background.png frontend/public/bg.png
   ```

2. **重新构建前端 / Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   cp -r build/* ../static/
   ```

#### 生产环境 / Production Environment
```bash
# 1. 替换静态目录中的背景 / Replace background in static directory
cp your-new-background.png static/bg.png

# 2. 如需修改CSS属性，编辑App.tsx / To modify CSS properties, edit App.tsx
# 文件位置 / File location: frontend/src/App.tsx
```

### 背景样式配置 / Background Style Configuration

在 `frontend/src/App.tsx` 中的 AppContainer 样式：
Background styles in `frontend/src/App.tsx` AppContainer:

```typescript
const AppContainer = styled.div`
  min-height: 100vh;
  background-image: url('/bg.png');
  background-size: cover;           // 覆盖整个屏幕 / Cover entire screen
  background-repeat: no-repeat;     // 不重复 / No repeat
  background-position: center;      // 居中 / Centered
  background-attachment: fixed;     // 固定背景 / Fixed background
  
  /* 备用颜色 / Fallback color */
  background-color: #DC143C;
`;
```

### 背景图片建议 / Background Image Recommendations

- **格式 / Format**: PNG, JPG (PNG推荐，支持透明度)
- **尺寸 / Size**: 1920x1080 或更高分辨率
- **文件大小 / File Size**: 建议小于2MB以提升加载速度
- **颜色主题 / Color Theme**: 中国红主题配金色元素 / Chinese red with golden elements

### 背景属性说明 / Background Property Options

```css
/* 不同的背景填充方式 / Different background fill options */
background-size: cover;      /* 覆盖 - 填满容器 / Cover - fill container */
background-size: contain;    /* 包含 - 完整显示图片 / Contain - show full image */
background-size: 100% 100%;  /* 拉伸 - 可能变形 / Stretch - may distort */

/* 背景重复方式 / Background repeat options */
background-repeat: no-repeat;   /* 不重复 / No repeat */
background-repeat: repeat;      /* 平铺重复 / Tile repeat */
background-repeat: repeat-x;    /* 水平重复 / Horizontal repeat */
background-repeat: repeat-y;    /* 垂直重复 / Vertical repeat */
```

## 📚 更多文档 / More Documentation

- `docs/DEVELOPMENT.md` - 开发者指南
- `docs/DEPLOYMENT.md` - 部署指南
- `docs/CLEANUP.md` - 项目结构清理记录

---

**技术栈**: Go + Gin + React + TypeScript + WebSocket  
**版本**: v1.0.0  
**开发**: Claude Code Assistant