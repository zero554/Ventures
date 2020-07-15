const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const config = require("config");

const founderSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minlength: 3 },
    lastName: { type: String, required: true, minlength: 3 },
    role: { type: String, required: true, minlength: 3 },
    aboutFounder: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, minlength: 10, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    linkedIn: { type: String, required: false, minlength: 3 },
    facebook: { type: String, required: false, minlength: 3 },
    instagram: { type: String, required: false, minlength: 3 },
    twitter: { type: String, required: false, minlength: 3 },
});

const businessSchema = new mongoose.Schema({
    businessName: { type: String, required: true, minlength: 3 },
    businessIndustry: { type: String, minlength: 3, required: true },
    yearFound: { type: String, minlength: 3, required: true },
    businessFounders: { type: [founderSchema], required: false },
    businessDescription: { type: String, minlength: 3, required: true },
    problemSolved: { type: String, minlength: 3, required: true },
    aboutBusiness: { type: String, minlength: 3, required: true },
    businessTargetAudience: { type: String, minlength: 3, required: true },
    businessEmail: { type: String, required: true, minlength: 3, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    businessMission: { type: String, minlength: 3, required: true },
    businessVision: { type: String, minlength: 3, required: true },
    week: { type: String, required: false },
    rating: { type: String, required: false }
});

businessSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
    return token;
}

const Business = mongoose.model('Business', businessSchema);


function validateBusiness(business) {

    return Joi.validate(business, {
        businessName: Joi.string().required().min(3),
        businessIndustry: Joi.string().required().min(3),
        yearFound: Joi.string().required().min(3),
        businessDescription: Joi.string().min(3).required(),
        problemSolved: Joi.string().min(3).required(),
        aboutBusiness: Joi.string().min(3).required(),
        businessTargetAudience: Joi.string().min(3).required(),
        businessEmail: Joi.string().min(5).required().email(),
        password: Joi.string().min(8).max(255).required(),
        businessMission: Joi.string().min(3).required(),
        businessVision: Joi.string().min(3).required()
    });

}


module.exports.validateBusiness = validateBusiness;
module.exports.Business = Business;