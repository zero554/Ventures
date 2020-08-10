const mongoose = require('mongoose');

const resetInfoSchema = new mongoose.Schema({
    createdAt: { type: Date },
    businessEmail: { type: String, required: false },
    secretCode: { type: String, required: false }
});

const ResetInfo = mongoose.model('ResetInfo', resetInfoSchema);
module.exports.ResetInfo = ResetInfo;