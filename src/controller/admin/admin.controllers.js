import mongoose from "mongoose";
import { Audio } from "../../model/audio.model.js";
import { User } from "../../model/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalAudio = await Audio.countDocuments();
  const publishedAudio = await Audio.countDocuments({ isPublished: true });
  const unpublishedAudio = await Audio.countDocuments({ isPublished: false });

  return res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalAudio,
      publishedAudio,
      unpublishedAudio
    }, "Admin dashboard data fetched")
  );
});

const getAllUsersForAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const users = await User.find({
    role: { $in: ["user", "artist"] },
    _id: { $ne: req.user._id }
  })
    .select("-password -refreshToken")
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments({ role: "user" });
  const totalArtists = await User.countDocuments({ role: "artist" });

  return res.status(200).json(
    new ApiResponse(200,
      {
        users,
        totalUsers,
        totalArtists
      },
      "Users & artists fetched successfully"
    )
  );
});

const getAllAudioForAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const audios = await Audio.find()
        .populate("artist", "username")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

    const totalAudio = await Audio.countDocuments();

    return res.status(200).json(
        new ApiResponse(200, {audios, totalAudio}, "All audios fetched for admin")
    );
});

const adminDeleteAudio = asyncHandler(async (req, res) => {
  const { audioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid audioId");
  }

  const audio = await Audio.findByIdAndDelete(audioId);

  if (!audio) {
    throw new ApiError(404, "Audio not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Audio deleted by admin")
  );
});

const adminUpdateAudio = asyncHandler(async (req, res) => {
  const { audioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid audioId");
  }

  const updatedAudio = await Audio.findByIdAndUpdate(
    audioId,
    req.body,
    { new: true }
  );

  if (!updatedAudio) {
    throw new ApiError(404, "Audio not found");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedAudio, "Audio updated by admin")
  );
});

const toggleUserBlockByAdmin = asyncHandler(async (req, res) => {
  const {userId} = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const user = await User.findOneAndUpdate(
    {_id : userId}, 
    // Values ​​are being flipped within the database itself
    [
      {
        $set: {
          isBlocked: { $not: "$isBlocked" }
        }
      }
    ],
    { new: true, updatePipeline: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { isBlocked: user.isBlocked }, "User block status updated")
  ); 
})

const toggleAudioStatus = asyncHandler(async (req, res) => {
  const { audioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid audioId");
  }

  const audio = await Audio.findOneAndUpdate(
    {_id : audioId}, 
    // Values ​​are being flipped within the database itself
    [
      {
        $set: {
          isPublished: { $not: "$isPublished" }
        }
      }
    ],
    { new: true, updatePipeline: true }
  );

  if (!audio) {
    throw new ApiError(404, "Audio not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { isPublished: audio.isPublished }, "Audio status updated")
  );
});

export {
  getAdminDashboard, getAllUsersForAdmin, getAllAudioForAdmin, adminDeleteAudio,
  adminUpdateAudio, toggleAudioStatus, toggleUserBlockByAdmin
}
