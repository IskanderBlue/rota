import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { RotaBoard } from '@/components/RotaBoard';
import { Button } from '@/components/ui/button';
import { 
  BoardState, 
  Player, 
  GamePhase, 
  checkWinner, 
  getValidMoves, 
  makeAiMove, 
  checkForThreat,
  WINNING_LINES 
} from '@/lib/rota';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Images
import romanEagle from '@assets/generated_images/roman_legion_eagle_emblem.png';
import gaulBoar from '@assets/generated_images/celtic_gaul_boar_emblem.png';
import carthageTanit from '@assets/generated_images/carthaginian_tanit_emblem.png';
import parthianHorse from '@assets/generated_images/parthian_horse_emblem.png';

const SKINS_INFO: Record<string, { name: string, winMsg: string, img: string }> = {
  roman: { name: 'Roman Legion', winMsg: 'ROMA VICTRIX!', img: romanEagle },
  gaul: { name: 'Gallic Tribes', winMsg: 'GALLIA VICTRIX!', img: gaulBoar },
  carthage: { name: 'Carthage', winMsg: 'CARTHAGO VICTRIX!', img: carthageTanit },
  parthian: { name: 'Parthian Empire', winMsg: 'PARTHIA VICTRIX!', img: parthianHorse },
};

// Audio Helper
const playSound = (type: 'chime' | 'cheer' | 'move', enabled: boolean) => {
  if (!enabled) return;
  
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  if (type === 'move') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }
  else if (type === 'chime') {
    // Simple major chord arpeggio
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.5);
    });
  } else if (type === 'cheer') {
    // Victory fanfare ish
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.8);
    });
  }
};

export default function Game() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const { toast } = useToast();
  
  const mode = params.get('mode') || 'ai'; 
  const p1Skin = params.get('p1') || 'roman';
  const p2Skin = params.get('p2') || 'gaul';
  const startParam = params.get('start') || 'p1';
  const wifeMode = params.get('wife') === 'true';

  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  
  // Initialize turn based on start param
  // We need to store the *actual* starting player for Wife Mode logic
  const [actualStartingPlayer, setActualStartingPlayer] = useState<Player>(() => {
    if (startParam === 'random') return Math.random() > 0.5 ? 'p1' : 'p2';
    return startParam === 'p1' ? 'p1' : 'p2';
  });

  const [turn, setTurn] = useState<Player>(actualStartingPlayer);
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pieceCount, setPieceCount] = useState(0);

  // Audio State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // History for repetition check
  const [history, setHistory] = useState<string[]>([]);

  // Helper to find winning line visually
  const findWinningLine = (b: BoardState, p: Player) => {
    for (const line of WINNING_LINES) {
      const [x, y, z] = line;
      if (b[x] === p && b[y] === p && b[z] === p) return line;
    }
    return null;
  };

  const checkRepetition = (currentBoard: BoardState) => {
    if (!wifeMode) return false;
    
    const boardStr = currentBoard.join(',');
    const newHistory = [...history, boardStr];
    setHistory(newHistory);

    // Count occurrences
    const count = newHistory.filter(s => s === boardStr).length;
    return count >= 3;
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    // Recalculate random start on reset if needed, or keep same? Usually reset = new game = new coin flip.
    const nextStart = startParam === 'random' ? (Math.random() > 0.5 ? 'p1' : 'p2') : (startParam === 'p1' ? 'p1' : 'p2');
    setActualStartingPlayer(nextStart);
    setTurn(nextStart);
    setPhase('placement');
    setWinner(null);
    setWinningLine(null);
    setSelectedPiece(null);
    setPieceCount(0);
    setHistory([]);
  };

  // AI Turn Effect
  useEffect(() => {
    if (mode === 'ai' && turn === 'p2' && !winner) {
      const timer = setTimeout(() => {
        const move = makeAiMove(board, phase, 'p2');
        if (move) {
          if (phase === 'placement') {
            performPlacement(move.to, 'p2');
          } else {
            performMovement(move.from!, move.to, 'p2');
          }
        }
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [turn, phase, board, winner, mode]);

  const performPlacement = (index: number, player: Player) => {
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    playSound('move', soundEnabled);
    
    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(findWinningLine(newBoard, w));
      setPhase('gameover');
      playSound('cheer', soundEnabled);
      return;
    }

    const newCount = pieceCount + 1;
    setPieceCount(newCount);

    if (newCount >= 6) {
      setPhase('movement');
      toast({
        title: "All Units Deployed",
        description: "Movement Phase Begins! Move your pieces to adjacent empty spots.",
        duration: 3000,
      });
    }
    
    const nextPlayer = player === 'p1' ? 'p2' : 'p1';
    setTurn(nextPlayer);
    
    // Check threat for NEXT player (to warn them)
    if (checkForThreat(newBoard, nextPlayer)) {
       playSound('chime', soundEnabled);
    }
  };

  const performMovement = (from: number, to: number, player: Player) => {
    const newBoard = [...board];
    newBoard[from] = null;
    newBoard[to] = player;
    setBoard(newBoard);
    playSound('move', soundEnabled);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(findWinningLine(newBoard, w));
      setPhase('gameover');
      playSound('cheer', soundEnabled);
      return;
    }

    // Check Repetition (Wife Mode)
    if (checkRepetition(newBoard)) {
      // Starting player loses
      const loser = actualStartingPlayer;
      const winnerByDefault = loser === 'p1' ? 'p2' : 'p1';
      setWinner(winnerByDefault);
      setPhase('gameover');
      toast({
        title: "Stalemate Detected!",
        description: "Threefold repetition rule invoked. Starting player loses.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    const nextPlayer = player === 'p1' ? 'p2' : 'p1';
    setTurn(nextPlayer);
    setSelectedPiece(null);

    // Check threat for NEXT player
    if (checkForThreat(newBoard, nextPlayer)) {
       playSound('chime', soundEnabled);
    }
  };

  const handleCellClick = (index: number) => {
    if (winner || (mode === 'ai' && turn === 'p2')) return;

    if (phase === 'placement') {
      if (board[index] === null) {
        performPlacement(index, turn!);
      }
    } else if (phase === 'movement') {
      // If clicking own piece -> select
      if (board[index] === turn) {
        setSelectedPiece(index);
      }
      // If clicking empty spot and have selection -> try move
      else if (board[index] === null && selectedPiece !== null) {
        const validMoves = getValidMoves(board, turn, 'movement', selectedPiece);
        if (validMoves.includes(index)) {
          performMovement(selectedPiece, index, turn!);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* HUD */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" className="text-stone-700 hover:bg-stone-200/50" onClick={() => setLocation('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Exit
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-stone-700 hover:bg-stone-200/50"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-stone-700 hover:bg-stone-200/50">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#f2efe9] border-stone-400 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-primary text-center">Rules of Engagement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 font-serif text-stone-700">
              <div className={`p-3 rounded-lg border ${phase === 'placement' ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent opacity-60'}`}>
                <h3 className="font-bold text-lg mb-1">Phase I: Muster</h3>
                <p>Players take turns placing one piece on the board in any open spot.</p>
              </div>
              
              <div className={`p-3 rounded-lg border ${phase === 'movement' ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent opacity-60'}`}>
                <h3 className="font-bold text-lg mb-1">Phase II: March</h3>
                <p className="mb-2">After all the pieces are on the board, a player moves one piece each turn onto the next empty spot (along spokes or circle).</p>
                <p className="font-bold text-sm uppercase mb-1">A player may not:</p>
                <ul className="list-disc list-outside ml-4 space-y-1 text-sm">
                  <li>Skip a turn, even if the move forces you to lose the game</li>
                  <li>Jump over another piece</li>
                  <li>Move more than one space</li>
                  <li>Land on a space with a piece already on it</li>
                  <li>Knock a piece off a space</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" className="text-stone-700 hover:bg-stone-200/50" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 text-center z-10"
      >
        <h2 className="text-3xl font-serif font-bold text-primary mb-2 drop-shadow-sm">
          {winner ? 'VICTORY' : phase === 'placement' ? 'Muster Forces' : 'Battle Phase'}
        </h2>
        <p className="text-stone-600 font-medium">
          {winner ? (
             <span className="text-xl text-primary font-bold">
               {winner === 'p1' ? SKINS_INFO[p1Skin]?.name : SKINS_INFO[p2Skin]?.name} Wins!
             </span>
          ) : (
            <span>
              Turn: <span className={turn === 'p1' ? 'text-primary font-bold' : 'text-blue-700 font-bold'}>
                {turn === 'p1' ? SKINS_INFO[p1Skin]?.name : SKINS_INFO[p2Skin]?.name}
              </span>
            </span>
          )}
        </p>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg z-10"
      >
        <RotaBoard
          board={board}
          phase={phase}
          currentPlayer={turn!}
          selectedPiece={selectedPiece}
          validMoves={selectedPiece !== null ? getValidMoves(board, turn, phase, selectedPiece) : []}
          onCellClick={handleCellClick}
          player1Skin={p1Skin}
          player2Skin={p2Skin}
          winningLine={winningLine}
        />
      </motion.div>

      {/* Game Over Modal Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card border-2 border-primary/30 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-24 h-24 rounded-full border-4 border-primary shadow-xl overflow-hidden bg-stone-800"
                >
                  <img 
                    src={winner === 'p1' ? SKINS_INFO[p1Skin]?.img : SKINS_INFO[p2Skin]?.img} 
                    alt="Winner Emblem" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <h1 className="text-4xl font-serif font-bold text-primary mb-2">
                  {winner === 'p1' ? SKINS_INFO[p1Skin]?.winMsg : SKINS_INFO[p2Skin]?.winMsg}
                </h1>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full btn-roman bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
                  onClick={handleReset}
                >
                  Play Again
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-stone-400 text-stone-700 hover:bg-stone-200"
                  onClick={() => setLocation('/')}
                >
                  Return to Camp
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
