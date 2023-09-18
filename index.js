import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import Joi from "joi";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

//GET /
app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "Welcome to the Reddit server!",
  });
});

//POST /users/register
app.post("/users/register", async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().min(3).max(20).required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.send({
        success: false,
        error: error.details[0].message,
      });
    } else {
      console.log("Input is valid:", value);
    }

    const { username, password } = req.body;
    const checkUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (checkUser) {
      return res.send({
        success: false,
        error: "Username already exists, please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.send({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//POST /users/login
app.post("/users/login", async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().min(3).max(20).required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.send({
        success: false,
        error: error.details[0].message,
      });
    } else {
      console.log("Input is valid:", value);
    }

    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (!user) {
      return res.send({
        success: false,
        error: "Incorrect username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.send({
        success: false,
        error: "Incorrect username or password",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.send({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//GET /users/token
app.get("/users/token", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    delete user.password;
    res.send({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//GET /posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: true,
        subreddit: true,
        upvotes: true,
        downvotes: true,
        children: true,
      },
    });
    res.send({
      success: true,
      posts,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//POST /posts
app.post("/posts", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { text, title, subredditId, parentId } = req.body;
    if (!text)
      return res.send({
        success: false,
        error: "Text must be provided to create a message!",
      });
    if (!subredditId)
      return res.send({
        success: false,
        error: "Subreddit must be provided to create a message!",
      });
    const post = await prisma.post.create({
      data: {
        text,
        title,
        subredditId,
        userId,
        parentId,
      },
    });
    return res.send({ success: true, post });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//PUT /posts/:postId
app.put("/posts/:postId", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { postId } = req.params;
    const { title, text } = req.body;

    if (!postId)
      return res.send({
        success: false,
        error: "The post not found.",
      });
    if (!title && !text)
      return res.send({
        success: false,
        error: "Should provide title or text to update a post!",
      });
    const post = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title,
        text,
      },
    });
    res.send({ success: true, post });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//DELETE /posts/:postId
app.delete("/posts/:postId", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { postId } = req.params;
    if (!postId)
      return res.send({
        success: false,
        error: "Post ID not provided.",
      });
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    if (!post) {
      return res.send({
        success: false,
        error: "The post was not found.",
      });
    }
    if (post.userId !== userId) {
      return res.send({
        success: false,
        error: "You don't have permission to delete this post.",
      });
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    res.send({ success: true, post });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//handle error with bad request
app.use((req, res) => {
  res.send({ success: false, error: "No route found." });
});

app.use((error, req, res, next) => {
  res.send({ success: false, error: error.message });
});

app.listen(3000, () => console.log("Server is up!"));
