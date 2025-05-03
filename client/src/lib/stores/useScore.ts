import { create } from 'zustand';
import { apiRequest } from '../queryClient';
import { useEffect } from 'react';

interface Score {
  id: number;
  userId: number | null;
  gameId: string;
  score: number;
  createdAt: Date;
}

interface ScoreState {
  highScores: Score[];
  isLoadingScores: boolean;
  
  // Methods
  fetchHighScores: (gameId: string) => Promise<void>;
  submitScore: (gameId: string, score: number) => Promise<void>;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  highScores: [],
  isLoadingScores: false,
  
  fetchHighScores: async (gameId: string) => {
    set({ isLoadingScores: true });
    
    try {
      const response = await fetch(`/api/scores/${gameId}?limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scores: ${response.status}`);
      }
      
      const data = await response.json();
      set({ highScores: data, isLoadingScores: false });
    } catch (error) {
      console.error('Error fetching high scores:', error);
      set({ isLoadingScores: false });
    }
  },
  
  submitScore: async (gameId: string, score: number) => {
    try {
      const response = await apiRequest('POST', '/api/scores', {
        userId: null, // Anonymous score
        gameId,
        score
      });
      
      if (response.ok) {
        // Refresh high scores after submitting
        get().fetchHighScores(gameId);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }
}));

// Hook with automatic score fetching
export function useScore() {
  const { fetchHighScores, ...state } = useScoreStore();
  
  useEffect(() => {
    const gameId = window.location.pathname.split('/').pop();
    
    if (gameId && ['snake', 'memory', 'maze', 'ragdoll', 'escape-road'].includes(gameId)) {
      fetchHighScores(gameId);
    }
  }, [fetchHighScores]);
  
  return { ...state, fetchHighScores };
}
