import Course from '../models/course.model.js';
try {
    const getAllCourses = async function (req, res) {
        const course = await Course.find({}).select('-lecture')
        res.status(200).json({
            success: true,
            message: "all courses",
            course
        })
    }
} catch (error) {
    console.error("course error:",error);
    return next(new AppError(error || "unable to fetch all coure details"));
}

const getLecturesByCourseId = async function(req, res) {
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

export {
    getAllCourses,
    getLecturesByCourseId
}