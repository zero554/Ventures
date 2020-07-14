const express = require("express");
const router = express.Router();
const Content = require('../models/content');
const mongoose = require("mongoose");

router.get('/', async (req, res) => {
    const content = await Content
        .find()
        .sort({ Week: 1 })
});

module.exports = router;