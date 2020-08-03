const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const founderSchema = new mongoose.Schema({
  firstName: { type: String, required: true, minlength: 3 },
  lastName: { type: String, required: true, minlength: 3 },
  role: { type: String, required: true, minlength: 3 },
  aboutFounder: { type: String, required: true, minlength: 3 },
  email: { type: String, required: true, minlength: 10, unique: true },
  linkedIn: { type: String, required: false, minlength: 3 },
  facebook: { type: String, required: false, minlength: 3 },
  instagram: { type: String, required: false, minlength: 3 },
  twitter: { type: String, required: false, minlength: 3 },
  avatarUrl: { type: String, required: false },
});

const Founder = mongoose.model("Founder", founderSchema);

function validateFounder(founder) {
  return Joi.validate(founder, {
    firstName: Joi.string().required().min(3),
    lastName: Joi.string().min(3).required(),
    role: Joi.string().min(3).required(),
    aboutFounder: Joi.string().min(3).required(),
    email: Joi.string().min(5).required().email(),
    linkedIn: Joi.string().min(3),
    facebook: Joi.string().min(3),
    instagram: Joi.string().min(3),
    twitter: Joi.string().min(3),
  });
}

module.exports.Founder = Founder;
module.exports.validateFounder = validateFounder;
