import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardState, Player, GamePhase, ADJACENCY } from '@/lib/rota';
import { cn } from '@/lib/utils';

import romanEagle from '@assets/generated_images/roman_legion_eagle_emblem.png';
import gaulBoar from '@assets/generated_images/celtic_gaul_boar_emblem.png';
import carthageTanit from '@assets/generated_images/carthaginian_tanit_emblem.png';
import parthianHorse from '@assets/generated_images/parthian_horse_emblem.png';

interface RotaBoardProps {
  board: BoardState;
  phase: GamePhase;
  currentPlayer: Player;
  selectedPiece: number | null;
  validMoves: number[];
  onCellClick: (index: number) => void;
  player1Skin: string;
  player2Skin: string;
  winningLine: number[] | null;
}

const SKINS: Record<string, string> = {
  roman: romanEagle,
  gaul: gaulBoar,
  carthage: carthageTanit,
  parthian: parthianHorse,
};

export function RotaBoard({
  board,
  phase,
  currentPlayer,
  selectedPiece,
  validMoves,
  onCellClick,
  player1Skin,
  player2Skin,
  winningLine
}: RotaBoardProps) {

  // Board coordinates: 0 is center, 1-8 are rim (clockwise from top)
  const radius = 35;
  const center = 50;
  
  const getCoord = (index: number) => {
    if (index === 0) return { x: center, y: center };
    // -90 degrees to start at top (12 o'clock)
    // 8 points -> 45 degrees (PI/4) increments
    // Index 1 is Top (270 deg or -90 deg)
    const angle = (index - 1) * (Math.PI / 4) - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  const points = Array.from({ length: 9 }, (_, i) => ({ id: i, ...getCoord(i) }));

  // Generate lines
  const lines = [];
  // Spokes (0 to 1-8)
  for (let i = 1; i <= 8; i++) {
    lines.push({ from: 0, to: i });
  }
  // Rim (1-2, 2-3, ... 8-1)
  for (let i = 1; i <= 8; i++) {
    lines.push({ from: i, to: i === 8 ? 1 : i + 1 });
  }

  return (
    <div className="relative w-full max-w-md aspect-square mx-auto p-4 select-none">
      {/* Board Background */}
      <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
        {/* Outer Rim Circle */}
        <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="1.5" className="text-stone-400 opacity-50 fill-none" />
        
        {/* Lines */}
        {lines.map((line, idx) => {
          const p1 = getCoord(line.from);
          const p2 = getCoord(line.to);
          return (
            <line
              key={`line-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-stone-400 opacity-50"
            />
          );
        })}

        {/* Highlight Winning Line */}
        {winningLine && (
           <motion.path
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: 1, opacity: 1 }}
             d={`M ${getCoord(winningLine[0]).x} ${getCoord(winningLine[0]).y} L ${getCoord(winningLine[1]).x} ${getCoord(winningLine[1]).y} L ${getCoord(winningLine[2]).x} ${getCoord(winningLine[2]).y}`}
             fill="none"
             stroke="hsl(var(--primary))"
             strokeWidth="4"
             strokeLinecap="round"
             className="drop-shadow-lg"
           />
        )}
      </svg>

      {/* Interactive Points */}
      {points.map((point) => {
        const cellValue = board[point.id];
        const isSelected = selectedPiece === point.id;
        const isValidMove = validMoves.includes(point.id);
        const isClickable = 
          (phase === 'placement' && cellValue === null) ||
          (phase === 'movement' && currentPlayer === cellValue) ||
          (phase === 'movement' && isValidMove);

        // Determine token image
        const tokenImg = cellValue === 'p1' ? SKINS[player1Skin] : cellValue === 'p2' ? SKINS[player2Skin] : null;

        return (
          <motion.div
            key={point.id}
            className={cn(
              "absolute w-[18%] h-[18%] -ml-[9%] -mt-[9%] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 z-10",
              // Base style for empty slot
              !cellValue && "bg-stone-300/20 hover:bg-stone-400/30 border-2 border-stone-400/30",
              // Highlight valid move target
              isValidMove && "bg-green-500/20 border-green-500/50 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.4)]",
              // Highlight selected piece source
              isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background scale-110 z-20"
            )}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onClick={() => isClickable && onCellClick(point.id)}
            whileHover={{ scale: isClickable ? 1.1 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence>
              {cellValue && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="w-full h-full rounded-full shadow-lg relative overflow-hidden border-2 border-stone-600/50"
                >
                  <img 
                    src={tokenImg || ''} 
                    alt={cellValue} 
                    className="w-full h-full object-cover scale-110"
                  />
                  {/* Gloss effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none mix-blend-overlay" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Index label for debugging (optional, hidden for production look) */}
            {/* <span className="text-[8px] absolute opacity-50">{point.id}</span> */}
          </motion.div>
        );
      })}
    </div>
  );
}
