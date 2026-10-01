import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { habitController } from '../controllers/habit.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth routes (public)
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));
router.post('/auth/refresh-token', authController.refreshToken.bind(authController));
router.post('/auth/logout', authenticate, authController.logout.bind(authController));
router.get('/auth/profile', authenticate, authController.getProfile.bind(authController));

// Habit routes (protected)
router.get('/habits', authenticate, habitController.getAllHabits.bind(habitController));
router.get('/habits/category/:category', authenticate, habitController.getHabitsByCategory.bind(habitController));
router.get('/habits/:id', authenticate, habitController.getHabitById.bind(habitController));
router.post('/habits', authenticate, habitController.createHabit.bind(habitController));
router.put('/habits/:id', authenticate, habitController.updateHabit.bind(habitController));
router.delete('/habits/:id', authenticate, habitController.deleteHabit.bind(habitController));

// Sync route (protected)
router.get('/sync', authenticate, habitController.sync.bind(habitController));
router.post('/sync', authenticate, habitController.sync.bind(habitController));

export default router;
