const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    
    // IMPORTANT: This line connects the logged-in user to the review
    newReview.author = req.user._id; 
    
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;

    // Removes the reference from the listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    // Deletes the review document
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};