/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Undo2, Trophy, Home, History, Settings, Coins, Share2, User, Save, Bookmark, Trash2, Sun, Moon } from "lucide-react";
import { type MatchState, type BallEvent, type SavedMatch } from "./types";

const BengaliNumbers = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '';
  const numbers: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.'
  };
  return num.toString().split('').map(n => numbers[n] || n).join('');
};

export default function App() {
  const initialState: MatchState = {
    runs: 0,
    wickets: 0,
    totalBalls: 0,
    history: [],
    teamA: "টিম এ",
    teamB: "টিম বি",
    battingTeam: "",
    maxOvers: 20,
    tossWinner: "",
    tossDecision: "",
    target: null,
    isSecondInnings: false,
    playersCount: 11,
    firstInningsHistory: []
  };

  const [state, setState] = useState<MatchState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("cricket_match_state_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved match state", e);
        }
      }
    }
    return initialState;
  });

  React.useEffect(() => {
    localStorage.setItem("cricket_match_state_v1", JSON.stringify(state));
  }, [state]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [isShowingScorecard, setIsShowingScorecard] = useState(false);
  const [isShowingToss, setIsShowingToss] = useState(false);
  const [isShowingDevPage, setIsShowingDevPage] = useState(false);
  const [isShowingSavedMatches, setIsShowingSavedMatches] = useState(false);
  const [isSettingUpMatch, setIsSettingUpMatch] = useState(false);
  const [isShowingDonation, setIsShowingDonation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("theme") !== "light";
    }
    return true;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const [hasCopied, setHasCopied] = useState(false);
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("cricket_saved_matches_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved matches", e);
        }
      }
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem("cricket_saved_matches_v1", JSON.stringify(savedMatches));
  }, [savedMatches]);

  const saveMatchManually = () => {
    const now = new Date();
    const newSavedMatch: SavedMatch = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      dateStr: now.toLocaleDateString('bn-BD'),
      timeStr: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      matchState: JSON.parse(JSON.stringify(state))
    };
    setSavedMatches(prev => [newSavedMatch, ...prev]);
    setShowSaveConfirm(false);
  };

  React.useEffect(() => {
    const donationSeen = localStorage.getItem("donationSeen");
    if (!donationSeen) {
      setIsShowingDonation(true);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const closeDonation = () => {
    localStorage.setItem("donationSeen", "true");
    setIsShowingDonation(false);
  };
  const [activeSettingsTab, setActiveSettingsTab] = useState<'setup' | 'edit'>('setup');
  const [tempMaxOvers, setTempMaxOvers] = useState<string>('20');
  const [tempPlayersCount, setTempPlayersCount] = useState<string>('11');
  const [tempTossWinner, setTempTossWinner] = useState("");
  const [tempTossDecision, setTempTossDecision] = useState<'bat' | 'bowl' | ''>("");

  const [tempRuns, setTempRuns] = useState<string>('0');
  const [tempWickets, setTempWickets] = useState<string>('0');
  const [tempOvers, setTempOvers] = useState("0.0");
  const [tempIsSecondInnings, setTempIsSecondInnings] = useState(false);
  const [tempTarget, setTempTarget] = useState<string>('0');
  const [tempBattingTeam, setTempBattingTeam] = useState("");

  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [matchResult, setMatchResult] = useState({ winner: "", margin: "" });
  const [tempTeamA, setTempTeamA] = useState("টিম এ");
  const [tempTeamB, setTempTeamB] = useState("টিম বি");

  const formatOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const getOverHistory = (history: BallEvent[]) => {
    if (history.length === 0) return [];
    const totalLegal = history.filter(b => !['NB', 'WD'].includes(b)).length;
    if (totalLegal === 0) return history;
    const targetOverStart = Math.max(0, Math.floor((totalLegal - 1) / 6) * 6);
    const result: BallEvent[] = [];
    let legalsSoFar = 0;
    for (const b of history) {
      if (legalsSoFar >= targetOverStart) {
        result.push(b);
      }
      if (!['NB', 'WD'].includes(b)) legalsSoFar++;
    }
    return result;
  };

  const getInningsSummary = (history: BallEvent[]) => {
    const overs: { balls: BallEvent[]; runs: number; wickets: number; totalLegals: number; totalBalls: number }[] = [];
    let currentOver = { balls: [] as BallEvent[], runs: 0, wickets: 0, totalLegals: 0, totalBalls: 0 };
    
    // We don't store individual runs for NB/WD in history currently, 
    // but we can at least show the event codes.
    history.forEach(ball => {
      currentOver.balls.push(ball);
      currentOver.totalBalls++;
      
      if (['0', '1', '2', '3', '4', '6'].includes(ball)) {
        currentOver.runs += parseInt(ball);
        currentOver.totalLegals++;
      } else if (ball === 'W') {
        currentOver.wickets++;
        currentOver.totalLegals++;
      } else if (ball === 'NB' || ball === 'WD') {
        currentOver.runs += 1; // Assuming 1 extra run for now since we don't store metadata
      }

      if (currentOver.totalLegals === 6) {
        overs.push(currentOver);
        currentOver = { balls: [], runs: 0, wickets: 0, totalLegals: 0, totalBalls: 0 };
      }
    });

    if (currentOver.balls.length > 0) {
      overs.push(currentOver);
    }
    return overs;
  };

  const resetMatch = () => {
    const initialState: MatchState = {
      runs: 0,
      wickets: 0,
      totalBalls: 0,
      history: [],
      teamA: "টিম এ",
      teamB: "টিম বি",
      battingTeam: "",
      maxOvers: 20,
      tossWinner: "",
      tossDecision: "",
      target: null,
      isSecondInnings: false,
      playersCount: 11,
      firstInningsHistory: []
    };
    setState(initialState);
    localStorage.removeItem("cricket_match_state_v1");
    setIsSettingUpMatch(true);
    setShowGameOver(false);
  };

  const handleAction = useCallback((action: BallEvent, runValue: number = 0) => {
    setState(prev => {
      let newRuns = prev.runs;
      let newWickets = prev.wickets;
      let newTotalBalls = prev.totalBalls;

      // Check if the game or innings is already finished
      const isInningsOver = prev.wickets >= prev.playersCount - 1 || prev.totalBalls >= prev.maxOvers * 6;
      const isMatchOver = prev.isSecondInnings && (isInningsOver || (prev.target !== null && prev.runs >= prev.target));

      if (isMatchOver || showGameOver) {
        return prev;
      }

      if (isInningsOver && !prev.isSecondInnings) {
        setShowInningsBreak(true);
        return prev;
      }

      if (['0', '1', '2', '3', '4', '6'].includes(action)) {
        newRuns += runValue;
        newTotalBalls += 1;
      } else if (action === 'W') {
        newWickets = Math.min(prev.playersCount - 1, newWickets + 1);
        newTotalBalls += 1;
      } else if (action === 'NB' || action === 'WD') {
        newRuns += (runValue + 1);
      }

      // Check if innings just ended after this ball
      const inningsEndedAfterBall = newWickets >= prev.playersCount - 1 || newTotalBalls >= prev.maxOvers * 6;
      const targetReached = prev.isSecondInnings && prev.target !== null && newRuns >= prev.target;

      if (prev.isSecondInnings) {
        if (targetReached) {
          const wicketsLeft = (prev.playersCount - 1) - newWickets;
          setMatchResult({
            winner: prev.battingTeam,
            margin: `${BengaliNumbers(wicketsLeft)} উইকেটে জিতেছে`
          });
          setShowGameOver(true);
        } else if (inningsEndedAfterBall) {
          const firstInningsScore = (prev.target || 1) - 1;
          const bowlingTeam = prev.battingTeam === prev.teamA ? prev.teamB : prev.teamA;
          
          if (newRuns < (prev.target || 0)) {
            const runsWonBy = firstInningsScore - newRuns;
            setMatchResult({
              winner: bowlingTeam,
              margin: `${BengaliNumbers(runsWonBy)} রানে জিতেছে`
            });
          } else {
            setMatchResult({
              winner: "ড্র",
              margin: "ম্যাচ ড্র হয়েছে"
            });
          }
          setShowGameOver(true);
        }
      } else if (inningsEndedAfterBall) {
        setShowInningsBreak(true);
      }

      return {
        ...prev,
        runs: Math.max(0, newRuns),
        wickets: Math.max(0, newWickets),
        totalBalls: Math.max(0, newTotalBalls),
        history: [...prev.history, action]
      };
    });
  }, [showGameOver]);

  const saveTeamNames = () => {
    setState(prev => ({
      ...prev,
      teamA: tempTeamA,
      teamB: tempTeamB
    }));
    setIsEditingTeams(false);
  };

  const saveMatchSetup = () => {
    let initialBattingTeam = "";
    if (tempTossDecision === 'bat') {
      initialBattingTeam = tempTossWinner;
    } else if (tempTossDecision === 'bowl') {
      initialBattingTeam = tempTossWinner === tempTeamA ? tempTeamB : tempTeamA;
    }

    setState(prev => ({
      ...prev,
      teamA: tempTeamA,
      teamB: tempTeamB,
      battingTeam: initialBattingTeam,
      maxOvers: parseInt(tempMaxOvers, 10) || 1,
      playersCount: parseInt(tempPlayersCount, 10) || 1,
      tossWinner: tempTossWinner,
      tossDecision: tempTossDecision
    }));
    setIsSettingUpMatch(false);
  };

  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);

  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setCoinResult(null);
    
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'heads' : 'tails';
      setCoinResult(result);
      setIsFlipping(false);
      
      // Auto-assign toss winner if teams are selected
      if (tempTeamA && tempTeamB) {
        setTempTossWinner(result === 'heads' ? tempTeamA : tempTeamB);
      }
    }, 1000);
  };

  const saveAdvancedEdit = () => {
    const parts = tempOvers.split('.');
    const overs = parseInt(parts[0], 10) || 0;
    const balls = parseInt(parts[1], 10) || 0;
    const totalBallsCount = (overs * 6) + balls;

    // Cap wickets at playersCount - 1
    const finalWickets = Math.min(parseInt(tempWickets, 10) || 0, (parseInt(tempPlayersCount, 10) || 1) - 1);

    // Calculate batting team based on toss and innings
    let currentBattingTeam = "";
    if (tempTossDecision && tempTossWinner) {
      const winnerSelectedBat = tempTossDecision === 'bat';
      const tossWinner = tempTossWinner;
      const tossLoser = tempTossWinner === tempTeamA ? tempTeamB : tempTeamA;

      if (tempIsSecondInnings) {
        currentBattingTeam = winnerSelectedBat ? tossLoser : tossWinner;
      } else {
        currentBattingTeam = winnerSelectedBat ? tossWinner : tossLoser;
      }
    } else {
      currentBattingTeam = tempBattingTeam || (tempTeamA);
    }

    setState(prev => {
      const newState = {
        ...prev,
        runs: parseInt(tempRuns, 10) || 0,
        wickets: finalWickets,
        totalBalls: totalBallsCount,
        maxOvers: parseInt(tempMaxOvers, 10) || 1,
        playersCount: parseInt(tempPlayersCount, 10) || 1,
        isSecondInnings: tempIsSecondInnings,
        target: tempIsSecondInnings ? (parseInt(tempTarget, 10) || 0) : null,
        battingTeam: currentBattingTeam,
        teamA: tempTeamA,
        teamB: tempTeamB,
        tossWinner: tempTossWinner,
        tossDecision: tempTossDecision
      };

      // Check for completion conditions after manual edit
      const isInningsOver = newState.wickets >= newState.playersCount - 1 || newState.totalBalls >= newState.maxOvers * 6;
      
      if (newState.isSecondInnings) {
        const targetReached = newState.target !== null && newState.runs >= newState.target;
        if (targetReached) {
          const wicketsLeft = (newState.playersCount - 1) - newState.wickets;
          setMatchResult({
            winner: newState.battingTeam,
            margin: `${BengaliNumbers(wicketsLeft)} উইকেটে জিতেছে`
          });
          setShowGameOver(true);
        } else if (isInningsOver) {
          const firstInningsScore = (newState.target || 1) - 1;
          const bowlingTeam = newState.battingTeam === newState.teamA ? newState.teamB : newState.teamA;
          
          if (newState.runs < (newState.target || 0)) {
            const runsWonBy = firstInningsScore - newState.runs;
            setMatchResult({
              winner: bowlingTeam,
              margin: `${BengaliNumbers(runsWonBy)} রানে জিতেছে`
            });
          } else {
            setMatchResult({
              winner: "ড্র",
              margin: "ম্যাচ ড্র হয়েছে"
            });
          }
          setShowGameOver(true);
        }
      } else if (isInningsOver) {
        setShowInningsBreak(true);
      }

      return newState;
    });
    setIsSettingUpMatch(false);
  };

  const openSettings = () => {
    setTempRuns(state.runs.toString());
    setTempWickets(state.wickets.toString());
    setTempOvers(formatOvers(state.totalBalls));
    setTempIsSecondInnings(state.isSecondInnings);
    setTempTarget((state.target || (state.runs + 1)).toString());
    setTempMaxOvers(state.maxOvers.toString());
    setTempPlayersCount(state.playersCount.toString());
    setTempTeamA(state.teamA);
    setTempTeamB(state.teamB);
    setTempTossWinner(state.tossWinner);
    setTempTossDecision(state.tossDecision);
    
    setIsSettingUpMatch(true);
  };

  const setTargetManual = () => {
    const val = prompt("টার্গেট রান কত?");
    if (val) {
      setState(prev => ({
        ...prev,
        target: parseInt(val),
        isSecondInnings: true
      }));
    }
  };

  const startNextInnings = () => {
    setState(prev => {
      const nextBattingTeam = prev.battingTeam === prev.teamA ? prev.teamB : prev.teamA;
      return {
        ...prev,
        firstInningsHistory: [...prev.history],
        target: prev.runs + 1,
        battingTeam: nextBattingTeam,
        runs: 0,
        wickets: 0,
        totalBalls: 0,
        history: [],
        isSecondInnings: true
      };
    });
    setShowInningsBreak(false);
  };

  const undoLast = () => {
    if (state.history.length === 0) return;
    
    const lastAction = state.history[state.history.length - 1];
    setState(prev => {
      let newRuns = prev.runs;
      let newWickets = prev.wickets;
      let newTotalBalls = prev.totalBalls;
      const newHistory = prev.history.slice(0, -1);

      if (['0', '1', '2', '3', '4', '6'].includes(lastAction)) {
        newRuns -= parseInt(lastAction);
        newTotalBalls -= 1;
      } else if (lastAction === 'W') {
        newWickets -= 1;
        newTotalBalls -= 1;
      } else if (lastAction === 'NB' || lastAction === 'WD') {
        newRuns -= 1;
      }

      return {
        ...prev,
        runs: Math.max(0, newRuns),
        wickets: Math.max(0, newWickets),
        totalBalls: Math.max(0, newTotalBalls),
        history: newHistory
      };
    });
  };

  const [isCopied, setIsCopied] = useState(false);

  const shareScore = () => {
    const overs = formatOvers(state.totalBalls);
    const battingTeam = state.battingTeam || "টিম এ";
    
    let summary = `🏟️ ${state.teamA} বনাম ${state.teamB}\n`;
    summary += `🌟 ব্যাটিং: ${battingTeam}\n`;
    summary += `📊 স্কোর: ${BengaliNumbers(state.runs)}/${BengaliNumbers(state.wickets)}\n`;
    summary += `🥎 ওভার: ${BengaliNumbers(overs)} (${BengaliNumbers(state.maxOvers)} ওভারের মধ্যে)\n`;
    
    if (state.isSecondInnings && state.target) {
      const runsNeeded = state.target - state.runs;
      const ballsLeft = (state.maxOvers * 6) - state.totalBalls;
      if (runsNeeded > 0 && ballsLeft > 0) {
        summary += `📌 প্রয়োজন: ${BengaliNumbers(ballsLeft)} বলে ${BengaliNumbers(runsNeeded)} রান\n`;
      }
    }
    
    summary += `\n🚀 অ্যাপলিকেশন লিংক: ${window.location.origin}`;
    
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden pb-24">
      <div className="max-w-md mx-auto p-3 flex flex-col gap-4 min-h-screen">
        
        {/* Header Section: Compact for Mobile */}
        <header className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5" onClick={() => { setTempTeamA(state.teamA); setTempTeamB(state.teamB); setIsEditingTeams(true); }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">লাইভ</span>
            </div>
            <h1 className="text-sm font-black tracking-tighter uppercase text-white truncate max-w-[120px]">
              {state.battingTeam || (state.teamA + " বনাম " + state.teamB)}
            </h1>
            {state.tossWinner && (
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                টসে জয়ী: {state.tossWinner} ({state.tossDecision === 'bat' ? 'ব্যাটিং' : 'ফিল্ডিং'})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 transition-all active:scale-95"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={() => setIsShowingSavedMatches(true)}
              className="p-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 transition-all active:scale-95"
            >
              <Bookmark size={16} />
            </button>
            <button 
              onClick={() => setIsShowingDevPage(true)}
              className="p-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 transition-all active:scale-95"
            >
              <User size={16} />
            </button>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex flex-col items-center justify-center min-w-[70px] active:scale-95"
            >
              <RotateCcw size={14} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">ফুল রিসেট</span>
            </button>
          </div>
        </header>

        {/* Modals Section */}
        <AnimatePresence>
          {isShowingSavedMatches && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[280] bg-slate-950/98 backdrop-blur-3xl flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10 pt-4">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">সেভ করা ম্যাচ</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">আপনার রেকর্ড সমূহ</p>
                </div>
                <button onClick={() => setIsShowingSavedMatches(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400">
                  <RotateCcw className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-4 pb-20">
                {savedMatches.length === 0 && (
                  <div className="text-center py-20 bg-slate-900/30 rounded-[40px] border border-dashed border-slate-800">
                    <Bookmark size={40} className="mx-auto text-slate-800 mb-4" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">কোন সেভ করা ম্যাচ নেই</p>
                  </div>
                )}
                {savedMatches.map(match => (
                  <div key={match.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{match.dateStr} • {match.timeStr}</span>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">{match.matchState.teamA} বনাম {match.matchState.teamB}</h3>
                      </div>
                      <button 
                        onClick={() => setMatchToDelete(match.id)}
                        className="p-3 bg-rose-600/10 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">টোটাল স্কোর</span>
                        <span className="text-xl font-black text-white">
                          {BengaliNumbers(match.matchState.runs)}
                          <span className="text-slate-600 font-light mx-0.5">/</span>
                          <span className="text-rose-500">{BengaliNumbers(match.matchState.wickets)}</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">ওভার</span>
                        <span className="text-sm font-black text-blue-400">{BengaliNumbers(formatOvers(match.matchState.totalBalls))} / {BengaliNumbers(match.matchState.maxOvers)}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (window.confirm("এই ম্যাচ লোড করতে চান? বর্তমান প্রগ্রেস হারিয়ে যাবে।")) {
                          setState(match.matchState);
                          setIsShowingSavedMatches(false);
                          setIsShowingScorecard(true);
                        }
                      }}
                      className="w-full p-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all"
                    >
                      স্কোরকার্ড দেখুন
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {matchToDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-600/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
                  <Trash2 size={32} />
                </div>
                
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">মুছে ফেলুন?</h2>
                <p className="text-sm font-bold text-slate-300 leading-relaxed mb-8">
                  আপনার সেটা মুছতে ওকে ক্লিক করুন। এই রেকর্ডটি আর ফিরে পাওয়া যাবে না।
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => {
                      setSavedMatches(prev => prev.filter(m => m.id !== matchToDelete));
                      setMatchToDelete(null);
                    }}
                    className="w-full p-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-900/40 transition-all active:scale-95 text-center"
                  >
                    হ্যাঁ, মুছে ফেলুন
                  </button>
                  <button 
                    onClick={() => setMatchToDelete(null)}
                    className="w-full p-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                  >
                    না থাক
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showSaveConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 text-blue-500">
                  <Save size={32} />
                </div>
                
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">ম্যাচ সেভ করুন</h2>
                <p className="text-sm font-bold text-slate-300 leading-relaxed mb-8">
                  বর্তমান ম্যাচের ডাটা পার্মানেন্টলি সেভ করতে চান? এটি পরে হিস্ট্রি থেকে দেখতে পারবেন।
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={saveMatchManually}
                    className="w-full p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-95 text-center"
                  >
                    হ্যাঁ, সেভ করুন
                  </button>
                  <button 
                    onClick={() => setShowSaveConfirm(false)}
                    className="w-full p-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                  >
                    না, থাক
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {isShowingDevPage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-3xl flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-950/80 py-4 backdrop-blur-md z-10 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">IM Softworks</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Innovation & Possibilities</p>
                  </div>
                </div>
                <button onClick={() => setIsShowingDevPage(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:bg-slate-700 transition-all">
                  <RotateCcw className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-8 pb-24">
                {/* Connect Section (Donation) - Now at Top */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-500">
                      <div className="text-xl">🎁</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">ডোনেট করুন</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">সাপোর্ট আওয়ার টিম</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-5 rounded-3xl border border-white/5 space-y-4">
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        এটি একটি সম্পূর্ণ অ্যাড-ফ্রি এবং ফ্রি সার্ভিস। আমাদের এই ক্ষুদ্র প্রচেষ্টা সচল রাখতে আপনি চাইলে ডোনেট করতে পারেন।
                      </p>
                      <div className="bg-slate-900 p-4 rounded-2xl border border-rose-500/10 flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">বিকাশ / নগদ (পার্সোনাল)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-mono font-black text-blue-400 tracking-tighter">01753567152</span>
                          <button 
                            onClick={() => copyToClipboard("01753567152")}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hasCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                          >
                            {hasCopied ? "কপি" : "কপি"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <a href="mailto:im.softwark.team@gmail.com" className="w-full p-5 rounded-3xl bg-slate-800 flex flex-col items-center gap-1 hover:bg-slate-700 transition-all border border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">আমাদের সাথে যোগাযোগ করুন</span>
                      <span className="text-xs font-black text-blue-400">im.softwark.team@gmail.com</span>
                    </a>
                  </div>
                </div>

                {/* Intro Section */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4">
                      <div className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">🌐 IM Softworks</div>
                      <p className="text-sm font-bold text-slate-300 leading-relaxed">
                        IM Softworks একটি উদীয়মান সফটওয়্যার কোম্পানি, যা ভবিষ্যতমুখী প্রযুক্তি ও সৃজনশীল সমাধানের মাধ্যমে ক্লায়েন্টদের ব্যবসায়িক সাফল্যে সহায়তা করে। আমরা বিশ্বাস করি— আমাদের উন্নতি তখনই সম্ভব, যখন আমাদের ক্লায়েন্ট লাভবান হবেন।
                      </p>
                      <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 italic text-blue-400 text-sm font-black">
                        "আমরা শুধু সফটওয়্যার তৈরি করি না — আমরা সম্ভাবনা গড়ে তুলি।"
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">
                        IM Softworks is an emerging software company that empowers clients’ business success through futuristic technology and innovative solutions. We believe that our growth is only possible when our clients benefit. We don’t just build software — We build possibilities.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mission Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 bg-rose-600/20 rounded flex items-center justify-center text-rose-500 text-xs">🎯</span>
                    আমাদের লক্ষ্য (Our Mission)
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm font-black text-emerald-400">“আপনার লাভই আমাদের সফলতা।”</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      আমরা প্রতিটি প্রজেক্টে বিশ্বাস করি— যদি ক্লায়েন্ট উপকৃত হন, তবেই আমরা সফল। সেই লক্ষ্যেই আমাদের প্রতিটি কোড, প্রতিটি ডিজাইন এবং প্রতিটি আইডিয়া।
                    </p>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[11px] italic text-slate-500">
                        “Your profit is our success.” In every project, we believe that our true achievement lies in the client’s benefit.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center text-blue-500 text-xs">🔧</span>
                    আমাদের সার্ভিসসমূহ
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { bn: "কাস্টম সফটওয়্যার ডেভেলপমেন্ট", en: "Custom Software Development" },
                      { bn: "ওয়েব অ্যাপ্লিকেশন", en: "Web Applications" },
                      { bn: "মোবাইল অ্যাপ", en: "Mobile Apps" },
                      { bn: "ক্লাউড সল্যুশন", en: "Cloud Solutions" },
                      { bn: "API ডেভেলপমেন্ট", en: "API Development" },
                      { bn: "UI/UX ডিজাইন", en: "UI/UX Design" }
                    ].map((svc, i) => (
                      <div key={i} className="flex flex-col gap-0.5 p-3 bg-slate-950/50 rounded-2xl border border-white/5">
                        <span className="text-xs font-black text-slate-100">{svc.bn}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{svc.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About Me Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-blue-600/20 shadow-2xl relative"
                    >
                      <img 
                        src="https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg" 
                        alt="Mohammad Esa Ali" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white uppercase italic">👋 About Me</h3>
                      <p className="text-blue-500 font-black text-sm mt-1">Mohammad Esa Ali</p>
                    </div>
                  </div>
                  
                  <p className="text-sm font-bold text-slate-300 text-center leading-relaxed">
                    Hello, I am Mohammad Esa Ali, a passionate and creative tech enthusiast. I specialize in Software Development, Web Solutions, and Creative Design.
                  </p>
                  
                  <div className="bg-slate-950 p-5 rounded-3xl border border-white/5 text-center">
                    <p className="text-emerald-400 font-black text-sm">“Success comes when your clients succeed.”</p>
                  </div>
                </div>

                {/* Preview/Share Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">শেয়ার করুন</h3>
                    <button 
                      onClick={shareScore}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'}`}
                    >
                      {isCopied ? "কপি হয়েছে!" : "শেয়ার করুন"}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-blue-100 select-text">
                    {`🏟️ ${state.teamA} বনাম ${state.teamB}\n`}
                    {`🌟 ব্যাটিং: ${state.battingTeam || "টিম এ"}\n`}
                    {`📊 স্কোর: ${BengaliNumbers(state.runs)}/${BengaliNumbers(state.wickets)}\n`}
                    {`🥎 ওভার: ${BengaliNumbers(formatOvers(state.totalBalls))} (${BengaliNumbers(state.maxOvers)} ওভারের মধ্যে)\n\n`}
                    {`🚀 অ্যাপলিকেশন লিংক: ${window.location.origin}`}
                  </div>
                </div>

                {/* Footer Credits */}
                <div className="text-center space-y-2 opacity-50 pb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Copyright © IM Softwark
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-600/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
                  <RotateCcw size={32} />
                </div>
                
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">রিসেট কনফার্মেশন</h2>
                <p className="text-sm font-bold text-slate-300 leading-relaxed mb-8">
                  আপনার আগের সব ডেটা মুছতে ক্লিক করুন। এই অ্যাকশনটি আর ফিরিয়ে আনা যাবে না।
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => {
                      resetMatch();
                      setShowResetConfirm(false);
                    }}
                    className="w-full p-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-900/40 transition-all active:scale-95 text-center"
                  >
                    হ্যাঁ, সব মুছে ফেলুন
                  </button>
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="w-full p-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                  >
                    না, থাক
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isShowingDonation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                  <div className="text-3xl">🎁</div>
                </div>
                
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">স্বাগতম!</h2>
                
                <div className="space-y-4 mb-8">
                  <p className="text-sm font-bold text-slate-300 leading-relaxed">
                    এটি একটি সম্পূর্ণ অ্যাড-ফ্রি এবং ফ্রি সার্ভিস। আপনার ক্রিকেটের অভিজ্ঞতা আরও সহজ করতে আমরা এটি বানিয়েছি।
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    আমাদের এই ক্ষুদ্র প্রচেষ্টা সচল রাখতে আপনি চাইলে ডোনেট করতে পারেন।
                  </p>
                  
                  <div className="bg-slate-950 p-4 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">বিকাশ / নগদ (পার্সোনাল)</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-mono font-black text-blue-400">01753567152</span>
                      <button 
                        onClick={() => copyToClipboard("01753567152")}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hasCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {hasCopied ? "কপি হয়েছে" : "কপি"}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={closeDonation}
                  className="w-full p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                >
                  এরিয়ে যান
                </button>
              </div>
            </motion.div>
          )}

          {isShowingScorecard && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-slate-950/98 backdrop-blur-3xl flex flex-col p-4"
            >
              <div className="flex justify-between items-center mb-6 pt-4">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">স্কোরকার্ড ও হিস্ট্রি</h2>
                <button onClick={() => setIsShowingScorecard(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400">
                  <RotateCcw className="rotate-45" size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pb-12 scrollbar-hide">
                {/* Second Innings or Current Innings */}
                <InningsDetailedSummary 
                  title={state.isSecondInnings ? `${state.battingTeam} (২য় ইনিংস)` : `${state.battingTeam} (১ম ইনিংস)`}
                  history={state.history}
                  teamName={state.battingTeam}
                />

                {/* First Innings if applicable */}
                {state.isSecondInnings && (
                  <InningsDetailedSummary 
                    title={`${state.battingTeam === state.teamA ? state.teamB : state.teamA} (১ম ইনিংস)`}
                    history={state.firstInningsHistory}
                    teamName={state.battingTeam === state.teamA ? state.teamB : state.teamA}
                  />
                )}
              </div>
            </motion.div>
          )}
          {isShowingToss && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[160] bg-slate-950/98 backdrop-blur-3xl flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-10 pt-4">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">টস ও ইনিংস সিস্টেম</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ম্যাচের সিদ্ধান্ত নিন</p>
                </div>
                <button onClick={() => setIsShowingToss(false)} className="bg-slate-800 p-2 rounded-xl text-slate-400">
                  <RotateCcw className="rotate-45" size={24} />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-8">
                {/* Coin Flip Section */}
                <div className="flex flex-col items-center gap-6 py-10 bg-slate-900/50 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
                  
                  <motion.div 
                    animate={isFlipping ? { rotateY: 1800, scale: [1, 1.2, 1] } : { rotateY: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    onClick={flipCoin}
                    className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-500 border-8 border-yellow-700/50 flex items-center justify-center cursor-pointer shadow-2xl shadow-yellow-900/40 active:scale-90 relative z-10"
                  >
                    <div className="absolute inset-2 rounded-full border-2 border-yellow-300/30" />
                    <Coins size={48} className="text-yellow-900/80" />
                  </motion.div>
                  
                  <div className="text-center relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">টস বিজয়ী দল</p>
                    <h3 className="text-2xl font-black text-white italic uppercase">{tempTossWinner || "টস করুন"}</h3>
                  </div>
                </div>

                {/* Toss Configuration */}
                <div className="space-y-6">
                   <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">টসে জয়ী দল</label>
                    <select 
                      value={tempTossWinner}
                      onChange={(e) => setTempTossWinner(e.target.value)}
                      className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-4 text-white font-bold text-sm outline-none"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value={tempTeamA}>{tempTeamA}</option>
                      <option value={tempTeamB}>{tempTeamB}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">টসের সিদ্ধান্ত</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setTempTossDecision('bat')}
                        className={`p-5 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${tempTossDecision === 'bat' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-800 text-slate-500'}`}
                      >
                        ব্যাটিং
                      </button>
                      <button 
                        onClick={() => setTempTossDecision('bowl')}
                        className={`p-5 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${tempTossDecision === 'bowl' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-800 text-slate-500'}`}
                      >
                        ফিল্ডিং
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ম্যাচ কনফিগারেশন</label>
                    <button 
                      onClick={() => {
                        setActiveSettingsTab('setup');
                        openSettings();
                        setIsShowingToss(false);
                      }}
                      className="w-full p-5 rounded-3xl bg-slate-800 border-2 border-slate-700/50 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
                    >
                      <Settings size={18} />
                      সেটিং থেকে সেটআপ করুন
                    </button>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => {
                      saveAdvancedEdit();
                      setIsShowingToss(false);
                    }}
                    className="w-full p-6 rounded-[28px] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-emerald-900/40 transition-all active:scale-95"
                  >
                    ডিসিশন সেভ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border-2 border-emerald-500/30 p-10 rounded-[50px] w-full max-w-sm shadow-2xl shadow-emerald-500/10 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                
                <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
                  <Trophy size={48} className="animate-bounce" />
                </div>
                
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/70 mb-2">বিজয়ী ঘোষণা</h2>
                <h1 className="text-4xl font-black text-white italic uppercase mb-2 leading-none">{matchResult.winner}</h1>
                <p className="text-emerald-400 font-bold text-lg mb-8 tracking-tight">{matchResult.margin}</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700/50">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">মোট রান</span>
                      <span className="text-2xl font-black text-white">{BengaliNumbers(state.runs)}</span>
                    </div>
                    <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700/50">
                      <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">উইকেট</span>
                      <span className="text-2xl font-black text-rose-500">{BengaliNumbers(state.wickets)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={resetMatch}
                    className="w-full p-5 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    নতুন ম্যাচ শুরু করুন
                    <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  
                  <button 
                    onClick={() => setShowGameOver(false)}
                    className="w-full p-4 rounded-[20px] bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    স্কোরকার্ড দেখুন
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showInningsBreak && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <Trophy size={32} />
                </div>
                
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">ইনিংস শেষ</h2>
                <h1 className="text-2xl font-black text-white italic uppercase mb-6">{state.battingTeam} ইনিংস</h1>
                
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 mb-8">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-black text-white">{BengaliNumbers(state.runs)}</span>
                    <span className="text-xl font-light text-slate-600">/</span>
                    <span className="text-3xl font-black text-rose-500">{BengaliNumbers(state.wickets)}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {BengaliNumbers(formatOvers(state.totalBalls))} ওভার খেলা হয়েছে
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-bold text-slate-400">টার্গেট: <span className="text-blue-500 text-lg font-black">{BengaliNumbers(state.runs + 1)}</span> রান</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-2">এখন {state.battingTeam === state.teamA ? state.teamB : state.teamA} ব্যাটিং করবে</p>
                </div>

                <button 
                  onClick={startNextInnings}
                  className="w-full p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                >
                  ২য় ইনিংস শুরু করুন
                </button>
              </motion.div>
            </motion.div>
          )}

          {isSettingUpMatch && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-3 text-blue-500">
                    <Settings size={28} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white italic">সেটিংস ও কনফিগারেশন</h2>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-800/50 rounded-2xl mb-6">
                  <button 
                    onClick={() => setActiveSettingsTab('setup')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSettingsTab === 'setup' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    ম্যাচ সেটআপ
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('edit')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSettingsTab === 'edit' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    স্কোর পরিবর্তন
                  </button>
                </div>

                {activeSettingsTab === 'setup' ? (
                  <div className="flex flex-col gap-4 mb-8">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">১ম টিম</label>
                        <input 
                          type="text" 
                          value={tempTeamA}
                          onChange={(e) => setTempTeamA(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-bold text-xs focus:border-blue-500/50 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">২য় টিম</label>
                        <input 
                          type="text" 
                          value={tempTeamB}
                          onChange={(e) => setTempTeamB(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-bold text-xs focus:border-blue-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">নির্ধারিত ওভার</label>
                      <input 
                        type="number" 
                        value={tempMaxOvers}
                        onChange={(e) => setTempMaxOvers(e.target.value)}
                        className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-4 text-white font-black text-center text-xl focus:border-blue-500/50 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">প্লেয়ার সংখ্যা (প্রতি টিম)</label>
                      <input 
                        type="number" 
                        value={tempPlayersCount}
                        onChange={(e) => setTempPlayersCount(e.target.value)}
                        className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-4 text-white font-black text-center text-xl focus:border-blue-500/50 outline-none"
                      />
                    </div>
                    
                    <button 
                      onClick={saveMatchSetup} 
                      className="mt-4 p-5 rounded-2xl bg-emerald-600 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-95"
                    >
                      সেভ ও খেলা শুরু
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-8">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">বর্তমান রান</label>
                        <input 
                          type="number" 
                          value={tempRuns}
                          onChange={(e) => setTempRuns(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-black text-center text-lg focus:border-blue-500/50 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">উইকেট</label>
                        <input 
                          type="number" 
                          value={tempWickets}
                          max={state.playersCount - 1}
                          onChange={(e) => setTempWickets(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-black text-center text-lg focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">নির্ধারিত ওভার</label>
                        <input 
                          type="number" 
                          value={tempMaxOvers}
                          onChange={(e) => setTempMaxOvers(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-black text-center text-lg focus:border-blue-500/50 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">প্লেয়ার সংখ্যা</label>
                        <input 
                          type="number" 
                          value={tempPlayersCount}
                          onChange={(e) => setTempPlayersCount(e.target.value)}
                          className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-3 text-white font-black text-center text-lg focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">বর্তমান ওভার (উদাহরণ: ৫.২)</label>
                      <input 
                        type="text" 
                        value={tempOvers}
                        onChange={(e) => setTempOvers(e.target.value)}
                        className="bg-slate-800 border-2 border-slate-700/50 rounded-2xl p-4 text-white font-black text-center text-xl focus:border-blue-500/50 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">ইনিংস নির্বাচন</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            if (tempIsSecondInnings) {
                              setTempIsSecondInnings(false);
                            }
                          }}
                          className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!tempIsSecondInnings ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
                        >
                          ১ম ইনিংস
                        </button>
                        <button 
                          onClick={() => {
                            if (!tempIsSecondInnings) {
                              setTempIsSecondInnings(true);
                              setTempRuns(0);
                              setTempWickets(0);
                              setTempOvers("0.0");
                              setTempTarget(state.runs + 1);
                            }
                          }}
                          className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tempIsSecondInnings ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
                        >
                          ২য় ইনিংস
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setTempRuns(0);
                          setTempWickets(0);
                          setTempOvers("0.0");
                        }}
                        className="flex-1 p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all"
                      >
                        স্কোর ০ করুন
                      </button>
                    </div>

                    {tempIsSecondInnings && (
                      <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-1">টার্গেট রান (১ম ইনিংস রান + ১)</label>
                        <input 
                          type="number" 
                          value={tempTarget}
                          onChange={(e) => setTempTarget(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-center text-lg focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    )}
                    
                    <button 
                      onClick={saveAdvancedEdit} 
                      className="mt-4 p-5 rounded-2xl bg-blue-600 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95"
                    >
                      পরিবর্তন সেভ করুন
                    </button>
                    <p className="text-[7px] text-slate-600 text-center uppercase font-bold px-4">
                      সতর্কতা: এখান থেকে স্কোর পরিবর্তন করলে স্কোরকার্ডের বল-বাই-বল হিস্ট্রি আপডেট হবে না।
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => setIsSettingUpMatch(false)} 
                  className="w-full p-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 mt-2"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Big Score Card: Mobile Optimized */}
        <div className="bg-gradient-to-br from-slate-900 to-black p-4 rounded-[32px] border border-white/5 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden text-center min-h-[140px]">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full"></div>
          
          <motion.div 
            key={`${state.runs}-${state.wickets}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black leading-none text-white drop-shadow-lg tracking-tighter">
                {BengaliNumbers(state.runs)}
              </span>
              <span className="text-2xl font-light text-slate-600">/</span>
              <span className="text-3xl font-black text-rose-500">
                {BengaliNumbers(state.wickets)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{state.battingTeam}</span>
              <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </motion.div>
          
          <div className="mt-2">
            <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 backdrop-blur-md flex items-center gap-2">
              <span className="text-slate-500 text-[8px] uppercase font-black tracking-widest">ওভার</span>
              <span className="text-base font-mono font-bold text-white tracking-widest">
                {BengaliNumbers(formatOvers(state.totalBalls))} 
                <span className="text-slate-600 mx-0.5">/</span>
                <span className="text-slate-400">{BengaliNumbers(state.maxOvers)}</span>
              </span>
            </div>
          </div>
          
          {state.isSecondInnings && state.target !== null && (
            <div className="mt-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                    {state.battingTeam === state.teamA ? state.teamB : state.teamA} (১ম ইনিংস)
                  </span>
                  <span className="text-xs font-black text-slate-400">{state.target ? BengaliNumbers(state.target - 1) : '-'}</span>
                </div>
                <div className="h-6 w-[1px] bg-slate-800" />
                <div className="flex flex-col items-center text-blue-500">
                  <span className="text-[7px] font-black uppercase tracking-widest mb-0.5">টার্গেট</span>
                  <span className="text-xs font-black">{BengaliNumbers(state.target)}</span>
                </div>
              </div>
              <div className="bg-emerald-600/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-950/20">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">
                  {BengaliNumbers(Math.max(0, state.maxOvers * 6 - state.totalBalls))} বলে {BengaliNumbers(Math.max(0, state.target - state.runs))} রান প্রয়োজন
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ball Tracker (This Over) */}
        <div className="bg-slate-900/30 p-3 rounded-2xl border border-slate-800/40">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">চলমান ওভার</h2>
            <div className="flex gap-1">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full transition-colors ${i < (state.totalBalls % 6) ? 'bg-blue-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide min-h-[40px] items-center text-center">
            <AnimatePresence mode="popLayout">
              {getOverHistory(state.history).map((event, i) => (
                <motion.div
                  key={`${event}-${i}-${state.history.length}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border
                    ${event === 'W' ? 'bg-rose-600 border-rose-400 text-white' : 
                      event === '4' ? 'bg-emerald-600 border-emerald-400 text-white' :
                      event === '6' ? 'bg-blue-600 border-blue-400 text-white' :
                      event === 'NB' || event === 'WD' ? 'bg-amber-500 border-amber-300 text-slate-950' :
                      'bg-slate-800 border-slate-700 text-slate-300'}
                  `}
                >
                  {event === 'W' ? 'W' : 
                   event === 'NB' ? 'NB' : 
                   event === 'WD' ? 'WD' : 
                   BengaliNumbers(event)}
                </motion.div>
              ))}
              {getOverHistory(state.history).length === 0 && (
                <p className="text-slate-700 text-[9px] font-bold uppercase tracking-widest px-2">বল নেই</p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Controls: Action Grid for Mobile */}
        <div className="grid grid-cols-4 gap-2">
          <ControlBtn onClick={() => handleAction('0', 0)} label="০" sub="ডট" />
          <ControlBtn onClick={() => handleAction('1', 1)} label="১" sub="রান" />
          <ControlBtn onClick={() => handleAction('2', 2)} label="২" sub="রান" />
          <ControlBtn onClick={() => handleAction('3', 3)} label="৩" sub="রান" />
          
          <ControlBtn onClick={() => handleAction('4', 4)} label="৪" sub="চার" variant="emerald" />
          <ControlBtn onClick={() => handleAction('6', 6)} label="৬" sub="ছয়" variant="blue" />
          <ControlBtn onClick={() => handleAction('WD')} label="WD" sub="ওয়াইড" variant="amber" />
          <ControlBtn onClick={() => handleAction('NB')} label="NB" sub="নো-বল" variant="amber" />

          {/* Large Primary Actions */}
          <button 
            onClick={() => handleAction('W')}
            className="col-span-2 bg-rose-600 hover:bg-rose-500 border border-rose-500 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-900/20 text-white"
          >
            উইকেট (W)
          </button>

          <button 
            onClick={undoLast}
            className="col-span-1 bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center text-slate-400"
          >
            <Undo2 size={14} />
          </button>

          <button 
            onClick={resetMatch}
            className="col-span-1 bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center text-slate-400"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Small Progress / Stat Footer */}
        <div className="bg-slate-900/20 p-2 rounded-xl flex justify-between items-center mb-1">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">প্রাক্কলিত রান</span>
            <span className="text-xs font-bold text-slate-400">
              {state.totalBalls > 0 
                ? BengaliNumbers(Math.round((state.runs / state.totalBalls) * 120)) 
                : BengaliNumbers('০')}
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">ইকনোমি</span>
            <span className="text-xs font-bold text-slate-400">
              {state.totalBalls > 0 
                ? BengaliNumbers(((state.runs / state.totalBalls) * 6).toFixed(1)) 
                : BengaliNumbers('০.০')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Floating Save Match Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto z-40 pointer-events-none">
        <div className="flex justify-end pointer-events-auto">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSaveConfirm(true)}
            className="flex items-center gap-2 bg-blue-600 p-2.5 px-4 rounded-2xl border-4 border-slate-950 shadow-2xl shadow-blue-900/50 text-white"
          >
            <Save size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">ম্যাচ সেভ</span>
          </motion.button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-3xl border-t border-slate-800/50 px-6 py-3 pb-8 flex justify-between items-center max-w-lg mx-auto z-50 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <NavIcon icon={<Home size={22} />} label="স্কোর" active={!isShowingScorecard && !isShowingToss} onClick={() => { setIsShowingScorecard(false); setIsShowingToss(false); }} />
        <NavIcon icon={<History size={22} />} label="হিস্ট্রি" active={isShowingScorecard} onClick={() => { setIsShowingScorecard(true); setIsShowingToss(false); }} />
        <NavIcon icon={<Coins size={22} />} label="টস" active={isShowingToss} onClick={() => { setIsShowingToss(true); setIsShowingScorecard(false); }} />
        <NavIcon icon={<Settings size={22} />} label="সেটিংস" active={isSettingUpMatch} onClick={openSettings} />
      </nav>
    </div>
  );
}

function InningsDetailedSummary({ title, history, teamName }: { title: string, history: BallEvent[], teamName: string }) {
  const getInningsSummary = (hist: BallEvent[]) => {
    const overs: { balls: BallEvent[]; runs: number; wickets: number; totalLegals: number; totalBalls: number }[] = [];
    let currentOver = { balls: [] as BallEvent[], runs: 0, wickets: 0, totalLegals: 0, totalBalls: 0 };
    
    hist.forEach(ball => {
      currentOver.balls.push(ball);
      currentOver.totalBalls++;
      
      if (['0', '1', '2', '3', '4', '6'].includes(ball)) {
        currentOver.runs += parseInt(ball);
        currentOver.totalLegals++;
      } else if (ball === 'W') {
        currentOver.wickets++;
        currentOver.totalLegals++;
      } else if (ball === 'NB' || ball === 'WD') {
        currentOver.runs += 1;
      }

      if (currentOver.totalLegals === 6) {
        overs.push(currentOver);
        currentOver = { balls: [], runs: 0, wickets: 0, totalLegals: 0, totalBalls: 0 };
      }
    });

    if (currentOver.balls.length > 0) {
      overs.push(currentOver);
    }
    return overs;
  };

  const oversData = getInningsSummary(history);
  const totalRuns = history.reduce((acc, curr) => {
    if (['0', '1', '2', '3', '4', '6'].includes(curr)) return acc + parseInt(curr);
    if (curr === 'NB' || curr === 'WD') return acc + 1;
    return acc;
  }, 0);
  const totalWickets = history.filter(b => b === 'W').length;

  return (
    <div className="bg-slate-900/50 rounded-[32px] border border-slate-800 p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-black text-white italic truncate max-w-[180px]">{teamName}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {BengaliNumbers(totalRuns)}
            <span className="text-slate-600 font-light mx-0.5">/</span>
            <span className="text-rose-500">{BengaliNumbers(totalWickets)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {oversData.map((over, index) => (
          <div key={index} className="flex flex-col gap-2 bg-slate-800/30 p-4 rounded-[24px] border border-white/5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ওভার {BengaliNumbers(index + 1)}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">{BengaliNumbers(over.totalBalls)} বল</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-black text-emerald-400">{BengaliNumbers(over.runs)} রান</span>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {over.balls.map((ball, i) => (
                <div 
                  key={i}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border flex-shrink-0
                    ${ball === 'W' ? 'bg-rose-600 border-rose-400 text-white' : 
                      ball === '4' ? 'bg-emerald-600 border-emerald-400 text-white' :
                      ball === '6' ? 'bg-blue-600 border-blue-400 text-white' :
                      ball === 'NB' || ball === 'WD' ? 'bg-amber-500 border-amber-300 text-slate-950' :
                      'bg-slate-800 border-slate-700 text-slate-400'}
                  `}
                >
                  {ball === 'W' ? 'W' : 
                   ball === 'NB' ? 'NB' : 
                   ball === 'WD' ? 'WD' : 
                   BengaliNumbers(ball)}
                </div>
              ))}
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest italic">কোন ডাটা নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface NavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavIcon({ icon, label, active = false, onClick }: NavIconProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 group transition-colors ${active ? 'text-blue-500' : 'text-slate-500'}`}
    >
      <div className={`p-1 transition-transform group-active:scale-90 ${active ? 'text-blue-500' : 'text-slate-500'}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

interface ControlBtnProps {
  label: string;
  sub: string;
  onClick: () => void;
  variant?: 'slate' | 'emerald' | 'blue' | 'amber';
}

function ControlBtn({ label, sub, onClick, variant = 'slate' }: ControlBtnProps) {
  const styles = {
    slate: 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-900/20',
    blue: 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/20',
    amber: 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-900/20'
  };

  return (
    <button 
      onClick={onClick}
      className={`${styles[variant]} p-2.5 rounded-xl border text-xl font-black transition-all active:scale-95 flex flex-col items-center justify-center gap-0 group`}
    >
      <span>{BengaliNumbers(label)}</span>
      <span className="text-[7px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {sub}
      </span>
    </button>
  );
}

