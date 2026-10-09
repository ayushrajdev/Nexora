const express = require('express');
const { createServiceProxy } = require('../proxy/proxyMiddleware');
const sessionAuth = require('../middlewares/sessionAuth');
const { authLimiter } = require('../middlewares/rateLimiter');
const services = require('../config/services');

const router = express.Router();

// Auth service proxy
const authProxy = createServiceProxy(services.AUTH_SERVICE_URL);

// Public auth routes
router.post('/auth/signup', authLimiter, authProxy);
router.post('/auth/login', authLimiter, authProxy);
router.get('/auth/oauth/*', authLimiter, authProxy);

// Protected auth route
router.post('/auth/logout', sessionAuth, authProxy);

// Profile service proxy
const profileProxy = createServiceProxy(services.PROFILE_SERVICE_URL);
router.get('/profile/*', sessionAuth, profileProxy);
router.patch('/profile/*', sessionAuth, profileProxy);

// Matching service proxy
const matchingProxy = createServiceProxy(services.MATCHING_SERVICE_URL);
router.post('/request/*', sessionAuth, matchingProxy);
router.get('/user/*', sessionAuth, matchingProxy);

// Chat service proxy
const chatProxy = createServiceProxy(services.CHAT_SERVICE_URL);
router.get('/chat/*', sessionAuth, chatProxy);

// Payment service proxy
const paymentProxy = createServiceProxy(services.PAYMENT_SERVICE_URL);
router.post('/payment/create', sessionAuth, paymentProxy);
router.post('/payment/webhook', paymentProxy); // Webhook is public (Razorpay)
router.get('/payment/premium/verify', sessionAuth, paymentProxy);

module.exports = router;
