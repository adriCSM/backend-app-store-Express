const { nanoid } = require('nanoid');
const product = require('../model/store');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kendari');
module.exports = class {
    // GET PRODUCT
    static async getProduct(req, res) {
        let data = await product.findOne();
        if (!data) {
            data = await product.create({});
        }
        res.status(200).json({ data: data });
    }

    // TAMBAH PRODUCT
    static async addProduct(req, res) {
        const { productName, price, url } = req.body;
        let data = await product.findOne();

        if (!productName || !price || !url) {
            res.status(400).json({ message: 'Terdapat inputan kosong' });
            return;
        }

        if (!data) {
            data = await product.create({});
        }

        await product
            .findByIdAndUpdate(
                { _id: data._id },
                {
                    $push: { products: { productName, price, count: 0, image: url } },
                    updatedAt: moment().format('dddd, YYYY-MM-DD HH:mm:ss'),
                },
            )
            .then(() => {
                res.status(201).json({ message: 'Berhasil menambahkan product' });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
            });
    }

    // TAMBAH PESANAN
    static async addPesanan(req, res) {
        const { arrayProduct } = req.body;
        let data = await product.findOne();
        if (!arrayProduct) {
            res.status(400).json({ message: 'Terdapat inputan kosong' });
            return;
        }
        if (!data) {
            data = await product.create({});
        }

        await product
            .findByIdAndUpdate(
                { _id: data._id },
                {
                    $push: { pesanan: { product: arrayProduct, kode: nanoid(6).toUpperCase(), status: null } },
                    updatedAt: moment().format('dddd, YYYY-MM-DD HH:mm:ss'),
                },
            )
            .then(() => {
                res.status(201).json({ message: 'Berhasil menambahkan pesanan' });
            })
            .catch((err) => {
                res.status(400).json({ message: err.message });
            });
    }
};
