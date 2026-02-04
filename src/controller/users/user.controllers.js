import { Audio } from "../../model/audio.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAudio = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const audio = await Audio.find({ isPublished: true })
  .populate("artist", "username")
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

  if (!audio) {
    throw new ApiError(404, "Audio not Found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, audio, 'Audio fetched successfully'));
});

const getAudioById = asyncHandler(async (req, res) => {
  const { audioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(audioId)) {
    throw new ApiError(400, "Invalid audioId");
  }

  const audio = await Audio.findById(audioId).populate(
    "artist",
    "username"
  );

  if (!audio || (!audio.isPublished && !isAdmin)) {
    throw new ApiError(404, "Audio not found");
  }

  return res.status(200).json(
    new ApiResponse(200, audio, "Audio fetched successfully")
  );
});

const getArtistAudios = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new ApiError(400, "Invalid artistId");
  }

  const audios = await Audio.find({
    artist: artistId,
    isPublished: true
  })
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });

  if (!audios) {
    throw new ApiError(404, "Audios not found");
  }

  return res.status(200).json(
    new ApiResponse(200, audios, "Artist audios fetched")
  );
});

export {getAudio, getAudioById, getArtistAudios}
