// components/GameLobby.tsx
import React from "react";
import { Users, Wifi, WifiOff, Play, Share2 } from "lucide-react";
import { GameRoom } from "../types";

interface GameLobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  isConnected: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
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
                    className={`w-3 h-3 rounded-full ${
                      player.isOnline ? "bg-green-400" : "bg-gray-400"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      player.id === currentPlayerId
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {player.name} {player.id === currentPlayerId && "(Bạn)"}{" "}
                    {index === 0 && "👑"}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    player.isReady
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
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              currentPlayer?.isReady
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
              alert(`Đã sao chép liên kết phòng! Mã phòng: ${room.id}`);
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