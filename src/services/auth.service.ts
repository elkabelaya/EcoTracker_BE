import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  generateRefreshToken(userId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const existingTokens = await this.prisma.refreshToken.findMany({
          where: { userId },
        });

        for (const token of existingTokens) {
          await this.prisma.refreshToken.delete({ where: { id: token.id } });
        }

        const token = jwt.sign(
          { userId },
          config.jwt.refreshSecret,
          { expiresIn: config.jwt.refreshExpiresIn }
        );

        const expiresAt = new Date();
        const expiresInMs = this.parseExpiresIn(config.jwt.refreshExpiresIn);
        expiresAt.setTime(expiresAt.getTime() + expiresInMs);

        await this.prisma.refreshToken.create({
          data: {
            token,
            userId,
            expiresAt,
          },
        });

        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  }

  verifyRefreshToken(token: string): Promise<{ userId: string }> {
    return new Promise((resolve, reject) => {
      try {
        const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
          userId: string;
        };
        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    });
  }

  async validateRefreshToken(token: string): Promise<{ userId: string }> {
    const decoded = await this.verifyRefreshToken(token);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    return { userId: refreshToken.userId };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}

export const authService = new AuthService();
