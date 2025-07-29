import User from '../models/user.models.js';
import AppError from '../utils/error.util.js';
import {razorpay} from '../server.js'
import Payment from '../models/payment.model.js';
import crypto from 'crypto'
import asyncHandler from '../middlewares/asyncHandler.middleware.js';



const getRazorpayApiKey = async(req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Razorpay API Key",
        key: process.env.RAZORPAY_KEY_ID
    })
}

const buySubscription = async(req, res, next) => {
      try {
        const { id } = req.user;
        // check user exist or not
        const user = await User.findById(id);
        if (!user) {
          return next(new AppError("unauthorised user, please login"));
        }
        console.log("user:",user);
        if (user.role === "ADMIN") {
          return next(new AppError("admin cannot purchased course", 400));
        }
        if (user?.subscription &&  user?.subscription?.status === "active") {
          return next(
            new AppError("you already have an active subscription", 400)
          );
        }
        const options = {
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12, // 12 months subscription
        }
    
        const subscription = await razorpay.subscriptions.create(options);
        if (!subscription) {
            return next(new AppError("failed to create subscription", 500));
        }
        console.log("subscription =>", subscription);
        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
        await user.save();
        return res.status(200).json({
          success: true,
          message: "subscribe successfully",
          subscription_id: subscription.id,
        });
      
      } catch (error) {
        console.error("failed to buy subscription>", error);
        if (error.code === 'BAD_REQUEST') {
            return next(new AppError('bad request, please try again', 400));
        }
        if (error.code === 'INTERNAL_SERVER_ERROR') {
            return next(new AppError('internal server error, please try again later', 500));
        }
        return next(new AppError('failed to buy subscription', 500));
        
      }
  }

// this function is used to verify the subscription of the user
// it will check the payment signature and update the subscription status in the user model
const verifySubscription = async(req, res, next) => {
    try {
        const {id} = req.user
        const {razorpay_payment_id, razorpay_signature, razorpay_subscription_id} = req.body
        if(!razorpay_payment_id || !razorpay_signature || !razorpay_subscription_id){
            return next(new AppError('invalid request, please try again', 400));
        }
        const user = await User.findById(id)
        if(!user){
            return next(new AppError('unauthorised user, please login '))
        }
        const subscriptionId = user.subscription.id;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_ID)
            .update(`${razorpay_payment_id}|${subscriptionId}`)
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

// this function is used to cancel the subscription of the user
// it will update the subscription status to cancelled in the user model
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
        res.status(200).json({
                success: true,
                message: "cancel subscription successfully",
        })

    } catch (error) {
        console.error("failed to cancel subscription>", error)
        return next(new AppError('failed to cancel  subscription',500))

    }
}

// this function is used to get all the payments made by the user
// it will return the subscription details of the user
// const getAllPayment = async(req, res, next) => {
//     try {
//         const {count} = req.query;
//         const subscription = await razorpay.subscriptions.all({
//             count: count || 10
//         })
//         // console.log("subscription:",subscription);
//         // const monthlySummary = {};        
//         // subscription.items.forEach(item => {
//         //     const date = new Date(item.created_at * 1000); // convert from seconds
//         //     console.log("date:",date);
//         //     const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
//         //     console.log("month:",monthKey);

//         //     if (!monthlySummary[monthKey]) {
//         //       monthlySummary[monthKey] = 0;
//         //     }

//         //     monthlySummary[monthKey] += item.plan; // Convert paise to INR
//         //   });
        
//         // console.log("monthlySaleRecord:",monthlySummary);
//         res.status(200).json({
//                 success: true,
//                 message: "all payments",
//                 subscription,
//                 // monthlySalesRecord: monthlySummary

//         })
//     } catch (error) {
//         console.error("failed to get all payment>",error)
//         return next(new AppError('failed to get all payment>',500))
//     }
    
// }

  const getAllPayment = asyncHandler(async (req, res, _next) => {
  const {count} = req.query;
  
  // Find all subscriptions from razorpay
  const allPayment = await razorpay.subscriptions.all({
    count: count ? count : 10
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayment.items.map((payment) => {
    // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
    const monthsInNumbers = new Date(payment.start_at * 1000);
    
    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });
  let totalpayment = 0;
  allPayment.items.forEach((elemet) => {
    if(elemet.status === "active"){
      totalpayment++
    }
  })
  console.log("total count:",totalpayment);
  res.status(200).json({
    success: true,
    message: 'All payments',
    allPayment,
    finalMonths,
    monthlySalesRecord,
  });
});

export{
    getAllPayment,
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription
}