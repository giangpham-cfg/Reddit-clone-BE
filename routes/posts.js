import express from "express";
import { prisma } from "../index.js";
export const postsRoute = express.Router();

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

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to create a post.",
      });
    }
    const post = await prisma.post.create({
      data: {
        text,
        title,
        subredditId,
        userId: req.user.id,
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
    const { postId } = req.params;
    const { title, text } = req.body;

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to update a post.",
      });
    }
    if (!postId)
      return res.send({
        success: false,
        error: "Post ID not provided.",
      });
    const findPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    if (!findPost) {
      return res.send({
        success: false,
        error: "The post was not found.",
      });
    }
    if (!title && !text)
      return res.send({
        success: false,
        error: "Should provide title or text to update a post!",
      });
    if (findPost.userId !== req.user.id) {
      return res.send({
        success: false,
        error: "You don't have permission to delete this post.",
      });
    }
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
    const { postId } = req.params;

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to create a post.",
      });
    }
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
    if (post.userId !== req.user.id) {
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
