import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { postsRoute } from "./routes/posts.js";
import { usersRoute } from "./routes/users.js";
import { subredditsRoute } from "./routes/subreddits.js";
import { votesRoute } from "./routes/votes.js";

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return next();
    }
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return next();
    }
    delete user.password;
    req.user = user;
    next();
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
});

app.use("/posts", postsRoute);
app.use("/users", usersRoute);
app.use("/subreddits", subredditsRoute);
app.use("/votes", votesRoute);

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
