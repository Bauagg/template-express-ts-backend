import { Router } from 'express';
import {
  createFlexParam,
  getAllFlexParams,
  getFlexParamById,
  getFlexParamsByType,
  getFlexParamsByHeaderId,
  updateFlexParam,
  deleteFlexParam,
} from './controller';
import { authenticate } from '../../middlewares/authenticate';
import upload from '../../config/multer';

const router = Router();

router.post('/', authenticate, upload.single('photo'), createFlexParam);
router.get('/', getAllFlexParams);
router.get('/type/:type_param', getFlexParamsByType);
router.get('/header/:header_id', getFlexParamsByHeaderId);
router.get('/:id', authenticate, getFlexParamById);
router.put('/:id', authenticate, upload.single('photo'), updateFlexParam);
router.delete('/:id', authenticate, deleteFlexParam);

export default router;
