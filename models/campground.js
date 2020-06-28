const mongoose = require("mongoose");
const Comment = require("./comment");

const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

campgroundSchema.pre("remove", async function(){
    try{
        await Comment.deleteMany({
            _id: {
                $in: this.comments
            }
        });
        await Review.deleteMany({
            _id: {
                $in: this.reviews
            }
        });
    } catch(err){
        if(err){
            req.flash("error", "Something went wrong");
            return res.redirect("back");
        }
    }
});

module.exports = mongoose.model("Campground", campgroundSchema);