const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js"); // Fixes "Listing is not defined"
const Booking = require("../models/booking.js"); // Required for the reserve route
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Main Listings Routes
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// New Listing Form
router.get("/new", isLoggedIn, listingController.renderNewForm);

/**
 * RESERVE ROUTE
 * Logic: Finds the listing, creates a new booking document, 
 * and saves it to the database.
 */
router.post("/:id/reserve", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id); // Correctly references the imported model
    
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        price: listing.price
    });

    await newBooking.save();
    
    req.flash("success", `Successfully reserved ${listing.title}!`);
    res.redirect(`/listings/${id}`);
}));

// Individual Listing Routes
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit Listing Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;