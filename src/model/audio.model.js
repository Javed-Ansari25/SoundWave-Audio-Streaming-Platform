import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim : true
    },
    description : {
      type: String,
      required: true,
      trim: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isPublished: {
      type: Boolean,
      default: true
    },
    isDelete: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

audioSchema.index({ artist: 1, isPublished: 1, createdAt: -1 });

export const Audio = mongoose.model("Audio", audioSchema);
