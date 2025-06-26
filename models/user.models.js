import mongoose from 'mongoose'

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
            type:String
        }
    },
    role:{
        type:String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date
},{timestamps:true})