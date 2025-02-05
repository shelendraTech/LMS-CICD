import User from "../models/user.model.js"
import AppError from "../utils/appError.js";
import {rozarpay} from '../server.js';
import crypto from 'crypto';
import Payment from "../models/payment.model.js";


export const getRazorpayApiKey = async(req,res,next)=>{
 try {
    res.status(200).json({
        success:true,
        message:'Razorpay API key',
        key:process.env.RAZORPAY_KEY_ID
    })
 } catch (e) {
    return next(new AppError(e.message ,500))
 }
}

export const buySubscription = async(req,res,next)=>{
  try {
    const {id} = req.user;

    const user =  await User.findById(id);

    if(!user){
        return next(new AppError('Unauthorized,please login',400))
    }

    if(user.role === 'ADMIN'){
        return next(new AppError('Admin can not subscription',400))
    }


     // Creating a subscription using razorpay that we imported from the server
     const subscription =  await rozarpay.subscriptions.create({
        plan_id:process.env.RAZORPAY_PLAN_ID,
        customer_notify:1
     })

     // update user model with this subscription
     user.subscription.id = subscription.id,
     user.subscription.status = subscription.status;


    //  Saving the user accound
    await user.save();

    res.status(200).json({
        success:true,
        message:'Subcribe Successfully',
        subscription_id:subscription.id
    })
  } catch (e) {
     return next(new AppError(e.message || 'Something else',500))
  }
}

export const veriyfySubscription = async(req,res,next)=>{
 
    try {
        const {id} =req.user;

        const user = await User.findById(id);

        if(!user){
            return next(new AppError('Unautorized user',500))
        }

        const {razorpay_payment_id,razorpay_subscription_id,razorpay_signature  } =req.body;

        const generateSingnature = crypto
        .createHmac('sha256',process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)

        if(generateSingnature !== razorpay_signature){
            return next(new AppError('Payment Not Verify,please try again',400))
        }

        //save this record in the payment collection(model)

        await Payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        })

        // update the user model subscription status 
        user.subscription.status ="active";
        await user.save();

        res.status(200).json({
            success:true,
            message:'Payment verify Successfully',
        })



    } catch (e) {
        return next(new AppError(e.message || 'something else',400))
    }


}

export const cancleSubscription = async(req,res,next)=>{
 try {
    const {id} = req.user;

    const user = await User.findById(id);

    if(!user){
        return next(new AppError('Unautorized,please try again',400))
    }

    if(user.role === 'ADMIN'){
        return next(new AppError('Admin can not subscription',400))
    }

    //get subscription id from the user model;
    const subscriptionId = user.subscription.id;


    const subscription = await rozarpay.subscriptions.cancel(subscriptionId);

    // update the user status
    user.subscription.status = subscription.status;
    await user.save();

    res.status(200).json({
        success:true,
        message:"Subscription canclled",
    })

 } catch (e) {
    return next(new AppError(e.message))
 }
}

export const getAllPaymets = async(req,res,next)=>{
  try {
    const {count} = req.query;

    const subscriptions = await rozarpay.subscriptions.all(
        {
            count : count || 10,
        }
    )

    res.status(200).json({
        success:true,
        message:"All Payment",
        payments:subscriptions
    })
  } catch (error) {
    
  }
}