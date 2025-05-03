import { useEffect, useRef, useState, useCallback } from 'react';
import { useScore } from '../lib/stores/useScore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';
import { toast } from 'sonner';

// Types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const GAME_SPEED = 150;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [score, setScore] = useState(0);
  const lastRenderTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const directionQueueRef = useRef<Direction[]>([]);
  const { submitScore } = useScore();
  
  // Audio setup
  const { hitSound, successSound, setHitSound, setSuccessSound, playHit, playSuccess } = useAudio();
  
  useEffect(() => {
    // Initialize sounds if not already loaded
    if (!hitSound) {
      const sound = new Audio('/sounds/hit.mp3');
      setHitSound(sound);
    }
    
    if (!successSound) {
      const sound = new Audio('/sounds/success.mp3');
      setSuccessSound(sound);
    }
  }, [hitSound, successSound, setHitSound, setSuccessSound]);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    // Check if food is on snake
    if (snake.some(segment => segment.x === x && segment.y === y)) {
      return generateFood();
    }
    
    return { x, y };
  }, [snake]);

  // Initialize game
  const initGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection('UP');
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
    setPaused(false);
    directionQueueRef.current = [];
  }, [generateFood]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') {
            directionQueueRef.current.push('UP');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') {
            directionQueueRef.current.push('DOWN');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') {
            directionQueueRef.current.push('LEFT');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') {
            directionQueueRef.current.push('RIGHT');
          }
          break;
        case ' ':
          // Toggle pause
          setPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [direction, gameOver]);

  // Main game loop
  const gameLoop = useCallback((currentTime: number) => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    if (paused || gameOver) return;
    
    const secondsSinceLastRender = (currentTime - lastRenderTimeRef.current) / 1000;
    
    if (secondsSinceLastRender < GAME_SPEED / 1000) return;
    
    lastRenderTimeRef.current = currentTime;
    
    updateGame();
  }, [paused, gameOver]);

  // Update game state
  const updateGame = useCallback(() => {
    // Get next direction from queue
    if (directionQueueRef.current.length > 0) {
      setDirection(directionQueueRef.current.shift()!);
    }
    
    // Move snake
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
      // Calculate new head position
      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }
      
      // Check collision with walls
      if (
        head.x < 0 || 
        head.x >= GRID_SIZE || 
        head.y < 0 || 
        head.y >= GRID_SIZE
      ) {
        endGame();
        return prevSnake;
      }
      
      // Check collision with self
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return prevSnake;
      }
      
      // Add new head
      newSnake.unshift(head);
      
      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        // Snake grows, no need to remove tail
        setScore(prev => prev + 10);
        setFood(generateFood());
        playSuccess();
        
        // Every 50 points, show toast
        if ((score + 10) % 50 === 0) {
          toast.success(`Great job! Score: ${score + 10}`);
        }
      } else {
        // Remove tail if no food eaten
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, score, generateFood, playSuccess]);

  // End game
  const endGame = useCallback(() => {
    setGameOver(true);
    cancelAnimationFrame(animationFrameRef.current);
    playHit();
    submitScore('snake', score);
    
    toast.error(`Game Over! Final Score: ${score}`);
  }, [score, playHit, submitScore]);

  // Start or restart game
  const startGame = useCallback(() => {
    initGame();
    lastRenderTimeRef.current = 0;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [initGame, gameLoop]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setPaused(p => !p);
  }, []);

  // Draw game elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate cell size
    const cellSize = Math.min(
      canvas.width / GRID_SIZE,
      canvas.height / GRID_SIZE
    );
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(
      food.x * cellSize,
      food.y * cellSize,
      cellSize,
      cellSize
    );
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Head is darker
      ctx.fillStyle = index === 0 ? '#1e40af' : '#3b82f6';
      ctx.fillRect(
        segment.x * cellSize,
        segment.y * cellSize,
        cellSize,
        cellSize
      );

      // Draw little eyes on the head
      if (index === 0) {
        ctx.fillStyle = 'white';
        const eyeSize = cellSize / 5;
        let eyeOffsetX, eyeOffsetY;
        
        switch(direction) {
          case 'UP':
            eyeOffsetX = cellSize / 3;
            eyeOffsetY = cellSize / 4;
            break;
          case 'DOWN':
            eyeOffsetX = cellSize / 3;
            eyeOffsetY = cellSize * 0.6;
            break;
          case 'LEFT':
            eyeOffsetX = cellSize / 4;
            eyeOffsetY = cellSize / 3;
            break;
          case 'RIGHT':
            eyeOffsetX = cellSize * 0.6;
            eyeOffsetY = cellSize / 3;
            break;
        }
        
        ctx.fillRect(
          segment.x * cellSize + eyeOffsetX,
          segment.y * cellSize + eyeOffsetY,
          eyeSize,
          eyeSize
        );
        
        ctx.fillRect(
          segment.x * cellSize + cellSize - eyeOffsetX - eyeSize,
          segment.y * cellSize + eyeOffsetY,
          eyeSize,
          eyeSize
        );
      }
    });
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
    
    // Draw overlay if game is paused
    if (paused && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 30);
    }
  }, [snake, food, paused, gameOver, direction]);

  // Start animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameLoop]);

  return (
    <Card className="w-full mx-auto overflow-hidden">
      <div className="bg-muted p-4 flex justify-between items-center">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="space-x-2">
          {!gameOver && (
            <Button size="sm" variant="outline" onClick={togglePause}>
              {paused ? 'Resume' : 'Pause'}
            </Button>
          )}
          <Button size="sm" onClick={startGame}>
            {gameOver ? 'Play Again' : 'Restart'}
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-white flex justify-center">
        <canvas 
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-border rounded-md touch-none"
        />
      </div>
      
      <div className="p-4 bg-muted text-sm text-center text-muted-foreground">
        Use arrow keys or WASD to control the snake. Press SPACE to pause.
      </div>
    </Card>
  );
}
