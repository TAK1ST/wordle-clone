import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORDS } from "./constants";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Fix cho __dirname trong ESM mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kiểu dữ liệu cho Player và Room
interface Player {
  id: string;
  name: string;
  guesses: string[];
  isReady: boolean;
  isFinished: boolean;
  isOnline: boolean;
}

interface Room {
  id: string;
  phase: 'lobby' | 'playing';
  players: Player[];
  secretWord: string | null;
  startTime: number | null;
}

const rooms = new Map<string, Room>();

function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// WebSocket
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('join_room', ({ playerId, playerName, roomId }: { playerId: string; playerName: string; roomId: string }) => {
    currentRoomId = roomId;
    currentPlayerId = playerId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        phase: 'lobby',
        players: [],
        secretWord: null,
        startTime: null
      });
    }

    const room = rooms.get(roomId)!;

    const playerExists = room.players.find(p => p.id === playerId);
    if (!playerExists) {
      room.players.push({
        id: playerId,
        name: playerName,
        guesses: [],
        isReady: false,
        isFinished: false,
        isOnline: true
      });
    } else {
      playerExists.isOnline = true;
      playerExists.name = playerName;
    }

    socket.join(roomId);
    io.to(roomId).emit('room_update', room);
  });

  socket.on('player_update', (data: Partial<Player> & { playerId: string }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const index = room.players.findIndex(p => p.id === data.playerId);
    if (index !== -1) {
      room.players[index] = {
        ...room.players[index],
        ...data
      };
    }

    io.to(currentRoomId).emit('room_update', room);
  });

  socket.on('start_game', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return;

    const allReady = room.players.length >= 2 && room.players.every(p => p.isReady);
    if (!allReady) return;

    room.phase = 'playing';
    room.secretWord = getRandomWord();
    room.startTime = Date.now();

    room.players.forEach(p => {
      p.guesses = [];
      p.isFinished = false;
    });

    io.to(roomId).emit('game_started', {
      secretWord: room.secretWord
    });
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentPlayerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player) {
          player.isOnline = false;
        }

        io.to(currentRoomId).emit('room_update', room);

        const anyoneOnline = room.players.some(p => p.isOnline);
        if (!anyoneOnline) {
          setTimeout(() => {
            const currentRoom = rooms.get(currentRoomId!);
            if (currentRoom && !currentRoom.players.some(p => p.isOnline)) {
              rooms.delete(currentRoomId!);
              console.log(`Phòng ${currentRoomId} đã bị xóa`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
