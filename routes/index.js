const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

//root route
router.get("/", (req, res) =>{
    res.render("landing");
});

//show register form
router.get("/register", (req, res) =>{
    res.render("register", {page: "register"});
});

//handle sign up logic
router.post("/register", (req, res) =>{
    const newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) =>{
        if(err){
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, () =>{
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        })
    });
});

//login form
router.get("/login", (req, res) =>{
    res.render("login", {page: "login"});
});

//login logic
router.post("/login", 
passport.authenticate("local", 
{
    failureRedirect: "/login",
    failureFlash: true
}), (req, res) =>{
    req.flash("success", "Welcome back " + req.user.username);
    res.redirect("/campgrounds");
});

//logout
router.get("/logout", (req, res) =>{
    req.logOut();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});


module.exports = router;