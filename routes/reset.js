const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Business, validateBusiness } = require('../models/business');
const { ResetInfo } = require('../models/reset');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

var businessEmail;
var secretCode;
let resetInfo;

router.post('/', async (req, res) => {
    try {
        const email = req.body.businessEmail;
        const business = await Business
            .find({ businessEmail: email });

        if (business.length != 0) {
            // console.log(business);
            businessEmail = email;


            var x = Math.floor(Math.random() * (99999999 - 10000000)) + 10000000;
            secretCode = x;
            resetInfo = new ResetInfo(_.pick(req.body, ['businessEmail']));
            resetInfo.createdAt = new Date();
            resetInfo.secretCode = x;
            await resetInfo.save();

            var transporter = nodemailer.createTransport({
                host: 'venturesonline.co.za',
                port: 465,
                secure: true,
                auth: {
                    user: 'Start@venturesonline.co.za',
                    pass: 'Venturesonline2020!'
                },
                tls: { rejectUnauthorized: false }
            });
            var message = "<p style='font-weight:bold;font-size:20px;'> Hi.</p> <p style='font-size:16px;'>You are being sent this email because you have requested a password reset.Please ignore this email if you did not request a password change.</p> <p style='font-size:16px;'>Here is Protected code: </p><p style='font-size:22px;color:blue'>"
            message = message + x;
            var part = "</p><p style='font-size:16px;'>This code will expire in 24 hours</p ><p style='font-size:16px;'>From:</p><p style='font-size:18px;'>Ventures Online Team </p>";
            message = message + part;
            var mailOptions = {
                from: 'Startventuresonline.co.za',
                to: email,
                subject: 'Password Reset request',
                html: message
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.send(error);
                } else {
                    res.send('Email sent: ' + info.response);
                }
            });
        } else {
            res.status(400).send('Invalid email!');
        }
    } catch (error) {
        res.status(404).send(error);
    }
});

router.put('/', async (req, res) => {
    var resetInfo = await ResetInfo
        .find({ secretCode: req.body.secretCode });

    if (resetInfo.length != 0) {

        if (req.body.newPassword === req.body.confirmPassword) {
            const salt = await bcrypt.genSalt(10);
            businessPassword = await bcrypt.hash(req.body.newPassword, salt);

            var business = await Business
                .find({ businessEmail: resetInfo[0].businessEmail });

            // console.log(businessPassword);

            business[0].password = businessPassword;
            await business[0].save();

            res.send("Password updated.");

        }
        else {
            res.status(400).send("Passwords do not match.");
        }
    }
    else { res.status(400).send("Secret code has expired"); }
});

module.exports = router;