export type BingoNumber = number;

export interface GameState {
  availableNumbers: BingoNumber[];
  history: BingoNumber[];
  currentNumber: BingoNumber | null;
  isSpinning: boolean;
  targetNumber: BingoNumber | null;
}

export enum GameStatus {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  COMPLETED = 'COMPLETED',
  FINISHED = 'FINISHED' // All numbers drawn
}