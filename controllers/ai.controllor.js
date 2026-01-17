import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { mongoConnections , inferType , inferencePrompt} from "../utils/mongoConnections.js";
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
  const { connectionId, question , userSelection} = req.body;
  const userId = req.user._id;

  if(userSelection !== "query" && userSelection !== "inference"){
    throw ApiError.badRequest("Invalid user selection. Use 'query' or 'inference'");
  }
  if (!connectionId || !question) {
    throw ApiError.badRequest("connectionId and question are required.");
  }

  // 1️⃣ Get LIVE Mongo connection
  const currentConnection = await mongoConnections.get(userId.toString());
  console.log("Current Connection:", currentConnection);

  if (!currentConnection) {
    throw ApiError.badRequest("No active database connection found.");
  }

  // 2️⃣ Build schema (reuse same logic as getMongoSchema)
  const db = currentConnection.db;
  const collections = await db.listCollections().toArray();

  const schema = {};


  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
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

  // 3️⃣ Call Gemini to generate the query (always use systemPrompt first)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  // Generate the MongoDB query using systemPrompt (for both query and inference modes)
  const prompt = `Schema: ${JSON.stringify(schema, null, 2)} User Question: ${question}`;
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  const aiOutput = await model.generateContent(fullPrompt);

  console.log("AI Raw Response:", aiOutput.response.text());

  // Clean AI response - remove markdown code blocks
  function cleanJsonResponse(text) {
    let cleaned = text.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  try {
    const cleanedResponse = cleanJsonResponse(aiOutput.response.text());
    console.log("Cleaned Response:", cleanedResponse);
    var aiResponse = JSON.parse(cleanedResponse);
  } catch (err) {
    console.error("JSON Parse Error:", err.message);
    console.error("AI Response Text:", aiOutput.response.text());
    throw ApiError.internal("AI returned invalid JSON: " + aiOutput.response.text().substring(0, 200));
  }

  if(userSelection === "query"){
    if (!aiResponse.collection || !aiResponse.pipeline) {
      throw ApiError.badRequest("AI response missing collection or pipeline");
    }

    // 4️⃣ Validate + execute query
    const response = await executeMongoQuery({
      connectionId: userId.toString(),
      collection: aiResponse.collection,
      pipeline: aiResponse.pipeline,
      schema,
    });

    return ApiResponse.success(res, "Query executed successfully", {
      aiQuery: aiResponse,
      response,
    });
  }
  else if(userSelection === "inference"){
    // First, we need to get the data using the query pipeline
    if (!aiResponse.collection || !aiResponse.pipeline) {
      throw ApiError.badRequest("AI response missing collection or pipeline");
    }

    // Execute the query to get actual data
    const queryResults = await executeMongoQuery({
      connectionId: userId.toString(),
      collection: aiResponse.collection,
      pipeline: aiResponse.pipeline,
      schema,
    });

    // Now ask AI to analyze the ACTUAL data
    const analysisPrompt = `
      Schema: ${JSON.stringify(schema, null, 2)}

      User Question: ${question}

      Query Results: ${JSON.stringify(queryResults, null, 2)}

      Collection: ${aiResponse.collection}
      `;

    const analysisModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const analysisOutput = await analysisModel.generateContent(`${inferencePrompt}\n\n${analysisPrompt}`);
    
    const cleanedAnalysisResponse = cleanJsonResponse(analysisOutput.response.text());
    console.log("Cleaned Analysis Response:", cleanedAnalysisResponse);
    
    let finalAnalysis;
    try {
      finalAnalysis = JSON.parse(cleanedAnalysisResponse);
    } catch (err) {
      console.error("JSON Parse Error:", err.message);
      console.error("Analysis Response Text:", analysisOutput.response.text());
      throw ApiError.internal("AI returned invalid JSON for analysis: " + analysisOutput.response.text().substring(0, 200));
    }

    if (!finalAnalysis.answer) {
      throw ApiError.badRequest("AI analysis response missing required fields");
    }

    return ApiResponse.success(res, "Analysis completed successfully", {
      analysis: finalAnalysis,
    });
  }
});