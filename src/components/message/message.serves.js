import AppError from "../../utils/HandelError/appError/APPERROR.js";
import { catchAsyncError } from "../../utils/HandelError/catchError/catchError.js";
import { getIo } from "../../utils/middleWare/socket/socket.js";
import { MessageModel } from "./message.model.js";
import { RoomModel } from "./roomMessages/messageRoom.model.js";

const sendMessage = catchAsyncError(async (req, res, next) => {
    const newMessage = await MessageModel.create({ senderId: req.user._id, receiver: req.body.receiver, title: req.body.title })
    const messages = await MessageModel.find({ senderId: req.user._id, receiver: req.body.receiver })
    const room = await RoomModel.find({ senderId: req.user._id, receiver: req.body.receiver })
    getIo().emit(`getMessage/${newMessage.receiver}`, messages)
    res.status(200).json({ message: 'success', newMessage, all: messages })
})

const getMessage = catchAsyncError(async (req, res, next) => {
    const newMessage = await MessageModel.find({ senderId: req.user._id, receiver: req.body.id })
    res.status(200).json({ message: 'success', newMessage, })
})

const getMessageUnSeen = catchAsyncError(async (req, res, next) => {
    const receiver = req.headers
    const newMessage = await MessageModel.find({ senderId: req.body.id, receiver: req.user._id, seen: false })
    res.status(200).json({ message: 'success', message: newMessage.length })
})
// This function fetches notifications  marked as Unseen by the user and make it seen.
const makeMessageSeen = catchAsyncError(async (req, res, next) => {
    // Find notifications with seen: false for the specified user
    const message = await RoomModel.find({
        userId: req.user.id, // Assuming you have a 'user' field referencing the user
        seen: false
    });
    if (!noti.length) return next(new AppError('notification not found'))
    // If there are notifications to update
    if (noti.length > 0) {
        const notificationIds = noti.map(notification => notification._id);
        // Update the 'seen' field to true for all found notifications
        await NotifModel.updateMany({ _id: { $in: notificationIds } }, { $set: { seen: true } });
    }
    res.status(201).json({ message: "success", noti: noti })
})
export { sendMessage, getMessage, getMessageUnSeen }