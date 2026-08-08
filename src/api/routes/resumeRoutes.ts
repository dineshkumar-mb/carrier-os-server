import express from 'express';
import multer from 'multer';
import { getResumes, saveResume, parseUploadedResume, auditMasterResume, createTailoredResume } from '../controllers/resumeController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getResumes)
  .put(saveResume);

router.post('/tailor', createTailoredResume);
router.post('/parse', upload.single('resume'), parseUploadedResume);
router.get('/audit', auditMasterResume);

export default router;
