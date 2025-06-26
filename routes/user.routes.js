import { Router } from "express";
import { login,logout, register, getProfile } from "../controllers/user.controllers";

const router = Router();

router.post('/register', register)
router.post('/login', login)
router.get('/logout', logout)
router.get('/me', getProfile)

export default router;