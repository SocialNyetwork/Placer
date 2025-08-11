const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Game state
const gameState = {
    cubes: new Map(), // Store all cubes: key -> {x, y, z, color, playerId}
    players: new Map(), // Store player info: playerId -> {name, color, position}
    nextPlayerId: 1
};

// Player colors for identification
const playerColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
];

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Assign player ID and color
    const playerId = gameState.nextPlayerId++;
    const playerColor = playerColors[(playerId - 1) % playerColors.length];
    
    // Add player to game state
    gameState.players.set(playerId, {
        id: playerId,
        name: `Player ${playerId}`,
        color: playerColor,
        position: { x: 0, y: 2, z: 10 }
    });
    
    // Send current game state to new player
    socket.emit('gameState', {
        cubes: Array.from(gameState.cubes.entries()),
        players: Array.from(gameState.players.values()),
        playerId: playerId,
        playerColor: playerColor
    });
    
    // Notify other players about new player
    socket.broadcast.emit('playerJoined', {
        id: playerId,
        name: `Player ${playerId}`,
        color: playerColor,
        position: { x: 0, y: 2, z: 10 }
    });
    
    // Handle cube placement
    socket.on('placeCube', (data) => {
        const { x, y, z, color } = data;
        const key = `${x},${y},${z}`;
        
        // Add cube to game state
        gameState.cubes.set(key, {
            x, y, z, color, playerId
        });
        
        // Broadcast to all players
        io.emit('cubePlaced', {
            key,
            x, y, z, color, playerId
        });
    });
    
    // Handle cube removal
    socket.on('removeCube', (data) => {
        const { key } = data;
        
        if (gameState.cubes.has(key)) {
            gameState.cubes.delete(key);
            
            // Broadcast to all players
            io.emit('cubeRemoved', { key });
        }
    });
    
    // Handle player movement
    socket.on('playerMove', (data) => {
        const { position } = data;
        
        if (gameState.players.has(playerId)) {
            gameState.players.get(playerId).position = position;
            
            // Broadcast to other players
            socket.broadcast.emit('playerMoved', {
                playerId,
                position
            });
        }
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove player from game state
        gameState.players.delete(playerId);
        
        // Notify other players
        socket.broadcast.emit('playerLeft', { playerId });
    });
    
    // Handle clear canvas
    socket.on('clearCanvas', () => {
        gameState.cubes.clear();
        io.emit('canvasCleared');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
