import { Router } from "express";
import { login,logout, register, getProfile } from "../controllers/user.controllers";
import { isLoggedIn } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";

const router = Router();

router.post('/register',upload.single("avatar"), register)
router.post('/login', login)
router.get('/logout', logout)
router.get('/me',isLoggedIn, getProfile)
router.post('/reset',forgotPassword)
router.post('/reset/:resetToken',resetPassword)
router.post('/changed-password', isLoggedIn, changePassword)
router.put('/update', isLoggedIn, upload.single("avatar"),updateUser)

export default router;