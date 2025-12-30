import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Connection } from "../models/connection.models.js";
import { encrypt } from "../configs/encryption.js";

export var getMongoUri = asyncHandler(async (req, res) => {
    var {mongoUri, name} = req.body;
    var userId = req.user._id;

    var hashedMongoUri = encrypt(mongoUri).content; 
    
    if(!mongoUri || !name){
        throw ApiError.badRequest("Mongo URI and name are required");
    }
    
    var createdConnection = await Connection.create({
        userId: userId,
        connecteduri: hashedMongoUri,
        name: name
    });

    return ApiResponse.success(res, "Connection created successfully", {
        connection: createdConnection
    });
});