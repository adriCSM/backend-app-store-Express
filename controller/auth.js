const bcrypt = require('bcrypt');
const user = require('../model/user.js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { createHmac } = require('node:crypto');

module.exports = class {
    // REGISTER
    static async register(req, res) {
        const { firstName, lastName, phoneNumber, email, password, confirmPassword, gender } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword || !gender) {
            res.status(400).json({ message: 'Terdapat kolom kosong' });
        } else if (password !== confirmPassword) {
            res.status(400).json({ message: 'Password dan confirm password tidak sesuai' });
        } else {
            const number = '62' + phoneNumber.slice(1) + '@c.us';
            const cekNumber = await client.isRegisteredUser(number);
            const cekAkun = await user.findOne({ email });
            if (!cekNumber) {
                res.status(400).json({ message: 'Nomor tidak terdaftar pada WhatsApp. Gunakan nomor lain' });
            } else if (!cekAkun) {
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
                try {
                    const { fullName, phoneNumber, email, picture } = cekAkun;
                    const accessToken = jwt.sign({ fullName, phoneNumber, email, picture }, process.env.ACCESS_TOKEN_SECRET, {
                        expiresIn: '20s',
                    });
                    const refreshToken = jwt.sign({ fullName, phoneNumber, email, picture }, process.env.REFRESH_TOKEN_SECRET, {
                        expiresIn: '1d',
                    });
                    await user.findOneAndUpdate(
                        { email },
                        {
                            refreshToken,
                        },
                    );

                    const tandaTangan = createHmac('sha256', process.env.SECRET).update(refreshToken).digest('hex');

                    res.status(200).json({ accessToken, refreshToken: `${refreshToken}@_@${tandaTangan}` });
                } catch (err) {
                    res.status(500).json({ message: err.message });
                }
            } else {
                res.status(400).json({ message: 'Password salah' });
            }
        } else {
            res.status(400).json({ message: 'Email tidak terdaftar' });
        }
    }

    // REFRESH ACCESS TOKEN
    static async refreshAccessToken(req, res) {
        const authorization = req.headers.authorization;
        const token = authorization && authorization.split(' ')[1];

        if (token) {
            const [refreshToken, tandaTangan] = token.split('@_@');
            const hashTandaTangan = createHmac('sha256', process.env.SECRET).update(refreshToken).digest('hex');
            if (tandaTangan == hashTandaTangan) {
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
                res.status(401).json({ message: 'Secret key tidak valid' });
            }
        } else {
            res.sendStatus(401);
        }
    }
    // LOG OUT
    static async logOut(req, res) {
        const authorization = req.headers.authorization;
        const token = authorization && authorization.split(' ')[1];
        if (token) {
            const [refreshToken, tandaTangan] = token.split('@_@');
            const hashTandaTangan = createHmac('sha256', process.env.SECRET).update(refreshToken).digest('hex');
            if (tandaTangan == hashTandaTangan) {
                const cekAkun = await user.findOne({ refreshToken });
                if (cekAkun) {
                    await user
                        .findByIdAndUpdate(
                            { _id: cekAkun._id },
                            {
                                refreshToken: null,
                            },
                        )
                        .then(() => {
                            res.clearCookie('refreshToken');
                            res.sendStatus(200);
                        })
                        .catch((err) => {
                            res.status(500).json({ message: err.message });
                        });
                } else {
                    res.sendStatus(204);
                }
            } else {
                res.status(401).json({ message: 'Secret key tidak valid' });
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
};
