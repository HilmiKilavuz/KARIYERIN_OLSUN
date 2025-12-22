import express from 'express';
import multer from 'multer';
import * as cvController from '../controllers/cvController.js';
import * as avatarController from '../controllers/avatarController.js';
import * as authController from '../controllers/authController.js';
import * as emotionController from '../controllers/emotionController.js';

const router = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- AUTH ROUTES ---
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/update-profile', authController.updateProfile);
router.get('/auth/profile/:userId', authController.getProfile);
router.get('/auth/analysis/:userId', authController.getAnalysisResult);
router.get('/interview-history/:userId', authController.getInterviewHistory);

// --- CV ROUTES ---
router.post('/upload-cv', upload.single('cvFile'), cvController.uploadCv);
router.post('/delete-cv', cvController.deleteCv);
router.get('/analysis-result/:id', cvController.getAnalysis);

// --- AVATAR ROUTES ---
router.post('/streams/create', avatarController.createStream);
router.post('/streams/:id/start', avatarController.startStream);
router.post('/streams/:id/ice', avatarController.submitIceCandidate);
router.post('/streams/:id/talk', avatarController.talkToAvatar);
router.post('/streams/:id/start-interview', avatarController.startInterview);
router.delete('/streams/:id', avatarController.deleteStream);

// --- EMOTION ANALYSIS ROUTES ---
router.post('/emotion/analyze-frame', emotionController.analyzeFrame);
router.post('/emotion/record-question', emotionController.recordQuestion);
router.get('/emotion/session/:sessionId', emotionController.getSessionStats);
router.post('/emotion/save-interview', emotionController.saveInterview);
router.post('/emotion/reset/:sessionId', emotionController.resetSession);
router.get('/emotion/health', emotionController.healthCheck);

export default router;

