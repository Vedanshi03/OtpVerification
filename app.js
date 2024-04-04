const nodemailer = require('nodemailer');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const exphbs=require('express-handlebars');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine('handlebars',exphbs.engine({ extname: "hbs", defaultLayout: false, layoutsDir: "views/ "}));
app.set('view engine','handlebars');

const emailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    }
});

const Email = mongoose.model('Email', emailSchema);

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

app.get('/send', (req, res)=> {
    res.render('contact');
})
app.get('/verify', (req,res)=> {
    res.render('otp');
})
const generateOTP = () => {
    return Math.floor(1000+Math.random()*8999).toString(); 
}
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'guptavedanshi56@gmail.com',
        pass: "qyez kbwe wdan iuja"
    }
})

const sendMail =async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send("Email address is required");
    }
    const Otp = generateOTP();
    const mail = {
        to: email,
        from: "guptavedanshi56@gmail.com",
        subject: "OTP",
        text: `Your otp is: ${Otp}`
    }
    transporter.sendMail(mail, async function (err, info) {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to send email");
        } else {
            console.log('Email sent Successfully!!');
            try {
                await Email.create({ email, otp: Otp });
                return res.status(200).send("Email sent successfully");
            } catch (error) {
                console.error(error);
                return res.status(500).send("Failed to save email and OTP to database");
            }
        }
    });
};
app.post('/send', sendMail);
app.post('/verify', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).send("Email and OTP are required");
    } try {
        const storedEmail = await Email.findOne({ email, otp });
        if (storedEmail) {
            return res.status(200).send("OTP verified successfully");
        } else {
            return res.status(400).send("Invalid email or OTP");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});
const port = 3000;
app.listen(port, ()=> {
    console.log(`server started at ${port}`)
});
