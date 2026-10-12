
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    width: {
      type: Number,
      min: 1,
    },

    height: {
      type: Number,
      min: 1,
    },

    altText: {
      type: String,
      default: "",
      maxlength: 300,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2200,
    },

    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= 10,
        message: "A post can contain at most 10 media items.",
      },
    },

    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

postSchema.pre("validate", function () {
  if (!this.caption?.trim() && this.media.length === 0) {
    this.invalidate(
      "caption",
      "A post must contain text or at least one media item."
    );
  }
});

const Post =
  mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;