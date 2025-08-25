# 开发者指南 / Developer Guide

## 🏗️ 开发环境设置 / Development Environment Setup

### 必需工具 / Required Tools
- **Go**: 1.21+ (后端开发)
- **Node.js**: 18+ (前端开发) 
- **Git**: 版本控制

### 环境验证 / Environment Verification
```bash
go version          # 应显示 1.21+
node --version      # 应显示 18+
npm --version       # 应显示对应版本
```

## 🔧 项目架构 / Project Architecture

### 后端 (Go + Gin) / Backend
```
├── main.go                 # 程序入口
├── handlers/
│   ├── api.go             # REST API处理器
│   └── websocket.go       # WebSocket处理器
├── models/
│   └── types.go           # 数据模型定义
└── storage/
    └── storage.go         # 数据存储层
```

### 前端 (React + TypeScript) / Frontend  
```
frontend/src/
├── components/
│   ├── Display.tsx        # 页面路由组件
│   ├── SpinnerWheel.tsx   # 转盘组件
│   └── History.tsx        # 历史记录组件
├── pages/
│   ├── User.tsx           # 用户界面
│   ├── Admin.tsx          # 管理界面
│   └── Restaurant.tsx     # 餐厅展示页
└── services/
    ├── api.ts             # API服务
    └── websocket.ts       # WebSocket客户端
```

## 🚀 开发工作流 / Development Workflow

### 1. 首次设置 / First Setup
```bash
# 克隆项目 / Clone project
git clone <repository>
cd SpinnerWheel

# 安装后端依赖 / Install backend dependencies  
go mod tidy

# 安装前端依赖 / Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. 开发模式 / Development Mode
```bash
# 启动后端开发服务器 / Start backend dev server
run.bat
# 或 or: go run .

# 启动前端开发服务器 / Start frontend dev server (新终端 new terminal)
cd frontend  
npm start
```

### 3. 构建测试 / Build Testing
```bash
build.bat           # 完整构建
START.bat          # 测试启动
```

### 4. 代码清理 / Code Cleanup
```bash
clean.bat          # 清理构建文件
```

## 📡 API 接口文档 / API Documentation

### 游戏配置 / Game Configuration
- `GET /api/config` - 获取当前配置
- `POST /api/config` - 更新配置

### 抽奖功能 / Lottery Functions
- `POST /api/spin` - 执行抽奖
- `GET /api/history` - 获取历史记录
- `POST /api/reset` - 重置游戏

### 页面控制 / Page Control
- `POST /api/switch-page` - 切换页面

### 餐厅管理 / Restaurant Management
- `GET /api/restaurant` - 获取餐厅数据
- `POST /api/restaurant/config` - 更新餐厅配置
- `POST /api/restaurant/menu/:id` - 更新菜单项
- `POST /api/restaurant/advertisement` - 上传广告
- `POST /api/restaurant/recommendation` - 添加推荐

### WebSocket 事件 / WebSocket Events
- `config_updated` - 配置更新
- `spin_started` - 开始抽奖
- `spin_completed` - 抽奖完成
- `page_switched` - 页面切换

## 🧪 测试指南 / Testing Guide

### 功能测试 / Functional Testing
```bash
# 测试构建 / Test build
build.bat

# 测试启动 / Test startup  
START.bat

# 访问测试 / Access testing
# http://localhost:8080/user
# http://localhost:8080/admin
```

### API 测试 / API Testing
```bash
# 获取配置 / Get config
curl http://localhost:8080/api/config

# 切换页面 / Switch page
curl -X POST -H "Content-Type: application/json" \
     -d '{"page":"advertisement"}' \
     http://localhost:8080/api/switch-page
```

## 🐛 调试技巧 / Debugging Tips

### 后端调试 / Backend Debugging
```bash
# 启用详细日志 / Enable verbose logging
go run . -verbose

# 检查端口占用 / Check port usage
netstat -ano | findstr :8080
```

### 前端调试 / Frontend Debugging
```bash
# 开发服务器 / Development server
cd frontend
npm start

# 构建调试 / Build debugging
npm run build
```

### 数据文件检查 / Data File Inspection
- `data/config.json` - 游戏配置
- `data/history.json` - 抽奖历史
- `data/restaurant.json` - 餐厅数据

## 📦 部署构建 / Deployment Build

### 本地构建 / Local Build
```bash
build.bat          # 完整构建
package.bat        # 创建部署包
```

### 构建产物 / Build Artifacts
- `spinner-wheel.exe` - 主程序
- `static/` - 前端资源
- `data/` - 数据目录

## 🔒 安全注意事项 / Security Notes

- 仅本地访问，不开放外网端口
- 数据文件定期备份
- 密钥配置使用环境变量
- 上传文件类型验证

## 🤝 贡献指南 / Contribution Guidelines

1. Fork 项目 / Fork the project
2. 创建功能分支 / Create feature branch
3. 提交更改 / Commit changes
4. 推送分支 / Push to branch  
5. 创建 Pull Request

## 📚 技术文档 / Technical Documentation

### 依赖项 / Dependencies
- **后端**: Gin, Gorilla WebSocket
- **前端**: React 19, TypeScript, styled-components
- **构建**: Go modules, npm

### 配置文件 / Configuration Files
- `go.mod` - Go模块定义
- `frontend/package.json` - NPM包定义
- `frontend/tsconfig.json` - TypeScript配置

---

**维护者**: Claude Code Assistant  
**最后更新**: 2025-08-24