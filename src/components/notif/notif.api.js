import { Router } from "express";

import protectedRoutes from "../../utils/middleWare/ProtectedRoutes/ProtectedRoutes.js";
import { getNotiUnSeen, getNotiSeen, makeNotiSeen } from "./notif.serves.js";



const routerNoti = Router()
// Routes for handling notifications

routerNoti
    .get('/getNotiUnSeen', protectedRoutes, getNotiUnSeen)// Get unseen notifications
    .get('/getNotiSeen', protectedRoutes, getNotiSeen) // Get seen notifications
    .get('/makeNotiSeen', protectedRoutes, makeNotiSeen) // Mark notifications as seen



export default routerNoti