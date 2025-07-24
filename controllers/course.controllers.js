import Course from '../models/course.model.js';
import fs from 'fs/promises';
import cloudinary from 'cloudinary';
import AppError from '../utils/error.util.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';

// we are extracting the whole lectures
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

// create the course
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

const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
  // Grabbing the courseId and lectureId from req.query
  const { courseId, lectureId } = req.query;
  console.log("removeLectureFromCourse:",req.query);

  console.log(courseId);

  // Checking if both courseId and lectureId are present
  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  if (!lectureId) {
    return next(new AppError('Lecture ID is required', 400));
  }

  // Find the course using the courseId
  const course = await Course.findById(courseId);

  // If no course send custom message
  if (!course) {
    return next(new AppError('Invalid ID or Course does not exist.', 404));
  }

  // Find the index of the lecture using the lectureId
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError('Lecture does not exist.', 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: 'video',
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numbersOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: 'Course lecture removed successfully',
  });
});

 const deleteCourseById = asyncHandler(async (req, res, next) => {
  // Extracting id from the request parameters
  const { id } = req.params;

  // Finding the course via the course ID
  const course = await Course.findById(id);

  // If course not find send the message as stated below
  if (!course) {
    return next(new AppError('Course with given id does not exist.', 404));
  }

  // Remove course
  await course.deleteOne()

  // Send the message as response
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});
export {
    getAllCourses,
    getLecturesByCourseId,
    updateCourse,
    createCourse,
    removeCourse,
    addLectureToCourseById, 
    removeLectureFromCourse,
    deleteCourseById
}