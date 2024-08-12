import { Schema, Types, model } from "mongoose";

// Define the Friend schema
const schema = new Schema({
    // Array of user IDs representing the user's friends
    friends: [{ type: Types.ObjectId, ref: 'user' }],
    // Array of user IDs representing users who have sent friend requests to this user
    listRequestAdd: [{ type: Types.ObjectId, ref: 'user' }],
    // Array of user IDs representing users who have sent "still there" requests to this user
    stillThereRequest: [{ type: Types.ObjectId, ref: 'user' }],
    // The user ID associated with this friend document (might be redundant)
    userId: {
        type: Types.ObjectId,
        ref: 'user'
    },
    senderId: {
        type: Types.ObjectId,
        ref: 'user'
    },
}, { timestamps: true, strictPopulate: false });

// Create the Friend model
export const FriendModel = model("friend", schema);
