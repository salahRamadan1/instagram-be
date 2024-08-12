import { Router } from "express";

import protectedRoutes from "../../utils/middleWare/ProtectedRoutes/ProtectedRoutes.js";
import { getMessage, getMessageUnSeen, sendMessage } from "./message.serves.js";




const routerMessage = Router()
// Routes for handling message

routerMessage
    .post('/sendMessage', protectedRoutes, sendMessage)//send message
    .get('/getMessage', protectedRoutes, getMessage) // Get message
    .post('/getMessageUnSeen', protectedRoutes, getMessageUnSeen) // Get message



export default routerMessage