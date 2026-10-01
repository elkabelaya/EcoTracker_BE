import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { RegisterRequest, AuthResponse } from '../types';

const prisma = new PrismaClient();

export class AuthController {
  async register(req: Request<{}, {}, RegisterRequest>, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { email, password: hashedPassword },
        select: { id: true, email: true },
      });

      const accessToken = authService.generateAccessToken(user.id, user.email);
      const refreshToken = await authService.generateRefreshToken(user.id);

      const response: AuthResponse = {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request<{}, {}, { email: string; password: string }>, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = authService.generateAccessToken(user.id, user.email);
      const refreshToken = await authService.generateRefreshToken(user.id);

      const response: AuthResponse = {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email },
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: Request<{}, {}, { refreshToken: string }>, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const { userId } = await authService.validateRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      await authService.revokeRefreshToken(refreshToken);

      const newAccessToken = authService.generateAccessToken(user.id, user.email);
      const newRefreshToken = await authService.generateRefreshToken(user.id);

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          await authService.revokeRefreshToken(token);
        } catch (error) {
          // Ignore if token is not a refresh token
        }
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, createdAt: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();
