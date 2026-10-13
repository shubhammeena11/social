import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI must be set in .env");

const applyChanges = process.argv.includes("--apply");
const showHelp = process.argv.includes("--help");

if (showHelp) {
  console.log("Review counts by default. Pass --apply to update counters while relationship writes are paused.");
} else {
  await mongoose.connect(mongoUri);

  try {
    const database = mongoose.connection.db;
    const [likeGroups, followingGroups, followerGroups, users, posts] = await Promise.all([
      database.collection("likes").aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$post", count: { $sum: 1 } } },
      ]).toArray(),
      database.collection("follows").aggregate([
        { $match: { isDeleted: { $ne: true }, status: "accepted" } },
        { $group: { _id: "$following", count: { $sum: 1 } } },
      ]).toArray(),
      database.collection("follows").aggregate([
        { $match: { isDeleted: { $ne: true }, status: "accepted" } },
        { $group: { _id: "$follower", count: { $sum: 1 } } },
      ]).toArray(),
      database.collection("users").find({}, { projection: { _id: 1, followersCount: 1, followingCount: 1 } }).toArray(),
      database.collection("posts").find({}, { projection: { _id: 1, likesCount: 1 } }).toArray(),
    ]);

    const likeCounts = new Map(likeGroups.map(({ _id, count }) => [String(_id), count]));
    const followersCounts = new Map(followingGroups.map(({ _id, count }) => [String(_id), count]));
    const followingCounts = new Map(followerGroups.map(({ _id, count }) => [String(_id), count]));

    const userRepairs = users.filter((user) =>
      user.followersCount !== (followersCounts.get(String(user._id)) || 0) ||
      user.followingCount !== (followingCounts.get(String(user._id)) || 0)
    );
    const postRepairs = posts.filter((post) =>
      post.likesCount !== (likeCounts.get(String(post._id)) || 0)
    );

    console.log(`Users needing counter repair: ${userRepairs.length}`);
    console.log(`Posts needing counter repair: ${postRepairs.length}`);
    console.table(userRepairs.slice(0, 20).map((user) => ({
      id: String(user._id),
      currentFollowers: user.followersCount || 0,
      computedFollowers: followersCounts.get(String(user._id)) || 0,
      currentFollowing: user.followingCount || 0,
      computedFollowing: followingCounts.get(String(user._id)) || 0,
    })));
    console.table(postRepairs.slice(0, 20).map((post) => ({
      id: String(post._id),
      currentLikes: post.likesCount || 0,
      computedLikes: likeCounts.get(String(post._id)) || 0,
    })));
    if (userRepairs.length > 20 || postRepairs.length > 20) {
      console.log("Showing the first 20 mismatches per collection.");
    }

    if (!applyChanges) {
      console.log("Dry run only. Pause relationship writes and rerun with --apply to update counters.");
    } else {
      const writes = [];
      if (userRepairs.length) {
        writes.push(database.collection("users").bulkWrite(userRepairs.map((user) => ({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                followersCount: followersCounts.get(String(user._id)) || 0,
                followingCount: followingCounts.get(String(user._id)) || 0,
              },
            },
          },
        }))));
      }
      if (postRepairs.length) {
        writes.push(database.collection("posts").bulkWrite(postRepairs.map((post) => ({
          updateOne: {
            filter: { _id: post._id },
            update: { $set: { likesCount: likeCounts.get(String(post._id)) || 0 } },
          },
        }))));
      }
      await Promise.all(writes);
      console.log("Counter reconciliation complete.");
    }
  } finally {
    await mongoose.disconnect();
  }
}
