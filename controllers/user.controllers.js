import AppError from "../utils/error.util.js";
import User from "../models/user.models.js";
import fs from 'fs/promises'
import cloudinary from 'cloudinary';

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
        console.log("request body:",req);
        const {fullname, email, password} = req.body;
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
            avatar:{
                public_Id: email,
                //TODO: paste url
                secure_url: ""
            }
        })
    
        if(!user){
            return next(new AppError("user registeration failed, please try again", 400))
        }
        // TODO: file upload

        console.log('file details:', JSON.stringify(req.file));
        if(req.file){
            try {
                console.log("req file:". req.file);
                const result = cloudinary.v2.uploader.upload(req.file.path, {
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
        user.password = undefined
        const token = await user.generateJWTToken()
        console.log("token", token);
    
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
    res.cookie('token', null, {
        secure: true, 
        maxAge: 0,
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "user logged out successfully"
    })
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
    const email = req.body;
    if(!email){
        return next(new AppError("email is required", 400))
    }
    const user = await User.findOne({email})
    if(!user){
        return next(new AppError("email not registered", 400))
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    try {
        await sendEmail(email, subject, message);
        res.status(200).json({
            success: true, 
            message: `reset password token has been sent to ${email} successfully`
        })
    } catch (error) {
        user.forgotPasswordExpiry = undefined;
        user.forPasswordToken = undefined
        console.error("error occur while sending email:", error);
        return next(new AppError(error.message, 400))
    }

    }

const resetPassword = async(req, res) => {
        const {resetToken} = req.params;
        const {password} = req.body;
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
        user.forPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        user.save()
        res.status(200).json({
            success: true,
            message: "password changed successfully"
        })

    }
const changePassword = async(req, res) => {
        const {oldPassword, newPassword} = req.body;
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

    }
const updateUser = async(req, res) => {
        const {fullname} = req.body
        const {id} = req.user.id;
        const user = await User.findById(id)
        if(!user){
            return next(new AppError("user does not exist", 400))
        }
        if(req.fullname){
            user.fullname = fullname;
        }
        if(req.file){
            await cloudinary.v2.uploader.destroy(user.avatar.public_Id);
            try {
                console.log("req file:". req.file);
                const result = cloudinary.v2.uploader.upload(req.file.path, {
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
