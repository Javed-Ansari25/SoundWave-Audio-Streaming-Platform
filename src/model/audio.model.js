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
    }
  },
  { timestamps: true }
);

audioSchema.index({ _id: 1, artist: 1 });

export const Audio = mongoose.model("Audio", audioSchema);
