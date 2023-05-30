require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors({ credentials: true, origin: ['http://localhost:8080', 'https://adricsm.github.io', 'http://127.0.0.1:5500'] }));

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    cors({
        origin: ['http://localhost:8080', 'https://adricsm.github.io', 'http://127.0.0.1:5500'],
        credentials: true,
    }),
);
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
    console.info(`server running at http://localhost:${process.env.PORT}`);
});
