
import { catchAsyncError } from "../../utils/HandelError/catchError/catchError.js";
import bcrypt from 'bcrypt'
import { UserModel } from "./user.model.js";
import { sendEmail } from "../../utils/nodemailer/nodemailer.js";
import jwt from "jsonwebtoken";
import { getIo } from "../../utils/middleWare/socket/socket.js";
import AppError from "../../utils/HandelError/appError/APPERROR.js";
import { FriendModel } from "../friend/friend.model.js";
 


const registerSocket = catchAsyncError(async (req, res, next) => {
    // const user = await UserModel.findByIdAndUpdate(req.user._id, { socketId: req.user._id })
    // getIo().emit('registerSocket', user)
    console.log('hello');
    getIo().on('connection', (socket) => {
        console.log(socket);
        console.log(`User connected: ${socket.id}`);


        socket.on('registerSocket', async (userId) => {
            console.log(userId);
            const user = await UserModel.findByIdAndUpdate(userId, { socketId: socket.id });
            console.log(`User ${user.name} registered with socket ID: ${socket.id}`);
        });
    });
})
const disconnectSocket = catchAsyncError(async (req, res, next) => {
    // const user = await UserModel.findByIdAndUpdate(req.user._id, { socketId: "" })
    // getIo().emit('disconnectSocket')
    // res.status(200).json({ message: "success" })

    // getIo().on('connection', (socket) => {
    //     console.log(`User connected: ${socket.id}`);

    //     // Handle user disconnect
    //     socket.on('disconnect', async () => {
    //         const user = await UserModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null });

    //         console.log(`User ${user.name} disconnected and socket ID removed`);
    //     });
    // });

})
const getUsers = catchAsyncError(async (req, res, next) => {
    const currentUserId = req.user._id;

    // Find the friend document for the current user
    const friendDoc = await FriendModel.findOne({ userId: currentUserId }).exec();

    // Get all IDs to exclude
    const excludeIds = [
        currentUserId,
        ...(friendDoc.friends || []),
        ...(friendDoc.listRequestAdd || []),
        ...(friendDoc.stillThereRequest || [])
    ];

    // Find all users excluding the ones in excludeIds
    const users = await UserModel.find({ _id: { $nin: excludeIds } }).exec();

    // Respond with the list of users
    // getIo().to(req.user._id).emit('getUseres', { message: 'success', user: users });

    res.status(200).json({
        status: 'success',
        data: {
            users
        }
    });
});
// addFriend
const addFriend = catchAsyncError(async (req, res, next) => {
    const bothUser = await UserModel.findById(req.user._id)
    const user = await UserModel.findById(req.body.id)
    if (!user || !bothUser || user._id.toString() === bothUser._id.toString()) return next(new AppError('user not found', 201))
    // both user
    const checkStillThereRequest = user.listRequestAdd.includes(req.user._id)
    if (checkStillThereRequest) return next(new AppError('Sent request', 201))
    bothUser.stillThereRequest.push(req.body.id)
    await bothUser.save()
    //  user 
    const checkListRequest = user.listRequestAdd.includes(req.user._id)
    if (checkListRequest) return next(new AppError('Sent request', 201))
    user.listRequestAdd.push(req.user._id)
    await user.save()
    res.status(201).json({ message: "success" })
})
// accept friend
const acceptFriend = catchAsyncError(async (req, res, next) => {
    const user = await UserModel.findById(req.body.id)
    const bothUser = await UserModel.findById(req.user._id)
    if (!user || !bothUser || user._id.toString() === bothUser._id.toString()) return next(new AppError('user not found', 201))
    // both user
    const checkFirendUser = bothUser.friends.includes(req.body.id)
    if (checkFirendUser) return next(new AppError(`${user.name} be your friend`, 201))
    bothUser.friends.push(user._id)
    bothUser.listRequestAdd.pull(user._id)
    //  user
    user.stillThereRequest.pull(bothUser._id)
    user.friends.push(bothUser._id)
    await user.save()
    await bothUser.save()
    res.status(201).json({ message: "success" })

})
// removeFriend 
const removeFriend = catchAsyncError(async (req, res, next) => {
    const user = await UserModel.findById(req.body.id)
    const bothUser = await UserModel.findById(req.user._id)
    if (!user || !bothUser) return next(new AppError('user not found', 201))
    bothUser.friends.pull(user._id)
    user.friends.pull(bothUser._id)
    await bothUser.save()
    await user.save()
    res.status(201).json({ message: "success" })

})


export { registerSocket, addFriend, acceptFriend, removeFriend, disconnectSocket }