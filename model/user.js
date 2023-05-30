const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kendari');
const user = mongoose.model(
    'User',
    new mongoose.Schema({
        picture: { type: String, default: 'https://img.icons8.com/ios-filled/50/000000/user-male-circle.png' },
        fullName: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        gender: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        refreshToken: { type: String },
        createdAt: {
            type: String,
            default: moment().format('dddd, YYYY-MM-DD HH:mm:ss'),
        },
        updatedAt: {
            type: String,
            default: moment().format('dddd, YYYY-MM-DD HH:mm:ss'),
        },
    }),
);

module.exports = user;
