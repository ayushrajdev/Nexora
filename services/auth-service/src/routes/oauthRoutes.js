import express from 'express';
import oauthController from '../controllers/oauthController.js';

const router = express.Router();

router.get('/google', (req, res, next) => oauthController.googleRedirect(req, res, next));
router.get('/google/callback', (req, res, next) => oauthController.googleCallback(req, res, next));

router.get('/github', (req, res, next) => oauthController.githubRedirect(req, res, next));
router.get('/github/callback', (req, res, next) => oauthController.githubCallback(req, res, next));

export default router;
