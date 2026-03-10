const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js"); 
const Booking = require("../models/booking.js"); 
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// ==========================================
// 1. INDEX & CREATE ROUTES
// ==========================================
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// ==========================================
// 2. NEW ROUTE (Must be ABOVE /:id)
// ==========================================
// This ensures that "new" is treated as a string, not an ID.
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ==========================================
// 3. PARAMETERIZED ROUTES (:id)
// ==========================================

/**
 * RESERVE ROUTE
 * Handles booking logic
 */
router.post("/:id/reserve", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id); 
    
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

// EDIT FORM
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// SHOW, UPDATE, DELETE
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

module.exports = router;
