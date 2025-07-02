import {Router} from 'express';
import { createCourse, getAllCourses, getLecturesByCourseId, removeCourse, updateCourse } from '../controllers/course.controllers.js';
import { isLoggedIn,authorisedRoles } from "../middlewares/auth.middleware.js";
import upload from '../middlewares/multer.middleware.js';

const router = Router();
router.route('/')
    .get(getAllCourses)
    .post(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        upload.single('thumbnail'),
        createCourse
    )
    ;

router.route('/id:')
    .get(isLoggedIn,getLecturesByCourseId)
    .put(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        updateCourse
    )
    .delete(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        removeCourse
    )
    .post(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        upload.single('lecture'),
        addLectureToCourseById
    )
    
    ;

export default router;