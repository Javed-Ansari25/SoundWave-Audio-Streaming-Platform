import { User } from '../model/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateTokens, cookieOptions } from "../utils/token.js";
import { checkUserLoginStatus, handleFailedLogin } from '../utils/security.login.js';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (![name, username, email, password].every(Boolean)) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const user = await User.create({
      name,
      username,
      email,
      password,
      role
    });

    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    // const userResponse = await User.findById(user._id)
    //   .select("username email role");

    return res.status(201).json(
      new ApiResponse(201, userResponse, "User registered successfully")
    );

  } catch (error) {
    if (error.code === 11000) {  // Duplicate key error check (MongoDB)
      throw new ApiError(409, "Email or Username already exists");
    }
    throw error;
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    throw new ApiError(400, "Email/Username and password are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password role username isBlocked loginAttempts lockUntil");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // account checks
  checkUserLoginStatus(user);

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    await handleFailedLogin(user);
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        loginAttempts: 0,
        lockUntil: null,
        refreshToken,
      },
    }
  );

  const userResponse = {
    _id: user._id,
    username: user.username,
    role: user.role,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: userResponse }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.updateOne(
    { _id: req.user._id },
    { $unset: { refreshToken: 1 } },
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {username : req.user.username}, "User logged out successfully"));
});

const regenerateAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id);

  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, 'Token refreshed'),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  regenerateAccessAndRefreshToken,
};
