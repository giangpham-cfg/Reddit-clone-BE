import express from "express";
import { prisma } from "../index.js";
import jwt from "jsonwebtoken";
export const postsRoute = express.Router();

postsRoute.use(express.json());

//GET /posts
postsRoute.get("/", async (req, res) => {
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
postsRoute.post("/", async (req, res) => {
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
postsRoute.put("/:postId", async (req, res) => {
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
postsRoute.delete("/:postId", async (req, res) => {
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
