
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },

    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

// Paginate comments for a post.
commentSchema.index({ post: 1, createdAt: -1 });

// Find comments created by a particular user.
commentSchema.index({ author: 1, createdAt: -1 });

// Find replies to a comment.
commentSchema.index({ parentComment: 1, createdAt: 1 });

const Comment =
  mongoose.models.Comment ||
  mongoose.model("Comment", commentSchema);

export default Comment;