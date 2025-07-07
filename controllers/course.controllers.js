import Course from '../models/course.model.js';
import fs from 'fs/promises';
import cloudinary from 'cloudinary';
import AppError from '../utils/error.util.js';




const getAllCourses = async(req, res) => {
    try {
        const allCourses = await Course.find({}).select('-lecture')
        if(!allCourses || allCourses.length === 0){
            return next(new AppError("no courses found"));
        }

        res.status(200).json({
            success: true,
            message: "course lecture fetched successfully",
            courses: allCourses
        })
    } catch (error) {
        console.error("course error:",error);
        return next(new AppError(error || "unable to fetch all coure details"));
    }
}


const getLecturesByCourseId = async function(req, res, next) {
    try {
       const {id} = req.param;
       const course = await Course.findById(id);
       if(!course){
         return next(new AppError(error || "invalid course id"));
       }
       res.status(200).json({
            success: true,
            message: "course lecture fetched successfully",
            lectures: course.lectures
        })

        
    } catch (error) {
        console.error("course error:",error);
        return next(new AppError(error || "unable to fetch course lecture"));
    }

    
}

const createCourse = async (req, res, next) => {
    try {
        console.log("req.body:",req.body);
        const {title, description, category, createdBy} = req.body
        if(!title || !description || !category|| !createdBy){
            return next(new AppError(error || "unable to create course, all fields are required"));
        }
    
        const course = await Course.create({
            title, 
            description, 
            category, 
            createdBy,
            thumbnail:{
            public_id: 'dummy',
            secure_url: 'dummy'

    }
        })
        if(!course){
            return next(new AppError(error || "course could not be created"));
        }
        try {
            if(req.file){
                const result = await cloudinary.v2.uploader.upload(req.file.path,{
                    folder: 'lms'
                })
                if(result){
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url
                }
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
             return next(new AppError(error || "unable to upload thumbnail lecture"));
        }
        await course.save()
        res.status(200).json({
            success: true,
            message: 'course created successfully',
            course
        })


    } catch (error) {
        return next(new AppError(error || "unable to create course lecture"));
    }

}

const updateCourse = async (req, res, next) => {
    try {
        // console.log("req.param:",req.params);
        const {id} = req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )
        if(!course){
            return next(new AppError(error || "course with given id does not exist")); 
        }
        res.status(200).json({
            success: true,
            message: "course lecture updated successfully",
            course
        })
        
    } catch (error) {
        console.error("course updation error:",error);
        return next(new AppError(error || "unable to update course"));

        
    }

}

const removeCourse = async (req, res, next) => {
    try {
        const {id} = req.param;
        const course = await Course.findById(id);
        if(!course){
            return next(new AppError(error || "course does not exist with this id"));
        }
        await Course.findByIdAndDelete(id)
        res.status(200).json({
            success: true,
            message: "course deleted successfully",
            course
        })
    } catch (error) {
        console.error("course deletion error:",error);
        return next(new AppError(error || "unable to delete course"));
    }
    

}

const addLectureToCourseById = async(req, res, next) => {
  try {
    console.log("req.body:", req.body);
    const { title, description } = req.body;
    const { id } = req.params;
    const course = await Course.findById(id);
    console.log("course:", course);
    // agar course nahi mila to error throw karna hai
    if (!course) {
      return next(new AppError(error || "course with given id does not exist"));
    }
    // agar title ya description nahi hai to error throw karna hai
    if (!title || !description) {
      return next(
        new AppError(
          error || "title and description are required to add lecture"
        )
      );
    }
    // lecture data ke andar title, description, lecture ke andar public_id aur secure_url ko store karna hai
    const lectureData = {
      title,
      description,
      lectures: {},
    };
    try {
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        console.log("result:", result);
        if (result) {
          lectureData.lectures.public_id = result.public_id;
          lectureData.lectures.secure_url = result.secure_url;
        }
        await fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error || "unable to upload thumbnail lecture"));
    }
    course.lectures.push(lectureData);
    course.numbersOfLectures = course.lectures.length;
    await course.save();
    res.status(200).json({
      success: true,
      message: "course lecture added successfully",
      course,
    });
  } catch (error) {
    console.error("failed to add lecture error:", error);
    return next(new AppError(error || "failed to add lecture error"));
  }
}


export {
    getAllCourses,
    getLecturesByCourseId,
    updateCourse,
    createCourse,
    removeCourse,
    addLectureToCourseById
}