/*
 * Title: Task Manage API
 * Description: CRUD API for tasks
 * Author: Fahim Hasan Mehedi
 * Date: 24.09.2022
 */

//dependencies
const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => console.log(`Server is up and running on port ${port}`));