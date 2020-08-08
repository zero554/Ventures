const express = require("express");
const router = express.Router();
const { Business, validateBusiness } = require("../models/business");
const { Founder, validateFounder } = require("../models/founder");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const Joi = require("joi");
const queryHandler = require("../chats/utils");

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
  const { data } = req.body;
  const { error, value } = validateBusiness(JSON.parse(data));

  if (error) return res.status(404).send(error.details[0].message);
  let business = await Business.findOne({
    businessEmail: value.businessEmail,
  });
  if (business) return res.status(400).send("Business already registered.");

  let fileObj;
  if (req.file) {
    const [obj] = await Promise.all([
      queryHandler.uploadDoc({
        files: [
          {
            ...req.file,
            type: req.file.mimetype,
            originalName: req.file.originalname,
          },
        ],
      }),
    ]);

    fileObj = obj;
  }

  business = new Business(
    _.pick(value, [
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
  business.week = "1";
  business.avatarUrl = fileObj.url;
  await business.save();

  const token = business.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(
      _.pick(value, [
        "businessName",
        "businessDescription",
        "businessEmail",
        "avartarUrl",
      ])
    );
});

router.put("/", auth, async (req, res) => {
  const { error, value } = validateFounder(JSON.parse(req.body.data));

  if (error) return res.status(404).send(error.details[0].message);
  let founder = await Founder.findOne({ email: value.email });
  if (founder) return res.status(400).send("Founder is already registered.");

  let fileObj;
  if (req.file) {
    const [obj] = await Promise.all([
      queryHandler.uploadDoc({
        files: [
          {
            ...req.file,
            type: req.file.mimetype,
            originalName: req.file.originalname,
          },
        ],
      }),
    ]);

    fileObj = obj;
  }

  founder = new Founder(
    _.pick(value, [
      "firstName",
      "lastName",
      "role",
      "aboutFounder",
      "email",
      "linkedIn",
      "facebook",
      "instagram",
      "twitter",
      "avartarUrl",
    ])
  );

  founder.avatarUrl = fileObj.url;

  await Business.updateOne(
    { _id: req.business._id },
    { $push: { businessFounders: founder } }
  );

  await founder.save();

  res.send(_.pick(value, ["firstName", "lastName", "email", "avartarUrl"]));
});

router.put("/rate", auth, async (req, res) => {
  const { error } = Joi.validate(req.body, {
    businessName: Joi.string().min(1),
    rating: Joi.string().min(1),
  });

  if (error) return res.status(404).send(error.details[0].message);

  try {
    let business = await Business.findOne({
      businessName: req.body.businessName,
    });

    const value = business.rating;

    var averageOld = parseFloat(value);
    const size = business.numRatings + 1;

    await Business.updateOne(
      { businessName: req.body.businessName },
      { numRatings: size }
    );

    const averageNew =
      averageOld + (parseInt(req.body.rating) - averageOld) / size;

    await Business.updateOne(
      { businessName: req.body.businessName },
      { rating: averageNew }
    );

    res.json({ rating: averageNew });
  } catch (error) {
    res.send("There is no businesses with that business name");
  }
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
