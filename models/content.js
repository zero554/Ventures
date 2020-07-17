const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const config = require("config");

const contentSchema = new mongoose.Schema({
    Week: { required: false },
    Focus: { type: String },
    Videos: { type: [String] },
    Notes: { type: String },
    Task: { type: String },
    Template: { type: String }
});

const AllContents = mongoose.model('AllContents', contentSchema);

module.exports.AllContents = AllContents;