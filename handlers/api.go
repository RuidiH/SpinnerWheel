package handlers

import (
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"spinner-wheel/models"
	"spinner-wheel/storage"

	"github.com/gin-gonic/gin"
)

// APIHandler handles all API requests
type APIHandler struct {
	storage    *storage.Storage
	spinMutex  sync.Mutex
	wsHandler  *WebSocketHandler
}

// NewAPIHandler creates a new API handler
func NewAPIHandler(store *storage.Storage) *APIHandler {
	return &APIHandler{
		storage: store,
	}
}

// SetWebSocketHandler sets the WebSocket handler for broadcasting
func (h *APIHandler) SetWebSocketHandler(ws *WebSocketHandler) {
	h.wsHandler = ws
}

// GetConfig returns the current game configuration
func (h *APIHandler) GetConfig(c *gin.Context) {
	config, err := h.storage.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get config: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, config)
}

// UpdateConfig updates the game configuration
func (h *APIHandler) UpdateConfig(c *gin.Context) {
	var updateReq models.ConfigUpdateRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Get current config
	config, err := h.storage.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get current config: " + err.Error()})
		return
	}

	// Update fields if provided
	if updateReq.Mode != nil {
		config.Mode = *updateReq.Mode
	}
	if updateReq.Mode1Options != nil {
		config.Mode1Options = updateReq.Mode1Options
	}
	if updateReq.CurrentPlayer != nil {
		config.CurrentPlayer = *updateReq.CurrentPlayer
	}
	if updateReq.RemainingSpins != nil {
		config.RemainingSpins = *updateReq.RemainingSpins
	}

	// Save updated config
	if err := h.storage.SaveConfig(config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to save config: " + err.Error()})
		return
	}

	// Broadcast config update
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "config_updated",
			Data: config,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, config)
}

// Spin handles spin requests
func (h *APIHandler) Spin(c *gin.Context) {
	// Prevent concurrent spins
	h.spinMutex.Lock()
	defer h.spinMutex.Unlock()

	// Get current config
	config, err := h.storage.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get config: " + err.Error()})
		return
	}

	// Check if spins remaining
	if config.RemainingSpins <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No spins remaining"})
		return
	}

	// Broadcast spin started
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "spin_started",
			Data: gin.H{"player": config.CurrentPlayer},
		})
	}

	// Determine winning segment
	var winningIndex int
	var winningPrize string

	if config.Mode == 1 {
		// Mode 1: Use probabilities
		winningIndex, winningPrize = h.spinMode1(config.Mode1Options)
	} else {
		// Mode 2: Simple 5% win rate
		winningIndex, winningPrize = h.spinMode2()
	}

	// Create spin result
	result := models.SpinResult{
		Player:    config.CurrentPlayer,
		Prize:     winningPrize,
		Index:     winningIndex,
		Timestamp: time.Now(),
		Mode:      config.Mode,
	}

	// Add to history
	if err := h.storage.AddSpinResult(result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save result: " + err.Error()})
		return
	}

	// Update config (decrement spins, increment total)
	config.RemainingSpins--
	config.TotalSpins++
	if err := h.storage.SaveConfig(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update config: " + err.Error()})
		return
	}

	// Broadcast spin completed
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "spin_completed",
			Data: gin.H{
				"result": result,
				"config": config,
			},
		})
	}

	// Check if auto-switch to advertisement page is enabled
	go h.handleAutoSwitchAfterSpin(config)

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, gin.H{
		"result": result,
		"config": config,
	})
}

// GetHistory returns the spin history
func (h *APIHandler) GetHistory(c *gin.Context) {
	history, err := h.storage.GetHistory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get history: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, history)
}

// Reset resets the game state
func (h *APIHandler) Reset(c *gin.Context) {
	if err := h.storage.ResetGame(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset game: " + err.Error()})
		return
	}

	// Get updated config
	config, err := h.storage.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get config after reset: " + err.Error()})
		return
	}

	// Broadcast state updated
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "state_updated",
			Data: config,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, gin.H{"message": "Game reset successfully", "config": config})
}

// spinMode1 handles mode 1 spinning logic (weighted random)
func (h *APIHandler) spinMode1(options []models.PrizeOption) (int, string) {
	// Create cumulative probability array
	cumulative := make([]float64, len(options))
	total := 0.0
	
	for i, option := range options {
		total += option.Probability
		cumulative[i] = total
	}

	// Generate random number between 0 and total
	random := rand.Float64() * total

	// Find which segment the random number falls into
	for i, threshold := range cumulative {
		if random <= threshold {
			return i, options[i].Text
		}
	}

	// Fallback (should never happen)
	return 0, options[0].Text
}

// spinMode2 handles mode 2 spinning logic (fixed 5% win rate)
func (h *APIHandler) spinMode2() (int, string) {
	// 5% chance to win
	if rand.Float64() < 0.05 {
		// Winner! Place at random winning position
		winIndex := rand.Intn(12) // Any of the 12 segments can be winner
		return winIndex, "中奖了!"
	}

	// No win - place at random non-winning position
	loseIndex := rand.Intn(12)
	return loseIndex, "没中奖"
}

// handleAutoSwitchAfterSpin handles automatic page switching after spin completion
func (h *APIHandler) handleAutoSwitchAfterSpin(config *models.GameConfig) {
	// Get restaurant configuration to check if auto-switch is enabled
	restaurantData, err := h.storage.GetRestaurantData()
	if err != nil {
		return // Silently fail - don't interrupt main flow
	}

	// Check if auto-switch is enabled
	if !restaurantData.Config.EnableAutoSwitch {
		return
	}

	// Wait for the spin animation to complete (about 8 seconds total)
	// This allows users to see the result before switching
	time.Sleep(8 * time.Second)

	// Switch to advertisement page
	config.CurrentPage = "advertisement"
	
	// Save the updated config
	if err := h.storage.SaveConfig(config); err != nil {
		return // Silently fail
	}

	// Broadcast the page switch
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "page_switched",
			Data: gin.H{
				"page":   "advertisement",
				"config": config,
				"auto":   true, // Indicate this was an automatic switch
			},
		})
	}

	// Wait for the configured advertisement time, then switch back to the lottery page
	autoSwitchTime := time.Duration(restaurantData.Config.AutoSwitchTime) * time.Second
	if autoSwitchTime > 0 {
		time.Sleep(autoSwitchTime)
		
		// Determine which lottery page to return to based on current mode
		returnPage := "lottery1"
		if config.Mode == 2 {
			returnPage = "lottery2"
		}
		
		config.CurrentPage = returnPage
		
		// Ensure mode is synchronized with page (defensive programming)
		if returnPage == "lottery1" && config.Mode != 1 {
			config.Mode = 1
		} else if returnPage == "lottery2" && config.Mode != 2 {
			config.Mode = 2
		}
		
		// Save the updated config
		if err := h.storage.SaveConfig(config); err != nil {
			return // Silently fail
		}

		// Broadcast the return to lottery page
		if h.wsHandler != nil {
			h.wsHandler.Broadcast(models.WebSocketMessage{
				Type: "page_switched",
				Data: gin.H{
					"page":   returnPage,
					"config": config,
					"auto":   true, // Indicate this was an automatic switch
				},
			})
		}
	}
}

// Restaurant and Page Management API Endpoints

// SwitchPage switches the current display page
func (h *APIHandler) SwitchPage(c *gin.Context) {
	var request models.PageSwitchRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if err := request.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page: " + err.Error()})
		return
	}

	// Get current config
	config, err := h.storage.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get config: " + err.Error()})
		return
	}

	// Update current page
	config.CurrentPage = request.Page

	// Synchronize mode with page for consistency
	if request.Page == "lottery1" && config.Mode != 1 {
		config.Mode = 1
	} else if request.Page == "lottery2" && config.Mode != 2 {
		config.Mode = 2
	}

	// Save updated config
	if err := h.storage.SaveConfig(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save config: " + err.Error()})
		return
	}

	// Broadcast page change
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "page_switched",
			Data: gin.H{
				"page":   request.Page,
				"config": config,
			},
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, gin.H{"message": "Page switched successfully", "page": request.Page})
}

// GetRestaurantData returns restaurant configuration and data
func (h *APIHandler) GetRestaurantData(c *gin.Context) {
	data, err := h.storage.GetRestaurantData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get restaurant data: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, data)
}

// UpdateRestaurantConfig updates restaurant configuration
func (h *APIHandler) UpdateRestaurantConfig(c *gin.Context) {
	var config models.RestaurantConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Get current restaurant data
	data, err := h.storage.GetRestaurantData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get restaurant data: " + err.Error()})
		return
	}

	// Update config
	data.Config = config

	// Save updated data
	if err := h.storage.SaveRestaurantData(data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save restaurant config: " + err.Error()})
		return
	}

	// Broadcast restaurant config update
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "restaurant_config_updated",
			Data: config,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, config)
}

// UploadAdvertisement handles advertisement image upload
func (h *APIHandler) UploadAdvertisement(c *gin.Context) {
	// Get file from form
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get image file: " + err.Error()})
		return
	}
	defer file.Close()

	// Validate file type
	if !isValidImageFile(header) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, and GIF are allowed."})
		return
	}

	// Generate unique filename
	filename := generateUniqueFilename(header.Filename)
	uploadsPath := h.storage.GetUploadsPath()
	filePath := filepath.Join(uploadsPath, filename)

	// Create the file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file: " + err.Error()})
		return
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	// Get advertisement name from form
	name := c.PostForm("name")
	if name == "" {
		name = "Advertisement"
	}

	// Create advertisement record
	ad := models.Advertisement{
		ID:       generateID(),
		Filename: filename,
		Name:     name,
		Active:   true,
		Order:    int(time.Now().Unix()), // Use timestamp as default order
		Created:  time.Now(),
	}

	// Save to storage
	if err := h.storage.AddAdvertisement(ad); err != nil {
		// Clean up file if database operation fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save advertisement: " + err.Error()})
		return
	}

	// Broadcast advertisement update
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "advertisement_added",
			Data: ad,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, ad)
}

// DeleteAdvertisement deletes an advertisement
func (h *APIHandler) DeleteAdvertisement(c *gin.Context) {
	adID := c.Param("id")
	if adID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Advertisement ID is required"})
		return
	}

	if err := h.storage.DeleteAdvertisement(adID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete advertisement: " + err.Error()})
		return
	}

	// Broadcast advertisement deletion
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "advertisement_deleted",
			Data: gin.H{"id": adID},
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, gin.H{"message": "Advertisement deleted successfully"})
}

// UpdateMenuItem updates a menu item
func (h *APIHandler) UpdateMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Menu item ID is required"})
		return
	}

	var item models.MenuItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Ensure ID matches
	item.ID = itemID

	if err := h.storage.UpdateMenuItem(itemID, item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu item: " + err.Error()})
		return
	}

	// Broadcast menu item update
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "menu_item_updated",
			Data: item,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, item)
}

// AddRecommendation adds a new recommendation
func (h *APIHandler) AddRecommendation(c *gin.Context) {
	var rec models.Recommendation
	if err := c.ShouldBindJSON(&rec); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Set required fields
	rec.ID = generateID()
	rec.Date = time.Now()

	if err := h.storage.AddRecommendation(rec); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recommendation: " + err.Error()})
		return
	}

	// Broadcast recommendation addition
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "recommendation_added",
			Data: rec,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, rec)
}

// UpdateRecommendation updates an existing recommendation
func (h *APIHandler) UpdateRecommendation(c *gin.Context) {
	recID := c.Param("id")
	if recID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recommendation ID is required"})
		return
	}

	var rec models.Recommendation
	if err := c.ShouldBindJSON(&rec); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Ensure ID matches
	rec.ID = recID

	if err := h.storage.UpdateRecommendation(recID, rec); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recommendation: " + err.Error()})
		return
	}

	// Broadcast recommendation update
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "recommendation_updated",
			Data: rec,
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, rec)
}

// DeleteRecommendation deletes a recommendation
func (h *APIHandler) DeleteRecommendation(c *gin.Context) {
	recID := c.Param("id")
	if recID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recommendation ID is required"})
		return
	}

	if err := h.storage.DeleteRecommendation(recID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recommendation: " + err.Error()})
		return
	}

	// Broadcast recommendation deletion
	if h.wsHandler != nil {
		h.wsHandler.Broadcast(models.WebSocketMessage{
			Type: "recommendation_deleted",
			Data: gin.H{"id": recID},
		})
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(http.StatusOK, gin.H{"message": "Recommendation deleted successfully"})
}

// Utility functions

// isValidImageFile checks if the uploaded file is a valid image
func isValidImageFile(header *multipart.FileHeader) bool {
	contentType := header.Header.Get("Content-Type")
	validTypes := []string{
		"image/jpeg",
		"image/jpg", 
		"image/png",
		"image/gif",
	}
	
	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	
	// Also check file extension as backup
	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExts := []string{".jpg", ".jpeg", ".png", ".gif"}
	
	for _, validExt := range validExts {
		if ext == validExt {
			return true
		}
	}
	
	return false
}

// generateUniqueFilename generates a unique filename for uploaded files
func generateUniqueFilename(originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	timestamp := strconv.FormatInt(time.Now().UnixNano(), 36)
	return fmt.Sprintf("ad_%s%s", timestamp, ext)
}

// generateID generates a unique ID using timestamp
func generateID() string {
	return strconv.FormatInt(time.Now().UnixNano(), 36)
}

// init initializes random seed
func init() {
	rand.Seed(time.Now().UnixNano())
}