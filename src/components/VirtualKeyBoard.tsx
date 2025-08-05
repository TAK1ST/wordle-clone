import { KEYBOARD_ROWS } from "../constants";
import { LetterState } from "../types";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  guessedLetters: Map<string, LetterState>;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  guessedLetters,
}) => {
  const getKeyClass = (key: string) => {
    const state = guessedLetters.get(key);
    let baseClass =
      "px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95";

    if (key === "ENTER" || key === "BACKSPACE") {
      baseClass += " px-3 text-xs";
    }

    switch (state) {
      case "correct":
        return `${baseClass} bg-green-500 text-white`;
      case "present":
        return `${baseClass} bg-yellow-500 text-white`;
      case "absent":
        return `${baseClass} bg-gray-500 text-white`;
      default:
        return `${baseClass} bg-purple-100 text-gray-600 hover:bg-purple-200`;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <div className="space-y-2">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={getKeyClass(key)}
              >
                {key === "BACKSPACE" ? "⌫" : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
