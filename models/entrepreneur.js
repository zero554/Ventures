const mongoose = require('mongoose');
const Joi = require('joi');

const entrepreneurSchema = new mongoose.Schema({
    businessName: { type: String, required: true, minlength: 3 },
    aboutBusiness: { type: String, minlength: 10, required: true },
    businessEmail: { type: String, required: true, minlength: 10, unique: true },
    password: { type: String, minlength: 5, required: true }
});

const Entrepreneur = mongoose.model('Entrepreneur', entrepreneurSchema);


function validateEntrepreneur(entrepreneur) {

    return Joi.validate(entrepreneur, {
        businessName: Joi.string().required().min(3),
        aboutBusiness: Joi.string().min(3).required(),
        businessEmail: Joi.string().min(5).required().email(),
        password: Joi.string().min(8).max(255).required()
    });

}

module.exports.validateEntrepreneur = validateEntrepreneur;
module.exports.Entrepreneur = Entrepreneur;