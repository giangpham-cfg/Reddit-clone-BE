import express from "express";
import { prisma } from "../index.js";
import jwt from "jsonwebtoken";
import Joi from "joi";
import bcrypt from "bcrypt";

export const usersRoute = express.Router();

//POST /users/register
usersRoute.post("/register", async (req, res) => {
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
usersRoute.post("/login", async (req, res) => {
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
usersRoute.get("/token", async (req, res) => {
  try {
    // const token = req.headers.authorization.split(" ")[1];
    // const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await prisma.user.findUnique({
    //   where: {
    //     id: userId,
    //   },
    // });
    // delete user.password;
    res.send({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  }
});
