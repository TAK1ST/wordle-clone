import React, { useState, useEffect } from "react";
import { LetterState } from "../types";

interface WordCellProps {
  char: string;
  state: LetterState;
  delay?: number;
  size?: "normal" | "small";
  showChar?: boolean;
}

export const WordCell: React.FC<WordCellProps> = ({
  char,
  state,
  delay = 0,
  size = "normal",
  showChar = true,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (state !== "empty") {
      const flipTimer = setTimeout(() => setIsFlipping(true), delay);
      const resetTimer = setTimeout(() => setIsFlipping(false), delay + 300);
      
      return () => {
        clearTimeout(flipTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [state, delay]);

  const getStateClasses = () => {
    switch (state) {
      case "correct":
        return "bg-green-500 border-green-500";
      case "present":
        return "bg-yellow-500 border-yellow-500";
      case "absent":
        return "bg-gray-500 border-gray-500";
      default:
        // Empty state - khác nhau giữa có chữ và không có chữ
        if (char && showChar) {
          return "bg-white text-gray-800 border-gray-400";
        }
        return "bg-white border-gray-300";
    }
  };

  const getTextColor = () => {
    // Chỉ áp dụng màu chữ khi có state màu hoặc khi hiển thị chữ
    if (state === "correct" || state === "present" || state === "absent") {
      return "text-white";
    }
    return "text-gray-800";
  };

  const sizeClasses = size === "small" 
    ? "w-4 h-4 text-xs" 
    : "w-14 h-14 text-xl";

  const getScaleEffect = () => {
    if (isFlipping) {
      return "scale-110 rotate-12";
    }
    if (char && state === "empty" && showChar) {
      return "scale-105";
    }
    return "scale-100 rotate-0";
  };

  return (
    <div
      className={`
        ${sizeClasses}
        flex items-center justify-center font-bold border-2 rounded-lg
        transition-all duration-300 transform
        ${getStateClasses()}
        ${getTextColor()}
        ${getScaleEffect()}
      `}
      style={{ 
        transitionDelay: `${delay}ms`,
        // Đảm bảo cell luôn có kích thước cố định
        minWidth: size === "small" ? "16px" : "56px",
        minHeight: size === "small" ? "16px" : "56px"
      }}
    >
      {/* Chỉ hiển thị chữ khi showChar = true */}
      {showChar && char ? char.toUpperCase() : ""}
    </div>
  );
};
