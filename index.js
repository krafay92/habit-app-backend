require('./auth_by_google');
const connectToMongo = require('./db');
const cors = require('cors');
connectToMongo();

const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

const moment = require('moment');
const Habit = require('./models/Habit');
const passport = require('passport');
const expressSession = require('express-session');
require('dotenv').config();
const path = require('path');

const timeInSec = moment().endOf('day').valueOf();
const Interval = timeInSec - Date.now();

const updateDataMidnight = async () => {
    try {
        await Habit.updateMany({ done: false }, {
            $set: {
                streak: 0
            }
        });

        await Habit.updateMany({ done: true }, {
            $set: {
                done: false
            }
        });

    } catch (error) {
        console.log(error);
    }

}

const updateWeekData = async () => {
    try {
        console.log("week")
        await Habit.updateMany({}, {
            $set: {
                weeklyRecord: []
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

setInterval(async () => {

    if ((new Date()).getDay() === 0) {
        updateWeekData();
    }
    updateDataMidnight();

}, Interval);

app.use(expressSession({
    secret: process.env.COOKIE_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        secure: true,
        samSite: "none"
    }
}));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habit', require('./routes/habit'));
app.use(express.static(path.join(__dirname, '/build')));
app.get('*', (req, res) => {
    res.send(path.join(__dirname, '/build/index.html'))
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
