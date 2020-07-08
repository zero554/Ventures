const express = require('express');
const router = express.Router();
const { Admin, validateAdmin } = require('../models/admin');
const _ = require('lodash');
const bcrypt = require('bcrypt');


router.get('/', async (req, res) => {
    const admins = await Admin
        .find()
        .sort({ firstName: 1 });

    res.send(admins);
});

router.post('/', async (req, res) => {
    const { error } = validateAdmin(req.body);

    if (error) return res.status(404).send(error.details[0].message);
    let admin = await Admin.findOne({ email: req.body.email });
    if (admin) return res.status(400).send('Admin already registered.')

    admin = new Admin(_.pick(req.body, ['firstName', 'lastName', 'email', 'password']));

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);

    await admin.save();

    res.send(_.pick(req.body, ['firstName', 'lastName', 'email']));
});

router.put('/:id', (req, res) => {

});

router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Admin with the given ID does not exist');
    const admins = await Admin.findByIdAndRemove(req.params.id);

    if (!admins) return res.status(404).send('Admin with the given ID does not exist.');
    else { return res.send('Admin deleted'); }
});

module.exports = router
