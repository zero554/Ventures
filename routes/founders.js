const express = require("express");
const router = express.Router();
const { Founder, validateFounder } = require("../models/founder");
const { Business, validateBusiness } = require("../models/business");
const _ = require("lodash");
// const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
  const { error } = validateFounder(req.body);

  if (error) return res.status(404).send(error.details[0].message);
  let founder = await Founder.findOne({ email: req.body.email });
  if (founder) return res.status(400).send("Founder is already registered.");

  founder = new Founder(
    _.pick(req.body, [
      "firstName",
      "lastName",
      "role",
      "aboutFounder",
      "email",
      "linkedIn",
      "facebook",
      "instagram",
      "twitter",
    ])
  );

  await founder.save();
  res.send(_.pick(req.body, ["firstName", "lastName", "email"]));
});

module.exports = router;
