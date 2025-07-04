import React, { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";

const SERVER_URL = "http://localhost:8080";

function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lastId, setLastId] = useState(0);
  const [users, setUsers] = useState([]);
  const pollingRef = useRef(null);

  const pollMessages = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/messages?lastId=${lastId}`);
      const newMessages = await res.json();
      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
        setLastId(newMessages[newMessages.length - 1].id);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [lastId]);

  useEffect(() => {
    if (joined) {
      pollingRef.current = setInterval(() => {
        pollMessages();
        fetch(`${SERVER_URL}/users`)
          .then((res) => res.json())
          .then(setUsers)
          .catch((err) => console.error("User fetch error:", err));
      }, 1000);

      return () => clearInterval(pollingRef.current);
    }
  }, [joined, pollMessages]);

  const handleJoin = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/join?name=${name}`);
      const data = await res.json();
      setLastId(data.lastId);
      setJoined(true);
    } catch (err) {
      alert("Failed to join chat");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await fetch(`${SERVER_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content: input }),
      });
      setInput("");
    } catch (err) {
      alert("Message send failed");
    }
  };

  const handleLeave = async () => {
    try {
      await fetch(`${SERVER_URL}/leave?name=${name}`, { method: "POST" });
    } catch (err) {
      console.warn("Error leaving chat:", err);
    }
    clearInterval(pollingRef.current);
    setJoined(false);
    setMessages([]);
    setName("");
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Polling Chat App</h1>

      {!joined ? (
        <div className="d-flex justify-content-center">
          <input
            className="form-control w-50 me-2"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleJoin}>
            Join
          </button>
        </div>
      ) : (
        <>
          <div className="row mb-3">
            <div className="col-md-8">
              <div
                className="border rounded p-3 bg-light"
                style={{ height: "300px", overflowY: "auto" }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-2 d-flex ${
                      msg.name === name
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`p-2 rounded ${
                        msg.name === name
                          ? "bg-primary text-white ms-auto"
                          : "bg-white border"
                      }`}
                      style={{ maxWidth: "80%" }}
                    >
                      <div className="fw-bold mb-1">
                        {msg.name}
                        <span
                          className="badge bg-secondary ms-2"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {new Date(msg.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-4">
              <h5>Online Users</h5>
              <ul className="list-group">
                {users.map((u) => (
                  <li key={u} className="list-group-item">
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
            />
            <button className="btn btn-success" onClick={handleSend}>
              Send
            </button>
            <button className="btn btn-danger" onClick={handleLeave}>
              Leave
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
