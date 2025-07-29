import {Router} from 'express';
import { addLectureToCourseById, createCourse, deleteCourseById, getAllCourses, getLecturesByCourseId, removeLectureFromCourse, updateCourse } from '../controllers/course.controllers.js';
import {authorisedRoles, isLoggedIn, authorisedSubcriber} from '../middlewares/auth.middleware.js'
import upload from '../middlewares/multer.middleware.js'

const router = Router();

router
  .route('/')
  .get(getAllCourses)         // get all courses
  .post(
    isLoggedIn,
    authorisedRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse              //create course
  )
  .delete(isLoggedIn, authorisedRoles('ADMIN'), removeLectureFromCourse);              // remove lecture from course

router
  .route('/:id')
  .get(isLoggedIn, authorisedSubcriber, getLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
  .post(
    isLoggedIn,
    authorisedRoles('ADMIN'),
    upload.single('lecture'),
    addLectureToCourseById
  )
  .delete(isLoggedIn, authorisedRoles('ADMIN'), deleteCourseById)
  .put(isLoggedIn, authorisedRoles('ADMIN'), updateCourse);
export default router;