const express = require("express");
const router = express.Router();
const { AllContents } = require('../models/content');
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const _ = require('lodash');

router.get('/', async (req, res) => {
    const allContent = await AllContents
        .find()
        .sort({ Week: 1 })
        .select('-_id');

    res.send(allContent);
});

router.get('/:value', async (req, res) => {
    const content = await AllContents
        .find({ Week: req.params.value })
        .select('-_id');

    res.send(content);
});

router.post('/', async (req, res) => {
    content = new AllContents(_.pick(req.body, ['Week', 'Notes', 'Task', 'Template',]));

    await content.save();
    res.send(_.pick(req.body, ['Week', 'Notes', 'Task']));
});

router.put('/', async (req, res) => {

});

module.exports = router;