import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScoreSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Define API routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Get high scores for a game
  app.get('/api/scores/:gameId', async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const scores = await storage.getHighScores(gameId, limit);
      res.json(scores);
    } catch (error) {
      console.error('Error fetching scores:', error);
      res.status(500).json({ error: 'Failed to fetch scores' });
    }
  });

  // Save a new score
  app.post('/api/scores', async (req: Request, res: Response) => {
    try {
      const result = insertScoreSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }
      
      const score = await storage.createScore(result.data);
      res.status(201).json(score);
    } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).json({ error: 'Failed to save score' });
    }
  });

  // Get all games data 
  app.get('/api/games', (_req: Request, res: Response) => {
    // Return a list of available games
    const games = [
      {
        id: 'ragdoll',
        name: 'Ragdoll Hit',
        description: 'A fighting game where you battle other players and unlock new weapons.',
        imageUrl: '/assets/ragdoll.svg',
        instructions: 'Fight against other players, unlock different weapons, and become the ultimate champion in this action-packed ragdoll fighting game.',
        externalUrl: 'https://ragdollhit.io/ragdoll-hit-unblocked'
      },
      {
        id: 'escape-road',
        name: 'Escape Road 2',
        description: 'A bank robber trying to escape from the police and stay alive as long as possible.',
        imageUrl: '/assets/escape-road.svg',
        instructions: 'Drive as far as you can while avoiding police and obstacles. Collect money bags to increase your score and unlock upgrades for your getaway vehicle.',
        externalUrl: 'https://ragdollhit.io/escape-road-2'
      }
    ];
    
    res.json(games);
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
