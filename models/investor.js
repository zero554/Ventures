const mongoose = require('mongoose');
const Joi = require('joi');


const investorSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minlength: 3 },
    lastName: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, minlength: 10, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 }
});

const Investor = mongoose.model('Investor', investorSchema);

function validateInvestor(investor) {

    return Joi.validate(investor, {
        firstName: Joi.string().required().min(3),
        lastName: Joi.string().min(3).required(),
        email: Joi.string().min(5).required().email(),
        password: Joi.string().min(8).max(255).required()
    });

}

module.exports.Investor = Investor;
module.exports.validateInvestor = validateInvestor;