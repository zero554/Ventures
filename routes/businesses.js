const express = require("express");
const router = express.Router();
const { Business, validateBusiness } = require("../models/business");
const { Founder, validateFounder } = require("../models/founder");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const Joi = require("joi");
const queryHandler = require("../chats/utils");
const multer = require("multer");
const mongoose = require("mongoose");

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|png|JPG|PNG|JPEG|jpeg|pdf|PDF|MP4|mp4|)$/)) return callback(new Error('File format incorrect'));
    callback(undefined, true);
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send("Business with the given ID does not exist");

  const business = await Business
    .findById(req.params.ID);

  res.status(200).send(business);
});

router.get("/profile", auth, async (req, res) => {
  const business = await Business.find({ _id: req.business._id }).select(
    "-password"
  );

  res.send(business);
});

router.get("/image", auth, async (req, res) => {
  const business = await Business.findOne({ _id: req.business._id });

  res.set("Content-Type", "image/jpg");
  res.send(business.avatarUrl);
});

router.get("/founders", auth, async (req, res) => {
  const business = await Business.findById(req.business._id);

  res.send(business.businessFounders);
});

router.get("/allbusinesses/:value/:page", auth, async (req, res) => {
      try {
    var filters = ["age", "industry", "rating"];
    var value=req.params.value;
    var businesses='';
    if (value==='all'){

         businesses = await Business.find({ _id: { $ne: req.business._id } })
    .limit(10)
    .skip(10 * req.params.page);

     res.status(200).send(businesses);
   }
   if(filters.includes(value)){

      switch(value){
         case 'industry':
              businesses = await Business.find({_id: { $ne: req.business._id }}).sort({ businessIndustry: 1 });
               res.status(200).send(businesses);
         case 'rating':
               businesses = await Business.find({_id: { $ne: req.business._id }}).sort({ rating: -1 });
               res.status(200).send(businesses);
         case 'age':
              businesses = await Business.find({_id: { $ne: req.business._id }}).sort({ yearFound: -1 });
              res.status(200).send(businesses);
         default:
              res.status(404).send('error')


      }
   }
  try {
          business = await Business.find({ businessName:new RegExp(value,'i')})
      .select("-password")
      .limit(10)
      .skip(10 * req.params.page);
    if (!business)
       res
        .status(400)
        .send([]);

    res.status(200).send(business);
  } catch (exception) {
     res.status(404).send("error");
  }
}
 catch(e){
    res.status(404)
 }
});


router.get("/currentWeek", auth, async (req, res) => {
  const business = await Business.find({ _id: req.business._id })
    .select(["businessName", "week"])
    .select("-_id");

  res.send(business);
});
router.get('/industry', async (req, res) => {
  const businesses = await Business
    .find()
    .sort({ businessIndustry: 1 });

  res.status(200).send(businesses);
});

router.get('/rating', async (req, res) => {
  const businesses = await Business
    .find()
    .sort({ rating: -1 });

  res.status(200).send(businesses);
});

router.get('/age', async (req, res) => {
  const businesses = await Business
    .find()
    .sort({ age: 1 });

  res.status(200).send(businesses);
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
  business.week = 1;
  business.rating = 0;
  business.numRatings = 0;
  business.weeks = [];
  business.uploads = [];
  business.avatarUrl = fileObj.url;
  await business.save();

  // Ronewa wanted the token to be sent back as the response here.
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

router.post(
  "/upload",
  auth,
  async (req, res) => {
    var business = await Business.findById(req.business._id);

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

    business.avatarUrl = fileObj.url;

    await business.save();

    res.send("File " + req.file.originalname + " uploaded");
  },
  (err, req, res, next) => res.status(404).send({ error: err.message })
);

router.post('/files/upload', auth, upload.single('upload'), async (req, res) => {
  var business = await Business
    .findById(req.business._id);

  let file = req.file.buffer;
  await Business
    .updateOne({ _id: req.business._id }, { uploads: file });

  await business.save();

  res.send('File ' + req.file.originalname + ' uploaded');

}, (err, req, res, next) => res.status(404).send({ error: err.message }));


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

router.put('/updateWeeks', auth, async (req, res) => {
  let object = _.pick(req.body, ['week', 'video', 'task', 'download']);
  await Business
    .updateOne({ _id: req.business._id }, { $push: { weeks: object } });

  res.send("Update complete!");

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
