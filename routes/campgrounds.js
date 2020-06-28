const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const Review = require("../models/review");
const middleware = require("../middleware");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_KEY });
const multer = require('multer');
const storage = multer.diskStorage({
  filename: (req, file, callback) =>{
    callback(null, Date.now() + file.originalname);
  }
});
let imageFilter = (req, file, cb) =>{
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({ storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');
const campground = require("../models/campground");
cloudinary.config({ 
  cloud_name: 'mdphaneuf', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//Index
router.get("/", (req, res) =>{
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, (err, campgrounds) =>{
            if(err || !campgrounds){
                console.log(err);
                req.flash("error", "Something went wrong");
                res.redirect("back");
            } else{
                if(campgrounds.length === 0){
                    req.flash("error", "No campgrounds match your search");
                    return res.redirect("back");
                }
                res.render("campgrounds/index", {campgrounds: campgrounds, page: "campgrounds"});
            }
        });
    } else{
        Campground.find({}, (err, campgrounds) =>{
            if(err || !campgrounds){
                console.log(err);
                req.flash("error", "Something went wrong");
                res.redirect("back");
            } else{
                res.render("campgrounds/index", {campgrounds: campgrounds, page: "campgrounds"});
            }
        });
    }
});

//Create
router.post("/", middleware.isLoggedIn, upload.single('image'), (req, res) =>{
    const name = req.body.name;
    const price = req.body.price;
    const desc = req.body.description;
    const location = req.body.location;
    const author = {
        id: req.user._id,
        username: req.user.username
    };
    geocodingClient.forwardGeocode({
        query: location,
        limit: 1
      })
        .send()
        .then(response => {
            const match = response.body;
            let lng = match.features[0].center[0];
            let lat = match.features[0].center[1];
            cloudinary.v2.uploader.upload(req.file.path, (err, result) =>{
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                  }
                const image = result.secure_url;
                const imageId = result.public_id;
                let newCampground = {name: name, price: price, image: image, imageId: imageId, description: desc, location: location, 
                     lat: lat, lng: lng, author: author};
                Campground.create(newCampground, (err, newCamp) =>{
                    if(err){
                        req.flash("error", "Something went wrong");
                        res.redirect("back");
                    } else{
                        req.flash("success", "Campground added successfully!");
                        res.redirect("/campgrounds");
                    }
                });
            });
        }, error =>{
            if(error){
                req.flash("error", "Location not found, please try again");
                res.redirect("back");
            }
        });
});

//New
router.get("/new", middleware.isLoggedIn, (req, res) =>{
    res.render("campgrounds/new");
});

//Show
router.get("/:id", (req, res) =>{
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec((err, foundCamp) =>{
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
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), (req, res) =>{
    delete req.body.campground.rating;
    Campground.findById(req.params.id, async (err, campground) =>{
        if(err){
            req.flash("error", err.message);
            res.redirect("/campgrounds");
        } else{
            if(req.file){
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch (err) {
                    req.flash("error", err.message);
                    return res.redirect("/campgrounds");
                }

            }
            const location = req.body.location;
            await geocodingClient.forwardGeocode({
                query: location,
                limit: 1
              })
                .send()
                .then(response => {
                    const match = response.body;
                    let lng = match.features[0].center[0];
                    let lat = match.features[0].center[1];
                    campground.name = req.body.name;
                    campground.price = req.body.price;
                    campground.description = req.body.description;
                    campground.location = location;
                    campground.lng = lng;
                    campground.lat = lat;
                    campground.save();
                }, error =>{
                    if(error){
                        req.flash("error", "Location not found, please try again");
                        res.redirect("back");
                    }
                });
                req.flash("success", "Successfully updated campground");
                res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//Destroy
router.delete("/:id", middleware.checkCampgroundOwnership, async(req, res) => {
    try {
      let foundCampground = await Campground.findById(req.params.id);
      await cloudinary.v2.uploader.destroy(foundCampground.imageId);
      await foundCampground.remove();
      req.flash("success", "Campground removed successfully");
      res.redirect("/campgrounds");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/campgrounds");
    }
  });

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;