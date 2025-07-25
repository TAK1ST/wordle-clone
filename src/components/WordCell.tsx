// components/WordCell.tsx
import React, { useState, useEffect } from "react";
import { LetterState } from "../types";

interface WordCellProps {
  char: string;
  state: LetterState;
  delay?: number;
  size?: "normal" | "small";
}

export const WordCell: React.FC<WordCellProps> = ({
  char,
  state,
  delay = 0,
  size = "normal",
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (state !== "empty") {
      setTimeout(() => setIsFlipping(true), delay);
      setTimeout(() => setIsFlipping(false), delay + 300);
    }
  }, [state, delay]);

  const getStateClasses = () => {
    switch (state) {
      case "correct":
        return "bg-green-500 text-white border-green-500";
      case "present":
        return "bg-yellow-500 text-white border-yellow-500";
      case "absent":
        return "bg-gray-500 text-white border-gray-500";
      default:
        return "bg-white text-gray-800 border-gray-300";
    }
  };

  const sizeClasses =
    size === "small" ? "w-6 h-6 text-xs" : "w-14 h-14 text-xl";

  return (
    <div
      className={`
        ${sizeClasses} flex items-center justify-center font-bold border-2 rounded-lg
        transition-all duration-300 transform
        ${getStateClasses()}
        ${isFlipping ? "scale-110 rotate-12" : "scale-100 rotate-0"}
        ${char && state === "empty" ? "border-gray-400 scale-105" : ""}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {char}
    </div>
  );
};