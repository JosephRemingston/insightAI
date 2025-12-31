import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoConnections from "../utils/mongoConnections.js";
import { Connection } from "../models/connection.models.js";
import { encryptString , decryptString } from "../configs/encryption.js";
import mongoose from "mongoose";

export var getMongoUri = asyncHandler(async (req, res) => {
    var {mongoUri, name} = req.body;
    var userId = req.user._id;

    if(!mongoUri || !name){
        throw ApiError.badRequest("Mongo URI and name are required");
    }
    var hashedMongoUri = encryptString(mongoUri); 

    if (mongoConnections.has(userId.toString())) {
        throw ApiError.conflict("Database already connected");
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

export var connectToDatabase = asyncHandler(async (req , res) => {
    var {connectionId} = req.body
    var userId = req.user._id;

    if(!connectionId){
        throw ApiError.badRequest("Connection ID is required");
    }

    var connectionUri = await Connection.findOne({ _id : connectionId });


    if(!connectionUri){
        throw ApiError.notFound("Connection not found");
    }

    var decryptedUri = decryptString(connectionUri.connecteduri);

    if (mongoConnections.has(userId.toString())) {
        throw ApiError.conflict("Database already connected");
    }

    var connection = await mongoose.createConnection(decryptedUri).asPromise();
    mongoConnections.set(userId.toString(), connection);
    console.log(mongoConnections);

    return ApiResponse.success(res , "Connected to database successfully" , {
        connectionName: connectionUri.name,
        status: connection.readyState === 1 ? 'connected' : 'disconnected',
        host: connection.host,
        database: connection.name
    })
})


export var disconnectDatabase = asyncHandler(async (req , res) => {
    var userId = req.user._id;

    var connections = mongoConnections.get(userId.toString());
    console.log(mongoConnections);
    console.log(connections);
    if(!connections){
        throw ApiError.badRequest("No active connection found for the user");
    }

    await connections.close();
    mongoConnections.delete(userId.toString());

    return ApiResponse.success(res , "Disconnected from database successfully");
})