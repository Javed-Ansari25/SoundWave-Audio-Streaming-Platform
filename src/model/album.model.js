import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },

    coverImage: {
      type: String 
    },

    audios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Audio"
      }
    ],

    isPublished: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Album = mongoose.model("Album", albumSchema);
