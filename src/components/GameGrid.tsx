import { Guess } from "../types";
import { WordCell } from "./WordCell";

interface GameGridProps {
  guesses: Guess[];
  currentGuess: string;
  shake: boolean;
  size?: "normal" | "small";
}

export const GameGrid: React.FC<GameGridProps> = ({
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
          className={`flex justify-center ${gapClass} ${
            shake && i === guesses.length ? "animate-bounce" : ""
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