import { Router } from 'express';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from './controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.post('/', authenticate, createCompany);
router.get('/', getAllCompanies);
router.get('/:id', authenticate, getCompanyById);
router.put('/:id', authenticate, updateCompany);
router.delete('/:id', authenticate, deleteCompany);

export default router;
