import { Router } from "express";
import { login,logout, register, getProfile } from "../controllers/user.controllers";
import { isLoggedIn } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";

const router = Router();

router.post('/register',upload("avatar"), register)
router.post('/login', login)
router.get('/logout', logout)
router.get('/me',isLoggedIn, getProfile)

export default router;