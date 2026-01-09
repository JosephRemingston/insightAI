import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { mongoConnections , inferType } from "../utils/mongoConnections.js";
import {executeMongoQuery} from "../utils/aiUtils.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemPrompt } from "../utils/mongoConnections.js";
import dotenv from "dotenv";

dotenv.config({path: "./.env"});

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

export var runAiQuery = asyncHandler(async (req, res) => {
  const { connectionId, question } = req.body;
  const userId = req.user._id.toString();

  if (!connectionId || !question) {
    throw ApiError.badRequest("connectionId and question are required.");
  }

  // 1️⃣ Get LIVE Mongo connection
  const currentConnection = mongoConnections.get(userId);

  if (!currentConnection) {
    throw ApiError.badRequest("No active database connection found.");
  }

  // 2️⃣ Build schema (reuse same logic as getMongoSchema)
  const db = currentConnection.db;
  const collections = await db.listCollections().toArray();

  const schema = {};

  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).limit(20).toArray();
    const fields = {};

    for (const doc of docs) {
      for (const key of Object.keys(doc)) {
        if (!fields[key]) {
          fields[key] = inferType(doc[key]);
        }
      }
    }
    schema[col.name] = fields;
  }

  // 3️⃣ Call Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = "Schema: ${JSON.stringify(schema, null, 2)} User Question: ${question}";

  const result = await model.generateContent([
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ]);


  try {
    var aiResponse = JSON.parse(result.response.text());
  } catch (err) {
    throw ApiError.internal("AI returned invalid JSON");
  }

  if (!aiResponse.collection || !aiResponse.pipeline) {
    throw ApiError.badRequest("AI response missing collection or pipeline");
  }

  // 4️⃣ Validate + execute query
  const response = await executeMongoQuery({
    connectionId,
    collection: aiResponse.collection,
    pipeline: aiResponse.pipeline,
    schema,
  });

  return ApiResponse.success(res, "Query executed successfully", {
    aiQuery: aiResponse,
    response,
  });
});