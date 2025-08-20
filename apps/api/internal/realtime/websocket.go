package realtime

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/tabrezdn1/dune-form-analytics/api/pkg/utils"
)

// Client represents a WebSocket client for form analytics
type Client struct {
	ID     string
	FormID string
	Conn   *websocket.Conn
	Send   chan []byte
	Manager *WebSocketManager
}

// IsValid checks if the client has valid data
func (c *Client) IsValid() bool {
	return len(c.FormID) == 24 && !strings.Contains(c.FormID, "/") && c.ID != ""
}

// WebSocketManager manages real-time WebSocket connections for form analytics
type WebSocketManager struct {
	// Registered clients grouped by form ID
	rooms map[string]map[*Client]bool

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast messages to all clients in a room
	broadcast chan *Message

	// Mutex for thread-safe operations
	mutex sync.RWMutex
}

// Message represents an analytics message to be broadcast
type Message struct {
	FormID string      `json:"formId"`
	Type   string      `json:"type"`
	Data   interface{} `json:"data"`
}

// NewWebSocketManager creates a new WebSocket manager
func NewWebSocketManager() *WebSocketManager {
	return &WebSocketManager{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

// Run starts the WebSocket manager
func (w *WebSocketManager) Run() {
	log.Println("INFO: WebSocket manager started for real-time analytics")
	
	// Start periodic cleanup routine
	go w.periodicCleanup()
	
	for {
		select {
		case client := <-w.register:
			w.registerClient(client)

		case client := <-w.unregister:
			w.unregisterClient(client)

		case message := <-w.broadcast:
			w.broadcastToRoom(message)
		}
	}
}

// periodicCleanup runs every minute to log room status
func (w *WebSocketManager) periodicCleanup() {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	
	for range ticker.C {
		w.mutex.RLock()
		
		log.Printf("INFO: Periodic room status check - %d rooms active", len(w.rooms))
		for roomKey, clients := range w.rooms {
			clientCount := len(clients)
			if clientCount > 0 {
				log.Printf("INFO: Room '%s' (len:%d) has %d active clients", roomKey, len(roomKey), clientCount)
			}
		}
		
		w.mutex.RUnlock()
	}
}

// HandleConnection handles WebSocket connections for real-time analytics
func (w *WebSocketManager) HandleConnection(c *fiber.Ctx) error {
	// Check if it's a WebSocket upgrade request
	if !websocket.IsWebSocketUpgrade(c) {
		return c.Status(426).JSON(fiber.Map{
			"error": "WebSocket upgrade required",
		})
	}

	// Extract form ID from URL parameter
	formIDParam := c.Params("id")
	
	// Clean and normalize form ID - remove any spaces, slashes, or special characters
	formID := strings.TrimSpace(formIDParam)
	formID = strings.Trim(formID, "/")
	formID = strings.ReplaceAll(formID, "/", "")
	formID = strings.ReplaceAll(formID, " ", "")
	
	if formID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Form ID is required",
		})
	}

	// Validate form ID format
	if !utils.IsValidObjectID(formID) {
		log.Printf("WARN: Invalid ObjectID format for WebSocket connection: '%s'", formID)
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid form ID format",
		})
	}

	// Handle WebSocket connection with proper configuration
	return websocket.New(func(conn *websocket.Conn) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("ERROR: WebSocket handler panic: %v", r)
			}
		}()
		
		// Generate unique client ID
		clientID := utils.GenerateRandomString(16)
		
		// Validate FormID one more time before creating client
		if len(formID) != 24 || strings.Contains(formID, "/") {
			log.Printf("ERROR: Rejecting WebSocket connection - invalid FormID: '%s' (length: %d)", formID, len(formID))
			conn.WriteMessage(websocket.CloseMessage, []byte("Invalid form ID"))
			return
		}
		
		// Create a deep copy of formID to ensure it's immutable
		// Use a fresh string allocation to prevent any possible mutation
		formIDBytes := []byte(formID)
		immutableFormID := string(append([]byte{}, formIDBytes...))
		
		// Create client with immutable FormID
		client := &Client{
			ID:      clientID,
			FormID:  immutableFormID,
			Conn:    conn,
			Send:    make(chan []byte, 1024),
			Manager: w,
		}
		
		// Final validation before registration
		if !client.IsValid() {
			log.Printf("ERROR: Client failed final validation before registration - FormID: '%s'", client.FormID)
			conn.WriteMessage(websocket.CloseMessage, []byte("Client validation failed"))
			return
		}
		
		// Register client with manager (this starts readPump and writePump)
		w.RegisterClient(client)
		
		log.Printf("INFO: WebSocket client %s connected to form analytics %s", clientID, formID)
		
		// Keep the handler alive - this is crucial!
		// The connection will be managed by readPump and writePump goroutines
		select {}
	}, websocket.Config{
		Origins: []string{"http://127.0.0.1:3000", "http://localhost:3000"},
		WriteBufferSize: 1024,
		ReadBufferSize:  1024,
	})(c)
}

// RegisterClient registers a new client
func (w *WebSocketManager) RegisterClient(client *Client) {
	w.register <- client
}

// UnregisterClient unregisters a client
func (w *WebSocketManager) UnregisterClient(client *Client) {
	w.unregister <- client
}

// Broadcast sends analytics updates to all connected clients for a form
func (w *WebSocketManager) Broadcast(formID string, messageType string, data interface{}) {
	// Normalize form ID to ensure consistency with room keys
	// Remove any spaces, slashes, or special characters
	normalizedFormID := strings.TrimSpace(formID)
	normalizedFormID = strings.Trim(normalizedFormID, "/")
	normalizedFormID = strings.ReplaceAll(normalizedFormID, "/", "")
	normalizedFormID = strings.ReplaceAll(normalizedFormID, " ", "")
	
	// Validate the normalized form ID
	if len(normalizedFormID) != 24 {
		log.Printf("ERROR: Invalid form ID length after normalization: '%s' (len:%d)", normalizedFormID, len(normalizedFormID))
		return
	}
	
	message := &Message{
		FormID: normalizedFormID,
		Type:   messageType,
		Data:   data,
	}
	
	select {
	case w.broadcast <- message:
		// Message successfully queued
	default:
		log.Printf("WARN: Broadcast channel full, dropping analytics message for form %s", normalizedFormID)
	}
}

// GetRoomCount returns the number of clients in a form analytics room
func (w *WebSocketManager) GetRoomCount(formID string) int {
	w.mutex.RLock()
	defer w.mutex.RUnlock()
	
	// Normalize form ID to match room keys
	normalizedFormID := strings.TrimSpace(formID)
	normalizedFormID = strings.Trim(normalizedFormID, "/")
	normalizedFormID = strings.ReplaceAll(normalizedFormID, "/", "")
	normalizedFormID = strings.ReplaceAll(normalizedFormID, " ", "")
	
	// Validate FormID format
	if len(normalizedFormID) != 24 {
		log.Printf("WARN: GetRoomCount called with invalid FormID: '%s' (length: %d)", normalizedFormID, len(normalizedFormID))
		return 0
	}
	
	if room, exists := w.rooms[normalizedFormID]; exists {
		return len(room)
	}
	return 0
}

// GetTotalConnections returns total number of connected analytics clients
func (w *WebSocketManager) GetTotalConnections() int {
	w.mutex.RLock()
	defer w.mutex.RUnlock()
	
	total := 0
	for _, room := range w.rooms {
		total += len(room)
	}
	return total
}

// registerClient handles client registration
func (w *WebSocketManager) registerClient(client *Client) {
	w.mutex.Lock()
	defer w.mutex.Unlock()
	
	// Validate FormID format before creating room
	if len(client.FormID) != 24 || strings.Contains(client.FormID, "/") {
		log.Printf("ERROR: Cannot register client with invalid FormID: '%s' (length: %d)", client.FormID, len(client.FormID))
		return
	}
	
	// Use the client's FormID directly as the room key
	// The FormID is already immutable from the HandleConnection function
	roomKey := client.FormID
	
	// Create room if it doesn't exist
	if w.rooms[roomKey] == nil {
		w.rooms[roomKey] = make(map[*Client]bool)
	}
	
	// Add client to room
	w.rooms[roomKey][client] = true
	
	log.Printf("INFO: Client %s joined form analytics %s (room size: %d)", 
		client.ID, roomKey, len(w.rooms[roomKey]))
	
	// Start client goroutines
	go client.writePump()
	go client.readPump()
	
	// Send welcome message
	welcomeMsg := map[string]interface{}{
		"type":    "connected",
		"message": "Connected to real-time analytics",
		"formId":  client.FormID,
	}
	
	if data, err := json.Marshal(welcomeMsg); err == nil {
		select {
		case client.Send <- data:
		default:
			// Welcome message failed to send, unregister client safely
			log.Printf("WARN: Welcome message failed to send to client %s, unregistering", client.ID)
			go w.UnregisterClient(client)
		}
	}
}

// unregisterClient handles client disconnection
func (w *WebSocketManager) unregisterClient(client *Client) {
	w.mutex.Lock()
	defer w.mutex.Unlock()
	
	// Validate client has valid FormID
	if len(client.FormID) != 24 {
		log.Printf("ERROR: Unregistering client with invalid FormID: '%s' (length: %d) for client %s", 
			client.FormID, len(client.FormID), client.ID)
		close(client.Send)
		return
	}
	
	// Use the client's FormID directly as the room key
	roomKey := client.FormID
	
	// Find and remove client from room
	if room, exists := w.rooms[roomKey]; exists {
		if _, exists := room[client]; exists {
			delete(room, client)
			
			// Close the channel (client goroutines should handle cleanup)
			close(client.Send)
			
			log.Printf("INFO: Client %s left form analytics %s (room size: %d)", 
				client.ID, roomKey, len(room))
			
			// Clean up empty rooms to prevent memory leaks
			if len(room) == 0 {
				delete(w.rooms, roomKey)
			}
			return
		}
	}
	
	// Client not found in expected room
	log.Printf("WARN: Client %s with FormID %s not found in expected room during unregistration", 
		client.ID, client.FormID)
	// Close the channel anyway
	close(client.Send)
}

// broadcastToRoom broadcasts analytics message to all clients in a specific room
func (w *WebSocketManager) broadcastToRoom(message *Message) {
	// Validate message FormID first
	if len(message.FormID) != 24 {
		log.Printf("ERROR: Invalid FormID length: '%s' (length: %d)", message.FormID, len(message.FormID))
		return
	}
	
	w.mutex.Lock() // Use write lock for complete safety
	
	// Look for the room with exact match only
	targetRoom, roomExists := w.rooms[message.FormID]
	
	if !roomExists {
		// Room doesn't exist, no clients to broadcast to
		w.mutex.Unlock()
		return
	}
	
	if len(targetRoom) == 0 {
		w.mutex.Unlock()
		return
	}
	
	// Prepare message data
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("ERROR: Error marshaling analytics message: %v", err)
		w.mutex.Unlock()
		return
	}
	
	// Safely copy clients list for broadcast (we already have the write lock)
	clients := make([]*Client, 0, len(targetRoom))
	for client := range targetRoom {
		clients = append(clients, client)
	}
	
	// Release the lock before sending messages to prevent deadlocks
	w.mutex.Unlock()
	
	// Store clients that need to be unregistered
	var failedClients []*Client
	
	for _, client := range clients {
		select {
		case client.Send <- data:
			// Success
		default:
			// Client's send channel is full, mark for cleanup
			log.Printf("WARN: Client %s send channel full, marking for cleanup from form %s", client.ID, client.FormID)
			failedClients = append(failedClients, client)
		}
	}
	
	// Clean up failed clients without the main lock held
	for _, client := range failedClients {
		go func(c *Client) {
			w.UnregisterClient(c)
		}(client)
	}
	
	// Successfully broadcasted to all clients
}

// writePump pumps messages from the manager to the websocket connection
func (c *Client) writePump() {
	defer func() {
		c.Conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			// Check client integrity before writing
			if !c.IsValid() {
				log.Printf("ERROR: Client %s corrupted during write (FormID: '%s') - closing connection", c.ID, c.FormID)
				return
			}
			
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("ERROR: Error writing message to analytics client %s: %v", c.ID, err)
				return
			}
		}
	}
}

// readPump pumps messages from the websocket connection to the manager
func (c *Client) readPump() {
	defer func() {
		c.Manager.UnregisterClient(c)
		c.Conn.Close()
	}()
	
	for {
		// Check client integrity before processing messages
		if !c.IsValid() {
			log.Printf("ERROR: Client %s has been corrupted (FormID: '%s') - disconnecting", c.ID, c.FormID)
			break
		}
		
		var msg map[string]interface{}
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WARN: WebSocket error for analytics client %s: %v", c.ID, err)
			}
			break
		}
		
		// Handle client messages (ping, heartbeat, etc.)
		if msgType, exists := msg["type"]; exists {
			switch msgType {
			case "ping":
				// Send pong response
				pong := map[string]interface{}{
					"type": "pong",
					"timestamp": msg["timestamp"],
				}
				if data, err := json.Marshal(pong); err == nil {
					select {
					case c.Send <- data:
					default:
						return
					}
				}
			}
		}
	}
}

