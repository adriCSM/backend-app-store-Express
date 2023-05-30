const bcrypt = require('bcrypt');
const user = require('../model/user.js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const client = new Client({
    authStrategy: new LocalAuth(),
    executablePath: '/path/to/chromium-binary',
});
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Client is ready!');
});
client.initialize();
module.exports = class {
    // REGISTER
    static async register(req, res) {
        const { firstName, lastName, phoneNumber, email, password, confirmPassword, gender } = req.body;
        const number = '62' + phoneNumber.slice(1) + '@c.us';
        const cekNumber = await client.isRegisteredUser(number);
        if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword || !gender) {
            res.status(400).json({ message: 'Terdapat kolom kosong' });
        } else if (!cekNumber) {
            res.status(400).json({ message: 'Nomor tidak terdaftar pada WhatsApp. Gunakan nomor lain' });
        } else if (password !== confirmPassword) {
            res.status(400).json({ message: 'Password dan confirm password tidak sesuai' });
        } else {
            const cekAkun = await user.findOne({ email });
            if (!cekAkun) {
                const fullName = firstName + ' ' + lastName;
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(password, salt);
                if (gender == 'Wanita') {
                    await user
                        .insertMany({
                            fullName,
                            firstName,
                            lastName,
                            phoneNumber,
                            email,
                            password: hashPassword,
                            gender,
                            picture: 'https://img.icons8.com/ios-filled/50/000000/user-female-circle.png',
                        })
                        .then(() => {
                            res.status(201).json({ message: 'Akun berhasil dibuat' });
                        })
                        .catch((err) => {
                            res.status(500).json({ message: err.message });
                        });
                } else {
                    await user
                        .insertMany({
                            fullName,
                            firstName,
                            lastName,
                            phoneNumber,
                            email,
                            password: hashPassword,
                            gender,
                        })
                        .then(() => {
                            res.status(201).json({ message: 'Akun berhasil dibuat' });
                        })
                        .catch((err) => {
                            res.status(500).json({ message: err.message });
                        });
                }
            } else {
                res.status(400).json({ message: 'Email sudah terdaftar' });
            }
        }
    }
    // LOGIN
    static async login(req, res) {
        const { email, password } = req.body;
        const cekAkun = await user.findOne({ email });
        if (!email || !password) res.status(400).json({ message: 'Field kosong' });
        else if (cekAkun) {
            const cekPassword = await bcrypt.compare(password, cekAkun.password);
            if (cekPassword) {
                const { fullName, phoneNumber, email, picture } = cekAkun;
                const accessToken = jwt.sign({ fullName, phoneNumber, email, picture }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '20s',
                });
                const refreshToken = jwt.sign({ fullName, phoneNumber, email, picture }, process.env.REFRESH_TOKEN_SECRET, {
                    expiresIn: '1d',
                });
                try {
                    await user.findOneAndUpdate(
                        { email },
                        {
                            refreshToken,
                        },
                    );
                    res.cookie('REFRESH_TOKEN', refreshToken, {
                        httpOnly: true,
                        maxAge: 24 * 60 * 60 * 1000,
                        secure: true,
                        sameSite: 'none',
                    });
                    res.status(200).json({ accessToken });
                } catch (err) {
                    res.status(500).json({ message: err.message });
                }
            } else {
                res.status(400).json({ message: 'Password salah' });
            }
        } else {
            res.status(400).json({ message: 'Email belum terdaftar' });
        }
    }

    // REFRESH ACCESS TOKEN
    static async refreshAccessToken(req, res) {
        const refreshToken = req.cookies.REFRESH_TOKEN;
        if (refreshToken) {
            const cekUser = await user.findOne({ refreshToken });
            if (cekUser) {
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                    if (err) res.sendStatus(403);
                    else {
                        const newAccessToken = jwt.sign({ decoded }, process.env.ACCESS_TOKEN_SECRET, {
                            expiresIn: '30s',
                        });
                        res.status(200).json({ accessToken: newAccessToken });
                    }
                });
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(401);
        }
    }
    // LOG OUT
    static async logOut(req, res) {
        const cookie = req.cookies.REFRESH_TOKEN;

        if (cookie) {
            const cekAkun = await user.findOne({ refreshToken: cookie });
            if (cekAkun) {
                await user
                    .findByIdAndUpdate(
                        { _id: cekAkun._id },
                        {
                            refreshToken: null,
                        },
                    )
                    .then(() => {
                        res.clearCookie('REFRESH_TOKEN');
                        res.sendStatus(200);
                    })
                    .catch((err) => {
                        res.status(500).json({ message: err.message });
                    });
            } else {
                res.sendStatus(204);
            }
        } else {
            res.sendStatus(204);
        }
    }
    // SEND MESSAGE ON EMAIL
    static async sendEmail(req, res) {
        const { email } = req.body;
        const cek = await user.findOne({ email });
        if (!email) res.status(400).json({ message: 'Field masih kosong' });
        else if (cek) {
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                requireTLS: true,
                Port: 465,
                secureConnection: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
                tls: {
                    rejectUnauthorized: true,
                },
            });

            try {
                const a = await transporter.sendMail({
                    from: 'AM Store <acsm.web291201@gmail.com>',
                    to: email,
                    subject: 'Change Password🔑',
                    attachments: [
                        {
                            filename: 'index.html',
                            content: '<h1>Click this link to change your password:</h1 ><a style="text-decoration:none;"  href="https://adricsm.github.io/store/">Change password</a>',
                            contentType: 'text/html',
                            contentDisposition: 'inline',
                        },
                    ],
                });
                res.status(200).json({ message: 'Link telah dikirim ke email anda, periksa kotak masuk atau spam' });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        } else {
            res.status(404).json({ message: 'Email tidak terdaftar' });
        }
    }

    // SEND WHATS APP
    static async sendWaCostumer(req, res) {
        const { no, name } = req.body;
        if (!no || !name) res.status(400).json({ message: 'Field kosong' });
        else {
            const number = '62' + no.slice(1) + '@c.us';
            const jam = new Date().getHours();
            let waktu;

            if (jam >= 6 && jam <= 10) waktu = 'pagi';
            if (jam <= 14) waktu = 'siang';
            if (jam <= 18) waktu = 'sore';
            if (jam <= 24 || jam <= 3) waktu = 'malam';
            else {
                waktu = 'subuh';
            }
            const pesan = `Assalamualikum, Selamat ${waktu}... \nHallo👋 ${name}... \nTerimakasih telah melakukan order. \nAgar paket anda di proses silakan kirim bukti pembayaran kepada pemilik product AM Store pada nomor dibawah👇. \nWhatsApp: 085256278587. \n\n\nTerimakasih.\nWeb AM Store: https://adricsm.github.io/store/. `;
            try {
                await client.sendMessage(number, pesan);
                res.status(200).json({ message: `Pesan kepada ${name} telah terkirim` });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        }
    }
    static async sendWaAdmin(req, res) {
        const { no, name } = req.body;
        if (!no || !name) res.status(400).json({ message: 'Field kosong' });
        else {
            const number = '62' + no.slice(1) + '@c.us';
            const pesan = `Hallo👋 ${name}... \nTerimakasih telah melakukan order. \nAgar paket anda di proses silakan chat pemilik product AM Store : 085256278587. \nWeb AM Store: https://adricsm.github.io/store/. \nTerimakasih`;
            try {
                await client.sendMessage(number, pesan);
                res.status(200).json({ message: `Pesan kepada ${name} telah terkirim` });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        }
    }
};
