import { Audio } from "../model/audio.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const uploadAudio = asyncHandler(async (req, res) => {
    const {title, description} = req.body;

    if(!title || !description) {
        throw new ApiError(400, "All field are required");
    }

    const audioLocalFile = req?.file?.path;
    const audioUpload = await uploadOnCloudinary(audioLocalFile);

    if (!audioUpload?.url) {
        throw new ApiError(400, "audio upload failed");
    }

    const audio = await Audio.create({
        title,
        description,
        fileUrl : audioUpload.url,
        uploadedBy: req?.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, audio, "Audio upload successfully")
    )
})

const deleteAudioById = asyncHandler(async (req, res) => {
    const { audioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(audioId)) {
        throw new ApiError(400, "Invalid AudioId");
    }

    const filter = req?.user.role === "ADMIN" ? { _id: audioId } : { _id: audioId, uploadedBy: req?.user._id };
    const deletedAudio = await Audio.findOneAndDelete(filter);

    if (!deletedAudio) {
        throw new ApiError(404, "Audio file not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Audio file deleted successfully")
    );
});

const updateAudioDetails = asyncHandler(async (req, res) => {
  const { audioId } = req.params;
  const { title, description, fileUrl } = req.body;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid Audio ID");
  }

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "All are required");
  }

  const filter = req?.user.role === "ADMIN" ? {_id : audioId} : {_id: audioId, uploadedBy: req?.user._id };
  const audio = await Audio.findOneAndUpdate(
    filter,
    { $set: { title, description, fileUrl } },
    { new: true ,  projection: { title: 1, description: 1 }}
  );

  if (!audio) {
    throw new ApiError(404, "Audio not found or unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(200, audio, "Audio details updated successfully")
  );
});

export {uploadAudio, deleteAudioById, updateAudioDetails}
