const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");

//Index
router.get("/", (req, res) =>{
    Campground.find({}, (err, campgrounds) =>{
        if(err || !campgrounds){
            console.log(err);
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else{
            res.render("campgrounds/index", {campgrounds: campgrounds});
        }
    });
});

//Create
router.post("/", middleware.isLoggedIn, (req, res) =>{
    const name = req.body.name;
    const price = req.body.price;
    const image = req.body.image;
    const desc = req.body.description;
    const author = {
        id: req.user._id,
        username: req.user.username
    };
    const newCampground = {name: name, price: price, image: image, description: desc, author: author};
    Campground.create(newCampground, (err, newCamp) =>{
        if(err){
            console.log(err);
        } else{
            res.redirect("/campgrounds");
        }
    });
});

//New
router.get("/new", middleware.isLoggedIn, (req, res) =>{
    res.render("campgrounds/new");
});

//Show
router.get("/:id", (req, res) =>{
    Campground.findById(req.params.id).populate("comments").exec((err, foundCamp) =>{
        if(err || !foundCamp){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else{
            res.render("campgrounds/show", {campground: foundCamp});
        }
    });
});

//Edit
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findById(req.params.id, (err, foundCamp) =>{
        res.render("campgrounds/edit", {campground: foundCamp});
    });
});

//Update
router.put("/:id", middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCamp) =>{
        if(err){
            res.redirect("/campgrounds");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//Destroy
router.delete("/:id", middleware.checkCampgroundOwnership, async(req, res) => {
    try {
      let foundCampground = await Campground.findById(req.params.id);
      await foundCampground.remove();
      res.redirect("/campgrounds");
    } catch (error) {
      console.log(error.message);
      res.redirect("/campgrounds");
    }
  });


module.exports = router;