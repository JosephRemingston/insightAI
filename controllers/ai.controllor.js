import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { mongoConnections , inferType } from "../utils/mongoConnections.js";

export var getMongoSchema = asyncHandler(async (req , res) => {
    var userId = req.user._id;
    

    console.log("User ID:", userId.toString());
    console.log("All connections:", mongoConnections);
    
    var currentConnection = mongoConnections.get(userId.toString());
    console.log("Current connection:", currentConnection);

    if(!currentConnection){
        throw ApiError.badRequest("No active connection found. Please connect to a database first.");
    }

    var db = currentConnection.db;

    var collections = await db.listCollections().toArray();

    var schema = {};

    for (const col of collections) {
        const name = col.name;

        // 2️⃣ sample documents
        const docs = await db
        .collection(name)
        .find({})
        .limit(20)
        .toArray();

        const fields = {};

        for (const doc of docs) {
        for (const key of Object.keys(doc)) {
            if (!fields[key]) {
            fields[key] = inferType(doc[key]);
            }
        }
        }

        schema[name] = fields;
    }

    return ApiResponse.success(res, "Schema extracted successfully", {
    schema,
  });
})