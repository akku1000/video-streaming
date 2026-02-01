import {Router} from "express"
import { login, logout, profile, signup } from "../controller/user.controller.js";
import authuser from "../middleware/authmiddleware.js";

const router=Router();

router.post('/signup',signup);
router.post('/login',login);
router.post('/logout',authuser,logout);
router.get('/profile',authuser,profile);

export default router;