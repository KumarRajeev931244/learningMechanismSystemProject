import {Router} from 'express';
import {isLoggedIn,  authorisedRoles } from '../middlewares/auth.middleware.js';
import {getAllPayment,getRazorpayApiKey,buySubscription,
verifySubscription,cancelSubscription} from '../controllers/payment.controllers.js';
const router = Router();

router.route('/razorpay-key').get(isLoggedIn,getRazorpayApiKey)

router.route('/subscribe').post(isLoggedIn,buySubscription)

router.route('/verify').post(isLoggedIn,verifySubscription)

router.route('/unsubscribe').post(isLoggedIn,cancelSubscription)

router.route('/').get(isLoggedIn,authorisedRoles('ADMIN'),getAllPayment)

export default router