const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  profpic: String,
  username: String,
  work: String,
  email: String,
  post: String,
  upload: String,
  thumbnail: String,
  likes: Array,
  messages: Array,
  followedBy: Array,
});

const Post = mongoose.model("Post", schema);
module.exports = Post;
