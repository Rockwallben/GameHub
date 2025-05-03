import { users, type User, type InsertUser, scores, type Score, type InsertScore } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Score tracking methods
  getScores(gameId: string, limit?: number): Promise<Score[]>;
  getUserScores(userId: number, gameId?: string): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getHighScores(gameId: string, limit?: number): Promise<Score[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scores: Map<number, Score>;
  currentUserId: number;
  currentScoreId: number;

  constructor() {
    this.users = new Map();
    this.scores = new Map();
    this.currentUserId = 1;
    this.currentScoreId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getScores(gameId: string, limit: number = 10): Promise<Score[]> {
    return Array.from(this.scores.values())
      .filter(score => score.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getUserScores(userId: number, gameId?: string): Promise<Score[]> {
    return Array.from(this.scores.values())
      .filter(score => score.userId === userId && (gameId ? score.gameId === gameId : true))
      .sort((a, b) => b.score - a.score);
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const id = this.currentScoreId++;
    const now = new Date();
    const score: Score = { 
      ...insertScore, 
      id, 
      createdAt: now 
    };
    this.scores.set(id, score);
    return score;
  }

  async getHighScores(gameId: string, limit: number = 10): Promise<Score[]> {
    return this.getScores(gameId, limit);
  }
}

export const storage = new MemStorage();
