const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = new express.Router();

// Endpoint to create a new task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// Endpoint to read tasks
// Read all tasks
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

// Read task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const result = await Task.findOne({ _id, owner: req.user._id });
    if (!result) {
      return res.status(404).send();
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

// Endpoint to update task
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(404).send({
      error: "Invalid update operation",
    });
  }

  try {
    const _id = req.params.id;
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

//Endpoint to delete a task
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

module.exports = router;
