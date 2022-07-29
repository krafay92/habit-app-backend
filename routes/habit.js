const express = require("express");
const router = express.Router();
const Habit = require('../models/Habit');
const fetchUser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');

// Router 1 : fetch all habits of a respective user api/habit/fetchallhabits
router.get('/fetchallhabits', fetchUser, async (req, res) => {
    try {
        const habits = await Habit.find({ user: req.user.id });
        res.json(habits);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Router 2 : Add habits for a respective user api/habit/addhabit
router.post('/addhabit', fetchUser, [
    body('name', 'Enter a valid name').isLength({ min: 3 })
], async (req, res) => {

    //Checking whether request is normal
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { name, description } = req.body;

        const habit = new Habit({
            user: req.user.id, name, description
        })

        const saveHabit = await habit.save();
        res.json(saveHabit);

    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Router 3: Update a respective habit of a respective user api/habit/updatehabit
router.put('/updatehabit/:id', fetchUser, async (req, res) => {

    const { name, description } = req.body;
    try {
        const newHabit = {};

        if (name) {
            newHabit.name = name;
            newHabit.description = description;
        }

        // Chacking whether habit with this id exist or not
        let habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).send("Not Found");
        }

        //Checking whether habit belongs to logged in user 
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).send("Unauthorized Not Allowed");
        }

        //Finally Updating the habit
        habit = await Habit.findByIdAndUpdate(req.params.id, { $set: newHabit }, { new: true });
        res.json({ habit });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

//Router 4: Delete habit of a respective user api/habit/deletehabit
router.delete('/deletehabit/:id', fetchUser, async (req, res) => {

    try {
        // Chacking whether habit with this id exist or not
        let delHabit = await Habit.findById(req.params.id);
        if (!delHabit) {
            return res.status(404).send("Not Found");
        }

        //Checking whether habit belongs to logged in user 
        if (delHabit.user.toString() !== req.user.id) {
            return res.status(401).send("Unauthorized Not Allowed");
        }

        //Finally Deleting the habit
        delHabit = await Habit.findByIdAndDelete(req.params.id);
        res.json({ Success: "Deleted Successfully", habit: delHabit });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

// Route 5 : When Respective Habit Performed by user api/habit/donehabit

router.put('/doneHabit/:id', fetchUser, async (req, res) => {
    try {

        let habit = await Habit.findById(req.params.id);

        // Chacking whether habit with this id exist
        if (!habit) {
            return res.status(404).send("Not Found");
        }

        //Checking whether habit belongs to logged in user 
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).send("Unauthorized Not Allowed");
        }

        console.log(weeklyRecord)
        // if (weeklyRecord[weeklyRecord.length - 1] === (new Date()).getDay()) {
        //     habit = await Habit.findByIdAndUpdate(req.params.id, { $set: { done: true }, $inc: { streak: 1 } }, { new: true });
        //     res.json({ Success: "Done Successfully", habit: habit });
        // }
        // else {
            habit = await Habit.findByIdAndUpdate(req.params.id, { $set: { done: true }, $inc: { streak: 1 }, $push: { weeklyRecord: (new Date()).getDay() } }, { new: true });
            res.json({ Success: "Done Successfully", habit: habit });
        // }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }

})

module.exports = router;