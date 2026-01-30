import { Audio } from '../model/audio.model.js';
import { User } from '../model/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if(!user) {
      throw new ApiError(401, "UnAuthorization user");
    }

    const accessToken = user.accessTokenGenerate();
    const refreshToken = user.refreshTokenGenerate();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Failed to generate tokens');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (![name, username, email, password].every(Boolean)) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: "USER",
    });

    const userResponse = await User.findById(user._id)
      .select("name username email role");

    return res.status(201).json(
      new ApiResponse(201, userResponse, "User registered successfully")
    );

  } catch (error) {
    // Duplicate key error (MongoDB)
    if (error.code === 11000) {
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
  }).select("+password role username email");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError(403, "Account locked. Try again later");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    const updates = {
      $inc : {loginAttempts : 1}
    }

    if (user.loginAttempts + 1 >= 5) {
      updates.$set = {
        lockUntil : new Date.now() + 10 * 60 * 1000
      }
    }

    await user.updateOne({_id: user._id}, updates);
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  await user.updateOne(
    {_id: user._id},
    {
      $set : {
        loginAttempts: 0,
        lockUntil: null,
        refreshToken
      }
    }
  )

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role
  };

  const cookieOptions = {
    httpOnly: true,
    secure: true, 
  };

  User.updateOne(
    { _id: user._id },
    { lastLoginAt: new Date() }
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: userResponse, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    { $unset: { refreshToken: 1 } },
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const regenerateAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );
  const user = await User.findById(decoded._id);

  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, 'Token refreshed'),
    );
});

const getAudioFile = asyncHandler(async (req, res) => {
  const audio = await Audio.find({ isActive: true })
  .populate("uploadedBy", "username email")

  return res
    .status(200)
    .json(new ApiResponse(200, audio, 'Audio fetched successfully'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  regenerateAccessAndRefreshToken,
  getAudioFile,
};
