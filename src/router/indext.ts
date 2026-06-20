import { Router } from 'express';
import userRoute from '../services/users/route';
import documentRoute from '../services/documents/route';
import flexParamRoute from '../services/flex-params/route';

const router = Router();

router.use('/users', userRoute);
router.use('/documents', documentRoute);
router.use('/flex-params', flexParamRoute);

export default router;
