package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"spinner-wheel/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WebSocketHandler manages WebSocket connections
type WebSocketHandler struct {
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
	upgrader  websocket.Upgrader
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{
		clients: make(map[*websocket.Conn]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins for development
				return true
			},
		},
	}
}

// HandleWebSocket handles WebSocket connection requests
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	// Add client to connections
	h.clientsMu.Lock()
	h.clients[conn] = true
	h.clientsMu.Unlock()

	log.Printf("WebSocket client connected. Total clients: %d", len(h.clients))

	// Handle client disconnection
	defer func() {
		h.clientsMu.Lock()
		delete(h.clients, conn)
		h.clientsMu.Unlock()
		conn.Close()
		log.Printf("WebSocket client disconnected. Total clients: %d", len(h.clients))
	}()

	// Send welcome message
	welcomeMsg := models.WebSocketMessage{
		Type: "connected",
		Data: gin.H{"message": "Connected to spinner wheel server"},
	}
	
	if err := conn.WriteJSON(welcomeMsg); err != nil {
		log.Printf("Error sending welcome message: %v", err)
		return
	}

	// Listen for messages (mainly for ping/pong to keep connection alive)
	for {
		var msg models.WebSocketMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle ping/pong
		if msg.Type == "ping" {
			pongMsg := models.WebSocketMessage{
				Type: "pong",
				Data: gin.H{"timestamp": msg.Data},
			}
			if err := conn.WriteJSON(pongMsg); err != nil {
				log.Printf("Error sending pong: %v", err)
				break
			}
		}
	}
}

// Broadcast sends a message to all connected clients
func (h *WebSocketHandler) Broadcast(message models.WebSocketMessage) {
	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()

	if len(h.clients) == 0 {
		return
	}

	// Convert message to JSON for logging
	msgJSON, _ := json.Marshal(message)
	log.Printf("Broadcasting to %d clients: %s", len(h.clients), string(msgJSON))

	// Send to all connected clients
	for conn := range h.clients {
		err := conn.WriteJSON(message)
		if err != nil {
			log.Printf("Error broadcasting to client: %v", err)
			// Remove failed connection
			delete(h.clients, conn)
			conn.Close()
		}
	}
}

// GetClientCount returns the number of connected clients
func (h *WebSocketHandler) GetClientCount() int {
	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()
	return len(h.clients)
}

// BroadcastToAdmins sends a message only to admin clients (future enhancement)
func (h *WebSocketHandler) BroadcastToAdmins(message models.WebSocketMessage) {
	// For now, just broadcast to all clients
	// In the future, we could track which clients are admin vs user
	h.Broadcast(message)
}

// BroadcastToUsers sends a message only to user clients (future enhancement)
func (h *WebSocketHandler) BroadcastToUsers(message models.WebSocketMessage) {
	// For now, just broadcast to all clients
	// In the future, we could track which clients are admin vs user
	h.Broadcast(message)
}