require("dotenv").config();
const express = require("express");

const path = require("path");
const mongodb = require("mongodb");

const mongoose = require("mongoose");
const multer = require("multer");

const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const { GridFsStorage } = require("multer-gridfs-storage");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Users = require("./models/Users");
const passport = require("passport");
const port = 5000;
const api = process.env.API_KEY;
const cors = require("cors");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

io.on("connection", (socket) => {
  socket.on("private message", (id) => {
    socket.join(id);
  });
  socket.on("vere", (mh) => {
    socket.on("newmsg", (msg) => {
      io.to(mh).emit("rece", msg);
    });
  });
});
//Mongodb Connection with mongoose schema and models
mongoose.connect(api, {
  serverSelectionTimeoutMS: 50000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("database running...");
});

//API Routes
app.get("/", (req, res) => {
  console.log("oiiii");
  res.send("youii");
});
app.post("/getchats", async (req, res) => {
  const user = await Users.findOne({ email: req.body.email }).exec();
  res.send(user);
});

app.post("/login", async (req, res) => {
  const user = await Users.findOne({ email: req.body.user.email }).exec();
  if (user) {
    bcrypt.compare(req.body.user.password, user.password, (err, result) => {
      result ? res.send("login sucessful") : res.send("incorrect password");
    });
  } else {
    res.send("user not found");
  }
});

app.post("/signup", (req, res) => {
  res.send("received thanks");
  const password = req.body.user.password;
  bcrypt.hash(password, saltRounds, async (err, hash) => {
    const small = new Users({
      username: req.body.user.username,
      email: req.body.user.email,
      password: hash,
    });
    await small.save();
  });
});

app.post("/picupload", async (req, res) => {
  res.send("success");
  const user = await Users.findOne({ email: req.body.profile.email }).exec();
  user.profilepic = req.body.profile.url;
  await user.save();
});
app.post("/newmsg", async (req, res) => {
  const updatedDocument1 = await Users.findOneAndUpdate(
    { email: req.body.chats.email },
    { $push: { chats: req.body.chats } }
  );
  const updatedDocument2 = await Users.findOneAndUpdate(
    { email: req.body.chats.receiver },
    { $push: { chats: req.body.chats } }
  );
});
httpServer.listen(port, () => {
  console.log("server running...");
});
/*
  const user = await Users.findOne({ email: req.body.msg.email }).exec();
  if (user) {
    const jats = user.chats;
    jats.push(req.body.msg);
    user.chats = jats;
    await user.update();
  }
  */
