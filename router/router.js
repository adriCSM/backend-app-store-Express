const express = require('express');
const router = express.Router();
const handler = require('../controller/product');

/**GET DATA */
router.get('/data', handler.getProduct);
/**TAMBAH PRODUCT */
router.post('/data/product', handler.addProduct);
/**TAMBAH PESANAN */
router.post('/data/pesanan', handler.addPesanan);

module.exports = router;
