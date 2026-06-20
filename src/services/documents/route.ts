import { Router } from 'express';
import { uploadDocument, getDocument, updateDocument, deleteDocument, bulkUploadDocument, bulkUpdateDocument, bulkUpsertDocument } from './controller';
import { authenticate } from '../../middlewares/authenticate';
import upload from '../../config/multer';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.post('/bulk-upload', authenticate, upload.array('files', 10), bulkUploadDocument);
router.put('/bulk-update', authenticate, upload.array('files', 10), bulkUpdateDocument);
router.post('/bulk-upsert', authenticate, upload.array('files', 10), bulkUpsertDocument);
router.get('/:id', authenticate, getDocument);
router.put('/:id', authenticate, upload.single('file'), updateDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;
