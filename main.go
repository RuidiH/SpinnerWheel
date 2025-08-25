package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"spinner-wheel/handlers"
	"spinner-wheel/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// createBasicTemplates creates basic HTML template files if they don't exist
func createBasicTemplates() {
	templatesDir := "templates"
	
	// Ensure templates directory exists
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		log.Printf("Warning: Failed to create templates directory: %v", err)
		return
	}
	
	// Basic user template
	userTemplate := `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>幸运转盘 - 用户界面</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0; }
        .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); display: inline-block; }
        .wheel { width: 200px; height: 200px; border: 5px solid white; border-radius: 50%; margin: 20px auto; background: conic-gradient(#ff6b6b 0deg 30deg, #4ecdc4 30deg 60deg, #45b7d1 60deg 90deg, #96ceb4 90deg 120deg, #feca57 120deg 150deg, #ff9ff3 150deg 180deg, #54a0ff 180deg 210deg, #5f27cd 210deg 240deg, #00d2d3 240deg 270deg, #ff9f43 270deg 300deg, #ee5a52 300deg 330deg, #0abde3 330deg 360deg); }
        .warning { background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 幸运转盘 - 用户界面</h1>
        <div class="wheel"></div>
        <p>当前玩家: <strong>1</strong> | 剩余次数: <strong>--</strong></p>
        <div class="warning">
            <h3>⚠️ 开发模式</h3>
            <p>这是简化版本。要获得完整功能，请运行 <code>build.bat</code></p>
        </div>
        <p><a href="/admin" style="color: #ffc107;">管理界面</a></p>
    </div>
</body>
</html>`

	// Basic admin template  
	adminTemplate := `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>幸运转盘 - 管理界面</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; min-height: 100vh; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); }
        .warning { background: rgba(255, 193, 7, 0.2); border: 1px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .section { background: rgba(255,255,255,0.05); padding: 20px; margin: 20px 0; border-radius: 10px; }
        button { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin: 5px; opacity: 0.6; cursor: not-allowed; }
        input, select { width: 100%; padding: 8px; margin: 5px 0; border: none; border-radius: 5px; background: rgba(255,255,255,0.1); color: white; opacity: 0.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ 幸运转盘 - 管理界面</h1>
        <div class="warning">
            <h3>⚠️ 开发模式</h3>
            <p>这是简化版本，无实际功能。要获得完整管理功能，请运行 <code>build.bat</code></p>
        </div>
        <div class="section">
            <h3>游戏模式</h3>
            <select disabled><option>模式 1: 自定义选项</option></select>
        </div>
        <div class="section">
            <h3>玩家设置</h3>
            <input type="number" placeholder="当前玩家" disabled>
            <input type="number" placeholder="剩余次数" disabled>
        </div>
        <div class="section">
            <button disabled>保存配置</button>
            <button disabled>重置游戏</button>
        </div>
        <p style="text-align: center;"><a href="/user" style="color: #3498db;">返回用户界面</a></p>
    </div>
</body>
</html>`

	// Create user.html if it doesn't exist
	userPath := filepath.Join(templatesDir, "user.html")
	if _, err := os.Stat(userPath); os.IsNotExist(err) {
		if err := os.WriteFile(userPath, []byte(userTemplate), 0644); err != nil {
			log.Printf("Warning: Failed to create user.html: %v", err)
		} else {
			fmt.Println("自动创建: templates/user.html")
		}
	}

	// Create admin.html if it doesn't exist
	adminPath := filepath.Join(templatesDir, "admin.html")
	if _, err := os.Stat(adminPath); os.IsNotExist(err) {
		if err := os.WriteFile(adminPath, []byte(adminTemplate), 0644); err != nil {
			log.Printf("Warning: Failed to create admin.html: %v", err)
		} else {
			fmt.Println("自动创建: templates/admin.html")
		}
	}
}

func main() {
	// Parse command line flags
	port := flag.String("port", "8080", "Port to run the server on")
	flag.Parse()

	// Ensure data directory exists
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatal("Failed to create data directory:", err)
	}

	// Create basic templates if they don't exist
	createBasicTemplates()

	// Initialize storage
	store, err := storage.New("data")
	if err != nil {
		log.Fatal("Failed to initialize storage:", err)
	}

	// Initialize Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	
	// Load HTML templates early for development mode
	if _, err := os.Stat("templates"); err == nil {
		r.LoadHTMLGlob("templates/*")
		fmt.Println("开发模式: 加载HTML模板")
	}

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Initialize handlers
	apiHandler := handlers.NewAPIHandler(store)
	wsHandler := handlers.NewWebSocketHandler()

	// API routes
	api := r.Group("/api")
	{
		// Game configuration
		api.GET("/config", apiHandler.GetConfig)
		api.POST("/config", apiHandler.UpdateConfig)
		api.POST("/spin", apiHandler.Spin)
		api.GET("/history", apiHandler.GetHistory)
		api.POST("/reset", apiHandler.Reset)
		
		// Page management
		api.POST("/switch-page", apiHandler.SwitchPage)
		
		// Restaurant data management
		api.GET("/restaurant", apiHandler.GetRestaurantData)
		api.POST("/restaurant/config", apiHandler.UpdateRestaurantConfig)
		
		// Advertisement management
		api.POST("/advertisements", apiHandler.UploadAdvertisement)
		api.DELETE("/advertisements/:id", apiHandler.DeleteAdvertisement)
		
		// Menu management
		api.PUT("/menu/:id", apiHandler.UpdateMenuItem)
		
		// Recommendations management
		api.POST("/recommendations", apiHandler.AddRecommendation)
		api.PUT("/recommendations/:id", apiHandler.UpdateRecommendation)
		api.DELETE("/recommendations/:id", apiHandler.DeleteRecommendation)
	}

	// WebSocket endpoint
	r.GET("/ws", wsHandler.HandleWebSocket)

	// Serve uploaded advertisement images
	r.Static("/uploads", "data/uploads")

	// Serve static files (React app will be built here)
	staticPath := "static"
	if _, err := os.Stat(staticPath); err == nil {
		fmt.Println("生产模式: 使用React构建文件")
		// Serve the nested static files from React build
		r.Static("/static", filepath.Join(staticPath, "static"))
		// Serve other files directly from static directory
		r.StaticFile("/manifest.json", filepath.Join(staticPath, "manifest.json"))
		r.StaticFile("/favicon.ico", filepath.Join(staticPath, "favicon.ico"))
		r.StaticFile("/robots.txt", filepath.Join(staticPath, "robots.txt"))
		// Serve index.html for all routes
		r.StaticFile("/", filepath.Join(staticPath, "index.html"))
		r.StaticFile("/user", filepath.Join(staticPath, "index.html"))
		r.StaticFile("/admin", filepath.Join(staticPath, "index.html"))
	} else {
		fmt.Println("开发模式: 使用HTML模板")
		// Development mode - serve simple placeholder pages
		r.GET("/", func(c *gin.Context) {
			c.Redirect(http.StatusFound, "/user")
		})
		
		// Check if templates are available before defining HTML routes
		if _, err := os.Stat("templates"); err == nil {
			r.GET("/user", func(c *gin.Context) {
				c.HTML(http.StatusOK, "user.html", nil)
			})
			r.GET("/admin", func(c *gin.Context) {
				c.HTML(http.StatusOK, "admin.html", nil)
			})
		} else {
			// Fallback to JSON responses if no templates
			fmt.Println("警告: 未找到templates目录，使用JSON响应")
			r.GET("/user", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "开发模式 - 用户界面",
					"note": "请运行 build.bat 构建完整版本",
					"admin": "/admin",
				})
			})
			r.GET("/admin", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "开发模式 - 管理界面", 
					"note": "请运行 build.bat 构建完整版本",
					"user": "/user",
				})
			})
		}
	}

	// Connect WebSocket to API handlers for broadcasting
	apiHandler.SetWebSocketHandler(wsHandler)

	fmt.Printf("服务器启动在端口 %s\n", *port)
	fmt.Printf("用户界面: http://localhost:%s/user\n", *port)
	fmt.Printf("管理界面: http://localhost:%s/admin\n", *port)

	log.Fatal(r.Run(":" + *port))
}