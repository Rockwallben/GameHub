import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { Game } from "../types/game";

interface InstructionsProps {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Instructions({ game, open, onOpenChange }: InstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How to Play {game.name}</DialogTitle>
          <DialogDescription>
            {game.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm">
          <h3 className="font-bold mb-2">Game Controls:</h3>
          
          {game.id === 'snake' && (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use <span className="font-medium">Arrow keys</span> or <span className="font-medium">WASD</span> to control the snake direction</li>
                <li>Collect food (red squares) to grow longer</li>
                <li>Avoid hitting walls or your own tail</li>
                <li>Press <span className="font-medium">Space</span> to pause the game</li>
              </ul>
              <p className="mt-3">The longer your snake grows, the higher your score!</p>
            </>
          )}
          
          {game.id === 'memory' && (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li>Click on cards to flip them</li>
                <li>Find all matching pairs to win</li>
                <li>Remember card locations to match them efficiently</li>
                <li>Try to complete the game with as few moves as possible</li>
              </ul>
              <p className="mt-3">Your score is calculated based on the number of moves and time taken.</p>
            </>
          )}
          
          {game.id === 'maze' && (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use <span className="font-medium">Arrow keys</span> or <span className="font-medium">WASD</span> to navigate</li>
                <li>Find your way through the maze to the green exit marker</li>
                <li>Avoid walls and obstacles</li>
                <li>Complete the maze as quickly as possible for a higher score</li>
              </ul>
              <p className="mt-3">Each time you play, a new random maze is generated!</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
