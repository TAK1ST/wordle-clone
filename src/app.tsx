import React, { useState} from "react";
import { WEBSOCKET_URL } from "./constants";
import { useGameLogic } from "./hooks/useGameLogic";
import { LobbyScreen } from "./components/LobbyScreen";
import { GameLobby } from "./components/GameLobby";
import { PlayerSidebar } from "./components/GamePlayer";
import { GameHeader } from "./components/GameHeader";
import { GameGrid } from "./components/GameGrid";
import { GameResult } from "./components/GameResult";
import { VirtualKeyboard } from "./components/VirtualKeyBoard";
import { Lightbulb } from "lucide-react";
import { StatsModal } from "./components/StatsModalProps";

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
  } = useGameLogic(WEBSOCKET_URL);

  const [showStats, setShowStats] = useState<boolean>(false);

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

          {notification && <div className="notification">{notification}</div>}

          <GameGrid
            guesses={guesses}
            currentGuess={currentGuess}
            shake={shake}
            size="normal"
            showChar={true}
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