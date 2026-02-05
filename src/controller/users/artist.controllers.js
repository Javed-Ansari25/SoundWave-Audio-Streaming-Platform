import { Audio } from "../../model/audio.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../config/cloudinary.js";
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
      artist: req?.user._id
    })

    const audioResponse = {
      _id: audio._id,
      title: audio.title,
      description: audio.description,
      artist: audio.role,
      fileUrl: audio.fileUrl
    };

    return res.status(201).json(
      new ApiResponse(201, audioResponse, "Audio upload successfully")
    )
})

// softDelete
const deleteAudioById = asyncHandler(async (req, res) => {
    const { audioId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(audioId)) {
      throw new ApiError(400, "Invalid AudioId");
    }

    const deletedAudio = await Audio.findOneAndUpdate(
      {_id: audioId, artist: req?.user._id},
      {isDelete : true},
      {new : true}
    );

    if (!deletedAudio) {
      throw new ApiError(403, "Audio not found");
    }

    return res.status(200).json(
      new ApiResponse(200, {isDelete : deletedAudio.isDelete}, "Audio file deleted successfully")
    );
});

const updateAudioDetails = asyncHandler(async (req, res) => {
  const { audioId } = req.params;
  const { title, description, fileUrl } = req.body;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid Audio ID");
  }

  const audio = await Audio.findOneAndUpdate(
    {_id: audioId, artist: req.user._id},
    { $set: { title, description, fileUrl } },
    { new: true ,  projection: { title: 1, description: 1 }}
  );

  if (!audio) {
    throw new ApiError(403, "You are not allowed to update this audio");
  }

  return res.status(200).json(
    new ApiResponse(200, audio, "Audio details updated successfully")
  );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { audioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid audioId");
  }

  const audio = await Audio.findOneAndUpdate(
    {_id: audioId, artist: req.user._id},  
    
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
    throw new ApiError(404, "Audio not found or unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(200, { isPublished: audio.isPublished }, "Publish status toggled successfully")
  );
});

export {uploadAudio, deleteAudioById, updateAudioDetails, togglePublishStatus}
