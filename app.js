const express        = require("express"),
      app            = express(),
      bodyParser     = require("body-parser"),
      mongoose       = require("mongoose"),
      flash          = require("connect-flash"),
      passport       = require("passport"),
      LocalStrategy  = require("passport-local"),
      methodOverride = require("method-override"),
      Campground     = require("./models/campground"),
      Comment        = require("./models/comment"),
      User           = require("./models/user"),
      seedDB         = require("./seeds");

const commentRoutes    = require("./routes/comments"),
      campgroundRoutes = require("./routes/campgrounds"),
      indexRoutes      = require("./routes/index");

require('dotenv').config();
mongoose.connect("mongodb+srv://mdphaneuf:" + process.env.DB_PASS + "@cluster0-h6whz.mongodb.net/yelp_camp?retryWrites=true&w=majority", 
{ useUnifiedTopology: true, useNewUrlParser: true }).then(() =>{
  console.log("Connected to DB!");
}).catch(err =>{
  console.log("ERROR:", err.message);
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
      
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());


//seedDB(); //seed the database

app.use(require("express-session")({
    secret: "There are no shortcuts to any place worth going to!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);



var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});