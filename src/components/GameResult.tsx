interface GameResultProps {
  gameState: "playing" | "won" | "lost";
  onNewGame: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({ gameState, onNewGame }) => {
  if (gameState === "playing") return null;

  return (
    <div className="text-center mb-4">
      <div
        className={`text-xl font-bold mb-2 ${
          gameState === "won" ? "text-green-600" : "text-red-600"
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
