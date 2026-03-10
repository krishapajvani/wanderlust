// 1. Dependencies & Environment
const dns = require("node:dns/promises");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Fix for MongoDB Atlas connection issues

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Models & Utils
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

// Route Imports
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

const dbUrl = process.env.ATLASDB_URL;

// 2. Database Connection

async function main() {
    await mongoose.connect(dbUrl, {
        family: 4, // Force IPv4 to prevent connection timeouts
        serverSelectionTimeoutMS: 5000
    });
}

main()
    .then(() => console.log("✅ CONNECTED TO DB SUCCESSFULLY"))
    .catch((err) => console.log("❌ DATABASE CONNECTION ERROR:", err.message));

// 3. Configuration & Template Engine
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 4. Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// 5. Session & Storage
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET 
    },
    touchAfter: 24 * 3600, 
});

store.on("error", (err) => console.log("ERROR in MONGO SESSION STORE", err));

const sessionOptions = {
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// 6. Passport Authentication (Order is critical)
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 7. Global Locals Middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null; 
    next();
});

// 8. Footer & Informational Routes
// Organized alphabetically for easier management
app.get("/aircover", (req, res) => res.render("footer/aircover.ejs"));
app.get("/aircover-for-hosts", (req, res) => res.render("footer/aircover-hosts.ejs"));
app.get("/anti-discrimination", (req, res) => res.render("footer/anti-discrimination.ejs"));
app.get("/cancellation-options", (req, res) => res.render("footer/cancellation-options.ejs"));
app.get("/careers", (req, res) => res.render("footer/careers.ejs"));
app.get("/community-forum", (req, res) => res.render("footer/community-forum.ejs"));
app.get("/disability-support", (req, res) => res.render("footer/disability-support.ejs"));
app.get("/gift-cards", (req, res) => res.render("footer/gift-cards.ejs"));
app.get("/help", (req, res) => res.render("footer/help.ejs"));
app.get("/hosting-resources", (req, res) => res.render("footer/hosting-resources.ejs"));
app.get("/hosting-responsibly", (req, res) => res.render("footer/hosting-responsibly.ejs"));
app.get("/investors", (req, res) => res.render("footer/investors.ejs"));
app.get("/new-features", (req, res) => res.render("footer/new-features.ejs"));
app.get("/newsroom", (req, res) => res.render("footer/newsroom.ejs"));
app.get("/privacy", (req, res) => res.render("footer/privacy.ejs"));
app.get("/terms", (req, res) => res.render("footer/terms.ejs"));

// 9. Main Application Routes

app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings/:id/bookings", bookingRouter); // For specific property bookings
app.use("/bookings", bookingRouter);              // For dashboard and general booking actions

// 10. Error Handling
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// 11. Server Initialization
const port = 8080;
app.listen(port, () => {
    console.log(`🚀 Staycation Server running at http://localhost:${port}`);
});
