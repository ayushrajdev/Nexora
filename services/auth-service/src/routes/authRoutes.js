import express from 'express';
import authController from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../validators/authValidator.js';

const router = express.Router();

router.post('/signup', validateSignup, (req, res, next) => authController.signup(req, res, next));
router.post('/login', validateLogin, (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

export default router;
