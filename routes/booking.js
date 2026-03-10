const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const GiftCard = require("../models/giftcard"); // Make sure this model exists
const { isLoggedIn } = require("../middleware"); 
const wrapAsync = require("../utils/wrapAsync"); // Recommended for error handling

// ==========================================
// 1. PROPERTY BOOKINGS ROUTES
// ==========================================

// POST: Create a new Property Booking
router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let { checkIn, checkOut } = req.body.booking;

    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
        req.flash("error", "Check-out date must be after check-in date.");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = nights * listing.price;

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: d1,
        checkOut: d2,
        totalPrice: totalPrice
    });

    await newBooking.save();
    req.flash("success", "Your stay is booked! Pack your bags.");
    res.redirect("/bookings");
}));

// DELETE: Remove a Property Booking
router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Booking.findByIdAndDelete(id);
    req.flash("success", "Booking removed.");
    res.redirect("/bookings");
}));


// ==========================================
// 2. GIFT CARD ROUTES
// ==========================================

// POST: Purchase a Gift Card
router.post("/giftcards", isLoggedIn, wrapAsync(async (req, res) => {
    const { amount, recipientEmail, message, design } = req.body;
    
    // Generate a professional code: STAY-XXXX-XXXX
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `STAY-${part1}-${part2}`;

    const newGiftCard = new GiftCard({
        amount: parseInt(amount),
        recipientEmail,
        message,
        design: design || "classic",
        code: generatedCode,
        owner: req.user._id // Linking to logged-in user
    });

    await newGiftCard.save();
    req.flash("success", "Gift Card purchased and added to your rewards!");
    res.redirect("/bookings");
}));


// ==========================================
// 3. THE UNIFIED DASHBOARD ROUTE
// ==========================================

// GET: Show All Bookings AND Gift Cards (The "Your Next Chapters" Page)
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    // 1. Fetch Property Bookings
    const allBookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    // 2. Fetch Gift Cards owned by the user
    const allGiftCards = await GiftCard.find({ owner: req.user._id })
        .sort({ createdAt: -1 });

    // 3. Render the index page with both data sets
    res.render("bookings/index.ejs", { allBookings, allGiftCards });
}));

module.exports = router;