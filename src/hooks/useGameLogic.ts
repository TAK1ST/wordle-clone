// hooks/useGameLogic.ts
import { useState, useCallback } from 'react';
import { WORDS } from '../constants';
import { evaluateGuess, updateGuessedLettersMap } from '../utils';
import { 
  GameRoom, 
  Player, 
  Guess, 
  LetterState, 
  GameStats, 
  LastGame, 
  WebSocketMessage 
} from '../types';

export const useGameLogic = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [guessedLetters, setGuessedLetters] = useState<Map<string, LetterState>>(new Map());
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