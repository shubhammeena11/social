
import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index(
  { follower: 1, following: 1 },
  { unique: true }
);

followSchema.index({ following: 1, status: 1, createdAt: -1 });
followSchema.index({ follower: 1, status: 1, createdAt: -1 });

followSchema.pre("validate", function () {
  if (
    this.follower &&
    this.following &&
    this.follower.equals(this.following)
  ) {
    this.invalidate("following", "You cannot follow yourself.");
  }
});

const Follow =
  mongoose.models.Follow || mongoose.model("Follow", followSchema);

export default Follow;