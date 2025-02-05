import express from 'express';
import { buySubscription, cancleSubscription, getAllPaymets, getRazorpayApiKey, veriyfySubscription } from '../controllers/payment.controller.js';
import { authorizeRoles, isLoggedIn } from '../middleware/auth.middleware.js';


const router = express.Router();

router.route('/razorpay-key').get(isLoggedIn,getRazorpayApiKey);

router.route('/subscribe').post(isLoggedIn,buySubscription);

router.route('/verify').post(isLoggedIn,veriyfySubscription);

router.route('/unsubscribe').post(isLoggedIn,cancleSubscription);

router.route('/').get(isLoggedIn,authorizeRoles('ADMIN'),getAllPaymets);


export default router;