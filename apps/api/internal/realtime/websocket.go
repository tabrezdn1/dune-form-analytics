package realtime

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

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

// HandleConnection handles WebSocket connections for real-time analytics
func (w *WebSocketManager) HandleConnection(c *fiber.Ctx) error {
	// Check if it's a WebSocket upgrade request
	if !websocket.IsWebSocketUpgrade(c) {
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

	// Handle WebSocket connection with proper configuration
	return websocket.New(func(conn *websocket.Conn) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("ERROR: WebSocket handler panic: %v", r)
			}
		}()
		
		// Generate unique client ID
		clientID := utils.GenerateRandomString(16)
		
		// Create client
		client := &Client{
			ID:      clientID,
			FormID:  formID,
			Conn:    conn,
			Send:    make(chan []byte, 1024),
			Manager: w,
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
	log.Printf("INFO: Attempting to broadcast %s to form %s", messageType, formID)
	
	message := &Message{
		FormID: formID,
		Type:   messageType,
		Data:   data,
	}
	
	select {
	case w.broadcast <- message:
		log.Printf("INFO: Message queued for broadcast to form %s", formID)
	default:
		log.Printf("WARN: Broadcast channel full, dropping analytics message for form %s", formID)
	}
}

// GetRoomCount returns the number of clients in a form analytics room
func (w *WebSocketManager) GetRoomCount(formID string) int {
	w.mutex.RLock()
	defer w.mutex.RUnlock()
	
	if room, exists := w.rooms[formID]; exists {
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
	
	// Create room if it doesn't exist
	if w.rooms[client.FormID] == nil {
		w.rooms[client.FormID] = make(map[*Client]bool)
	}
	
	// Add client to room
	w.rooms[client.FormID][client] = true
	
	log.Printf("INFO: Client %s joined form analytics %s (room size: %d)", 
		client.ID, client.FormID, len(w.rooms[client.FormID]))
	
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
			close(client.Send)
			delete(w.rooms[client.FormID], client)
		}
	}
}

// unregisterClient handles client disconnection
func (w *WebSocketManager) unregisterClient(client *Client) {
	w.mutex.Lock()
	defer w.mutex.Unlock()
	
	if room, exists := w.rooms[client.FormID]; exists {
		if _, exists := room[client]; exists {
			delete(room, client)
			close(client.Send)
			
			log.Printf("INFO: Client %s left form analytics %s (room size: %d)", 
				client.ID, client.FormID, len(room))
		}
	}
}

// broadcastToRoom broadcasts analytics message to all clients in a specific room
func (w *WebSocketManager) broadcastToRoom(message *Message) {
	w.mutex.RLock()
	
	// Log active rooms for operational visibility
	log.Printf("INFO: Attempting broadcast to form: %s", message.FormID)
	for formID, clients := range w.rooms {
		if len(clients) > 0 {
			log.Printf("INFO: Room %s has %d clients", formID, len(clients))
		}
	}
	
	room, exists := w.rooms[message.FormID]
	w.mutex.RUnlock()
	
	if !exists {
		log.Printf("INFO: Room for form %s does not exist, skipping broadcast", message.FormID)
		return
	}
	
	if len(room) == 0 {
		log.Printf("INFO: No active clients in room for form %s analytics, skipping broadcast", message.FormID)
		return
	}
	
	log.Printf("INFO: Broadcasting to %d clients in form %s analytics room", len(room), message.FormID)
	
	// Prepare message data
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("ERROR: Error marshaling analytics message: %v", err)
		return
	}
	
	// Broadcast to all clients in the room
	w.mutex.RLock()
	clients := make([]*Client, 0, len(room))
	for client := range room {
		clients = append(clients, client)
	}
	w.mutex.RUnlock()
	
	for _, client := range clients {
		select {
		case client.Send <- data:
		default:
			// Client's send channel is full, disconnect them
			w.UnregisterClient(client)
		}
	}
	
	log.Printf("INFO: Broadcasted %s analytics to %d clients in form %s", 
		message.Type, len(clients), message.FormID)
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
