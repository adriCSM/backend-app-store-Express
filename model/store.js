const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kendari');
const product = mongoose.model(
    'Store',
    new mongoose.Schema({
        products: {
            type: Array,
            default: [],
        },
        pesanan: {
            type: Array,
            default: [],
        },
        createdAt: {
            type: 'string',
            default: moment().format('dddd, YYYY-MM-DD HH:mm:ss'),
        },
        updatedAt: {
            type: 'string',
            default: '',
        },
    }),
);
module.exports = product;
