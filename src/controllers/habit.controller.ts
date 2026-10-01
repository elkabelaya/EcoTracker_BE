import { Response } from 'express';
import { habitService } from '../services/habit.service';
import { AuthRequest } from '../middleware/auth';
import { HabitCreateRequest, HabitUpdateRequest, SyncRequest, SyncResponse } from '../types';

export class HabitController {
  async getAllHabits(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const habits = await habitService.getAllHabits(req.user.id);
      res.json(habits);
    } catch (error) {
      console.error('Get all habits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getHabitsByCategory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const category = parseInt(req.query.category as string);
      
      if (isNaN(category) || category < 0 || category > 3) {
        return res.status(400).json({ error: 'Invalid category (must be 0-3)' });
      }

      const habits = await habitService.getHabitsByCategory(req.user.id, category);
      res.json(habits);
    } catch (error) {
      console.error('Get habits by category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getHabitById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const habitId = parseInt(req.params.id);
      
      if (isNaN(habitId)) {
        return res.status(400).json({ error: 'Invalid habit ID' });
      }

      const habit = await habitService.getHabitById(req.user.id, habitId);
      
      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json(habit);
    } catch (error) {
      console.error('Get habit by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createHabit(req: AuthRequest<{}, {}, HabitCreateRequest>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, category, createdAt } = req.body;

      if (!title || category === undefined) {
        return res.status(400).json({ error: 'Title and category are required' });
      }

      if (category < 0 || category > 3) {
        return res.status(400).json({ error: 'Invalid category (must be 0-3)' });
      }

      const habit = await habitService.createHabit(req.user.id, {
        title,
        category,
        createdAt: createdAt || new Date(),
      });

      res.status(201).json(habit);
    } catch (error) {
      console.error('Create habit error:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Habit with this title and category already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateHabit(req: AuthRequest<{}, {}, HabitUpdateRequest>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const habitId = parseInt(req.params.id);
      
      if (isNaN(habitId)) {
        return res.status(400).json({ error: 'Invalid habit ID' });
      }

      const { title, category, isCompleted, updatedAt } = req.body;

      if (!updatedAt) {
        return res.status(400).json({ error: 'UpdatedAt is required' });
      }

      const habit = await habitService.updateHabit(req.user.id, habitId, {
        title,
        category,
        isCompleted,
        updatedAt: new Date(updatedAt),
      });

      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json(habit);
    } catch (error) {
      console.error('Update habit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteHabit(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const habitId = parseInt(req.params.id);
      
      if (isNaN(habitId)) {
        return res.status(400).json({ error: 'Invalid habit ID' });
      }

      const success = await habitService.deleteHabit(req.user.id, habitId);
      
      if (!success) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
      console.error('Delete habit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async sync(req: AuthRequest<{}, {}, SyncRequest>, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { lastSyncAt, changes } = req.body;
      const response: SyncResponse = {
        habits: [],
        lastSyncAt: new Date(),
      };

      if (lastSyncAt) {
        response.habits = await habitService.getHabitsSince(req.user.id, new Date(lastSyncAt));
      } else {
        response.habits = await habitService.getAllHabits(req.user.id);
      }

      if (changes && changes.length > 0) {
        const synced = await habitService.syncHabits(req.user.id, changes);
        response.habits = [...response.habits, ...synced];
      }

      res.json(response);
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const habitController = new HabitController();
