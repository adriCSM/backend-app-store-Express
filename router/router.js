const express = require('express');
const router = express.Router();
const handler = require('../controller/product');
const auth = require('../controller/auth.js');
const verifyAccessToken = require('../middleware/verifyAccesToken');
/**GET REGISTRASI, LOGIN, REFRESHT TOKEN, LOGOUT, SENDEMAIL */
router.post('/auth/registrasi', auth.register);
router.post('/auth/login', auth.login);
router.get('/token', auth.refreshAccessToken);
router.delete('/logout', auth.logOut);
router.post('/email', auth.sendEmail);
router.post('/wa/costumer', auth.sendWaCostumer);
router.post('/wa/admin', auth.sendWaAdmin);

/**GET DATA */
router.get('/data', verifyAccessToken, handler.getProduct);
/**TAMBAH PRODUCT */
router.post('/data/product', verifyAccessToken, handler.addProduct);
/**TAMBAH PESANAN */
router.post('/data/pesanan', verifyAccessToken, handler.addPesanan);

module.exports = router;
