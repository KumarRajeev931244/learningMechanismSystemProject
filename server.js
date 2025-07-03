import app from "./app.js";
import connectionDB from '../server/config/dbconnection.js'
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay';

// Cloudinary configuration
cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// razorpay configuration

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_ID
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, async() => {
    await connectionDB()
    console.log(`app is running at PORT:${PORT}`);
})