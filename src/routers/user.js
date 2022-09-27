const express = require("express");
const multer = require("multer");
const sharp = require('sharp');
const User = require("../models/user");
const auth = require("../middleware/auth");
const { findOne } = require("../models/task");

const router = new express.Router();

// Endpoint to create new users;Sign up
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// Endpoint for login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// Endpoint for logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// Endpoint for loggind out of all sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// Endpoint to read user
// Read profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Endpoint to update user
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(404).send({
      error: "Invalid update operation",
    });
  }

  try {
    const user = req.user;

    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

//Endpoint to delete profile
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

// Endpoint to upload a profile picture
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpe?g|png)$/)) {
      return cb(new Error("Please upload an image file"));
    }

    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Endpoint for deleting avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//Endpoint for serving profile avatar 
router.get('/users/:id/avatar', async (req, res) => {
  const user = await User.findOne({_id: req.params.id});
  if(!user || !user.avatar){
    return res.status(404).send({error: '404!Not found!'});
  }
  res.set('Content-Type', 'image/jpg')
  res.send(user.avatar);
})

module.exports = router;
