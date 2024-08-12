

import { Schema, Types, model } from "mongoose";
const schema = new Schema({
    userOne: {
        type: Types.ObjectId, ref: 'user'
    },
    userTwo: {
        type: Types.ObjectId, ref: 'user'
    },
    seen: {
        type: Boolean,
        default: false
    },
    typeing: {

        type: Boolean,
        default: false

    },
    messageId: [{
        type: Types.ObjectId, ref: 'message'
    }],
    navigate: String
}, { timestamps: true, strictPopulate: false });



export const RoomModel = model("room", schema);
