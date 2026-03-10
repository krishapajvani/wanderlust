// 1. Dependencies & Environment
const dns = require("node:dns/promises");
dns.setServers(["8.8.8.8", "8.8.4.4"]); 

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
        family: 4, 
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
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600, 
});

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

// 6. Passport Authentication
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

// ==========================================
// 8. MAIN ROUTE MOUNTING (THE FIX)
// ==========================================

// STEP 1: Mount User Routes (Signup/Login/Logout)
// These routes are usually defined as router.get("/signup", ...) in userRouter.
// Since we use "/", the final path is http://localhost:8080/signup
app.use("/", userRouter); 

// STEP 2: Mount Listing Routes
// These routes are usually defined as router.get("/new", ...) in listingRouter.
// Since we use "/listings", the final path is http://localhost:8080/listings/new
app.use("/listings", listingRouter);

// STEP 3: Mount Reviews (Nested)
app.use("/listings/:id/reviews", reviewRouter);

// STEP 4: Mount Bookings
app.use("/listings/:id/bookings", bookingRouter);
app.use("/bookings", bookingRouter);

// ==========================================

// 9. Error Handling
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message, err });
});

// 10. Server Initialization
const port = 8080;
app.listen(port, () => {
    console.log(`🚀 Staycation Server running at http://localhost:${port}`);
});
