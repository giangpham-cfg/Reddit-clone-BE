import express from "express";
import { prisma } from "../index.js";

export const votesRoute = express.Router();

const handleVote = async (req, res, voteType) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res.send({
        success: false,
        error: "The post was not found.",
      });
    }
    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to vote for a post",
      });
    }
    const vote = await prisma[voteType].create({
      data: {
        postId,
        userId: req.user.id,
      },
    });
    return res.send({ success: true, vote });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
};

const handleDeleteVote = async (req, res, voteType) => {
  try {
    const { postId } = req.params;

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to delete a vote",
      });
    }
    if (!postId) {
      return res.send({
        success: false,
        error: "The post was not found.",
      });
    }
    const vote = await prisma[voteType].findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId,
        },
      },
    });
    if (!vote) {
      return res.send({
        success: false,
        error: "You don't have a vote to delete",
      });
    }
    await prisma[voteType].delete({
      where: {
        id: vote.id,
      },
    });
    res.send({ success: true, vote });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
};

votesRoute.post("/upvotes/:postId", async (req, res) => {
  await handleVote(req, res, "upvote");
});

votesRoute.delete("/upvotes/:postId", async (req, res) => {
  await handleDeleteVote(req, res, "upvote");
});

votesRoute.post("/downvotes/:postId", async (req, res) => {
  await handleVote(req, res, "downvote");
});

votesRoute.delete("/downvotes/:postId", async (req, res) => {
  await handleDeleteVote(req, res, "downvote");
});
