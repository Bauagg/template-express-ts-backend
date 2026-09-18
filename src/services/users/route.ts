import { Router } from 'express';
import { register, login, refreshToken, getProfile, updateProfile, createEmployee, getEmployeeById, deleteEmployee } from './controller';
import { authenticate } from '../../middlewares/authenticate';
import upload from '../../config/multer';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('photo'), updateProfile);
router.post('/', authenticate, createEmployee);
router.get('/:id', authenticate, getEmployeeById);
router.delete('/:id', authenticate, deleteEmployee);

export default router;
