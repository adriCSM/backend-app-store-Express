require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'https://adricsm.github.io'); // Ubah URL ini sesuai dengan alamat frontend Anda
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', true); // Izinkan pengiriman cookie
    next();
});
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ credentials: true, origin: ['http://localhost:8080', 'https://adricsm.github.io', 'http://127.0.0.1:5500'] }));
mongoose
    .connect(process.env.URI)
    .then(() => {
        console.info('mongoDB connection successfully');
    })
    .catch((err) => {
        console.info(err.message);
    });
app.use(require('./router/router'));

app.listen(process.env.PORT, () => {
    console.info(`server running at port ${process.env.PORT}`);
});
