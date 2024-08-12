import mongoose, { Schema, Types, model } from "mongoose";
import bcrypt from 'bcrypt'

const schema = new Schema({
    name: {
        type: String,
        required: [true, "user name is required"],
        trim: true,
        minlength: [2, "the minlength is 2 "],
        maxlength: [20, "the minlength is 20 "],
    },
    email: {
        type: String,
        unique: [true, "email alraady exist"],
        required: [true, "user email is required"],
        trim: true,

        lowercase: true,
    },

    password: {
        type: String,
        trim: true,
        minlength: [6, "Password must be at least 6 characters"], // Enforce minimum password length

    },
    profilePicture: {
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSLU5_eUUGBfxfxRd4IquPiEwLbt4E_6RYMw&s",// Replace with a placeholder or default image URL
        type: String,
    },

    logoInChangedAt: Date,// Renamed for clarity (tracks last login)
    passwordChangedAt: Date,
    numberToConfirmEmail: String,// Consider using a dedicated schema for verification tokens
    logOut: Date,
    confirmEmail: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },
    socketId: {
        type: String,
        default: ''
    },


}, { timestamps: true, strictPopulate: false });



export const UserModel = model("user", schema);
