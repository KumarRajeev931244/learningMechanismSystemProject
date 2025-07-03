import {Router} from 'express';
import isLoggedIn, { authorisedRoles } from '../middlewares/auth.middleware.js';
const router = Router();

router.route('/razorpay-key').get(isLoggedIn,getRazorpayApiKey)

router.route('/subscribe').post(isLoggedIn,subscription)

router.route('/verify').post(isLoggedIn,verifySubscription)

router.route('/unsubscribe').post(isLoggedIn,cancelSubscription)

router.route('/').get(isLoggedIn,authorisedRoles('ADMIN'),getAllPayment)

export default router