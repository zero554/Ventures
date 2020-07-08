const express = require('express');
const router = express.Router();
const { Investor, validateInvestor } = require('../models/investor');
const _ = require('lodash');
const bcrypt = require('bcrypt');


router.get('/', async (req, res) => {
    const investors = await Investor
        .find()
        .sort({ firstName: 1 });

    res.send(investors);
});

router.post('/', async (req, res) => {
    const { error } = validateInvestor(req.body);

    if (error) return res.status(404).send(error.details[0].message);
    let investor = await Investor.findOne({ email: req.body.email });
    if (investor) return res.status(400).send('Investor already registered.')

    investor = new Investor(_.pick(req.body, ['firstName', 'lastName', 'email', 'password']));

    const salt = await bcrypt.genSalt(10);
    investor.password = await bcrypt.hash(investor.password, salt);

    await investor.save();

    res.send(_.pick(req.body, ['firstName', 'lastName', 'email']));
});

router.put('/:id', (req, res) => {

});

router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Investor with the given ID does not exist');
    const investor = await Investor.findByIdAndRemove(req.params.id);

    if (!investor) return res.status(404).send('Investor with the given ID does not exist.');
    else { return res.send('Investor deleted'); }
});

module.exports = router
