import { useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { updateGuessedLettersMap } from '../utils';
import { 
  GameRoom, 
  Player, 
  Guess, 
  LetterState, 
  GameStats, 
  LastGame
} from '../types';

export const useGameLogic = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
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
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);

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

      const socketIo = io(url, {
        transports: ['websocket'],
        autoConnect: true
      });

      socketIo.on('connect', () => {
        setIsConnected(true);
        setSocket(socketIo);
        socketIo.emit('join_room', { playerId, playerName: playerNameInput, roomId });
      });

      socketIo.on('room_update', (data) => {
        setRoom((prev) => {
          if (!prev || prev.id !== data.id) {
            return {
              ...data,
              players: data.players.map((p: Player) => ({
                ...p,
                guesses: p.guesses || [],
                isFinished: p.isFinished || false,
              })),
            };
          }
          return {
            ...data,
            players: data.players.map((p: Player) => ({
              ...p,
              guesses: p.guesses || [],
              isFinished: p.isFinished || false,
            })),
          };
        });
      });

      socketIo.on('game_started', (data) => {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                phase: "playing",
                secretWord: data.secretWord,
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
        setIsSubmittingGuess(false);
      });

      socketIo.on('game_finished', () => {
        setRoom((prev) => (prev ? { ...prev, phase: "finished" } : null));
        setGameState("lost");
        setIsSubmittingGuess(false);
      });

      // Handle guess validation response from server
      socketIo.on('guess_result', (data) => {
        if (data.success) {
          // Thêm guess mới vào danh sách
          setGuesses(prevGuesses => {
            const newGuesses = [...prevGuesses, data.guess];
            
            // Cập nhật guessed letters map
            setGuessedLetters(prevGuessedLetters => 
              updateGuessedLettersMap(prevGuessedLetters, data.guess.letters)
            );
            
            return newGuesses;
          });
          
          // Delay việc clear currentGuess để tránh flash
          setTimeout(() => {
            setCurrentGuess("");
            setIsSubmittingGuess(false);
          }, 100);

          // Check win/loss conditions
          if (data.isWon) {
            setGameState("won");
            setStats(prevStats => {
              const newStats = {
                ...prevStats,
                played: prevStats.played + 1,
                won: prevStats.won + 1,
                currentStreak: prevStats.currentStreak + 1,
                maxStreak: Math.max(prevStats.maxStreak, prevStats.currentStreak + 1),
              };
              return newStats;
            });
            setLastGame((prevLastGame) => ({
              won: true,
              guesses: (prevLastGame?.guesses || 0) + 1,
              word: room?.secretWord || "",
            }));
            showNotification("🎉 Xuất sắc!");
          } else if (data.isFinished) {
            setGameState("lost");
            setStats(prevStats => ({
              ...prevStats,
              played: prevStats.played + 1,
              currentStreak: 0,
            }));
            setLastGame({ 
              won: false, 
              guesses: 6, 
              word: room?.secretWord || "" 
            });
            showNotification(`Từ cần đoán: ${room?.secretWord}`);
          }
        } else {
          // Handle validation error
          setIsSubmittingGuess(false);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          showNotification(data.error || "Lỗi không xác định!");
        }
      });

      socketIo.on('error', (error) => {
        console.error("Server error:", error);
        setIsSubmittingGuess(false);
        showNotification("Lỗi kết nối!");
      });

      socketIo.on('disconnect', () => {
        setIsConnected(false);
        setSocket(null);
        setIsSubmittingGuess(false);
        showNotification("Mất kết nối!");
      });

      socketIo.on('connect_error', (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setIsSubmittingGuess(false);
        showNotification("Lỗi kết nối!");
      });
    },
    [url, showNotification, room]
  );

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  const sendMessage = useCallback(
    (type: string, data: any) => {
      if (socket && isConnected) {
        console.log(`[sendMessage] ${type}:`, data);
        socket.emit(type, data);
      } else {
        showNotification("Không thể gửi: Mất kết nối!");
      }
    },
    [socket, isConnected, showNotification]
  );

  const toggleReady = useCallback(() => {
    const currentPlayer = room?.players.find((p) => p.id === currentPlayerId);
    sendMessage('player_update', { playerId: currentPlayerId, isReady: !currentPlayer?.isReady });
  }, [sendMessage, currentPlayerId, room]);

  const startGame = useCallback(() => {
    if (room?.id) {
      sendMessage('start_game', { roomId: room.id });
    }
  }, [sendMessage, room]);

  const submitGuess = useCallback(() => {
    // Prevent double submission
    if (isSubmittingGuess) return;

    // Simple client-side check for empty guess
    if (currentGuess.length !== 5) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showNotification("Vui lòng nhập đủ 5 chữ cái!");
      return;
    }

    // Set submitting state
    setIsSubmittingGuess(true);

    // Send guess to server for validation and processing
    sendMessage('submit_guess', {
      playerId: currentPlayerId,
      roomId: room?.id,
      guess: currentGuess.toUpperCase()
    });
  }, [
    currentGuess,
    isSubmittingGuess,
    showNotification,
    sendMessage,
    currentPlayerId,
    room,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing" || room?.phase !== "playing" || isSubmittingGuess) return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (
        key.length === 1 &&
        /[A-Za-z]/.test(key) &&
        currentGuess.length < 5
      ) {
        setCurrentGuess(prev => prev + key.toUpperCase());
      }
    },
    [gameState, currentGuess, submitGuess, room, isSubmittingGuess]
  );

  const newGame = useCallback(() => {
    setGuesses([]);
    setCurrentGuess("");
    setGameState("playing");
    setGuessedLetters(new Map());
    setShake(false);
    setNotification("");
    setIsSubmittingGuess(false);
    
    sendMessage('player_update', {
      playerId: currentPlayerId,
      guesses: [],
      isFinished: false,
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
    isSubmittingGuess,
  };
};