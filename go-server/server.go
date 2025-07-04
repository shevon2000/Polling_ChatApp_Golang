package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type Message struct {
	ID      int       `json:"id"`
	Name    string    `json:"name"`
	Content string    `json:"content"`
	Time    time.Time `json:"time"`
}

var (
	messages   = []Message{}
	clients    = map[string]time.Time{}
	lastID     = 0
	lock       sync.Mutex
	timeoutDur = 5 * time.Minute
)

func joinHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Name required", http.StatusBadRequest)
		return
	}
	lock.Lock()
	clients[name] = time.Now()
	lastID++
	messages = append(messages, Message{
		ID:      lastID,
		Name:    "System",
		Content: fmt.Sprintf("%s joined the chat", name),
		Time:    time.Now(),
	})
	lock.Unlock()

	json.NewEncoder(w).Encode(map[string]int{"lastId": lastID})
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, "Invalid message", http.StatusBadRequest)
		return
	}
	lock.Lock()
	defer lock.Unlock()
	lastID++
	msg.ID = lastID
	msg.Time = time.Now()
	messages = append(messages, msg)
	clients[msg.Name] = time.Now() // Update activity
	w.WriteHeader(http.StatusOK)
}

func messagesHandler(w http.ResponseWriter, r *http.Request) {
	lastStr := r.URL.Query().Get("lastId")
	lastId, _ := strconv.Atoi(lastStr)

	lock.Lock()
	defer lock.Unlock()

	var newMessages []Message
	for _, msg := range messages {
		if msg.ID > lastId {
			newMessages = append(newMessages, msg)
		}
	}
	json.NewEncoder(w).Encode(newMessages)
}

func leaveHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Name required", http.StatusBadRequest)
		return
	}
	lock.Lock()
	defer lock.Unlock()
	delete(clients, name)
	lastID++
	messages = append(messages, Message{
		ID:      lastID,
		Name:    "System",
		Content: fmt.Sprintf("%s left the chat", name),
		Time:    time.Now(),
	})
	w.WriteHeader(http.StatusOK)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
	lock.Lock()
	defer lock.Unlock()
	now := time.Now()
	active := []string{}
	for name, lastSeen := range clients {
		if now.Sub(lastSeen) < timeoutDur {
			active = append(active, name)
		}
	}
	json.NewEncoder(w).Encode(active)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/join", joinHandler)
	mux.HandleFunc("/send", sendHandler)
	mux.HandleFunc("/messages", messagesHandler)
	mux.HandleFunc("/leave", leaveHandler)
	mux.HandleFunc("/users", usersHandler)

	fmt.Println("Server listening on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", allowCORS(mux)))
}

func allowCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
