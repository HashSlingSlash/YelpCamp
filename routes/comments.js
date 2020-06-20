const express = require("express");
const router = express.Router({mergeParams: true});
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//comments new
router.get("/new", middleware.isLoggedIn, (req, res) =>{
    Campground.findById(req.params.id, (err, campground) =>{
        if(err || !campground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else{
            res.render("comments/new", {campground: campground});
        }
    });
});

//comments create
router.post("/", middleware.isLoggedIn, (req, res) =>{
    Campground.findById(req.params.id, (err, campground) =>{
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else{
           Comment.create(req.body.comment, (err, comment) =>{
               if(err){
                   req.flash("error", "Something went wrong");
                   console.log(err);
               } else{
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.save();
                   campground.comments.push(comment);
                   campground.save();
                   req.flash("success", "Successfully added comment")
                   res.redirect("/campgrounds/" + campground._id);
               }
           }); 
        }
    });
});

//Edit
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) =>{
    Campground.findById(req.params.id, (err, foundCamp) =>{
        if(err || !foundCamp){
            req.flash("error", "No campground found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, foundCom) =>{
            if(err){
                res.redirect("back");
            } else{
                res.render("comments/edit", {camp_id: req.params.id, comment: foundCom});
            }
        });
    });
});

//Update
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) =>{
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, foundCom) =>{
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//Destroy
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) =>{
    Comment.findByIdAndRemove(req.params.comment_id, (err) =>{
        if(err){
            res.redirect("back");
        } else{
            req.flash("success", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


module.exports = router;