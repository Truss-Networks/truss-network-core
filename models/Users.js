const { default: mongoose } = require("mongoose");

const schema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  chats: Array,
});

const Users = mongoose.model("Users", schema);
module.exports = Users;
