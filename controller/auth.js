const bcrypt = require('bcrypt');
const user = require('../model/user.js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

module.exports = class {
    // REGISTER
    static async register(req, res) {
        const { firstName, lastName, phoneNumber, email, password, confirmPassword } = req.body;
        if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword) {
            res.status(400).json({ message: 'Terdapat kolom kosong' });
        } else if (password !== confirmPassword) {
            res.status(400).json({ message: 'Password dan confirm password tidak sesuai' });
        } else {
            const cekAkun = await user.findOne({ email });
            if (!cekAkun) {
                const fullName = firstName + ' ' + lastName;
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(password, salt);

                await user
                    .insertMany({
                        fullName,
                        firstName,
                        lastName,
                        phoneNumber,
                        email,
                        password: hashPassword,
                    })
                    .then(() => {
                        res.status(201).json({ message: 'Akun berhasil dibuat' });
                    })
                    .catch((err) => {
                        res.status(500).json({ message: err.message });
                    });
            } else {
                res.status(404).json({ message: 'Email sudah terdaftar' });
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
                const { fullName, phoneNumber, email } = cekAkun;
                const accessToken = jwt.sign({ fullName, phoneNumber, email }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '20s',
                });
                const refreshToken = jwt.sign({ fullName, phoneNumber, email }, process.env.REFRESH_TOKEN_SECRET, {
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
//                         httpOnly: true,
                        maxAge: 24 * 60 * 60 * 1000,
//                         secure: true,
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
            await user
                .findOne({ refreshToken })
                .then(() => {
                    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                        if (err) res.sendStatus(403);
                        else {
                            const { fullName, phoneNumber, email } = decoded;
                            const newAccessToken = jwt.sign({ fullName, phoneNumber, email }, process.env.ACCESS_TOKEN_SECRET, {
                                expiresIn: '30s',
                            });
                            res.status(200).json({ accessToken: newAccessToken });
                        }
                    });
                })
                .catch(() => {
                    res.sendStatus(403);
                });
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
        if (cek) {
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
                res.status(200).json({ message: 'Periksa email anda untuk memperbarui sandi' });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        } else {
            res.status(404).json({ message: 'Email belum terdaftar' });
        }
    }
};
