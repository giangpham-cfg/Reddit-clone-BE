import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { postsRoute } from "./routes/posts.js";
import { usersRoute } from "./routes/users.js";

const app = express();
export const prisma = new PrismaClient();
app.use(cors());
// app.use(express.json());
app.use("/posts", postsRoute);
app.use("/users", usersRoute);

//GET /
app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "Welcome to the Reddit server!",
  });
});

//handle error with bad request
app.use((req, res) => {
  res.send({ success: false, error: "No route found." });
});

app.use((error, req, res, next) => {
  res.send({ success: false, error: error.message });
});

app.listen(3000, () => console.log("Server is up!"));
