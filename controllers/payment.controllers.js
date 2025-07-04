import User from '../models/user.models.js';
import AppError from '../utils/error.util.js';
import {razorpay} from '../server.js'
import Payment from '../models/payment.model.js';


const getRazorpayApiKey = async(req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Razorpay API Key",
        key: process.env.RAZORPAY_KEY_ID
    })
}

const buySubscription = async(req, res, next) => {
    try {
        const {id} = req.user;
        const user = await User.findById(id)
        if(!user){
            return next(new AppError('unauthorised user, please login '))
        }
        if(user.role === 'ADMIN'){
            return next(new AppError('admin cannot purchased course ',400))
        }
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify : 1
        })
        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
        await user.save()
        res.status(200).json({
            success: true,
            message: "subscribe successfully",
            subscription_id: subscription.id
        })
    } catch (error) {
        console.error("failed to buy subscription>",error)
        return next(new AppError('failed to buy subscription',500))

    }
}

const verifySubscription = async(req, res, next) => {
    try {
        const {id} = req.user
        const {razorpay_payment_id, razorpay_signature, razorpay_subscription_id} = req.body
        const user = await User.findById(id)
        if(!user){
            return next(new AppError('unauthorised user, please login '))
        }
        const subscriptionId = user.subscription.id;
        const generatedSignature = crypto
            .createHash('sha256', process.env.RAZORPAY_SECRET_ID)
            .update(`${razorpay_payment_id} | ${subscriptionId}`)
            .digest('hex')
        if(generatedSignature !== razorpay_signature){
            return next(new AppError('payment not verified , please try again '))
        }
        await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        })
        user.subscription.status = 'active'
        await user.save()
        res.status(200).json({
                success: true,
                message: "verified payment successfully",
            })
    } catch (error) {
        console.error("failed to verify payment>",error);
        return next(new AppError('failed to verify payment',500))

        
    }
}

const cancelSubscription = async(req, res, next) => {
    try {
        const {id} = req.user;
        const user = await User.findById(id)
        if(!user){
            return next(new AppError('unauthorised user, please login '))
        }
        if(user.role === 'ADMIN'){
            return next(new AppError('admin cannot purchased course ',400))
        }
        const subscriptionId = user.subscription.id;
        const subscription = await razorpay.subscriptions.cancel(subscriptionId)
        user.subscription.status = subscription.status;
        await user.save()
    } catch (error) {
        console.error("failed to cancel subscription>", error)
        return next(new AppError('failed to cancel  subscription',500))

    }
}

const getAllPayment = async(req, res, next) => {
    try {
        const {count} = req.query;
        const subscription = await razorpay.subscriptions.all({
            count: count || 10
        })
        res.status(200).json({
                success: true,
                message: "all payments",
                subscription
        })
    } catch (error) {
        console.error("failed to get all payment>",error)
        return next(new AppError('failed to get all payment>',500))
    }
    
}

export{
    getAllPayment,
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription
}