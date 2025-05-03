import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Trophy, ExternalLink } from 'lucide-react';
import Instructions from '../components/Instructions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Game } from '../types/game';
import { useScore } from '../lib/stores/useScore';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);
  const { highScores, isLoadingScores } = useScore();

  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const game = games.find(g => g.id === gameId);

  // We'll embed the game directly in our page instead of opening in a new tab

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="container mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Game not found</h2>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    );
  }
  
  const renderGame = () => {
    if (game?.externalUrl) {
      return (
        <div className="flex flex-col items-center w-full h-full">
          <div className="game-frame-container w-full h-full flex-1 relative mb-4 rounded-lg shadow-lg overflow-hidden border border-primary/20">
            <iframe 
              src={game.externalUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              title={game.name}
              loading="eager"
              referrerPolicy="origin"
              allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            ></iframe>
          </div>
          
          <div className="text-center mt-2 mb-4 p-4 bg-background/80 rounded-lg w-full max-w-xl">
            <h2 className="text-xl font-semibold mb-2">Playing: {game.name}</h2>
            <p className="text-muted-foreground text-sm mb-3">Game is embedded directly on this page. You might need to click inside the game area to activate controls.</p>
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => window.open(game.externalUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2"
            >
              Open in New Tab <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }
    
    return <div className="text-center p-8">Game not available</div>;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/')} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold mt-2">{game.name}</h1>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstructions(true)}
          >
            <HelpCircle className="mr-2 h-4 w-4" /> Instructions
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowHighScores(true)}
          >
            <Trophy className="mr-2 h-4 w-4" /> High Scores
          </Button>
        </div>
      </div>

      <div className="game-container w-full max-w-6xl mx-auto h-[75vh] min-h-[600px]">
        {renderGame()}
      </div>

      <Instructions
        game={game}
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />

      <Dialog open={showHighScores} onOpenChange={setShowHighScores}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>High Scores - {game.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {isLoadingScores ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : highScores.length > 0 ? (
              <div className="space-y-1">
                {highScores.map((score, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <span className="font-medium">#{index+1}</span>
                    <span className="text-right font-bold">{score.score} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No high scores yet</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}