import React, { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  RotateCcw,
  Lightbulb,
  Users,
  Wifi,
  WifiOff,
  Play,
  UserPlus,
  Share2,
} from "lucide-react";

// ===== CONSTANTS =====
const WORDS = [
  "APPLE",
  "BREAD",
  "CHAIR",
  "DANCE",
  "EARTH",
  "FLAME",
  "GRAND",
  "HOUSE",
  "IMAGE",
  "JUICE",
  "KNIFE",
  "LIGHT",
  "MUSIC",
  "NIGHT",
  "OCEAN",
  "PEACE",
  "QUICK",
  "ROUND",
  "SPACE",
  "TRAIN",
  "UNDER",
  "VOICE",
  "WATER",
  "YOUNG",
  "ZEBRA",
  "ABOUT",
  "ABOVE",
  "ABUSE",
  "ACTOR",
  "ACUTE",
  "ADMIT",
  "ADOPT",
  "ADULT",
  "AFTER",
  "AGAIN",
  "AGENT",
  "AGREE",
  "AHEAD",
  "ALARM",
  "ALBUM",
  "ALERT",
  "ALIEN",
  "ALIGN",
  "ALIKE",
  "ALIVE",
  "ALLOW",
  "ALONE",
  "ALONG",
  "ALTER",
  "ANGRY",
];

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "BACKSPACE"],
];

const WEBSOCKET_URL = "wss://your-websocket-server.onrender.com"; // Thay bằng URL WebSocket công khai sau khi triển khai

// ===== TYPES =====
type LetterState = "correct" | "present" | "absent" | "empty";

interface Letter {
  char: string;
  state: LetterState;
}

interface Guess {
  letters: Letter[];
}

interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

interface LastGame {
  won: boolean;
  guesses: number;
  word: string;
}

interface Player {
  id: string;
  name: string;
  guesses: Guess[];
  isReady: boolean;
  isFinished: boolean;
  isOnline: boolean;
}

interface GameRoom {
  id: string;
  phase: "lobby" | "playing" | "finished";
  players: Player[];
  secretWord?: string;
  startTime?: number;
}

interface WebSocketMessage {
  type:
  | "join_room"
  | "player_update"
  | "room_update"
  | "game_started"
  | "game_finished"
  | "error"
  | "start_game";
  data: any;
}

// ===== UTILS =====
const getRandomWord = (): string =>
  WORDS[Math.floor(Math.random() * WORDS.length)];

const evaluateGuess = (guess: string, secretWord: string): Letter[] => {
  const result: Letter[] = [];
  const secretArray = secretWord.split("");
  const guessArray = guess.split("");

  const used = new Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === secretArray[i]) {
      result[i] = { char: guessArray[i], state: "correct" };
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i]?.state === "correct") continue;

    let found = false;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && secretArray[j] === guessArray[i]) {
        result[i] = { char: guessArray[i], state: "present" };
        used[j] = true;
        found = true;
        break;
      }
    }

    if (!found) {
      result[i] = { char: guessArray[i], state: "absent" };
    }
  }

  return result;
};

const updateGuessedLettersMap = (
  guessedLetters: Map<string, LetterState>,
  letters: Letter[]
): Map<string, LetterState> => {
  const newGuessedLetters = new Map(guessedLetters);
  letters.forEach((letter) => {
    const current = newGuessedLetters.get(letter.char);
    if (
      !current ||
      (current === "absent" && letter.state !== "absent") ||
      (current === "present" && letter.state === "correct")
    ) {
      newGuessedLetters.set(letter.char, letter.state);
    }
  });
  return newGuessedLetters;
};

// ===== HOOKS =====
const useGameLogic = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [guessedLetters, setGuessedLetters] = useState<
    Map<string, LetterState>
  >(new Map());
  const [stats, setStats] = useState<GameStats>({
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
  });
  const [lastGame, setLastGame] = useState<LastGame | undefined>();
  const [shake, setShake] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 2000);
  }, []);

  const connect = useCallback(
    (playerNameInput: string, roomId: string) => {
      if (!playerNameInput.trim()) {
        showNotification("Vui lòng nhập tên!");
        return;
      }
      if (!roomId.trim()) {
        showNotification("Vui lòng nhập mã phòng!");
        return;
      }
      const playerId = `player_${Date.now()}`;
      setCurrentPlayerId(playerId);
      setPlayerName(playerNameInput);

      const ws = new WebSocket(url);
      ws.onopen = () => {
        setIsConnected(true);
        setSocket(ws);
        ws.send(
          JSON.stringify({
            type: "join_room",
            data: { playerId, playerName: playerNameInput, roomId },
          })
        );
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          switch (message.type) {
            case "room_update":
              setRoom((prev) => {
                if (!prev || prev.id !== message.data.id) {
                  return {
                    ...message.data,
                    players: message.data.players.map((p: Player) => ({
                      ...p,
                      guesses: p.guesses || [],
                      isFinished: p.isFinished || false,
                    })),
                  };
                }
                return prev;
              });
              break;
            case "game_started":
              setRoom((prev) =>
                prev
                  ? {
                    ...prev,
                    phase: "playing",
                    secretWord: message.data.secretWord,
                    startTime: Date.now(),
                  }
                  : null
              );
              setGameState("playing");
              setGuesses([]);
              setCurrentGuess("");
              setGuessedLetters(new Map());
              setShake(false);
              setNotification("");
              break;
            case "game_finished":
              setRoom((prev) => (prev ? { ...prev, phase: "finished" } : null));
              setGameState("lost");
              break;
            case "player_update":
              setRoom((prev) => {
                if (!prev) return prev;
                const updatedPlayers = prev.players.map((p) =>
                  p.id === message.data.playerId
                    ? {
                      ...p,
                      ...message.data,
                      guesses: message.data.guesses || p.guesses,
                    }
                    : p
                );
                return { ...prev, players: updatedPlayers };
              });
              break;
            case "error":
              console.error("Server error:", message.data);
              showNotification("Lỗi kết nối!");
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          showNotification("Lỗi xử lý dữ liệu!");
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        showNotification("Mất kết nối!");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        showNotification("Lỗi kết nối!");
      };
    },
    [url, showNotification]
  );

  const disconnect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }, [socket]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
      } else {
        showNotification("Không thể gửi: Mất kết nối!");
      }
    },
    [socket, isConnected, showNotification]
  );

  const toggleReady = useCallback(() => {
    const currentPlayer = room?.players.find((p) => p.id === currentPlayerId);
    sendMessage({
      type: "player_update",
      data: { playerId: currentPlayerId, isReady: !currentPlayer?.isReady },
    });
  }, [sendMessage, currentPlayerId, room]);

  const startGame = useCallback(() => {
    if (room?.id) {
      sendMessage({
        type: "start_game",
        data: { roomId: room.id },
      });
    }
  }, [sendMessage, room]);

  const submitGuess = useCallback(() => {
    if (!room?.secretWord || currentGuess.length !== 5) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showNotification("Cần đủ 5 chữ cái!");
      return;
    }

    if (!WORDS.includes(currentGuess.toUpperCase())) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showNotification("Từ không hợp lệ!");
      return;
    }

    const evaluatedGuess = evaluateGuess(
      currentGuess.toUpperCase(),
      room.secretWord
    );
    const newGuess: Guess = { letters: evaluatedGuess };
    const newGuesses = [...guesses, newGuess];

    setGuesses(newGuesses);
    setGuessedLetters(updateGuessedLettersMap(guessedLetters, evaluatedGuess));
    setCurrentGuess("");

    if (currentGuess.toUpperCase() === room.secretWord) {
      setGameState("won");
      const newStats = {
        ...stats,
        played: stats.played + 1,
        won: stats.won + 1,
        currentStreak: stats.currentStreak + 1,
        maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
      };
      setStats(newStats);
      setLastGame({
        won: true,
        guesses: newGuesses.length,
        word: room.secretWord,
      });
      showNotification("🎉 Xuất sắc!");
    } else if (newGuesses.length >= 6) {
      setGameState("lost");
      const newStats = {
        ...stats,
        played: stats.played + 1,
        currentStreak: 0,
      };
      setStats(newStats);
      setLastGame({ won: false, guesses: 6, word: room.secretWord });
      showNotification(`Từ cần đoán: ${room.secretWord}`);
    }

    sendMessage({
      type: "player_update",
      data: {
        playerId: currentPlayerId,
        guesses: newGuesses,
        isFinished:
          currentGuess.toUpperCase() === room.secretWord ||
          newGuesses.length >= 6,
      },
    });
  }, [
    currentGuess,
    guesses,
    guessedLetters,
    stats,
    showNotification,
    sendMessage,
    currentPlayerId,
    room,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing" || room?.phase !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (
        key.length === 1 &&
        /[A-Za-z]/.test(key) &&
        currentGuess.length < 5
      ) {
        setCurrentGuess(currentGuess + key.toUpperCase());
      }
    },
    [gameState, currentGuess, submitGuess, room]
  );

  const newGame = useCallback(() => {
    setGuesses([]);
    setCurrentGuess("");
    setGameState("playing");
    setGuessedLetters(new Map());
    setShake(false);
    setNotification("");
    sendMessage({
      type: "player_update",
      data: {
        playerId: currentPlayerId,
        guesses: [],
        isFinished: false,
      },
    });
  }, [sendMessage, currentPlayerId]);

  return {
    isConnected,
    room,
    currentPlayerId,
    playerName,
    setPlayerName,
    connect,
    disconnect,
    toggleReady,
    startGame,
    guesses,
    currentGuess,
    gameState,
    guessedLetters,
    stats,
    lastGame,
    shake,
    notification,
    handleKeyPress,
    newGame,
    showNotification,
  };
};

// ===== COMPONENTS =====
interface LobbyScreenProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoinRoom: (roomId: string) => void;
  isConnecting: boolean;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerName,
  setPlayerName,
  onJoinRoom,
  isConnecting,
}) => {
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("roomId") || "";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Wordle Multiplayer
          </h1>
          <p className="text-gray-600">Nhập tên và mã phòng để tham gia</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên người chơi
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên của bạn..."
              maxLength={20}
              disabled={isConnecting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã phòng
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mã phòng..."
              maxLength={20}
              disabled={isConnecting}
            />
          </div>

          <button
            onClick={() => onJoinRoom(roomId || `room_${Date.now()}`)}
            disabled={isConnecting || !playerName.trim() || !roomId.trim()}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang kết nối...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Tham gia phòng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameLobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  isConnected: boolean;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  room,
  currentPlayerId,
  onToggleReady,
  onStartGame,
  isConnected,
}) => {
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const canStart =
    room.players.length >= 2 && room.players.every((p) => p.isReady === true);
  const isHost = room.players[0]?.id === currentPlayerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {isConnected ? (
              <Wifi size={20} className="text-green-500" />
            ) : (
              <WifiOff size={20} className="text-red-500" />
            )}
            <h2 className="text-2xl font-bold text-gray-800">Phòng chờ</h2>
          </div>
          <p className="text-gray-600">
            Chờ tất cả người chơi sẵn sàng để bắt đầu
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} />
            Người chơi ({room.players.length})
          </h3>

          <div className="space-y-2">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${player.isOnline ? "bg-green-400" : "bg-gray-400"
                      }`}
                  />
                  <span
                    className={`font-medium ${player.id === currentPlayerId
                        ? "text-blue-600"
                        : "text-gray-700"
                      }`}
                  >
                    {player.name} {player.id === currentPlayerId && "(Bạn)"}{" "}
                    {index === 0 && "👑"}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${player.isReady
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {player.isReady ? "Sẵn sàng" : "Chờ..."}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onToggleReady}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${currentPlayer?.isReady
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
              }`}
          >
            {currentPlayer?.isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
          </button>

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Bắt đầu game
            </button>
          )}
        </div>

        {!canStart && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {room.players.length < 2
              ? "Cần ít nhất 2 người chơi"
              : "Chờ tất cả người chơi sẵn sàng"}
          </p>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const url = `${window.location.origin}?roomId=${room.id}`;
              navigator.clipboard.writeText(url);
              showNotification("Đã sao chép liên kết phòng!");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Share2 size={18} />
            Sao chép liên kết phòng
          </button>
        </div>
      </div>
    </div>
  );
};

interface WordCellProps {
  char: string;
  state: LetterState;
  delay?: number;
  size?: "normal" | "small";
}

const WordCell: React.FC<WordCellProps> = ({
  char,
  state,
  delay = 0,
  size = "normal",
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (state !== "empty") {
      setTimeout(() => setIsFlipping(true), delay);
      setTimeout(() => setIsFlipping(false), delay + 300);
    }
  }, [state, delay]);

  const getStateClasses = () => {
    switch (state) {
      case "correct":
        return "bg-green-500 text-white border-green-500";
      case "present":
        return "bg-yellow-500 text-white border-yellow-500";
      case "absent":
        return "bg-gray-500 text-white border-gray-500";
      default:
        return "bg-white text-gray-800 border-gray-300";
    }
  };

  const sizeClasses =
    size === "small" ? "w-6 h-6 text-xs" : "w-14 h-14 text-xl";

  return (
    <div
      className={`
        ${sizeClasses} flex items-center justify-center font-bold border-2 rounded-lg
        transition-all duration-300 transform
        ${getStateClasses()}
        ${isFlipping ? "scale-110 rotate-12" : "scale-100 rotate-0"}
        ${char && state === "empty" ? "border-gray-400 scale-105" : ""}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {char}
    </div>
  );
};

interface GameGridProps {
  guesses: Guess[];
  currentGuess: string;
  shake: boolean;
  size?: "normal" | "small";
}

const GameGrid: React.FC<GameGridProps> = ({
  guesses,
  currentGuess,
  shake,
  size = "normal",
}) => {
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const cells = guesses[i]
        ? guesses[i].letters.map((letter, j) => (
          <WordCell
            key={j}
            char={letter.char}
            state={letter.state}
            delay={j * 100}
            size={size}
          />
        ))
        : i === guesses.length && currentGuess
          ? Array.from({ length: 5 }).map((_, j) => (
            <WordCell
              key={j}
              char={currentGuess[j] || ""}
              state="empty"
              size={size}
            />
          ))
          : Array.from({ length: 5 }).map((_, j) => (
            <WordCell key={j} char="" state="empty" size={size} />
          ));

      const gapClass = size === "small" ? "gap-1" : "gap-2";

      rows.push(
        <div
          key={i}
          className={`flex justify-center ${gapClass} ${shake && i === guesses.length ? "animate-bounce" : ""
            }`}
        >
          {cells}
        </div>
      );
    }
    return rows;
  };

  const gapClass = size === "small" ? "gap-1" : "gap-2";

  return (
    <div
      className={
        size === "small" ? "p-2" : "bg-white rounded-xl p-4 shadow-lg mb-4"
      }
    >
      <div className={`flex flex-col ${gapClass}`}>{renderGrid()}</div>
    </div>
  );
};

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerId: string;
  isConnected: boolean;
}

const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  players,
  currentPlayerId,
  isConnected,
}) => {
  return (
    <div className="w-72 bg-white rounded-xl p-4 shadow-lg mr-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600" />
          <h3 className="font-bold text-gray-800">Người chơi</h3>
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500" />
          )}
          <span
            className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"
              }`}
          >
            {isConnected ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {players.map((player) => (
          <div key={player.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium text-sm ${player.id === currentPlayerId
                      ? "text-blue-600"
                      : "text-gray-600"
                    }`}
                >
                  {player.name} {player.id === currentPlayerId && "(Bạn)"}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${player.isOnline ? "bg-green-400" : "bg-gray-400"
                    }`}
                />
              </div>
              <span className="text-xs text-gray-500">
                {player.guesses.length}/6
              </span>
            </div>
            <GameGrid
              guesses={player.guesses}
              currentGuess=""
              shake={false}
              size="small"
            />
            {player.isFinished && (
              <div className="text-xs text-center mt-1 text-green-600 font-medium">
                Hoàn thành!
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  guessedLetters: Map<string, LetterState>;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  guessedLetters,
}) => {
  const getKeyClass = (key: string) => {
    const state = guessedLetters.get(key);
    let baseClass =
      "px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95";

    if (key === "ENTER" || key === "BACKSPACE") {
      baseClass += " px-3 text-xs";
    }

    switch (state) {
      case "correct":
        return `${baseClass} bg-green-500 text-white`;
      case "present":
        return `${baseClass} bg-yellow-500 text-white`;
      case "absent":
        return `${baseClass} bg-gray-500 text-white`;
      default:
        return `${baseClass} bg-purple-100 text-gray-600 hover:bg-purple-200`;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <div className="space-y-2">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={getKeyClass(key)}
              >
                {key === "BACKSPACE" ? "⌫" : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface GameHeaderProps {
  onShowStats: () => void;
  onNewGame: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ onShowStats, onNewGame }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Wordle</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onShowStats}
          className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          title="Thống kê"
        >
          <Trophy size={20} />
        </button>
        <button
          onClick={onNewGame}
          className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          title="Chơi lại"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

interface NotificationProps {
  message: string;
}

const Notification: React.FC<NotificationProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-blue-500 text-white rounded-lg text-center font-medium animate-pulse">
      {message}
    </div>
  );
};

interface GameResultProps {
  gameState: "playing" | "won" | "lost";
  onNewGame: () => void;
}

const GameResult: React.FC<GameResultProps> = ({ gameState, onNewGame }) => {
  if (gameState === "playing") return null;

  return (
    <div className="text-center mb-4">
      <div
        className={`text-xl font-bold mb-2 ${gameState === "won" ? "text-green-600" : "text-red-600"
          }`}
      >
        {gameState === "won" ? "🎉 Chúc mừng!" : "😔 Hết lượt!"}
      </div>
      <button
        onClick={onNewGame}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
      >
        Chơi lại
      </button>
    </div>
  );
};

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  lastGame?: LastGame;
}

const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  lastGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Thống kê</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.played}</div>
            <div className="text-xs text-gray-600">Đã chơi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {stats.played > 0
                ? Math.round((stats.won / stats.played) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-600">Thắng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-gray-600">Chuỗi hiện tại</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.maxStreak}</div>
            <div className="text-xs text-gray-600">Chuỗi tốt nhất</div>
          </div>
        </div>

        {lastGame && (
          <div className="text-center mb-4">
            <div
              className={`text-lg font-semibold ${lastGame.won ? "text-green-600" : "text-red-600"
                }`}
            >
              {lastGame.won
                ? `🎉 Chúc mừng! (${lastGame.guesses}/6)`
                : `😔 Không thành công`}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Từ cần đoán: <span className="font-bold">{lastGame.word}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const App: React.FC = () => {
  const {
    isConnected,
    room,
    currentPlayerId,
    playerName,
    setPlayerName,
    connect,
    toggleReady,
    startGame,
    guesses,
    currentGuess,
    gameState,
    guessedLetters,
    stats,
    lastGame,
    shake,
    notification,
    handleKeyPress,
    newGame,
    showNotification,
  } = useGameLogic(WEBSOCKET_URL);

  const [showStats, setShowStats] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  if (!room) {
    return (
      <LobbyScreen
        playerName={playerName}
        setPlayerName={setPlayerName}
        onJoinRoom={(roomId) => connect(playerName, roomId)}
        isConnecting={isConnected && !room}
      />
    );
  }

  if (room.phase === "lobby") {
    return (
      <GameLobby
        room={room}
        currentPlayerId={currentPlayerId}
        onToggleReady={toggleReady}
        onStartGame={startGame}
        isConnected={isConnected}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex justify-center">
      <div className="max-w-7xl w-full flex gap-4">
        <PlayerSidebar
          players={room.players}
          currentPlayerId={currentPlayerId}
          isConnected={isConnected}
        />

        <div className="flex-1 max-w-2xl">
          <GameHeader
            onShowStats={() => setShowStats(true)}
            onNewGame={newGame}
          />

          <Notification message={notification} />

          <GameGrid
            guesses={guesses}
            currentGuess={currentGuess}
            shake={shake}
          />

          <GameResult gameState={gameState} onNewGame={newGame} />

          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            guessedLetters={guessedLetters}
          />

          <div className="mt-4 text-center text-lg text-gray-600">
            <Lightbulb size={16} className="inline mr-1" />
            Đoán từ 5 chữ cái trong 6 lần thử
          </div>
        </div>
      </div>

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        lastGame={lastGame}
      />
    </div>
  );
};

export default App;
