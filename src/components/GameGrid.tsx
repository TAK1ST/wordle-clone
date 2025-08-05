import { Guess } from "../types";
import { WordCell } from "./WordCell";

interface GameGridProps {
  guesses: Guess[];
  currentGuess: string;
  shake: boolean;
  size?: "normal" | "small";
  showChar?: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  guesses,
  currentGuess,
  shake,
  size = "normal",
  showChar = true,
}) => {
  const renderGrid = () => {
    const rows = [];
    
    for (let i = 0; i < 6; i++) {
      let cells;
      
      if (guesses[i]) {
        console.log("Rendering guess:", guesses[i]);
        cells = guesses[i].letters.map((letter, j) => {
          console.log(`Rendering letter: ${letter.char} `, typeof letter.char);
          return (
            <WordCell
              key={j}
              char={letter.char}
              state={letter.state}
              delay={j * 100}
              size={size}
              showChar={showChar}
            />
          );
        });
      } else if (i === guesses.length && currentGuess) {
        cells = Array.from({ length: 5 }).map((_, j) => (
          <WordCell
            key={j}
            char={currentGuess[j] || ""}
            state="empty"
            size={size}
            showChar={showChar}
          />
        ));
      } else {
        cells = Array.from({ length: 5 }).map((_, j) => (
          <WordCell
            key={j}
            char=""
            state="empty"
            size={size}
            showChar={showChar}
          />
        ));
      }

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
        size === "small" 
          ? "p-2 bg-gray-50 rounded-lg" 
          : "bg-white rounded-xl p-4 shadow-lg mb-4"
      }
    >
      <div className={`flex flex-col ${gapClass}`}>{renderGrid()}</div>
    </div>
  );
};
