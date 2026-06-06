/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MatchState {
  runs: number;
  wickets: number;
  totalBalls: number;
  history: BallEvent[];
  teamA: string;
  teamB: string;
  battingTeam: string;
  maxOvers: number;
  tossWinner: string;
  tossDecision: 'bat' | 'bowl' | '';
  target: number | null;
  isSecondInnings: boolean;
  playersCount: number;
  firstInningsHistory: BallEvent[];
}

export interface SavedMatch {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  matchState: MatchState;
}

export type BallEvent = 
  | '0' | '1' | '2' | '3' | '4' | '6' 
  | 'W' // Wicket
  | 'NB' // No Ball
  | 'WD' // Wide
  | 'undo';
