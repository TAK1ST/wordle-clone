export type LetterState = "correct" | "present" | "absent" | "empty";

export interface Letter {
  char: string;
  state: LetterState;
}

export interface Guess {
  letters: Letter[];
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

export interface LastGame {
  won: boolean;
  guesses: number;
  word: string;
}

export interface Player {
  id: string;
  name: string;
  guesses: Guess[];
  isReady: boolean;
  isFinished: boolean;
  isOnline: boolean;
}

export interface GameRoom {
  id: string;
  phase: "lobby" | "playing" | "finished";
  players: Player[];
  secretWord?: string;
  startTime?: number;
}

export interface WebSocketMessage {
  type:
    | "join_room"
    | "player_update"
    | "room_update"
    | "game_started"
    | "game_finished"
    | "error"
    | "start_game";
  data: any;
}