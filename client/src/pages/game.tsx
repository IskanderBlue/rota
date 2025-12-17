import { useState, useEffect } from 'react';
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
  WINNING_LINES 
} from '@/lib/rota';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Images
import romanEagle from '@assets/generated_images/roman_legion_eagle_emblem.png';
import gaulBoar from '@assets/generated_images/celtic_gaul_boar_emblem.png';
import carthageTanit from '@assets/generated_images/carthaginian_tanit_emblem.png';
import parthianHorse from '@assets/generated_images/parthian_horse_emblem.png';

const SKINS_INFO: Record<string, { name: string, winMsg: string }> = {
  roman: { name: 'Roman Legion', winMsg: 'ROMA VICTRIX!' },
  gaul: { name: 'Gallic Tribes', winMsg: 'GALLIA VICTRIX!' },
  carthage: { name: 'Carthage', winMsg: 'CARTHAGO VICTRIX!' },
  parthian: { name: 'Parthian Empire', winMsg: 'PARTHIA VICTRIX!' },
};

export default function Game() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const { toast } = useToast();
  
  const mode = params.get('mode') || 'ai'; // 'ai' or 'local'
  const p1Skin = params.get('p1') || 'roman';
  const p2Skin = params.get('p2') || 'gaul';

  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('p1');
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pieceCount, setPieceCount] = useState(0);

  // Helper to find winning line visually
  const findWinningLine = (b: BoardState, p: Player) => {
    for (const line of WINNING_LINES) {
      const [x, y, z] = line;
      if (b[x] === p && b[y] === p && b[z] === p) return line;
    }
    return null;
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setTurn('p1');
    setPhase('placement');
    setWinner(null);
    setWinningLine(null);
    setSelectedPiece(null);
    setPieceCount(0);
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
      }, 800); // Delay for realism
      return () => clearTimeout(timer);
    }
  }, [turn, phase, board, winner, mode]);

  const performPlacement = (index: number, player: Player) => {
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    
    // Check win (unlikely in placement but possible in some variants, though usually 3 pieces min)
    // Rota usually doesn't end in placement unless blocked?
    // We'll stick to: Check win immediately.
    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(findWinningLine(newBoard, w));
      setPhase('gameover');
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
    
    setTurn(player === 'p1' ? 'p2' : 'p1');
  };

  const performMovement = (from: number, to: number, player: Player) => {
    const newBoard = [...board];
    newBoard[from] = null;
    newBoard[to] = player;
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(findWinningLine(newBoard, w));
      setPhase('gameover');
    } else {
      setTurn(player === 'p1' ? 'p2' : 'p1');
    }
    setSelectedPiece(null);
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

      <div className="absolute top-4 right-4 z-20">
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
              <h1 className="text-4xl font-serif font-bold text-primary mb-4">
                {winner === 'p1' ? SKINS_INFO[p1Skin]?.winMsg : SKINS_INFO[p2Skin]?.winMsg}
              </h1>
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
