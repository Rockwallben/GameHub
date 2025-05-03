import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry, useKeyboardControls } from '@react-three/drei';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';
import { useScore } from '../lib/stores/useScore';
import { toast } from 'sonner';

// Define controls
enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right'
}

const keyMap: KeyboardControlsEntry<Controls>[] = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] }
];

// Define maze size
const MAZE_SIZE = 15;
const WALL_HEIGHT = 2;
const CELL_SIZE = 2;

// Create a simple maze generator
const generateMaze = () => {
  // Initialize maze with all walls
  const maze = Array(MAZE_SIZE).fill(0).map(() => Array(MAZE_SIZE).fill(1));
  
  // Recursive backtracking algorithm
  const visit = (x: number, y: number) => {
    maze[y][x] = 0; // Clear current cell
    
    // Define directions: [dx, dy]
    const directions = [
      [0, -2], // North
      [2, 0],  // East
      [0, 2],  // South
      [-2, 0]  // West
    ];
    
    // Shuffle directions
    directions.sort(() => Math.random() - 0.5);
    
    // Try each direction
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      // Check if we can move to this position
      if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] === 1) {
        // Clear the wall between current and next cell
        maze[y + dy/2][x + dx/2] = 0;
        
        // Visit next cell
        visit(nx, ny);
      }
    }
  };
  
  // Start from a random position
  const startX = Math.floor(Math.random() * Math.floor(MAZE_SIZE / 2)) * 2 + 1;
  const startY = Math.floor(Math.random() * Math.floor(MAZE_SIZE / 2)) * 2 + 1;
  
  visit(startX, startY);
  
  // Ensure the start and end are clear
  maze[1][1] = 0;
  maze[MAZE_SIZE-2][MAZE_SIZE-2] = 0;
  
  return maze;
};

// Player component
function Player({ maze }: { maze: number[][] }) {
  const playerRef = useRef<THREE.Mesh>(null);
  const [getState] = useKeyboardControls<Controls>();
  const [position, setPosition] = useState({ x: 1.5, z: 1.5 });
  const velocity = useRef(new THREE.Vector3());
  const { successSound, playSuccess } = useAudio();
  const { submitScore } = useScore();
  const startTime = useRef(Date.now());
  const [gameWon, setGameWon] = useState(false);
  
  useFrame((state, delta) => {
    if (gameWon) return;
    
    const { forward, backward, left, right } = getState();
    
    // Update velocity based on controls
    const speed = 3 * delta;
    velocity.current.set(0, 0, 0);
    
    if (forward) velocity.current.z -= speed;
    if (backward) velocity.current.z += speed;
    if (left) velocity.current.x -= speed;
    if (right) velocity.current.x += speed;
    
    // Get current grid position
    const oldPos = { x: position.x, z: position.z };
    const newPos = {
      x: oldPos.x + velocity.current.x,
      z: oldPos.z + velocity.current.z
    };
    
    // Check for collision with walls
    const gridX1 = Math.floor(newPos.x / CELL_SIZE);
    const gridZ1 = Math.floor(newPos.z / CELL_SIZE);
    const gridX2 = Math.floor((newPos.x + 0.4) / CELL_SIZE);
    const gridZ2 = Math.floor((newPos.z + 0.4) / CELL_SIZE);
    const gridX3 = Math.floor((newPos.x - 0.4) / CELL_SIZE);
    const gridZ3 = Math.floor((newPos.z - 0.4) / CELL_SIZE);
    
    // Check all corners for collisions
    const corners = [
      [gridX1, gridZ1],
      [gridX2, gridZ1],
      [gridX1, gridZ2],
      [gridX2, gridZ2],
      [gridX3, gridZ3],
      [gridX2, gridZ3],
      [gridX3, gridZ2]
    ];
    
    let collision = false;
    for (const [gx, gz] of corners) {
      if (
        gx < 0 || gx >= MAZE_SIZE || 
        gz < 0 || gz >= MAZE_SIZE || 
        maze[gz][gx] === 1
      ) {
        collision = true;
        break;
      }
    }
    
    // Update position if no collision
    if (!collision) {
      setPosition(newPos);
      
      if (playerRef.current) {
        playerRef.current.position.x = newPos.x;
        playerRef.current.position.z = newPos.z;
      }
      
      // Check if player reached the end
      const endX = (MAZE_SIZE - 2) * CELL_SIZE + CELL_SIZE / 2;
      const endZ = (MAZE_SIZE - 2) * CELL_SIZE + CELL_SIZE / 2;
      
      if (
        Math.abs(newPos.x - endX) < 1 &&
        Math.abs(newPos.z - endZ) < 1 &&
        !gameWon
      ) {
        console.log("Reached the end!");
        setGameWon(true);
        const endTime = Date.now();
        const timeSeconds = (endTime - startTime.current) / 1000;
        const score = Math.max(Math.floor(1000 * (60 / Math.max(timeSeconds, 10))), 10);
        
        playSuccess();
        submitScore('maze', score);
        toast.success(`You escaped the maze! Score: ${score}`);
      }
    }
  });
  
  return (
    <mesh ref={playerRef} position={[position.x, 0.5, position.z]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

// Wall component
function Wall({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
      <meshStandardMaterial color="#555" />
    </mesh>
  );
}

// Floor component
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAZE_SIZE * CELL_SIZE / 2, -0.5, MAZE_SIZE * CELL_SIZE / 2]}>
      <planeGeometry args={[MAZE_SIZE * CELL_SIZE + 2, MAZE_SIZE * CELL_SIZE + 2]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
}

// Goal marker
function Goal() {
  const endX = (MAZE_SIZE - 2) * CELL_SIZE + CELL_SIZE / 2;
  const endZ = (MAZE_SIZE - 2) * CELL_SIZE + CELL_SIZE / 2;
  
  return (
    <mesh position={[endX, 0.5, endZ]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="green" emissive="green" emissiveIntensity={0.5} />
    </mesh>
  );
}

// Maze walls
function Walls({ maze }: { maze: number[][] }) {
  const walls = [];
  
  for (let z = 0; z < MAZE_SIZE; z++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      if (maze[z][x] === 1) {
        walls.push(
          <Wall 
            key={`${x}-${z}`} 
            position={[
              x * CELL_SIZE + CELL_SIZE / 2, 
              WALL_HEIGHT / 2, 
              z * CELL_SIZE + CELL_SIZE / 2
            ]} 
          />
        );
      }
    }
  }
  
  return <>{walls}</>;
}

// Lights
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />
    </>
  );
}

// Main game component
export default function MazeGame() {
  const [maze, setMaze] = useState<number[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const { setHitSound, setSuccessSound, hitSound, successSound } = useAudio();
  
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
  
  const startGame = useCallback(() => {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setGameStarted(true);
  }, []);
  
  // Camera position
  const cameraPosition: [number, number, number] = [
    MAZE_SIZE * CELL_SIZE / 2, 
    MAZE_SIZE + 5, 
    MAZE_SIZE * CELL_SIZE / 2 + 5
  ];
  
  if (!gameStarted) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="bg-card p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">3D Maze Game</h2>
          <p className="mb-6 text-center text-muted-foreground">
            Navigate through the 3D maze to find the exit (green sphere). Use arrow keys or WASD to move.
          </p>
          <Button className="px-6 py-2 bg-primary text-primary-foreground rounded-md" onClick={startGame}>
            Start Game
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-[500px] relative">
      <KeyboardControls map={keyMap}>
        <Canvas camera={{ position: [1.5, 3, 6], fov: 60 }}>
          <Lighting />
          <Floor />
          <Walls maze={maze} />
          <Player maze={maze} />
          <Goal />
        </Canvas>
      </KeyboardControls>
      
      <div className="absolute top-4 right-4">
        <Button className="px-4 py-1 bg-primary text-primary-foreground rounded-md" onClick={startGame}>
          Restart
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
        Use arrow keys or WASD to move
      </div>
    </div>
  );
}
