const express = require('express');
const router = express.Router();
const handler = require('../controller/product');
const auth = require('../controller/auth.js');
const verifyAccessToken = require('../middleware/verifyAccesToken');
/**GET REGISTRASI & LOGIN */
router.post('/auth/registrasi', auth.register);
router.post('/auth/login', auth.login);
router.get('/token', auth.refreshAccessToken);
router.delete('/logout', auth.logOut);
/**GET DATA */
router.get('/data', verifyAccessToken, handler.getProduct);
/**TAMBAH PRODUCT */
router.post('/data/product', verifyAccessToken, handler.addProduct);
/**TAMBAH PESANAN */
router.post('/data/pesanan', verifyAccessToken, handler.addPesanan);

module.exports = router;
