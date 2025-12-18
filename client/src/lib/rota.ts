export type Player = 'p1' | 'p2' | null;
export type GamePhase = 'placement' | 'movement' | 'gameover';
export type BoardState = Player[];

export const WINNING_LINES = [
  // Diameter (through center 0)
  [1, 0, 5],
  [2, 0, 6],
  [3, 0, 7],
  [4, 0, 8],
  // Rim arcs
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5],
  [4, 5, 6],
  [5, 6, 7],
  [6, 7, 8],
  [7, 8, 1],
  [8, 1, 2]
];

export const ADJACENCY: Record<number, number[]> = {
  0: [1, 2, 3, 4, 5, 6, 7, 8],
  1: [0, 2, 8],
  2: [0, 1, 3],
  3: [0, 2, 4],
  4: [0, 3, 5],
  5: [0, 4, 6],
  6: [0, 5, 7],
  7: [0, 6, 8],
  8: [0, 7, 1]
};

export function checkWinner(board: BoardState): Player | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function checkForThreat(board: BoardState, player: Player, phase: GamePhase): boolean {
  // Check if player has 2 in a row with 3rd empty
  // AND if they can actually execute the win next turn
  
  for (const line of WINNING_LINES) {
    const cells = line.map(idx => ({ idx, val: board[idx] }));
    const playerCells = cells.filter(c => c.val === player);
    const emptyCells = cells.filter(c => c.val === null);
    
    if (playerCells.length === 2 && emptyCells.length === 1) {
      const emptySpotIndex = emptyCells[0].idx;

      if (phase === 'placement') {
        // In placement, any empty spot is valid unless game ends before (not possible here)
        return true;
      } else if (phase === 'movement') {
        // In movement, the player must have a 3rd piece that is adjacent to the empty spot
        // Find the player's pieces NOT in this line
        const allPlayerPieces = board.map((c, i) => c === player ? i : -1).filter(i => i !== -1);
        const piecesInLine = playerCells.map(c => c.idx);
        const freePiece = allPlayerPieces.find(p => !piecesInLine.includes(p));
        
        if (freePiece !== undefined) {
           const neighbors = ADJACENCY[freePiece];
           if (neighbors.includes(emptySpotIndex)) {
             return true;
           }
        }
      }
    }
  }
  return false;
}

export function getValidMoves(board: BoardState, player: Player, phase: GamePhase, selectedIndex?: number): number[] {
  if (phase === 'placement') {
    // Can place anywhere empty
    return board.map((cell, idx) => cell === null ? idx : -1).filter(idx => idx !== -1);
  } else if (phase === 'movement') {
    if (selectedIndex === undefined) return [];
    // Can move to adjacent empty spots
    const neighbors = ADJACENCY[selectedIndex];
    return neighbors.filter(idx => board[idx] === null);
  }
  return [];
}

export function makeAiMove(board: BoardState, phase: GamePhase, aiPlayer: Player): { from?: number, to: number } | null {
  // 1. Check for winning move
  // 2. Check for blocking move
  // 3. Random valid move
  
  // Helper to simulate move
  const tryMove = (b: BoardState, idx: number, player: Player) => {
    const newB = [...b];
    newB[idx] = player;
    return checkWinner(newB) === player;
  };

  if (phase === 'placement') {
    const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
    
    // Try to win
    for (const idx of empty) {
      if (tryMove(board, idx, aiPlayer)) return { to: idx };
    }
    
    // Try to block
    const opponent = aiPlayer === 'p1' ? 'p2' : 'p1';
    for (const idx of empty) {
      if (tryMove(board, idx, opponent)) return { to: idx };
    }
    
    // Pick center if available (strategic)
    if (board[0] === null) return { to: 0 };
    
    // Random
    return { to: empty[Math.floor(Math.random() * empty.length)] };
  } 
  
  if (phase === 'movement') {
    // AI Movement is harder to check all perms simply, so we'll do:
    // Find all AI pieces
    const myPieces = board.map((c, i) => c === aiPlayer ? i : -1).filter(i => i !== -1);
    const allMoves: { from: number, to: number }[] = [];
    
    for (const from of myPieces) {
      const validTo = getValidMoves(board, aiPlayer, 'movement', from);
      for (const to of validTo) {
        allMoves.push({ from, to });
      }
    }
    
    if (allMoves.length === 0) return null; // Trapped? (Rota doesn't usually have stalemate but possible)

    // Try win
    for (const move of allMoves) {
      const tempBoard = [...board];
      tempBoard[move.from] = null;
      tempBoard[move.to] = aiPlayer;
      if (checkWinner(tempBoard) === aiPlayer) return move;
    }
    
    // Block (simplified: just check immediate next state)
    // Ideally we check if *not* making a move lets opponent win, but that's Minimax depth 2.
    // We'll just play random for now if no immediate win.
    
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  return null;
}
