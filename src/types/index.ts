export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  id: number;
  title: string;
  category: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
  isDeleted: boolean;
  userId: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface HabitCreateRequest {
  title: string;
  category: number;
  createdAt: Date;
}

export interface HabitUpdateRequest {
  title?: string;
  category?: number;
  isCompleted?: boolean;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export interface SyncRequest {
  lastSyncAt?: Date;
  changes?: Habit[];
}

export interface SyncResponse {
  habits: Habit[];
  lastSyncAt: Date;
}
