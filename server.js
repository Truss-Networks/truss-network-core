require("dotenv").config();
const express = require("express");

const path = require("path");
const mongodb = require("mongodb");

const mongoose = require("mongoose");
const multer = require("multer");

const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const Cprofile = require("./models/customerprofile");

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

//gridfs middleware

const storage1 = new GridFsStorage({
  url: api,
  file: (req, file) => {
    return {
      bucketName: "promotion",
    };
  },
});

const upload1 = multer({
  storage: storage1,
});

const storage2 = new GridFsStorage({
  url: api,
  file: (req, file) => {
    return {
      bucketName: "bprofile",
    };
  },
});

const upload2 = multer({
  storage: storage2,
});

//API Routes

app.get("/allposts", async (req, res) => {
  const collection = db.collection("promotion.chunks");
  collection.aggregate(
    [
      {
        $lookup: {
          from: "promotion.files",
          localField: "files_id",
          foreignField: "_id",
          as: "image",
        },
      },
      {
        $unwind: "$image",
      },
      {
        $group: {
          _id: "$files_id",
          chunks: { $push: "$$ROOT" },
          image: { $first: "$image" },
        },
      },
      {
        $match: {
          "chunks.n": 0,
        },
      },

      {
        $project: {
          _id: 0,
          image: 1,
          chunks: 1,
        },
      },
    ],
    async (err, result) => {
      if (err) {
        // handle the error
        console.error(err);
        return;
      }
      const files = await result.toArray();
      // process the result of the aggregation pipeline
      res.send(files);
    }
  );
});

app.post("/post", upload1.single("image"), async (req, res, next) => {
  console.log(req.body);
  const filter = { filename: req.file.filename };
  const update = {
    $set: {
      metadata: {
        category: req.body.category,
        company: req.body.company,
        country: req.body.country,
        city: req.body.city,
        town: req.body.town,
        promodet: req.body.promodet,
      },
    },
  };
  const collection = db.collection("promotion.files");
  await collection.findOneAndUpdate(filter, update);
});

app.post("/cprofile", (req, res) => {
  bcrypt.hash(req.body.cprofile.password, saltRounds, async (err, hash) => {
    const profile = new Cprofile({
      username: req.body.cprofile.username,
      email: req.body.cprofile.email,
      password: hash,
    });

    await profile.save();
  });
});

app.post("/bprofile", upload2.single("imageb"), async (req, res, next) => {
  console.log(req.file);
  bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
    const filter = { filename: req.file.filename };
    const update = {
      $set: {
        metadata: {
          firstname: req.body.fname,
          lastname: req.body.lname,
          email: req.body.email,
          password: hash,
          company: req.body.company,
          country: req.body.country,
          city: req.body.city,
          town: req.body.town,
          about: req.body.about,
          category: req.body.category,
        },
      },
    };

    const collection = db.collection("bprofile.files");
    await collection.findOneAndUpdate(filter, update);
  });
});

app.post("/login", async (req, res) => {
  const email = req.body.logindet.email;
  const password = req.body.logindet.password;

  const user = await Cprofile.findOne({ email: email }).exec();
  if (user) {
    bcrypt.compare(password, user.password, (err, result) => {
      result ? res.send("true") : res.send("false");
    });
  } else {
    res.send("wrongusername");
  }
});

app.get("/", (req, res) => {
  res.send("oyawas");
});

httpServer.listen(port, () => {
  console.log("server running...");
});
