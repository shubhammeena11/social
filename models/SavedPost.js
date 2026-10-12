
import mongoose, { Schema } from "mongoose";

const savedPostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can save a post only once.
savedPostSchema.index(
  { user: 1, post: 1 },
  { unique: true }
);

const SavedPost =
  mongoose.models.SavedPost ||
  mongoose.model("SavedPost", savedPostSchema);

export default SavedPost;

