const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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
    const newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if(req.body.adminKey === "secret"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) =>{
        if(err){
            if(err.code === 11000){
                return res.render("register", {"error": "A user with the given email already exists"});
            }
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, () =>{
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
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

//forgot password 
router.get("/forgot", (req, res) =>{
    res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("/");
            }
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("/");
            }
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
              if(err){
                  req.flash("error", "Something went wrong");
                  return res.redirect("/");
              }
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'yelpcamphelpteam@gmail.com',
            pass: process.env.GMAIL_PASS
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'yelpcamphelpteam@gmail.com',
          subject: 'YelpCamp Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("/");
            }
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      return res.redirect('/campgrounds');
    });
  });
  
  router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){
            req.flash("error", "Something went wrong");
            return res.redirect("/");
        }
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("/");
            }
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
                if(err){
                    req.flash("error", "Something went wrong");
                    return res.redirect("/");
                }
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
              user.save(function(err) {
                if(err){
                    req.flash("error", "Something went wrong");
                    return res.redirect("/");
                }
                req.logIn(user, function(err) {
                    if(err){
                        req.flash("error", "Something went wrong");
                        return res.redirect("/");
                    }
                  done(err, user);
                });
              });
            });
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'yelpcamphelpteam@gmail.com',
            pass: process.env.GMAIL_PASS
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'yelpcamphelpteam@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("/");
            }
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
        if(err){
            req.flash("error", "Something went wrong");
            return res.redirect("/");
        }
      res.redirect('/campgrounds');
    });
  });

//user profile
router.get("/user/:id", (req, res) =>{
    User.findById(req.params.id, (err, foundUser) =>{
        if(err){
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec((err, campgrounds) =>{
            if(err){
                req.flash("error", "Something went wrong");
                return res.redirect("back");
            }
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});  
        });
    });
});


module.exports = router;