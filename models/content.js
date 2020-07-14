const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const config = require("config");

const contentSchema = new mongoose.Schema({
    Week: { type: String, required: true },
    Videos: { type: Array, required: true },
    Notes: { type: String },
    Task: { type: String },
    Template: { type: String }

});

contentSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
    return token;
}

const Content = mongoose.model('Content', contentSchema);
module.exports.Content = Content;