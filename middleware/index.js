const Campground = require("../models/campground");
const Comment = require("../models/comment");
//middleware
let middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCamp) =>{
            if(err || !foundCamp){
                req.flash("error", "Campground not found");
                res.redirect("/campgrounds");
            } else{
                if(foundCamp.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else{
        req.flash("error", "You need to be logged in to do that")
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundCom) =>{
            if(err || !foundCom){
                req.flash("error", "Comment not found")
                res.redirect("back");
            } else{
                if(foundCom.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = (req, res, next) =>{
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}



module.exports = middlewareObj;