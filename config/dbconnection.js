import mongoose from "mongoose";

mongoose.set('strictQuery', false)


const connectionDB = async() => {
    try {
        const {connection} = await mongoose.connect(process.env.MONGODB_URI)
        if(connection){
            console.log(`connected to MongoDb ${connection.host}`);
        }
    } catch (error) {
        console.error(`failed to connect to database:${error}`);
        process.exit(1)        
    }
}

export default connectionDB