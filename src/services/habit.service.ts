import { PrismaClient, Habit as PrismaHabit } from '@prisma/client';
import { Habit, HabitCreateRequest, HabitUpdateRequest } from '../types';

const prisma = new PrismaClient();

export class HabitService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getAllHabits(userId: string): Promise<Habit[]> {
    const habits = await this.prisma.habit.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToHabit(habits);
  }

  async getHabitsByCategory(userId: string, category: number): Promise<Habit[]> {
    const habits = await this.prisma.habit.findMany({
      where: { userId, category, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToHabit(habits);
  }

  async getHabitById(userId: string, habitId: string): Promise<Habit | null> {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId, isDeleted: false },
    });

    return habit ? this.mapToHabit([habit])[0] : null;
  }

  async createHabit(userId: string, data: HabitCreateRequest): Promise<Habit> {
    const habit = await this.prisma.habit.create({
      data: {
        title: data.title,
        category: data.category,
        isCompleted: false,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        userId,
      },
    });

    return this.mapToHabit([habit])[0];
  }

  async updateHabit(
    userId: string,
    habitId: number,
    data: HabitUpdateRequest
  ): Promise<Habit | null> {
    const existing = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!existing) return null;

    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
        updatedAt: data.updatedAt,
        syncVersion: existing.syncVersion + 1,
      },
    });

    return this.mapToHabit([habit])[0];
  }

  async deleteHabit(userId: string, habitId: number): Promise<boolean> {
    const existing = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!existing) return false;

    await this.prisma.habit.update({
      where: { id: habitId },
      data: { isDeleted: true, updatedAt: new Date(), syncVersion: existing.syncVersion + 1 },
    });

    return true;
  }

  async getHabitsSince(userId: string, since: Date): Promise<Habit[]> {
    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        isDeleted: false,
        updatedAt: { gte: since },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return this.mapToHabit(habits);
  }

  async syncHabits(
    userId: string,
    changes: Array<{ id?: number; title: string; category: number; isCompleted: boolean; createdAt: Date; updatedAt: Date; deleted?: boolean }>
  ): Promise<Habit[]> {
    const syncedHabits: Habit[] = [];

    for (const change of changes) {
      if (change.deleted && change.id) {
        await this.deleteHabit(userId, change.id);
      } else if (change.id) {
        const updated = await this.updateHabit(userId, change.id, {
          title: change.title,
          category: change.category,
          isCompleted: change.isCompleted,
          updatedAt: change.updatedAt,
        });
        if (updated) syncedHabits.push(updated);
      } else {
        const created = await this.createHabit(userId, {
          title: change.title,
          category: change.category,
          createdAt: change.createdAt,
        });
        syncedHabits.push(created);
      }
    }

    return syncedHabits;
  }

  private mapToHabit(habits: PrismaHabit[]): Habit[] {
    return habits.map((h) => ({
      id: h.id,
      title: h.title,
      category: h.category,
      isCompleted: h.isCompleted,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      syncVersion: h.syncVersion,
      isDeleted: h.isDeleted,
      userId: h.userId,
    }));
  }
}

export const habitService = new HabitService();
