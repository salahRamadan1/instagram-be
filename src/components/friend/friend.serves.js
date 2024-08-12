
import { ServiceFuture } from "../../utils/feature/futureService.js";
import AppError from "../../utils/HandelError/appError/APPERROR.js";
import { catchAsyncError } from "../../utils/HandelError/catchError/catchError.js";
import { getIo } from "../../utils/middleWare/socket/socket.js";
import { RoomModel } from "../message/roomMessages/messageRoom.model.js";
import { NotifModel } from "../notif/notif.model.js";
import { UserModel } from "../user/user.model.js";
import { FriendModel } from "./friend.model.js";

const getUsers = catchAsyncError(async (req, res, next) => {
    // const { socketId } = await UserModel.findById(req.user._id)
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

    // Creates a new ServiceFuture object to chain Mongoose query operations to ind all users excluding the ones in excludeIds
    let serviceFuture = new ServiceFuture(UserModel.find({ _id: { $nin: excludeIds } })
        .populate('userId', 'profilePicture'),
        req.query)
        // Applies pagination and searching filters based on request query parameters (if provided)
        .paginate()
        .search()

    // Executes the Mongoose query and retrieves the user
    let Document = await serviceFuture.mongooseQuery;

    // This line attempts to calculate the total number of pages 
    let numberOfPage = await UserModel.find({ _id: { $nin: excludeIds } });

    // Calculates the total number of pages based on retrieved user and page size (6)
    let numberPages = Math.ceil(numberOfPage.length / 6)

    // Handles the case where no user are found
    if (!Document.length) return next(new AppError('you do not have any friend '))

    // Sends a successful response with the retrieved user, number of pages, and current page
    res.status(201).json({
        message: "success",
        users: Document,
        numberOfPage: numberPages,
        page: serviceFuture.page,
    })
});

/********************************************************************************************************************************************************************************/

const getFriends = catchAsyncError(async (req, res, next) => {
    // Find the user's friend document by their ID
    const friend = await FriendModel.findById(req.user._id)

    // If the friend document is not found, return an error
    if (!friend) return next(new AppError('friend not found', 201))

    // Send a success response to the client
    res.status(200).json({ message: 'success', friend })
})
/********************************************************************************************************************************************************************************/
const addFriend = catchAsyncError(async (req, res, next) => {
    // Find the user who wants to send a friend request (req.user)
    const initiatingUser = await UserModel.findById(req.user._id);

    // Find the user to whom the request is being sent (req.body.id)
    const targetUser = await UserModel.findById(req.body.id);
    const { socketId } = targetUser; // Extract the socket ID

    // Check if either user document is not found
    if (!initiatingUser || !targetUser) {
        return next(new AppError('User not found', 201));
    }

    // Find the friend documents for both users
    const initiatingUserFriendList = await FriendModel.findOne({ userId: req.user._id });
    const targetUserFriendList = await FriendModel.findOne({ userId: req.body.id });

    // Check if either friend document is not found
    if (!initiatingUserFriendList || !targetUserFriendList) {
        return next(new AppError('User not found', 201));
    }

    // Check if the initiating user already sent a "still there" request to the target user
    const alreadyRequested = initiatingUserFriendList.stillThereRequest.includes(req.body.id);
    if (alreadyRequested) {
        return next(new AppError('Sent request', 201));
    }

    // Add the target user's ID to the initiating user's "still there" request list
    initiatingUserFriendList.stillThereRequest.push(req.body.id);
    await initiatingUserFriendList.save();

    // Check if the target user already has a friend request from the initiating user
    const alreadySentRequest = targetUserFriendList.listRequestAdd.includes(req.user._id);
    if (alreadySentRequest) {
        return next(new AppError('Sent request', 201));
    }

    // Add the initiating user's ID to the target user's "list request add" list
    targetUserFriendList.listRequestAdd.push(req.user._id);
    await targetUserFriendList.save();

    // Create a notification for the target user about the friend request
    const notification = await NotifModel.create({
        title: `${initiatingUser.name} sent you a friend request`,
        userId: req.body.id,
        senderId: req.user._id,
        navigate: '/mainFriend/requestfriend',
        profileImage: initiatingUser.profilePicture
        ,
    });

    // Get any existing unseen notifications for the target user
    const existingNotifications = await NotifModel.find({ userId: req.body.id, seen: false })
        .populate('senderId', 'profilePicture'); // Populate the user's profileImage for the notification

    // Send the updated notification list to the target user via socket.io
    getIo().emit(`notification/friendRequest/${socketId}`, { message: 'success', noti: existingNotifications });
    // Send a success response to the initiating user
    res.status(200).json({ message: 'success' });
});

/********************************************************************************************************************************************************************************/


const acceptFriend = catchAsyncError(async (req, res, next) => {
    // Find the user who is accepting the friend request (req.user)
    const acceptingUser = await UserModel.findById(req.user._id);

    // Find the user who sent the friend request (req.body.id)
    const requestingUser = await UserModel.findById(req.body.id);
    const { socketId } = requestingUser; // Extract the socket ID

    // Check if either user document is not found
    if (!acceptingUser || !requestingUser) {
        return next(new AppError('User not found', 201));
    }

    // Find the friend documents for both users
    const acceptingUserFriendList = await FriendModel.findOne({ userId: req.user._id });
    const requestingUserFriendList = await FriendModel.findOne({ userId: req.body.id });

    // Check if either friend document is not found
    if (!acceptingUserFriendList || !requestingUserFriendList) {
        return next(new AppError('User not found', 201));
    }

    // Check if the users are already friends
    const alreadyFriends = acceptingUserFriendList.friends.includes(req.body.id);
    if (alreadyFriends) {
        return next(new AppError('Already friends', 201));
    }

    // Remove the requesting user from the accepting user's "list request add" list
    acceptingUserFriendList.listRequestAdd.pull(req.body.id);

    // Add the requesting user to the accepting user's "friends" list
    acceptingUserFriendList.friends.push(req.body.id);
    await acceptingUserFriendList.save();

    // Remove the accepting user from the requesting user's "still there" request list
    requestingUserFriendList.stillThereRequest.pull(req.user._id);

    // Add the accepting user to the requesting user's "friends" list
    requestingUserFriendList.friends.push(req.user._id);
    await requestingUserFriendList.save();

    // Create a notification for the requesting user about the friend request being accepted
    const notification = await NotifModel.create({
        title: `${acceptingUser.name} accepted your friend request`,
        userId: req.body.id,
        senderId: req.user._id,
        navigate: '/mainFriend/friends', // Update navigation path (assuming accepted friends page)
        profileImage: acceptingUser.profileImage,
    });

    // Get any existing unseen notifications for the requesting user
    const existingNotifications = await NotifModel.find({ userId: req.body.id, seen: false })
        .populate('userId', 'profilePicture'); // Populate the user's profileImage for the notification

    // Send the updated notification list to the requesting user via socket.io
    getIo().emit(`notification/acceptFriend/${socketId}`, { message: 'success', noti: existingNotifications });
    const findRoom = await RoomModel.find({ userOne: req.body.id, userTwo: req.user._id })
    console.log(findRoom);
    if (findRoom.length === 0) {
        const room = await RoomModel.create({ userOne: req.body.id, userTwo: req.user._id })

    }
    // Send a success response to the accepting user
    res.status(200).json({ message: 'success' });
});

/********************************************************************************************************************************************************************************/

const rejectFriend = catchAsyncError(async (req, res, next) => {
    // Find the user who is rejecting the friend request (req.user)
    const rejectingUser = await UserModel.findById(req.user._id);

    // Find the user who sent the friend request (req.body.id)
    const requestingUser = await UserModel.findById(req.body.id);

    // Check if either user document is not found
    if (!rejectingUser || !requestingUser) {
        return next(new AppError('User not found', 201));
    }

    // Find the friend documents for both users
    const rejectingUserFriendList = await FriendModel.findOne({ userId: req.user._id });
    const requestingUserFriendList = await FriendModel.findOne({ userId: req.body.id });

    // Check if either friend document is not found
    if (!rejectingUserFriendList || !requestingUserFriendList) {
        return next(new AppError('User not found', 201));
    }

    // Remove the requesting user from the rejecting user's "list request add" list
    rejectingUserFriendList.listRequestAdd.pull(req.body.id);
    await rejectingUserFriendList.save();

    // Remove the rejecting user from the requesting user's "still there" request list (assuming it exists)
    requestingUserFriendList.stillThereRequest.pull(req.user._id);
    await requestingUserFriendList.save();

    // Send a success response to the rejecting user
    res.status(200).json({ message: 'success' });
});

/********************************************************************************************************************************************************************************/

const deleteMyRequestFriend = catchAsyncError(async (req, res, next) => {
    // Find the user who wants to withdraw their friend request (req.user)
    const withdrawingUser = await UserModel.findById(req.user._id);

    // Find the user to whom the request was sent (req.body.id)
    const targetUser = await UserModel.findById(req.body.id);

    // Check if either user document is not found
    if (!withdrawingUser || !targetUser) {
        return next(new AppError('User not found', 201));
    }

    // Find the friend documents for both users
    const withdrawingUserFriendList = await FriendModel.findOne({ userId: req.user._id });
    const targetUserFriendList = await FriendModel.findOne({ userId: req.body.id });

    // Check if either friend document is not found
    if (!withdrawingUserFriendList || !targetUserFriendList) {
        return next(new AppError('User not found', 201));
    }

    // Remove the target user's ID from the withdrawing user's "still there" request list
    withdrawingUserFriendList.stillThereRequest.pull(req.body.id);
    await withdrawingUserFriendList.save();

    // Remove the withdrawing user's ID from the target user's "list request add" list
    targetUserFriendList.listRequestAdd.pull(req.user._id);
    await targetUserFriendList.save();

    // Send a success response to the withdrawing user
    res.status(200).json({ message: 'success' });
});

/********************************************************************************************************************************************************************************/
const deleteFriend = catchAsyncError(async (req, res, next) => {
    // Find the user who wants to unfriend someone (req.user)
    const deletingUser = await UserModel.findById(req.user._id);

    // Find the user to be unfriended (req.body.id)
    const targetUser = await UserModel.findById(req.body.id);

    // Check if either user document is not found
    if (!deletingUser || !targetUser) {
        return next(new AppError('User not found', 201));
    }

    // Find the friend documents for both users
    const deletingUserFriendList = await FriendModel.findOne({ userId: req.user._id });
    const targetUserFriendList = await FriendModel.findOne({ userId: req.body.id });

    // Check if either friend document is not found
    if (!deletingUserFriendList || !targetUserFriendList) {
        return next(new AppError('User not found', 201));
    }

    // Remove the target user's ID from the deleting user's "friends" list
    deletingUserFriendList.friends.pull(req.body.id);
    await deletingUserFriendList.save();

    // Remove the deleting user's ID from the target user's "friends" list
    targetUserFriendList.friends.pull(req.user._id);
    await targetUserFriendList.save();

    // Send a success response to the deleting user
    res.status(200).json({ message: 'success' });
});

/********************************************************************************************************************************************************************************/

const getMyFriends = catchAsyncError(async (req, res, next) => {
    // Sorts by createdAt in descending order (newest first)
    const sortCriteria = { createdAt: -1 };
    // Creates a new ServiceFuture object to chain Mongoose query operations
    let serviceFuture = new ServiceFuture(FriendModel.find({ userId: req.user.id }).select('friends')
        .sort(sortCriteria)
        .populate('friends', 'name  profilePicture'),
        req.query)
        // Applies pagination and searching filters based on request query parameters (if provided)
        .paginate()
        .search()

    // Executes the Mongoose query and retrieves the friends
    let Document = await serviceFuture.mongooseQuery.exec();

    // This line attempts to calculate the total number of pages 
    let numberOfPage = await FriendModel.find({ userId: req.user.id });

    // Calculates the total number of pages based on retrieved friends and page size (6)
    let numberPages = Math.ceil(numberOfPage.length / 6)

    // Handles the case where no friends are found
    if (!Document.length) return next(new AppError('you do not have any friend '))

    // Sends a successful response with the retrieved friends, number of pages, and current page
    res.status(201).json({
        message: "success",
        myFriends: Document,
        numberOfPage: numberPages,
        page: serviceFuture.page,
    })
})
/********************************************************************************************************************************************************************************/

const getMyListRequestAdd = catchAsyncError(async (req, res, next) => {
    // Find the user's list of pending friend requests
    const { listRequestAdd } = await FriendModel.findOne({ userId: req.user._id }).populate('listRequestAdd', 'name email profilePicture')

    // Handle the friend data using a generic factory function
    handleFactory(listRequestAdd, res)


})
/********************************************************************************************************************************************************************************/

const getMyStillThereRequest = catchAsyncError(async (req, res, next) => {
    // Find the user's list of "still there" requests
    const { stillThereRequest } = await FriendModel.findOne({ userId: req.user._id }).populate('stillThereRequest', 'name email profilePicture')
    // Handle the friend data using a generic factory function
    handleFactory(stillThereRequest, res)

})

/********************************************************************************************************************************************************************************/


const handleFactory = (Document_, res) => {
    // Check if the Document_ array is empty
    if (!Document_.length) {
        // If empty, send a success response with a message indicating no requests
        res.status(200).json({ message: 'you do not have any Request' })
    } else {
        // If not empty, send a success response with the Document_ data
        res.status(200).json({ message: 'success', Document_ })

    }

};
// export { getFriends, addFriend, acceptFriend, deleteFriend, getMyStillThereRequest, rejectFriend, getMyFriends, getMyListRequestAdd, getUsers, deleteMyRequestFriend }
export {
    getFriends, // Likely fetches a user's friends list
    addFriend, // Likely adds a new friend
    acceptFriend, // Likely accepts a pending friend request
    deleteFriend, // Likely removes a friend
    getMyStillThereRequest, // Likely fetches the user's "still there" requests
    rejectFriend, // Likely rejects a pending friend request
    getMyFriends, // Likely fetches the user's friends list (redundant with getFriends?)
    getMyListRequestAdd, // Likely fetches the user's incoming friend requests
    getUsers, // Likely fetches a list of users (for search or other purposes)
    deleteMyRequestFriend, // Likely deletes a friend request sent by the user
};