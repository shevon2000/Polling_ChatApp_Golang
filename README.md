# Polling ChatApp (Golang + React)

A real-time polling chat application built with a Go backend and React frontend, allowing users to create polls, vote, and chat interactively.

## Features

- Real-time chat with WebSocket support
- Create and participate in live polls
- Responsive React frontend for dynamic UI
- High-performance backend with Go concurrency


## Getting Started

### Prerequisites

- Go 1.18+ installed
- Node.js and npm/yarn installed
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/shevon2000/Polling_ChatApp_Golang.git
cd Polling_ChatApp_Golang

Backend Setup
cd backend
go mod download
go run main.go
The backend server will start on http://localhost:8080.

Frontend Setup
Open a new terminal window:

cd frontend
npm install       # or yarn install
npm start         # or yarn start
The React app will open in your browser at http://localhost:3000 and communicate with the Go backend.
```

### Usage
Use the React frontend to create polls, chat in real-time, and vote.

The backend handles all API requests and WebSocket connections.

### Contributing
Contributions welcome! Please fork the repo and submit pull requests.

### License
This project is licensed under the MIT License.
