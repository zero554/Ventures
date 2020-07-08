const express = require('express');
const router = express.Router();
const { Entrepreneur, validateEntrepreneur } = require('../models/entrepreneur');
const _ = require('lodash');
const bcrypt = require('bcrypt');


router.get('/', async (req, res) => {
    const entrepreneur = await Entrepreneur
        .find()
        .sort({ businessName: 1 });

    res.send(entrepreneur);
});

router.post('/', async (req, res) => {
    const { error } = validateEntrepreneur(req.body);

    if (error) return res.status(404).send(error.details[0].message);
    let entrepreneur = await Entrepreneur.findOne({ businessEmail: req.body.businessEmail });
    if (entrepreneur) return res.status(400).send('Entrepreneur already registered.')

    entrepreneur = new Entrepreneur(_.pick(req.body, ['businessName', 'aboutBusiness', 'businessEmail', 'password']));

    const salt = await bcrypt.genSalt(10);
    entrepreneur.password = await bcrypt.hash(entrepreneur.password, salt);

    await entrepreneur.save();

    res.send(_.pick(req.body, ['businessName', 'aboutBusiness', 'businessEmail']));
});

router.put('/:id', (req, res) => {

});

router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Entrepreneur with the given ID does not exist');
    const entrepreneur = await Entrepreneur.findByIdAndRemove(req.params.id);

    if (!entrepreneur) return res.status(404).send('Entrepreneur with the given ID does not exist.');
    else { return res.send('Entrepreneur deleted'); }
});

module.exports = router
