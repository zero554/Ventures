const mongoose = require('mongoose');
const Joi = require('joi');


const adminSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minlength: 3 },
    lastName: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, minlength: 10, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 }
});

const Admin = mongoose.model('Admin', adminSchema);

function validateAdmin(admin) {

    return Joi.validate(admin, {
        firstName: Joi.string().required().min(3),
        lastName: Joi.string().min(3).required(),
        email: Joi.string().min(5).required().email(),
        password: Joi.string().min(8).max(255).required()
    });

}

module.exports.Admin = Admin;
module.exports.validateAdmin = validateAdmin;