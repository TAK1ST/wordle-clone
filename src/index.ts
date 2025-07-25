import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

interface Player {
  id: string;
  name: string;
  guesses: string[];
}
let players: Player[] = [];
let secretWord = getRandomWord();
let gameStarted = false;

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("join", (name: string) => {
    const player: Player = { id: socket.id, name, guesses: [] };
    players.push(player);

    io.emit("players_updated", players);
  });

  socket.on("start_game", () => {
    if (!gameStarted) {
      secretWord = getRandomWord();
      gameStarted = true;
      players.forEach((p) => (p.guesses = []));
      io.emit("game_started");
    }
  });

  socket.on("guess", (guess: string) => {
    const player = players.find((p) => p.id === socket.id);
    if (!player || !gameStarted) return;

    player.guesses.push(guess);
    const result = getGuessResult(guess, secretWord);

    io.emit("receive_guess", {
      playerId: player.id,
      guess,
      result,
    });

    if (guess === secretWord) {
      io.emit("game_over", { winner: player.name });
      gameStarted = false;
    }
  });

  socket.on("new_game", () => {
    secretWord = getRandomWord();
    gameStarted = true;
    players.forEach(p => p.guesses = []);
    io.emit("game_started");
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("players_updated", players);
  });
});

server.listen(3001, () => console.log("Server listening on port 3001"));

function getRandomWord() {
  const words = ["apple", "plane", "storm", "fight"];
  return words[Math.floor(Math.random() * words.length)];
}

function getGuessResult(guess: string, word: string) {
  return guess.split("").map((letter, i) => {
    if (word[i] === letter) return "correct";
    if (word.includes(letter)) return "present";
    return "absent";
  });
}
