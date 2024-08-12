import { Router } from "express";

import protectedRoutes from "../../utils/middleWare/ProtectedRoutes/ProtectedRoutes.js";
import {
    acceptFriend,
    addFriend,
    deleteFriend,
    rejectFriend,
    getMyFriends,
    getMyListRequestAdd,
    getMyStillThereRequest,
    getUsers,
    deleteMyRequestFriend,
} from "./friend.serves.js";

const routerFriends = Router();
 
// Protected routes for friend-related actions
routerFriends
    .get("/getMyFriends", protectedRoutes, getMyFriends) // Get the user's friends list
    .get("/getMyListRequestAdd", protectedRoutes, getMyListRequestAdd) // Get incoming friend requests
    .get("/getStillThereRequest", protectedRoutes, getMyStillThereRequest) // Get "still there" requests
    .get("/getUsers", protectedRoutes, getUsers) // Get a list of users (for search or other purposes)
    .post("/addFriend", protectedRoutes, addFriend) // Add a new friend
    .post("/acceptFriend", protectedRoutes, acceptFriend) // Accept a friend request
    .post("/deleteFriend", protectedRoutes, deleteFriend) // Delete a friend
    .post("/rejectFriend", protectedRoutes, rejectFriend) // Reject a friend request
    .post("/deleteMyRequestFriend", protectedRoutes, deleteMyRequestFriend); // Delete a friend request sent by the user

export default routerFriends;
