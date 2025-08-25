# 幸运转盘抽奖系统 / Spinner Wheel Lottery System

一个支持实时更新的网页转盘抽奖应用，具备三页面切换、管理员配置和餐厅广告展示功能。

A real-time web-based spinner wheel lottery application with three-page system, admin configuration, and restaurant advertisement display.

## 🚀 快速开始 / Quick Start

### 简单三步启动 / Simple 3-Step Start

1. **首次构建 / First Build**
   ```bash
   # 双击或运行 / Double-click or run
   build.bat
   ```

2. **启动应用 / Start Application** 
   ```bash
   # 双击或运行 / Double-click or run
   START.bat
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
├── START.bat           # 一键启动脚本
├── build.bat          # 构建脚本  
├── clean.bat          # 清理脚本
├── main.go            # 后端入口
├── frontend/          # React前端源码
├── handlers/          # API处理器
├── models/           # 数据模型
├── storage/          # 数据存储
└── data/             # 运行时数据文件
```

## 🔧 系统要求 / System Requirements

- Windows 10/11
- 首次构建需要: Go 1.21+ 和 Node.js 18+
- 生产运行只需要生成的exe文件

## 📖 常用操作 / Common Operations

### 开发模式 / Development Mode
```bash
run.bat              # 开发服务器
clean.bat           # 清理构建文件
```

### 生产部署 / Production Deployment  
```bash
package.bat         # 创建部署包
```

## 🛠️ 故障排除 / Troubleshooting

### 端口被占用 / Port in Use
- 关闭其他使用8080端口的程序
- 或使用: `spinner-wheel.exe -port 9000`

### 构建失败 / Build Failed
- 检查网络连接
- 删除 `frontend\node_modules` 重新构建
- 确保 Node.js 版本 18+

### 数据丢失 / Data Loss
- 数据自动保存在 `data/` 目录
- 建议定期备份此目录

## 📚 更多文档 / More Documentation

- `DEVELOPMENT.md` - 开发者指南
- `DEPLOYMENT.md` - 部署指南  
- `feedback.txt` - 客户反馈记录

---

**技术栈**: Go + Gin + React + TypeScript + WebSocket  
**版本**: v1.0.0  
**开发**: Claude Code Assistant