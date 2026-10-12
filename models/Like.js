
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can like a particular post only once.
likeSchema.index(
  { user: 1, post: 1 },
  { unique: true }
);

// Retrieve likes for a post, newest first.
likeSchema.index({ post: 1, createdAt: -1 });

const Like =
  mongoose.models.Like || mongoose.model("Like", likeSchema);

export default Like;