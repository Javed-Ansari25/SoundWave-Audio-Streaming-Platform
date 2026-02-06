import { Album } from "../../model/album.model.js";
import { Audio } from "../../model/audio.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../config/cloudinary.js";
import mongoose from "mongoose";

const createAlbum = async (req, res) => {
    const {title} = req.body;
    if (!title) {
        throw new ApiError(400, "Title required");
    }

    const coverImageLocalPath = req.file?.path;
    let coverImageUrl = "";
    if (coverImageLocalPath) {
        const cover = await uploadOnCloudinary(coverImageLocalPath);
        coverImageUrl = cover?.url || "";
    }

    const album = await Album.create({
        title: req.body.title,
        coverImage: coverImageUrl,
        audios: [],
        artist: req.user._id
    });

    if (!album) {
        throw new ApiError(400, "Album not created");
    }

    res.status(201).json(
        new ApiResponse(201, album, "Album created")
    );
};

const addAudioToAlbum = asyncHandler(async (req, res) => {
    const { albumId, audioId } = req.params;
    const artistId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(albumId)) {
        throw new ApiError(400, "Invalid AlbumId");
    }

    if (!mongoose.Types.ObjectId.isValid(audioId)) {
        throw new ApiError(400, "Invalid AudioId");
    }

    // Audio ownership check 
    const audioExists = await Audio.exists({
        _id: audioId,
        artist: artistId
    });

    if (!audioExists) {
        throw new ApiError(403, "You are not allowed to add another artist's audio to this album");
    }

    // Atomic update (fast)
    const album = await Album.findOneAndUpdate(
        {
            _id: albumId,
            artist: artistId,
            audios: { $ne: audioId }
        },
        {
            $addToSet: { audios: audioId }
        },
        {
            new: true,
            projection: { audios: 1, artist: 1 }
        }
    ).populate("audios", "title fileUrl artist");

    if (!album) {
        const albumExists = await Album.exists({ _id: albumId });

        if (!albumExists) {
        throw new ApiError(404, "Album not found");
        }

        throw new ApiError(409, "Audio already exists in album or you are not allowed");
    }

    return res.status(200).json(
        new ApiResponse(200, album, "Audio added to album")
    );
});

const deleteAudioToAlbum = asyncHandler(async (req, res) => {
    const { albumId, audioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(albumId)) throw new ApiError(400, "Invalid AlbumId");
    if (!mongoose.Types.ObjectId.isValid(audioId)) throw new ApiError(400, "Invalid AudioId");

    const album = await Album.findOneAndUpdate(
        {
            _id : albumId, artist: req.user._id
        },
        {
            $pull : {audios : audioId}
        },
        {
            new : true, projection : { audios: 1, artist: 1 , title: 1}
        }
    );

    if (!album) throw new ApiError(404, "Album not found or unauthorize");

    return res.status(200).json(
        new ApiResponse(200, album, "Audio Delete to album")
    );
})

const deleteAlbum = asyncHandler(async (req, res) => {
    const {albumId} = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(albumId)) {
        throw new ApiError(400, "Invalid albumId");
    }
    
    const deletedAlbum = await Album.findOneAndDelete({
        _id: albumId,
        artist: req.user._id
    });
    
    if (!deletedAlbum) {
        throw new ApiError(404, "Album not found or unauthorized");
    }
        
    return res.status(200).json(
        new ApiResponse(200, {}, "Album deleted successfully")
    );
})

const updateAlbum = asyncHandler(async (req, res) => {
  const { albumID } = req.params;
  const { title } = req.body;

  if (!mongoose.Types.ObjectId.isValid(albumID)) {
    throw new ApiError(400, "Invalid albumID");
  }

  const albumUpdate = await Album.findOneAndUpdate(
    { _id: albumID, artist: req.user._id },
    { 
        $set: {
            title
        } 
    },
    { new: true, projection: { isPublished: 1, artist: 1 , title: 1} }
  );

  if (!albumUpdate) {
    throw new ApiError(404, "Album not found or unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(200, albumUpdate, "Album updated successfully")
  );
});

const publishAlbumToggle = async (req, res) => {
  const { albumID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(albumID)) {
    throw new ApiError(400, "Invalid albumID");
  }

  const album = await Album.findOneAndUpdate(
    {
        _id: albumID, artist: req?.user._id
    },
    [
        {
            $set : {
                isPublished : {
                    $not : "$isPublished"
                }
            }
        }
    ],
    {
        new : true, updatePipeline : true
    }
  )

  if (!album) {
    throw new ApiError(404, "Album not found or unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(200, { isPublished: album.isPublished }, "Publish status update successfully")
  );
};

const getAlbumsById = asyncHandler(async (req, res) => {
  const { albumId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(albumId)) {
    throw new ApiError(400, "Invalid albumId");
  }

  const album = await Album.findById(
    albumId,
    {
      title: 1,
      artist: 1,
      audios: 1,
      isPublished: 1
    }
  )
    .populate("artist", "username")
    .populate("audios", "title fileUrl");

  if (!album) {
    throw new ApiError(404, "Album not found");
  }

  return res.status(200).json(
    new ApiResponse(200, album, "Album fetched successfully")
  );
});

const getPublishedAlbums = async (req, res) => {
    const {page = "1", limit = "10"} = req.query
    const skip = (page - 1) * limit;

    const albums = await Album.find(
        { isPublished: true },
        {
            title: 1,
            artist: 1,
            audios: 1,
            isPublished: 1
        }
    )
    .populate("artist", "username")
    .populate("audios", "title fileUrl")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, albums, "Publish Albums fetched")
    );
};

const getAllAlbumsOfArtist = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new ApiError(400, "Invalid artistId");
  }

  const skip = (page - 1) * limit;

  // Parallel DB calls
  const [albums, totalAlbums] = await Promise.all([
    Album.find({artist: artistId, isPublished: true})
      .select("title audios createdAt")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),

    Album.countDocuments({
      artist: artistId,
      isPublished: true
    })
  ]);

  res.status(200).json(
    new ApiResponse(200,
      {
        totalAlbums,
        albums
      },
      "Artist published albums fetched"
    )
  );
});


export {
    createAlbum, addAudioToAlbum, deleteAlbum, deleteAudioToAlbum, updateAlbum,
    publishAlbumToggle, getAlbumsById, getPublishedAlbums, getAllAlbumsOfArtist
}
