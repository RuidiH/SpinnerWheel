package handlers

import (
	"math/rand"
	"net/http"
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

// init initializes random seed
func init() {
	rand.Seed(time.Now().UnixNano())
}