const express = require('express');
const router = express.Router();
const { Business, validateBusiness } = require('../models/business');
const { Founder, validateFounder } = require('../models/founder');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const auth = require("../middleware/auth");


router.get('/profile', auth, async (req, res) => {
    const business = await Business
        .find({ _id: req.business._id })
        .select('-password');

    res.send(business);
});

router.get('/founders', auth, async (req, res) => {
    const business = await Business
        .findById(req.business._id);

    res.send(business.businessFounders);

});

router.get('/allbusinesses', auth, async (req, res) => {
    const businesses = await Business
        .find({ _id: { $ne: req.business._id } });

    console.log(req.business._id);
    res.send(businesses);
});

router.post('/', async (req, res) => {
    const { error } = validateBusiness(req.body);

    if (error) return res.status(404).send(error.details[0].message);
    let business = await Business.findOne({ businessEmail: req.body.businessEmail });
    if (business) return res.status(400).send('Business already registered.')

    business = new Business(_.pick(req.body, ['businessName', 'businessDescription', 'problemSolved', 'aboutBusiness', 'businessTargetAudience', 'businessEmail', 'password', 'businessMission', 'businessVision']));

    const salt = await bcrypt.genSalt(10);
    business.password = await bcrypt.hash(business.password, salt);
    await business.save();

    const token = business.generateAuthToken();
    res.header("x-auth-token", token).send(_.pick(req.body, ['businessName', 'businessDescription', 'businessEmail']));
});

router.put('/', auth, async (req, res) => {

    const { error } = validateFounder(req.body);

    if (error) return res.status(404).send(error.details[0].message);
    let founder = await Founder.findOne({ email: req.body.email });
    if (founder) return res.status(400).send('Founder is already registered.')

    founder = new Founder(_.pick(req.body, ['firstName', 'lastName', 'role', 'aboutFounder', 'email', 'linkedIn', 'facebook', 'instagram', 'twitter']));

    await Business
        .updateOne({ _id: req.business._id }, { $push: { businessFounders: founder } });

    await founder.save();

    res.send(_.pick(req.body, ['firstName', 'lastName', 'email']));


});

router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Business with the given ID does not exist');
    const business = await Business.findByIdAndRemove(req.params.id);

    if (!business) return res.status(404).send('Business with the given ID does not exist.');
    else { return res.send('Business deleted'); }
});

module.exports = router;