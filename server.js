require("dotenv").config();
const express = require("express");

const path = require("path");
const mongodb = require("mongodb");

const mongoose = require("mongoose");
const multer = require("multer");

const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const { GridFsStorage } = require("multer-gridfs-storage");
const { createServer } = require("http");
const { Server } = require("socket.io");
const port = 5000;
const api = process.env.API_KEY;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

io.on("connection", (socket) => {
  socket.on("signnew", (room, callback) => {
    socket.join(room);
    console.log(socket.rooms);
    socket.on("partner", (partner) => {
      console.log(partner);
      socket.on("message", (msg) => {
        console.log(msg);
        io.to(partner).emit("receive", msg);
        ds
      });
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
  res.send("oyawas");
});

httpServer.listen(port, () => {
  console.log("server running...");
});
