type LetterState = 'correct' | 'present' | 'absent' | 'empty';

interface Letter {
  char: string;
  state: LetterState;
}

interface Guess {
  letters: Letter[];
}

interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

interface LastGame {
  won: boolean;
  guesses: number;
  word: string;
}

interface Player {
  id: string;
  name: string;
  guesses: Guess[];
  isFinished: boolean;
  isOnline: boolean;
}