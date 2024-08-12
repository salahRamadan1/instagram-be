import { ServiceFuture } from "../../utils/feature/futureService.js";
import AppError from "../../utils/HandelError/appError/APPERROR.js";
import { catchAsyncError } from "../../utils/HandelError/catchError/catchError.js";
import { NotifModel } from "./notif.model.js";


// This function fetches notifications length marked as Unseen by the user.
const getNotiUnSeen = catchAsyncError(async (req, res, next) => {
    // Finds notifications where userId matches the user ID from the request and seen is false (unseen)
    const noti = await NotifModel.find({ userId: req.user.id, seen: false })

    // Handles the case where no unseen notifications are found
    if (!noti.length) return next(new AppError('you do not have any notification '))

    // Sends a successful response with the number of unseen notifications (length of noti array)
    res.status(201).json({ message: "success", noti: noti.length })
})

/********************************************************************************************************************************************************************************/

// This function fetches notifications marked as seen by the user.
const getNotiSeen = catchAsyncError(async (req, res, next) => {
    // Sorts by createdAt in descending order (newest first)
    const sortCriteria = { createdAt: -1 };
    // Creates a new ServiceFuture object to chain Mongoose query operations
    let serviceFuture = new ServiceFuture(NotifModel.find({ userId: req.user.id, seen: true })
        .sort(sortCriteria)
        .populate('senderId', 'profilePicture'),
        req.query)

        // Applies pagination and searching filters based on request query parameters (if provided)
        .paginate()
        .search()

    // Executes the Mongoose query and retrieves the notifications
    let Document = await serviceFuture.mongooseQuery;

    // This line attempts to calculate the total number of pages 
    let numberOfPage = await NotifModel.find({ userId: req.user.id, seen: true });

    // Calculates the total number of pages based on retrieved notifications and page size (6)
    let numberPages = Math.ceil(numberOfPage.length / 6)

    // Handles the case where no notifications are found
    if (!Document.length) return next(new AppError('you do not have any notification '))

    // Sends a successful response with the retrieved notifications, number of pages, and current page
    res.status(201).json({
        message: "success",
        noti: Document,
        numberOfPage: numberPages,
        page: serviceFuture.page,
    })
})

/********************************************************************************************************************************************************************************/

// This function fetches notifications  marked as Unseen by the user and make it seen.
const makeNotiSeen = catchAsyncError(async (req, res, next) => {
    // Find notifications with seen: false for the specified user
    const noti = await NotifModel.find({
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
export { getNotiUnSeen, getNotiSeen, makeNotiSeen }