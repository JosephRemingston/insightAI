import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Connection } from "../models/connection.models.js";
import { encryptString , decryptString } from "../configs/encryption.js";
import { closeMongoConnection, getOrCreateMongoConnection } from "../utils/mongoConnections.js";

export var getMongoUri = asyncHandler(async (req, res) => {
    var {mongoUri, name} = req.body;
    var userId = req.user._id;

    if(!mongoUri || !name){
        throw ApiError.badRequest("Mongo URI and name are required");
    }

    var hashedMongoUri = encryptString(mongoUri);

    var createdConnection = await Connection.create({
        userId: userId,
        connecteduri: hashedMongoUri,
        name: name
    });

    return ApiResponse.success(res, "Connection created successfully", {
        connection: createdConnection
    });
});

export var getConnectionByUser = asyncHandler(async (req , res) => {
    var userId = req.user._id;

    if(!userId){
        throw ApiError.badRequest("User ID is required");
    }

    var connections = await Connection.find({ userId: userId });

    if(!connections){
        throw ApiError.notFound("No connections found for the user");
    }

    return ApiResponse.success(res , "Connections fetched successfully" , {
        connections: connections
    });
});

export var connectToDatabase = asyncHandler(async (req , res) => {
    var {connectionId} = req.body;
    var userId = req.user._id;

    if(!connectionId){
        throw ApiError.badRequest("Connection ID is required");
    }

    var connectionUri = await Connection.findOne({ _id : connectionId, userId: userId });

    if(!connectionUri){
        throw ApiError.notFound("Connection not found");
    }

    var decryptedUri = decryptString(connectionUri.connecteduri);
    var connection = await getOrCreateMongoConnection(connectionId.toString(), decryptedUri);
    await connection.db.admin().ping();
    return ApiResponse.success(res , "Connected to database successfully" , {
        connectionName: connectionUri.name,
        status: connection.readyState === 1 ? 'connected' : 'disconnected',
        host: connection.host,
        database: connection.name
    });
});

export var disconnectDatabase = asyncHandler(async (req , res) => {
    var {connectionId} = req.body;
    var userId = req.user._id;

    if(!connectionId){
        throw ApiError.badRequest("Connection ID is required");
    }

    var existingConnection = await Connection.findOne({ _id : connectionId, userId: userId });

    if(!existingConnection){
        throw ApiError.notFound("Connection not found");
    }

    await closeMongoConnection(connectionId.toString());

    return ApiResponse.success(res , "Disconnected from database successfully");
});
