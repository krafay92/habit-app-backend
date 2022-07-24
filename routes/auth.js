const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchuser');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = "user@Token";

//Route 1 : Creating an endpoint and validating user data to create a new user in DB with express-validator
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters long').isLength({ min: 5 }),
],
    async (req, res) => {

        //Checking whether request is normal
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        //Checking for user with same email exist already
        try {

            let user = await User.findOne({ email: req.body.email });

            if (user) {
                return res.status(400).json({ error: "User with this email already exist" });
            }

            const salt = await bcryptjs.genSalt(10);
            const secPass = await bcryptjs.hash(req.body.password, salt);

            user = await User.create({
                name: req.body.name,
                email: req.body.email,
                password: secPass
            });

            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, JWT_SECRET);

            res.json({ Message: "Successfully SignUp", token });

        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }

    })

//Route 2 : Creating an endpoint to authenticate user with login credentials

router.post('/login', [
    body('email', "Enter a valid email address").isEmail(),
    body('password', "Password can't be blank").exists()
], async (req, res) => {

    //Checking for errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    let { email, password } = req.body;

    //Checking whether User input data is present already in DB
    try {

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send("Please provide correct credentials");
        }

        let passMatch = await bcryptjs.compare(password, user.password);

        if (!passMatch) {
            return res.status(400).send("Please provide correct credentials");
        }

        const data = {
            user: {
                id: user.id
            }
        }
        //If everything is fine then we will generate the token and send it as a response

        const token = jwt.sign(data, JWT_SECRET);

        res.json(token);

    }
    catch (error) {
        res.status(500).send("Internal Server Error");
    }

})

//Route 3 : Creating an endpoint to get loggedin user detail
router.post('/getuser', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

// Router 4 : Login with Google Federated Login
router.post('/loginwithgoogle', async (req, res) => {

    let { id, email, name, client_id, emailVerified } = req.body;

    try {

        // Checking if user already logged in before using Google
        let user = await User.findOne({ email });

        // If user had logged in before then we just send the token
        if (user) {
            const data = {
                user: {
                    id: user.id
                }
            }

            const token = jwt.sign(data, JWT_SECRET);
            res.json(token);
        }

        // If user had not then we will insert info about user that help to login in future
        else {

            // Checking user logging in with our Google console app or from some where else
            if (client_id === process.env.HABIT_TRACKER_GOOGLE_CLIENT_ID) {

                // After creating user we will generate token
                user = await User.create({
                    name: name,
                    email: email,
                    userIdByGoogle: id,
                    emailVerifiedByGoogle: emailVerified
                });

                const data = {
                    user: {
                        id: user.id
                    }
                }

                const token = jwt.sign(data, JWT_SECRET);

                res.json(token);

            }
            else {
                res.status(401).send("Unauthorized");
            }
        }


    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
})



module.exports = router