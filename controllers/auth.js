const crypto = require("crypto");
const User = require("../models/User");
const ErrorRepsonse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");

//const { json } = require("express");

exports.register = async (req, res, next) => {
  const { username, email, password, Role } = req.body;

  try {
    const user = await User.create({
      username,
      email,
      Role,
      password,
    });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorRepsonse("Please provide an email and password", 400));
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorRepsonse("Invalid credentiels", 401));
    }
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorRepsonse("Invalid credentiels", 401));
    }
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.forgotpassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorRepsonse("Email could not be sent", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `http:\\localhost:3000/passwordreset/${resetToken}`;

    const message = `
        <h1> You have requested a new password reset</h1>
        <p> Please go to this link to reset your password</p>
        <a href=${resetUrl} clicktracking= off> ${resetUrl}</a>
        `;
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({ success: true, data: "Email Sent" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return next(new ErrorRepsonse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
};
exports.resetpassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorRepsonse("Invalid Reset Token", 400));
    }

    user.password = req.body.password;
    user.resetPaswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Reset Success",
    });
  } catch (err) {
    next(err);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ success: true, token, user });
};
