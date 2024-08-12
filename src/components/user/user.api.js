import { Router } from "express";
import { ChangeName, ChangePassword, ChangeProdileImage, googleLogIn, logIn, Register, resetPassWord, sendNumberverifyIfNotsend, verfiyEmail } from "./user.service.js";
import { userValidation } from "../../utils/middleWare/validation/validation.js";
import protectedRoutes from "../../utils/middleWare/ProtectedRoutes/ProtectedRoutes.js";
import { uploadFileImage } from "../../utils/multer/multer.js";


const routerUserAuth = Router()
// Authentication routes

routerUserAuth
    .post('/googleLogIn', googleLogIn)// User login
    .post('/logIn', userValidation, logIn)// User login
    .post('/register', userValidation, Register)// User registration
    .post('/verfiy', userValidation, verfiyEmail)// Email verification
    .post('/numberVerfiy', sendNumberverifyIfNotsend)// Send number verification code
    .put('/resetPassWord', resetPassWord)// Reset user password
    .put('/ChangeProdileImage', protectedRoutes, uploadFileImage("imageUser", "profileImage"), ChangeProdileImage)
    .put('/ChangeName', protectedRoutes, userValidation, ChangeName)
    .put('/ChangePassword', protectedRoutes, userValidation, ChangePassword)



export default routerUserAuth