import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Lock, Swords, User, Users, Info, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Images
import romanEagle from '@assets/generated_images/roman_legion_eagle_emblem.png';
import gaulBoar from '@assets/generated_images/celtic_gaul_boar_emblem.png';
import carthageTanit from '@assets/generated_images/carthaginian_tanit_emblem.png';
import parthianHorse from '@assets/generated_images/parthian_horse_emblem.png';

const SKINS = [
  { id: 'roman', name: 'Roman Legion', img: romanEagle, unlocked: true },
  { id: 'gaul', name: 'Gallic Tribes', img: gaulBoar, unlocked: true },
  { id: 'carthage', name: 'Carthage', img: carthageTanit, unlocked: true },
  { id: 'parthian', name: 'Parthian Empire', img: parthianHorse, unlocked: true },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'mode' | 'setup'>('mode');
  const [mode, setMode] = useState<'ai' | 'local'>('ai');
  const [selectedP1, setSelectedP1] = useState('roman');
  const [selectedP2, setSelectedP2] = useState('gaul');
  const [startingPlayer, setStartingPlayer] = useState<'p1' | 'p2' | 'random'>('random');

  const handleStartGame = () => {
    setLocation(`/game?mode=${mode}&p1=${selectedP1}&p2=${selectedP2}&start=${startingPlayer}`);
  };

  const handleModeSelect = (selectedMode: 'ai' | 'local') => {
    setMode(selectedMode);
    setStep('setup');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f2efe9] relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/10 to-stone-900/30 pointer-events-none z-0" />

      {/* Left Panel: Game UI */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-serif font-black text-primary drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] tracking-widest mb-2">
            ROTA
          </h1>
          <p className="text-xl md:text-2xl font-serif text-stone-700 italic tracking-widest">
            The Game of Wheels
          </p>
        </motion.div>

        <div className="w-full max-w-md space-y-6">
          <AnimatePresence mode="wait">
            {step === 'mode' ? (
              <motion.div
                key="mode-selection"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <Button 
                  size="lg" 
                  className="w-full h-20 text-xl btn-roman bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide"
                  onClick={() => handleModeSelect('ai')}
                >
                  <User className="mr-3 h-6 w-6" /> Single Player
                </Button>

                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full h-20 text-xl btn-roman bg-secondary hover:bg-secondary/90 text-secondary-foreground font-serif tracking-wide border-2 border-stone-400/20"
                  onClick={() => handleModeSelect('local')}
                >
                  <Users className="mr-3 h-6 w-6" /> Local PvP
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="setup-selection"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="space-y-8 bg-stone-300/40 p-6 rounded-xl border border-stone-400/30 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                   <Button variant="ghost" size="sm" onClick={() => setStep('mode')}>
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back
                   </Button>
                   <h3 className="font-serif font-bold text-stone-700 text-lg uppercase tracking-wider">Battle Setup</h3>
                   <div className="w-16"></div> {/* Spacer */}
                </div>

                {/* Faction Selectors */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3 text-center">
                    <label className="text-xs font-serif font-bold text-primary uppercase tracking-widest block">
                      {mode === 'ai' ? 'You (Player 1)' : 'Player 1'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 justify-items-center">
                       {SKINS.map(skin => (
                         <button
                          key={`p1-${skin.id}`}
                          onClick={() => {
                            if (selectedP2 === skin.id) setSelectedP2(SKINS.find(s => s.id !== skin.id)?.id || 'gaul');
                            setSelectedP1(skin.id);
                          }}
                          disabled={!skin.unlocked}
                          className={`
                            w-12 h-12 rounded-full border-2 transition-all relative overflow-hidden bg-stone-800
                            ${selectedP1 === skin.id ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-[#f2efe9] scale-110 z-10 shadow-lg' : 'border-stone-500 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
                          `}
                         >
                           <img src={skin.img} className="w-full h-full object-cover scale-110" />
                           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none mix-blend-overlay" />
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-center">
                    <label className="text-xs font-serif font-bold text-blue-800 uppercase tracking-widest block">
                       {mode === 'ai' ? 'Enemy (AI)' : 'Player 2'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 justify-items-center">
                       {SKINS.map(skin => (
                         <button
                          key={`p2-${skin.id}`}
                          onClick={() => {
                            if (selectedP1 === skin.id) setSelectedP1(SKINS.find(s => s.id !== skin.id)?.id || 'roman');
                            setSelectedP2(skin.id);
                          }}
                          disabled={!skin.unlocked}
                          className={`
                            w-12 h-12 rounded-full border-2 transition-all relative overflow-hidden bg-stone-800
                            ${selectedP2 === skin.id ? 'border-blue-800 ring-2 ring-blue-800 ring-offset-2 ring-offset-[#f2efe9] scale-110 z-10 shadow-lg' : 'border-stone-500 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
                          `}
                         >
                           <img src={skin.img} className="w-full h-full object-cover scale-110" />
                           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none mix-blend-overlay" />
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Starting Player Selector */}
                <div className="space-y-3 pt-4 border-t border-stone-400/30">
                  <label className="text-xs font-serif font-bold text-stone-600 uppercase tracking-widest block text-center">
                    Who Strikes First?
                  </label>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant={startingPlayer === 'p1' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStartingPlayer('p1')}
                      className={`min-w-[80px] font-serif ${startingPlayer === 'p1' ? 'bg-primary text-primary-foreground' : 'bg-transparent border-stone-400'}`}
                    >
                      P1
                    </Button>
                    <Button 
                      variant={startingPlayer === 'random' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStartingPlayer('random')}
                      className={`min-w-[80px] font-serif ${startingPlayer === 'random' ? 'bg-stone-700 text-white' : 'bg-transparent border-stone-400'}`}
                    >
                      Random
                    </Button>
                    <Button 
                      variant={startingPlayer === 'p2' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStartingPlayer('p2')}
                      className={`min-w-[80px] font-serif ${startingPlayer === 'p2' ? 'bg-blue-800 text-white' : 'bg-transparent border-stone-400'}`}
                    >
                      P2
                    </Button>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full h-16 text-xl btn-roman bg-green-700 hover:bg-green-800 text-white font-serif tracking-wide mt-6"
                  onClick={handleStartGame}
                >
                  Start Battle <Play className="ml-2 h-5 w-5 fill-current" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel: About (Desktop) / Bottom (Mobile) */}
      <div className="md:w-[400px] w-full bg-stone-200/80 border-l border-stone-300 backdrop-blur-md z-10 flex flex-col h-[40vh] md:h-screen">
        <div className="p-6 bg-stone-300 border-b border-stone-400/50">
          <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center">
            <Info className="mr-2 h-5 w-5" /> About Rota
          </h2>
        </div>
        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-stone text-stone-700 font-serif leading-relaxed space-y-4">
            <p className="italic border-l-4 border-primary pl-4 bg-stone-300/30 p-2 rounded-r">
              “Rota” is a common modern name for an easy strategy game played on a round board. The Latin name is probably Terni Lapilli (“Three pebbles”)...
            </p>
            
            <h3 className="text-lg font-bold text-primary uppercase tracking-wider mt-6 mb-2">Goal</h3>
            <p>The first player to place three game pieces in a row across the center or in the circle of the board wins.</p>

            <h3 className="text-lg font-bold text-primary uppercase tracking-wider mt-6 mb-2">Rules of Engagement</h3>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>Players take turns placing one piece on the board in any open spot.</li>
              <li>After all the pieces are on the board, a player moves one piece each turn onto the next empty spot (along spokes or circle).</li>
            </ul>

            <h3 className="text-lg font-bold text-primary uppercase tracking-wider mt-6 mb-2">Restrictions</h3>
            <p className="font-bold text-sm text-stone-500 uppercase mb-1">A player may not:</p>
            <ul className="list-disc list-outside ml-4 space-y-1 text-sm">
              <li>Skip a turn, even if the move forces you to lose the game.</li>
              <li>Jump over another piece.</li>
              <li>Move more than one space.</li>
              <li>Land on a space with a piece already on it.</li>
              <li>Knock a piece off a space.</li>
            </ul>
            
            <div className="mt-8 pt-6 border-t border-stone-400">
               <a 
                 href="https://www.getty.edu/education/college/ancient_rome_at_home/pdf/rota_game.pdf" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-primary hover:underline text-sm flex items-center"
               >
                 Read full history at Getty.edu <ArrowRight className="ml-1 h-3 w-3" />
               </a>
            </div>
          </div>
        </ScrollArea>
      </div>
      
      <footer className="absolute bottom-4 left-0 right-0 md:right-[400px] text-center pointer-events-none z-0">
        <p className="text-xs text-stone-500 font-serif opacity-60">MMXXV REPLIT GAMES</p>
      </footer>
    </div>
  );
}
