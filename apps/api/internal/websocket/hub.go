package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

// Client represents a WebSocket client
type Client struct {
	ID     string
	FormID string
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
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

// Message represents a message to be broadcast
type Message struct {
	FormID string      `json:"formId"`
	Type   string      `json:"type"`
	Data   interface{} `json:"data"`
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
	}
}

// Run starts the WebSocket hub
func (h *Hub) Run() {
	log.Println("🔌 WebSocket hub started")
	
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToRoom(message)
		}
	}
}

// RegisterClient registers a new client
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// UnregisterClient unregisters a client
func (h *Hub) UnregisterClient(client *Client) {
	h.unregister <- client
}

// BroadcastToForm broadcasts a message to all clients in a form room
func (h *Hub) BroadcastToForm(formID string, messageType string, data interface{}) {
	message := &Message{
		FormID: formID,
		Type:   messageType,
		Data:   data,
	}
	
	select {
	case h.broadcast <- message:
	default:
		log.Printf("Warning: broadcast channel full, dropping message for form %s", formID)
	}
}

// GetRoomCount returns the number of clients in a form room
func (h *Hub) GetRoomCount(formID string) int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	if room, exists := h.rooms[formID]; exists {
		return len(room)
	}
	return 0
}

// GetTotalConnections returns total number of connected clients
func (h *Hub) GetTotalConnections() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	total := 0
	for _, room := range h.rooms {
		total += len(room)
	}
	return total
}

// registerClient handles client registration
func (h *Hub) registerClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	// Create room if it doesn't exist
	if h.rooms[client.FormID] == nil {
		h.rooms[client.FormID] = make(map[*Client]bool)
	}
	
	// Add client to room
	h.rooms[client.FormID][client] = true
	
	log.Printf("📱 Client %s joined form room %s (room size: %d)", 
		client.ID, client.FormID, len(h.rooms[client.FormID]))
	
	// Start client goroutines
	go client.writePump()
	go client.readPump()
	
	// Send welcome message
	welcomeMsg := map[string]interface{}{
		"type":    "connection:established",
		"message": "Connected to real-time updates",
		"formId":  client.FormID,
	}
	
	if data, err := json.Marshal(welcomeMsg); err == nil {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(h.rooms[client.FormID], client)
		}
	}
}

// unregisterClient handles client disconnection
func (h *Hub) unregisterClient(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if room, exists := h.rooms[client.FormID]; exists {
		if _, exists := room[client]; exists {
			delete(room, client)
			close(client.Send)
			
			log.Printf("📱 Client %s left form room %s (room size: %d)", 
				client.ID, client.FormID, len(room))
			
			// Remove empty rooms
			if len(room) == 0 {
				delete(h.rooms, client.FormID)
				log.Printf("🗑️  Removed empty room for form %s", client.FormID)
			}
		}
	}
}

// broadcastToRoom broadcasts a message to all clients in a specific room
func (h *Hub) broadcastToRoom(message *Message) {
	h.mutex.RLock()
	room, exists := h.rooms[message.FormID]
	h.mutex.RUnlock()
	
	if !exists {
		log.Printf("Warning: no room found for form %s", message.FormID)
		return
	}
	
	// Prepare message data
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}
	
	// Broadcast to all clients in the room
	h.mutex.RLock()
	clients := make([]*Client, 0, len(room))
	for client := range room {
		clients = append(clients, client)
	}
	h.mutex.RUnlock()
	
	for _, client := range clients {
		select {
		case client.Send <- data:
		default:
			// Client's send channel is full, disconnect them
			h.UnregisterClient(client)
		}
	}
	
	log.Printf("📡 Broadcasted %s message to %d clients in form %s", 
		message.Type, len(clients), message.FormID)
}

// writePump pumps messages from the hub to the websocket connection
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
				log.Printf("Error writing message to client %s: %v", c.ID, err)
				return
			}
		}
	}
}

// readPump pumps messages from the websocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.Hub.UnregisterClient(c)
		c.Conn.Close()
	}()
	
	for {
		var msg map[string]interface{}
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for client %s: %v", c.ID, err)
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
