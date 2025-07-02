import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
    title:{
        type:String,
        required: [true, "title is required"],
        minLength: [8, "title must be atleast 8 characters"],
        maxLength: [60, "title should be less than 60 character"],
        trim: true

    },
    description:{
        type:String,
        required: [true, "description is required"],
        minLength: [8, "description must be atleast 8 characters"],
        maxLength: [60, "description should be less than 200 character"],
    },
    category:{
        type:String,
        required: [true, "category is required"]
    },
    thumbnail:{
        public_id:{
                type: String,
                required: true
            },
            secure_url:{
                type: String,
                required: true
            }

    },
    lectures:[
        {
            title: String,
            description: String,
            lectures:{
                public_id:{
                    type: String,
                    required: true
                    
                },
                secure_url:{
                    type: String,
                    required: true
                }
            }
        }
    ],
    numbersOfLectures:{
        type:Number,
        default: 0

    },
    createdBy:{
        type:String
    }
},{timestamps: true})

const Course = mongoose.model("Course",courseSchema)
export default Course