// utils.ts
import { WORDS } from './constants';
import { Letter, LetterState } from './types';

export const getRandomWord = (): string =>
  WORDS[Math.floor(Math.random() * WORDS.length)];

export const evaluateGuess = (guess: string, secretWord: string): Letter[] => {
  const result: Letter[] = [];
  const secretArray = secretWord.split("");
  const guessArray = guess.split("");

  const used = new Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === secretArray[i]) {
      result[i] = { char: guessArray[i], state: "correct" };
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i]?.state === "correct") continue;

    let found = false;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && secretArray[j] === guessArray[i]) {
        result[i] = { char: guessArray[i], state: "present" };
        used[j] = true;
        found = true;
        break;
      }
    }

    if (!found) {
      result[i] = { char: guessArray[i], state: "absent" };
    }
  }

  return result;
};

export const updateGuessedLettersMap = (
  guessedLetters: Map<string, LetterState>,
  letters: Letter[]
): Map<string, LetterState> => {
  const newGuessedLetters = new Map(guessedLetters);
  letters.forEach((letter) => {
    const current = newGuessedLetters.get(letter.char);
    if (
      !current ||
      (current === "absent" && letter.state !== "absent") ||
      (current === "present" && letter.state === "correct")
    ) {
      newGuessedLetters.set(letter.char, letter.state);
    }
  });
  return newGuessedLetters;
};