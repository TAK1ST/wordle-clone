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
interface Guess {
  letters: Array<{
    char: string;
    state: 'correct' | 'present' | 'absent' | 'empty';
  }>;
}

interface Player {
  id: string;
  name: string;
  guesses: Guess[];
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
    console.log(`[join_room] Player ${playerName} joined room ${roomId}`);
    io.to(roomId).emit('room_update', room);
  });

  // ✅ FIX: Xử lý player_update đúng cách
  socket.on('player_update', (data: {
    playerId: string;
    guesses?: Guess[];
    isReady?: boolean;
    isFinished?: boolean;
  }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    console.log(`[player_update] Received data:`, data);

    const playerIndex = room.players.findIndex(p => p.id === data.playerId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      
      // ✅ Cập nhật từng field một cách an toàn
      if (data.guesses !== undefined) {
        player.guesses = data.guesses;
        console.log(`[player_update] Updated guesses for ${player.name}:`, player.guesses.length);
      }
      
      if (data.isReady !== undefined) {
        player.isReady = data.isReady;
      }
      
      if (data.isFinished !== undefined) {
        player.isFinished = data.isFinished;
      }

      console.log(`[player_update] Player ${player.name} state:`, {
        guessesCount: player.guesses.length,
        isFinished: player.isFinished,
        isReady: player.isReady
      });
    }

    // ✅ Gửi room_update để đồng bộ tất cả client
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

    // ✅ Reset trạng thái game cho tất cả player
    room.players.forEach(p => {
      p.guesses = [];
      p.isFinished = false;
    });

    console.log(`[start_game] Game started in room ${roomId} with word: ${room.secretWord}`);

    io.to(roomId).emit('game_started', {
      secretWord: room.secretWord
    });
    
    // ✅ Gửi room_update để đồng bộ trạng thái
    io.to(roomId).emit('room_update', room);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentPlayerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player) {
          player.isOnline = false;
          console.log(`[disconnect] Player ${player.name} went offline`);
        }

        io.to(currentRoomId).emit('room_update', room);

        // Auto-delete room after 5 minutes if no one online
        const anyoneOnline = room.players.some(p => p.isOnline);
        if (!anyoneOnline) {
          setTimeout(() => {
            const currentRoom = rooms.get(currentRoomId!);
            if (currentRoom && !currentRoom.players.some(p => p.isOnline)) {
              rooms.delete(currentRoomId!);
              console.log(`Room ${currentRoomId} deleted due to inactivity`);
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