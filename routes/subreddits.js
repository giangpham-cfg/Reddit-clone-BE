import express from "express";
import { prisma } from "../index.js";
export const subredditsRoute = express.Router();

subredditsRoute.get("/", async (req, res) => {
  try {
    const subreddits = await prisma.subreddit.findMany();
    res.send({
      success: true,
      subreddits,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

subredditsRoute.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.send({
        success: false,
        error: "Name must be provided to create a subreddit!",
      });
    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to create a subreddit.",
      });
    }
    const subreddit = await prisma.subreddit.create({
      data: {
        name,
        userId: req.user.id,
      },
    });
    return res.send({ success: true, subreddit });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});

subredditsRoute.delete("/:subredditId", async (req, res) => {
  try {
    const { subredditId } = req.params;

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to create a post.",
      });
    }
    if (!subredditId)
      return res.send({
        success: false,
        error: "Subreddit ID not provided.",
      });
    const subreddit = await prisma.subreddit.findUnique({
      where: {
        id: subredditId,
      },
    });
    if (!subreddit) {
      return res.send({
        success: false,
        error: "The subreddit was not found.",
      });
    }
    if (subreddit.userId !== req.user.id) {
      return res.send({
        success: false,
        error: "You don't have permission to delete this subreddit.",
      });
    }

    await prisma.subreddit.delete({
      where: {
        id: subredditId,
      },
    });
    res.send({ success: true, subreddit });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
});
