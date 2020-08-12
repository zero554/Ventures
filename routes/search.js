const express = require("express");
const router = express.Router();
const { Business, validateBusiness } = require("../models/business");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

router.get("/:value/:page", auth, async (req, res) => {
  if (!isNaN(req.params.value))
    return res
      .status(400)
      .send("No search results available for the provided search query");

  try {
    const business = await Business.find({
      $text: { $search: req.params.value },
    })
      .select("-password")
      .limit(10)
      .skip(10 * req.params.page);
    if (!business)
      return res
        .status(400)
        .send("No search results available for the provided search query");

    res.send(business);
  } catch (exception) {
    return res.send("error");
  }
});

module.exports = router;
