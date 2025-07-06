import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto';
const userSchema = new mongoose.Schema({
    fullname:{
        type: String,
        required: [true, "name is required"],
        min: [5, 'name must be atleast 5 character'],
        max: [50, 'name should be not more than 50 character'],
        lowercase: true,
        trim: true
    },
    email:{
        type: String,
        required: [true, 'email is required'],
        unique: true
    },
    password: {
        type:String,
        required: [true, 'password is required'],
        min: [6, "password must be atleast 6 character"],
        select: false,
        unique: true
    },
    avatar:{
        public_id:{
            type: String
        },
        secure_url:{
            type: String
        }
    },
    role:{
        type:String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription:{
        id: String,
        status: String
    }
},{timestamps:true})

userSchema.pre('save', async function(next){
    // if password is not modified
    if(!this.isModified('password')){
        return next()
    }
    // if password is modified
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods = {
    generateJWTToken:  function(){
        return  jwt.sign(
            {id: this._id, email: this.email, subscription: this.subscription, role: this.role},
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        )
    },
    comparePassword: async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword, this.password)
    },
    generatePasswordResetToken: async function(){
        // generate reset token 
        const resetToken = crypto.randomBytes(20).toString('hex')
        this.forgotPasswordToken = crypto
                                    .createHash('sha256')
                                    .update(resetToken)
                                    .digest('hex')
        // set  expiry time for 15 minutes
        this.forgotPasswordExpiry = Date.now() + 15*60*1000
        return resetToken;

    }
}

const User = new mongoose.model("User",userSchema)
export default User