import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import GameCard from '../components/GameCard';
import { Game } from '../types/game';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Game Hub</h1>
        <p className="text-xl text-muted-foreground">Choose a game and start playing!</p>
      </div>
      
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search games..."
            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="text-center text-destructive">
          <p>Unable to load games. Please try again later.</p>
        </div>
      ) : filteredGames.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p>No games found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
