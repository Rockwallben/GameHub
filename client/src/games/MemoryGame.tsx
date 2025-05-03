import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useScore } from '../lib/stores/useScore';
import { useAudio } from '@/lib/stores/useAudio';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type CardType = {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
};

// Card icons using emoji for simplicity
const CARD_ICONS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🦄', '🐲', '🦕', '🦖', '🐢', '🐍', '🦎', '🐙'
];

export default function MemoryGame() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(8); // number of pairs
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { submitScore } = useScore();
  const { hitSound, successSound, setHitSound, setSuccessSound, playHit, playSuccess } = useAudio();
  
  // Initialize sounds
  useEffect(() => {
    if (!hitSound) {
      const sound = new Audio('/sounds/hit.mp3');
      setHitSound(sound);
    }
    
    if (!successSound) {
      const sound = new Audio('/sounds/success.mp3');
      setSuccessSound(sound);
    }
  }, [hitSound, successSound, setHitSound, setSuccessSound]);

  // Initialize game
  const initGame = useCallback(() => {
    // Shuffle and prepare cards
    const shuffledIcons = [...CARD_ICONS].sort(() => Math.random() - 0.5).slice(0, difficulty);
    const doubledIcons = [...shuffledIcons, ...shuffledIcons];
    const shuffledCards = doubledIcons
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameOver(false);
    setGameStarted(true);
    setTimer(0);
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, [difficulty]);

  // Effect to check for game over
  useEffect(() => {
    if (matchedPairs === difficulty && gameStarted) {
      setGameOver(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Calculate score based on moves and time
      const score = Math.max(Math.floor(1000 * (difficulty / moves) * (60 / Math.max(timer, 10))), 1);
      submitScore('memory', score);
      
      playSuccess();
      toast.success(`You won! Score: ${score}`);
    }
  }, [matchedPairs, difficulty, gameStarted, moves, timer, submitScore, playSuccess]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle card click
  const handleCardClick = (id: number) => {
    // Ignore if game is over or same card is clicked twice
    if (gameOver || flippedCards.includes(id)) return;
    
    // Can't flip more than 2 cards at once or already matched cards
    const card = cards.find(c => c.id === id);
    if (flippedCards.length === 2 || card?.matched) return;
    
    // Flip the card
    setCards(prev => 
      prev.map(card => 
        card.id === id ? { ...card, flipped: true } : card
      )
    );
    
    setFlippedCards(prev => [...prev, id]);
    
    // If this is the second flip
    if (flippedCards.length === 1) {
      setMoves(prev => prev + 1);
      
      // Get the first flipped card
      const firstCardId = flippedCards[0];
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === id);
      
      // Check if cards match
      if (firstCard?.icon === secondCard?.icon) {
        // Cards match
        setCards(prev => 
          prev.map(card => 
            card.id === firstCardId || card.id === id
              ? { ...card, matched: true }
              : card
          )
        );
        
        setMatchedPairs(prev => prev + 1);
        setFlippedCards([]);
        playSuccess();
      } else {
        // Cards don't match, flip back after a delay
        setTimeout(() => {
          setCards(prev => 
            prev.map(card => 
              card.id === firstCardId || card.id === id
                ? { ...card, flipped: false }
                : card
            )
          );
          
          setFlippedCards([]);
          playHit();
        }, 800);
      }
    }
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = (matchedPairs / difficulty) * 100;

  // Get correct grid class based on difficulty
  const getGridClass = () => {
    switch(difficulty) {
      case 6: return 'grid-cols-3 grid-rows-4';
      case 8: return 'grid-cols-4 grid-rows-4';
      case 12: return 'grid-cols-4 grid-rows-6';
      default: return 'grid-cols-4 grid-rows-4';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!gameStarted ? (
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6">Memory Card Game</h2>
          <p className="mb-6 text-center text-muted-foreground">
            Flip cards to find matching pairs. The faster you finish with fewer moves, the higher your score!
          </p>
          
          <div className="mb-6 space-y-2 w-full max-w-xs">
            <p className="font-medium">Select difficulty:</p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={difficulty === 6 ? "default" : "outline"} 
                onClick={() => setDifficulty(6)}
              >
                Easy (6 pairs)
              </Button>
              <Button 
                variant={difficulty === 8 ? "default" : "outline"} 
                onClick={() => setDifficulty(8)}
              >
                Medium (8 pairs)
              </Button>
              <Button 
                variant={difficulty === 12 ? "default" : "outline"} 
                onClick={() => setDifficulty(12)}
              >
                Hard (12 pairs)
              </Button>
            </div>
          </div>
          
          <Button size="lg" onClick={initGame}>Start Game</Button>
        </Card>
      ) : (
        <Card>
          <div className="p-4 bg-muted flex justify-between items-center">
            <div className="flex gap-3">
              <Badge variant="outline" className="flex gap-1 items-center text-sm">
                <span className="font-bold">Moves:</span> {moves}
              </Badge>
              <Badge variant="outline" className="flex gap-1 items-center text-sm">
                <span className="font-bold">Time:</span> {formatTime(timer)}
              </Badge>
            </div>
            <Button size="sm" onClick={initGame}>Restart</Button>
          </div>
          
          <div className="p-4">
            <Progress value={progress} className="h-2 mb-4" />
            
            <div className={`grid ${getGridClass()} gap-2 max-w-md mx-auto`}>
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`aspect-[3/4] cursor-pointer transition-all duration-300 transform ${
                    card.flipped ? 'rotate-y-180' : ''
                  } preserve-3d`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className={`w-full h-full rounded-md flex items-center justify-center text-3xl font-bold perspective-1000 backface-hidden transition-transform duration-500 ${
                    card.flipped ? 'rotate-y-180 hidden' : 'bg-primary text-primary-foreground'
                  }`}>
                    ?
                  </div>
                  <div className={`w-full h-full rounded-md flex items-center justify-center text-3xl absolute top-0 left-0 backface-hidden transition-transform duration-500 ${
                    card.flipped ? 'rotate-y-0 bg-white border border-border' : 'rotate-y-180 bg-white'
                  }`}>
                    {card.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// This component requires some additional CSS to work correctly
// Adding the missing React import and useRef
import { useRef } from 'react';

// Adding styles to index.css that will be used by the component
// Add this to the index.css file
/*
.rotate-y-0 {
  transform: rotateY(0deg);
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.preserve-3d {
  transform-style: preserve-3d;
}
.perspective-1000 {
  perspective: 1000px;
}
.backface-hidden {
  backface-visibility: hidden;
}
*/
