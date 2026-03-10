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
// 1. NON-PARAMETERIZED ROUTES (Specific Paths)
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

// New Listing Form - MUST stay above /:id
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ==========================================
// 2. PARAMETERIZED ROUTES (Routes with :id)
// ==========================================

/**
 * RESERVE ROUTE
 * Placed above the general /:id route to ensure 'reserve' isn't treated as an ID
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

// Edit Listing Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Individual Listing Operations (GET, PUT, DELETE)
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