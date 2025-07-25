import { Server } from "socket.io";

const io = new Server(3001, {
  cors: { origin: "*" },
});

interface Player {
  id: string;
  name: string;
  [key: string]: any;
}

let players: Player[] = [];

io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("player_joined", (data: Player) => {
    players.push(data);
    io.emit("player_joined", data);
  });

  socket.on("player_update", (data: Player) => {
    players = players.map((p) =>
      p.id === data.id ? { ...p, ...data } : p
    );
    io.emit("player_update", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    io.emit("player_left", { id: socket.id });
    players = players.filter(p => p.id !== socket.id);
  });
});
