import { Router } from 'express';
import {
  createRoleMenuPermission,
  updateRoleMenuPermission,
  getAllRoleMenuPermissions,
  getRoleMenuPermissionByRole,
  deleteRoleMenuPermission,
} from './controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.post('/', authenticate, createRoleMenuPermission);
router.get('/', authenticate, getAllRoleMenuPermissions);
// '/detail' harus didaftarkan sebelum '/:flex_param_role_id',
// kalau tidak 'detail' akan ditangkap sebagai nilai param
router.get('/detail', authenticate, getRoleMenuPermissionByRole);
router.put('/:flex_param_role_id', authenticate, updateRoleMenuPermission);
router.delete('/:flex_param_role_id', authenticate, deleteRoleMenuPermission);

export default router;
