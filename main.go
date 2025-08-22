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

func main() {
	// Parse command line flags
	port := flag.String("port", "8080", "Port to run the server on")
	flag.Parse()

	// Ensure data directory exists
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatal("Failed to create data directory:", err)
	}

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
		api.GET("/config", apiHandler.GetConfig)
		api.POST("/config", apiHandler.UpdateConfig)
		api.POST("/spin", apiHandler.Spin)
		api.GET("/history", apiHandler.GetHistory)
		api.POST("/reset", apiHandler.Reset)
	}

	// WebSocket endpoint
	r.GET("/ws", wsHandler.HandleWebSocket)

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