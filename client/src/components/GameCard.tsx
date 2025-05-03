import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Game } from "../types/game";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
      <div className="h-36 bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
        {game.imageUrl ? (
          <img 
            src={game.imageUrl} 
            alt={game.name} 
            className="h-24 w-24 text-primary object-contain"
          />
        ) : (
          <div className="h-24 w-24 text-primary">
            <RagdollIcon />
          </div>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {game.name}
        </CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      
      <CardFooter className="flex justify-between items-center pt-0">
        <Badge variant="outline" className="capitalize">
          {game.id}
        </Badge>
        <Button onClick={() => navigate(`/games/${game.id}`)}>
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
}

// Game icon for Ragdoll Hit
function RagdollIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Head of first stick figure */}
      <circle cx="8" cy="5" r="2" />
      
      {/* Body of first stick figure (attacking) */}
      <line x1="8" y1="7" x2="8" y2="13" />
      
      {/* Arms of first stick figure (attacking position) */}
      <line x1="8" y1="9" x2="4" y2="7" /> {/* Left arm pulled back */}
      <line x1="8" y1="9" x2="13" y2="10" /> {/* Right arm striking */}
      
      {/* Legs of first stick figure */}
      <line x1="8" y1="13" x2="6" y2="18" /> {/* Left leg */}
      <line x1="8" y1="13" x2="10" y2="18" /> {/* Right leg */}
      
      {/* Head of second stick figure (being hit) */}
      <circle cx="16" cy="6" r="2" />
      
      {/* Body of second stick figure (falling back) */}
      <line x1="16" y1="8" x2="17" y2="14" strokeDasharray="2,1" />
      
      {/* Arms of second stick figure (thrown back) */}
      <line x1="17" y1="10" x2="14" y2="12" strokeDasharray="2,1" />
      <line x1="17" y1="10" x2="20" y2="11" strokeDasharray="2,1" />
      
      {/* Legs of second stick figure */}
      <line x1="17" y1="14" x2="15" y2="19" strokeDasharray="2,1" />
      <line x1="17" y1="14" x2="19" y2="18" strokeDasharray="2,1" />
      
      {/* Impact mark */}
      <path d="M13.5 10.5 L14 9.5 L14.5 10.5 L13.5 10.5" fill="currentColor" />
    </svg>
  );
}