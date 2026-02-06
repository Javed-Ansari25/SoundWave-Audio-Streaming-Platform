import { Album } from "../../model/album.model.js";
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
        coverImage: coverImageUrl?.url,
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

const addAudioToAlbum = async (req, res) => {
    const { albumId, audioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(albumId)) throw new ApiError(400, "Invalid AlbumId");
    if (!mongoose.Types.ObjectId.isValid(audioId)) throw new ApiError(400, "Invalid AudioId");

    const album = await Album.findOneAndUpdate(
        {_id : albumId, artist: req.user._id},
        {
            $addToSet : {audios : audioId}
        },
        {
            new : true
        }
    );

    if (!album) throw new ApiError(404, "Album not found or unauthorize");
    return res.status(200).json(
        new ApiResponse(200, album, "Audio added to album")
    );
};

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
            new : true
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
    { new: true }
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

const getAlbumsById = async (req, res) => {
    const {albumId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(albumId)) {
        throw new ApiError(400, "Invalid albumId");
    }

    const album = await Album.findById(albumId)
    .populate("audios")
    .populate("artist" , "username")

    if(!album) {
        throw new ApiError(404, "Album not found")
    }

    return res.status(200).json(
        new ApiResponse(200, album, "Album fetched successfully")
    ); 
};

const getPublishedAlbums = async (req, res) => {
    const {page = "1", limit = "10"} = req.query
    const skip = (page - 1) * limit;

    const albums = await Album.find({ isPublished: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, albums, "Publish Albums fetched")
    );
};

export {
    createAlbum, addAudioToAlbum, deleteAlbum, deleteAudioToAlbum, updateAlbum,
    publishAlbumToggle, getAlbumsById, getPublishedAlbums
}
