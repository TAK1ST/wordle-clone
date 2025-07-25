import { RotateCcw, Trophy } from "lucide-react";

interface GameHeaderProps {
  onShowStats: () => void;
  onNewGame: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onShowStats,
  onNewGame,
}) => {
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
