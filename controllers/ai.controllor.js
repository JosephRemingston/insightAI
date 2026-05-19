import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { inferType , inferencePrompt, getOrCreateMongoConnection, systemPrompt } from "../utils/mongoConnections.js";
import { executeMongoQuery } from "../utils/aiUtils.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Connection } from "../models/connection.models.js";
import { decryptString } from "../configs/encryption.js";

async function getResolvedMongoConnection(userId, connectionId){
    var savedConnection = await Connection.findOne({ _id: connectionId, userId: userId });

    if(!savedConnection){
        throw ApiError.notFound("Connection not found");
    }

    var decryptedUri = decryptString(savedConnection.connecteduri);
    var currentConnection = await getOrCreateMongoConnection(connectionId.toString(), decryptedUri);

    return {
        connection: currentConnection,
        savedConnection
    };
}

async function buildMongoSchema(db){
    var collections = await db.listCollections().toArray();
    var schema = {};

    for (const col of collections) {
        const name = col.name;
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

    return schema;
}

function cleanJsonResponse(text) {
    let cleaned = text.trim();

    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');

    cleaned = cleaned.trim();

    return cleaned;
}

export var getMongoSchema = asyncHandler(async (req , res) => {
    var { connectionId } = req.body;
    var userId = req.user._id;

    if(!connectionId){
        throw ApiError.badRequest("Connection ID is required");
    }

    var { connection } = await getResolvedMongoConnection(userId, connectionId);
    var schema = await buildMongoSchema(connection.db);

    return ApiResponse.success(res, "Schema extracted successfully", {
        schema,
    });
});

export var runAiQuery = asyncHandler(async (req, res) => {
    const { connectionId, question , userSelection } = req.body;
    const userId = req.user._id;

    if(userSelection !== "query" && userSelection !== "inference"){
        throw ApiError.badRequest("Invalid user selection. Use 'query' or 'inference'");
    }

    if (!connectionId || !question) {
        throw ApiError.badRequest("connectionId and question are required.");
    }

    const { connection } = await getResolvedMongoConnection(userId, connectionId);
    const schema = await buildMongoSchema(connection.db);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Schema: ${JSON.stringify(schema, null, 2)} User Question: ${question}`;
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const aiOutput = await model.generateContent(fullPrompt);

    console.log("AI Raw Response:", aiOutput.response.text());

    let aiResponse;
    try {
        const cleanedResponse = cleanJsonResponse(aiOutput.response.text());
        console.log("Cleaned Response:", cleanedResponse);
        aiResponse = JSON.parse(cleanedResponse);
    } catch (err) {
        console.error("JSON Parse Error:", err.message);
        console.error("AI Response Text:", aiOutput.response.text());
        throw ApiError.internal("AI returned invalid JSON: " + aiOutput.response.text().substring(0, 200));
    }

    if(userSelection === "query"){
        if (!aiResponse.collection || !aiResponse.pipeline) {
            throw ApiError.badRequest("AI response missing collection or pipeline");
        }

        const response = await executeMongoQuery({
            connection,
            collection: aiResponse.collection,
            pipeline: aiResponse.pipeline,
            schema,
        });

        return ApiResponse.success(res, "Query executed successfully", {
            aiQuery: aiResponse,
            response,
        });
    }

    if (!aiResponse.collection || !aiResponse.pipeline) {
        throw ApiError.badRequest("AI response missing collection or pipeline");
    }

    const queryResults = await executeMongoQuery({
        connection,
        collection: aiResponse.collection,
        pipeline: aiResponse.pipeline,
        schema,
    });

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
});
