package handlers

import (
	"log"

	"github.com/tabrezdn1/dune-form-analytics/api/internal/websocket"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"

	"github.com/gofiber/fiber/v2"
	ws "github.com/gofiber/websocket/v2"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub *websocket.Hub
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(hub *websocket.Hub) *WebSocketHandler {
	return &WebSocketHandler{
		hub: hub,
	}
}

// HandleConnection handles WebSocket connection requests
func (h *WebSocketHandler) HandleConnection(c *fiber.Ctx) error {
	// Check if it's a WebSocket upgrade request
	if !ws.IsWebSocketUpgrade(c) {
		return c.Status(426).JSON(fiber.Map{
			"error": "WebSocket upgrade required",
		})
	}

	formID := c.Params("id")
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Validate form ID format
	if !utils.IsValidObjectID(formID) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid form ID format",
		})
	}

	// Handle WebSocket connection
	return ws.New(func(conn *ws.Conn) {
		// Generate unique client ID
		clientID := utils.GenerateRandomString(16)
		
		// Create client
		client := &websocket.Client{
			ID:     clientID,
			FormID: formID,
			Conn:   conn,
			Send:   make(chan []byte, 256),
			Hub:    h.hub,
		}
		
		// Register client with hub
		h.hub.RegisterClient(client)
		
		log.Printf("🔌 WebSocket client %s connected to form %s", clientID, formID)
	})(c)
}

// GetConnectionStats returns WebSocket connection statistics
func (h *WebSocketHandler) GetConnectionStats(c *fiber.Ctx) error {
	formID := c.Query("formId")
	
	stats := fiber.Map{
		"totalConnections": h.hub.GetTotalConnections(),
	}
	
	if formID != "" {
		stats["roomConnections"] = h.hub.GetRoomCount(formID)
	}
	
	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}
