import {Router} from 'express';
import { createCourse, getAllCourses, getLecturesByCourseId, removeCourse, updateCourse, addLectureToCourseById } from '../controllers/course.controllers.js';
import { isLoggedIn,authorisedRoles, authorisedSubcriber } from "../middlewares/auth.middleware.js";
import upload from '../middlewares/multer.middleware.js';

const router = Router();
router.route('/')
    .get(getAllCourses) // to get all courses, anyone can see this route
    .post(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        upload.single('thumbnail'),
        createCourse    // to create course, only admin can create course
    )
    ;

router.route('/:id')
    .get(
        isLoggedIn,
        authorisedSubcriber,
        getLecturesByCourseId       //to get lectures by course id, only payment user can see this route
    )
    .put(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        updateCourse            // to update course by id, only admin can update course
    )
    .delete(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        removeCourse            // to delete course by id, only admin can delete course
    )
    .post(
        isLoggedIn,
        authorisedRoles('ADMIN'),
        upload.single('thumbnail'),
        addLectureToCourseById      // to add lecture to course by id, only admin can add lecture
    )
    
    ;


// TODO:1 to make middleware that only payment user can see list of lecture
export default router;