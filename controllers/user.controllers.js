import AppError from "../utils/error.util";
import User from "../models/user.models.js";

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

        if(req.file){
            try {
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
                }
            } catch (error) {
                console.log("failed to upload avatar:", error);
                
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

export {
    register,
    login,
    logout,
    getProfile
}
