import { Users, Wifi, WifiOff } from "lucide-react";
import { Player } from "../types";
import { GameGrid } from "./GameGrid";

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerId: string;
  isConnected: boolean;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
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
            className={`text-xs ${
              isConnected ? "text-green-600" : "text-red-600"
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
                  className={`font-medium text-sm ${
                    player.id === currentPlayerId
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {player.name} {player.id === currentPlayerId && "(Bạn)"}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    player.isOnline ? "bg-green-400" : "bg-gray-400"
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