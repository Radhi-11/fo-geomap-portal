import { Router } from 'express';
import { login, register, getMe, refreshToken, changePassword, changeCredentials, logout } from './auth.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.get('/me', authenticate, getMe);
router.put('/password', authenticate, changePassword);
router.put('/credentials', authenticate, changeCredentials);

export default router;
