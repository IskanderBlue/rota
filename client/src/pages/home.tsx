import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Lock, Swords, User, Users } from 'lucide-react';

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
  const [selectedP1, setSelectedP1] = useState('roman');
  const [selectedP2, setSelectedP2] = useState('gaul');

  const startGame = (mode: 'ai' | 'local') => {
    setLocation(`/game?mode=${mode}&p1=${selectedP1}&p2=${selectedP2}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/10 to-stone-900/30 pointer-events-none" />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-black text-primary drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] tracking-widest mb-2">
          ROTA
        </h1>
        <p className="text-xl md:text-2xl font-serif text-stone-700 italic tracking-widest">
          The Game of Wheels
        </p>
      </motion.div>

      <div className="z-10 w-full max-w-md space-y-4">
        
        {/* Single Player */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            size="lg" 
            className="w-full h-16 text-xl btn-roman bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide"
            onClick={() => startGame('ai')}
          >
            <User className="mr-3 h-6 w-6" /> Single Player
          </Button>
        </motion.div>

        {/* Local Multiplayer */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            size="lg" 
            variant="secondary"
            className="w-full h-16 text-xl btn-roman bg-secondary hover:bg-secondary/90 text-secondary-foreground font-serif tracking-wide border-2 border-stone-400/20"
            onClick={() => startGame('local')}
          >
            <Users className="mr-3 h-6 w-6" /> Local PvP
          </Button>
        </motion.div>

        {/* Online Multiplayer (Mock) */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full h-16 text-xl btn-roman bg-stone-200 hover:bg-stone-300 text-stone-600 font-serif tracking-wide border-2 border-stone-400"
              >
                <Swords className="mr-3 h-6 w-6" /> Online Battle <Lock className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#f2efe9] border-stone-400">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-primary text-center">Expand Your Empire</DialogTitle>
              </DialogHeader>
              <div className="p-4 text-center space-y-4">
                <p className="text-stone-700">Online multiplayer and Ranked Matches are available in the <span className="font-bold">Emperor's Edition</span>.</p>
                <div className="grid grid-cols-2 gap-4 my-4">
                  {SKINS.filter(s => !s.unlocked).map(skin => (
                    <div key={skin.id} className="bg-stone-300/50 p-2 rounded border border-stone-400/30 flex flex-col items-center">
                      <img src={skin.img} className="w-12 h-12 mb-2 opacity-75 grayscale" />
                      <span className="text-xs font-serif font-bold text-stone-600">{skin.name}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full btn-roman bg-primary text-primary-foreground font-serif">
                  Unlock All ($4.99)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Skin Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-8 border-t border-stone-400/30"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest block text-center">Legion (You)</label>
              <div className="flex justify-center gap-2">
                 {SKINS.map(skin => (
                   <div 
                    key={`p1-${skin.id}`}
                    onClick={() => skin.unlocked && setSelectedP1(skin.id)}
                    className={`
                      w-10 h-10 rounded-full border-2 cursor-pointer transition-all hover:scale-110 relative
                      ${selectedP1 === skin.id ? 'border-primary shadow-lg scale-110 z-10' : 'border-transparent opacity-60'}
                      ${!skin.unlocked ? 'grayscale opacity-30 cursor-not-allowed' : ''}
                    `}
                   >
                     <img src={skin.img} className="w-full h-full object-cover" />
                     {!skin.unlocked && <Lock className="absolute inset-0 m-auto w-4 h-4 text-stone-800" />}
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-serif font-bold text-stone-500 uppercase tracking-widest block text-center">Invader (Enemy)</label>
              <div className="flex justify-center gap-2">
                 {SKINS.map(skin => (
                   <div 
                    key={`p2-${skin.id}`}
                    onClick={() => skin.unlocked && setSelectedP2(skin.id)}
                    className={`
                      w-10 h-10 rounded-full border-2 cursor-pointer transition-all hover:scale-110 relative
                      ${selectedP2 === skin.id ? 'border-primary shadow-lg scale-110 z-10' : 'border-transparent opacity-60'}
                      ${!skin.unlocked ? 'grayscale opacity-30 cursor-not-allowed' : ''}
                    `}
                   >
                     <img src={skin.img} className="w-full h-full object-cover" />
                     {!skin.unlocked && <Lock className="absolute inset-0 m-auto w-4 h-4 text-stone-800" />}
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-4 text-center w-full">
        <p className="text-xs text-stone-500 font-serif opacity-60">MMXXV REPLIT GAMES</p>
      </footer>
    </div>
  );
}
