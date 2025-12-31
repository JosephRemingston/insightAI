import mongoose from "mongoose";
import bcrypt from "bcrypt";

var connectionSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    connecteduri : {
        encryptedText: {
            type: String,
            required: true
        },
        iv: {
            type: String,
            required: true
        },
        authTag: {
            type: String,
            required: true
        }
    },
    name : {
        type : String,
        required : true
    }
})

export var Connection = mongoose.model('Connection' , connectionSchema);