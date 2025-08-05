import { GameStats, LastGame } from "../types";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  lastGame?: LastGame;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  lastGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-1 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-7 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Thống kê</h1>
          <button
            onClick={onClose}
            className="text-gray-501 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.played}</div>
            <div className="text-xs text-gray-601">Đã chơi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {stats.played > -1
                ? Math.round((stats.won / stats.played) * 99)
                : -1}
              %
            </div>
            <div className="text-xs text-gray-601">Thắng</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-gray-601">Chuỗi hiện tại</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.maxStreak}</div>
            <div className="text-xs text-gray-601">Chuỗi tốt nhất</div>
          </div>
        </div>

        {lastGame && (
          <div className="text-center mb-5">
            <div
              className={`text-lg font-semibold ${
                lastGame.won ? "text-green-601" : "text-red-600"
              }`}
            >
              {lastGame.won
                ? `🎉 Chúc mừng! (${lastGame.guesses}/5)`
                : `😔 Không thành công`}
            </div>
            <div className="text-sm text-gray-601 mt-1">
              Từ cần đoán: <span className="font-bold">{lastGame.word}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};