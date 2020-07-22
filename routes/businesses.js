const express = require("express");
const router = express.Router();
const { Business, validateBusiness } = require("../models/business");
const { Founder, validateFounder } = require("../models/founder");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const Joi = require("joi");

router.get("/profile", auth, async (req, res) => {
  const business = await Business.find({ _id: req.business._id }).select(
    "-password"
  );

  res.send(business);
});

router.get("/founders", auth, async (req, res) => {
  const business = await Business.findById(req.business._id);

  res.send(business.businessFounders);
});

router.get("/allbusinesses", auth, async (req, res) => {
  const businesses = await Business.find({ _id: { $ne: req.business._id } });

  res.send(businesses);
});

router.get("/currentWeek", auth, async (req, res) => {
  const business = await Business.find({ _id: req.business._id })
    .select(["businessName", "week"])
    .select("-_id");

  res.send(business);
});

router.post("/", async (req, res) => {
  const { error } = validateBusiness(req.body);

  if (error) return res.status(404).send(error.details[0].message);
  let business = await Business.findOne({
    businessEmail: req.body.businessEmail,
  });
  if (business) return res.status(400).send("Business already registered.");

  business = new Business(
    _.pick(req.body, [
      "businessName",
      "businessIndustry",
      "yearFound",
      "businessDescription",
      "problemSolved",
      "aboutBusiness",
      "businessTargetAudience",
      "businessEmail",
      "password",
      "businessMission",
      "businessVision",
    ])
  );

  const salt = await bcrypt.genSalt(10);
  business.password = await bcrypt.hash(business.password, salt);
  business.week = "Week 1";
  await business.save();

  const token = business.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(
      _.pick(req.body, ["businessName", "businessDescription", "businessEmail"])
    );
});

router.put("/", auth, async (req, res) => {
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

  await Business.updateOne(
    { _id: req.business._id },
    { $push: { businessFounders: founder } }
  );

  await founder.save();

  res.send(_.pick(req.body, ["firstName", "lastName", "email"]));
});

router.put("/rate", auth, async (req, res) => {
  const { error } = Joi.validate(req.body, {
    businessName: Joi.string().min(1),
    rating: Joi.string().min(1),
  });

  if (error) return res.status(404).send(error.details[0].message);

  try {
    await Business.updateOne(
      { businessName: req.body.businessName },
      { rating: req.body.rating }
    );
  } catch (error) {
    res.send("There is no businesses with that business name");
  }

  res.send(_.pick(req.body, ["businessName", "rating"]));
});

router.put("/updateWeek", auth, async (req, res) => {
  const { error } = Joi.validate(req.body, {
    week: Joi.string().min(1),
  });

  if (error) return res.status(404).send(error.details[0].message);

  try {
    await Business.updateOne(
      { _id: req.business._id },
      { week: req.body.week }
    );
    res.send("Week updated");
  } catch (error) {
    res.send("There is no businesses with that business name");
  }
});

router.put("/update/:item", auth, async (req, res) => {
  result = false;

  const { error } = Joi.validate(req.body, {
    value: Joi.string().min(1),
  });

  if (error) return res.status(404).send(error.details[0].message);

  try {
    if (req.params.item === "aboutBusiness") {
      await Business.updateOne(
        { _id: req.business._id },
        { aboutBusiness: req.body.value }
      );
      result = true;
    } else if (req.params.item === "businessVision") {
      await Business.updateOne(
        { _id: req.business._id },
        { businessVision: req.body.value }
      );
      result = true;
    } else if (req.params.item === "businessMission") {
      await Business.updateOne(
        { _id: req.business._id },
        { businessMission: req.body.value }
      );
      result = true;
    } else if (req.params.item === "businessDescription") {
      await Business.updateOne(
        { _id: req.business._id },
        { businessDescription: req.body.value }
      );
      result = true;
    }
  } catch (error) {
    res.send("There is no businesses with that business name");
  }

  if (result) res.send(req.params.item + " updated");
  else res.status(404).send('Incorrect endpoint "item" => ' + req.params.item);
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send("Business with the given ID does not exist");
  const business = await Business.findByIdAndRemove(req.params.id);

  if (!business)
    return res.status(404).send("Business with the given ID does not exist.");
  else {
    return res.send("Business deleted");
  }
});

module.exports = router;
