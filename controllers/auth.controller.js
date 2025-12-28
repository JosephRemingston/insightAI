import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse.js";
import { generateAccessToken , generateRefreshToken , storeRefreshToken , deleteRefreshToken , blacklistToken } from "../configs/jwt.js";
import { User } from "../models/User.model.js";


export var login = asyncHandler(async (req , res) => {
    var {email , password} = req.body;
    
    if(!email || !password){
        throw ApiError.badRequest("Email and password are required");
    }
    var user = await User.findOne({email});
    if(!user){
        throw ApiError.badRequest("Invalid email or password");
    }
    var isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw ApiError.badRequest("Invalid email or password");
    }

    var accessToken = generateAccessToken(user._id);
    var refreshToken = generateRefreshToken(user._id);

    await storeRefreshToken(user._id , refreshToken);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    return ApiResponse.success(res , 200 , "Login successful" , {
        user : loggedInUser,
        accessToken,
        refreshToken
    })
})

export const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest('User with this email already exists');
  }

  // Create user (password will be hashed by pre-save hook)
  const user = await User.create({ email, password });

  // Get user without password
  const createdUser = await User.findById(user._id).select('-password -refreshToken');

  return ApiResponse.success(res, 'User registered successfully', { 
    user: createdUser 
  });
});