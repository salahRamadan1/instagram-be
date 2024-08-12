

import { Schema, Types, model } from "mongoose";


const schema = new Schema({
    title: String,
    senderId: {
        type: Types.ObjectId, ref: 'user'
    },
    userId: {
        type: Types.ObjectId, ref: 'user'
    },
    seen: {
        type: Boolean,
        default: false
    },
    navigate: String
}, { timestamps: true, strictPopulate: false });



export const NotifModel = model("notif", schema);
