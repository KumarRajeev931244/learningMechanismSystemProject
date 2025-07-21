import AppError from "../utils/error.util.js";
import User from "../models/user.models.js";
import fs from 'fs/promises'
import cloudinary from 'cloudinary';
import { sendEmail } from "../utils/sendEmail.js";
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true
}

const register = async(req, res, next) => {
    // extract the required field from req 
    // check field are empty or not
    // check  user already exist or not
    // if user exist give message already exist otherwise if not create new user 
    try {
        const {fullname, email, password, role} = req.body;
        if(!fullname|| !email || !password){
            return next(new AppError("all fields are required"))
        }
        // if user exist return from register page
        const existingUser = await User.findOne({email})
        if(existingUser){
            return next(new AppError("user already exist"))
        }
        
        const user = await User.create({
            fullname,
            email, 
            password,
            role,
            avatar:{
                public_Id: "default_avatar",
                //TODO: paste url
                secure_url: ""
            }
        })
    
        if(!user){
            return next(new AppError("user registeration failed, please try again", 400))
        }
        // TODO: file upload

        // console.log('file details:', JSON.stringify(req.file));
        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lmsProject',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill'
                })
                // console.log("image result:", result);
                if(result){
                    user.avatar.public_Id = result.public_id,
                    user.avatar.secure_url = result.secure_url

                    // remove file from local
                    fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (error) {
                console.log("failed to upload avatar:", error);
                return next(
                    new AppError(error || 'file is not uploaded,please try again')
                )
                
            }
        }
        if(!user.avatar.secure_url){
            return next(
                    new AppError(error || 'please upload avatar image', 400)
                )
        }
        
        await user.save();
        user.password = undefined
        const token = await user.generateJWTToken()
        // console.log("token", token);
    
        // set cookie
        res.cookie('token', token,cookieOptions)
    
        res.status(201).json({
            success:true,
            message:"user register successfully",
            user,
        })
        
    } catch (error) {
        return next(new AppError("error occur while registering", 500))
    }

}

const login = async(req, res) => {
    try {
        const {email , password} = req.body
        const user = await User.findOne({email}).select('+password')
        if(!user || !user.comparePassword(password)){
            return next(new AppError("email or password does not match", 400))
        } 
        const token = await user.generateJWTToken();
        user.password = undefined;
        res.cookie('token', token, cookieOptions);
        res.status(200).json(
           { success: true,
             message: "user login successfully",
             user
           }
        )
    } catch (error) {
        return next(new AppError("error occur while login", 500))
    }  
}

const logout = (req, res) => {
    try {
        res.cookie('token', null, {
            secure: true, 
            maxAge: 0,
            httpOnly: true
        })
        res.status(200).json({
            success: true,
            message: "user logged out successfully"
        })
    } catch (error) {
        console.error("error occur while logging out:", error);
        return next(new AppError("error occur while logging out", 500))
    }
}

const getProfile = async(req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
        res.status(200).json({
            success: true,
            message: "user details",
            user
        })
    } catch (error) {
        return next(new AppError("failed to fetch profile", 500))
    }
}

const forgotPassword = async(req, res, next) => {
    const {email} = req.body;
    if(!email){
        return next(new AppError("email is required", 400))
    }
    const user = await User.findOne({email})
    if(!user){
        return next(new AppError("email not registered", 400))
    }
    const resetToken = await user.generatePasswordResetToken();
    console.log('resetToken:', resetToken);
    await user.save();
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    try {
        await sendEmail({
            email,
            subject: 'reset password', message:`click here to reset your password:${resetPasswordUrl}`});
        res.status(200).json({
            success: true, 
            message: `reset password token has been sent to ${email} successfully`
        })
    } catch (error) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined
        console.error("error occur while sending email:", error);
        return next(new AppError(error.message, 400))
    }

    }

const resetPassword = async(req, res, next) => {
        try {
            console.log("request:",req.body);
            const {resetToken} = req.params;  //extract reset token from params
            if(!resetToken){
                return next(new AppError("reset token is required", 400))
            }
            const {password} = req.body; //extract password from body
            if(!password){
                return next(new AppError("password is required", 400))
            }
            const forgotPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex')
    
            const user = await User.findOne({
                forgotPasswordToken,
                forgotPasswordExpiry: {$gt: Date.now()}
            })
            if(!user){
               return next(new AppError("token is invalid or expired, please try again", 400))
            }
            user.password = password;
            user.forgotPasswordToken = undefined;
            user.forgotPasswordExpiry = undefined;
            await user.save()
            res.status(200).json({
                success: true,
                message: "password changed successfully"
            })
    
        } catch (error) {
            console.error("error occur while resetting password:", error);
            return next(new AppError("error occur while resetting password", 500))
        }
    }
const changePassword = async(req, res, next) => {
        try {
            const {oldPassword, newPassword} = req.body;
            console.log('req user:',req.user);
            const {id} = req.user;
            if(!oldPassword || !newPassword){
                return next(new AppError("all field are mandatory", 400))
            }
            const user = await User.findById(id).select('+password')
            if(!user){
                return next(new AppError("user does not exist", 400))
            }
            const isPasswordValid = await user.comparePassword(oldPassword);
            if(!isPasswordValid){
                return next(new AppError("invalid old password", 400))
            }
            user.password = newPassword;
            await user.save()
            user.password = undefined
            res.status(200).json({
                success: true,
                message: "password changed successfully"
            })
        } catch (error) {
            console.error("error occur while changing password:", error);
            return next(new AppError("error occur while changing password", 500))
            
        }

    }
const updateUser = async(req, res, next) => {
        console.log("request body:", req.body);
        const {fullname} = req.body
        const {id} = req.user;
        console.log("request id:", id);
        const user = await User.findById(id)
        console.log("user:", user);
        if(!user){
            return next(new AppError("user does not exist", 400))
        }
        if(fullname){
            user.fullname = fullname;
        }
        console.log("request file:", req.file);
        if(req.file){
            const destroy = await cloudinary.v2.uploader.destroy(user.avatar.secure_url);
            console.log("destroy result:", destroy);
            try {
                // console.log("req file:". req.file);
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lmsProject',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill'
                })
                console.log("image result:", result);
                if(result){
                    user.avatar.public_Id = result.public_Id,
                    user.avatar.secure_url = result.secure_url

                    // remove file from local
                    fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (error) {
                console.log("failed to upload avatar:", error);
                return next(
                    new AppError(error || 'file is not uploaded,please try again')
                )        
            }
        }
        await user.save();
        res.status(200).json({
            success: true,
            message: "user details updated  successfully"
        })
    }
export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    updateUser,
    changePassword
}
