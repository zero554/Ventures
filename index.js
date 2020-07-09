const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const config = require("config");


// Middleware
// app.use(cors());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Origin-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', 'PUT', 'POST', 'POST', 'DELETE', 'PATCH');
        return res.status(200).json({});
    }
});
// app.options('*', cors());

const businesses = require('./routes/businesses');
const founders = require('./routes/founders');
const auth = require('./routes/auth');
const search = require('./routes/search');

if (!config.get("jwtPrivateKey")) {
    console.error("FATAL ERROR: jwtprivatekey is not defined")
    process.exit(1);
}


mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

mongoose.connect('mongodb+srv://zolotov:XfWW3FpepYqQNKbL@blanktechproject01-ht8w9.mongodb.net/ventures?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...'));

app.use(express.json());
app.use('/businesses', businesses);
app.use('/founders', founders);
app.use('/auth', auth);
app.use('/search', search);



// PORT
const PORT = process.env.PORT;
app.listen(PORT);
