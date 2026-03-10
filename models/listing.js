const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  price: Number,
  location: String,
  country: String,
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  amenities: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: [
      "Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", 
      "Amazing Pools", "Camping", "Farm", "Arctic", "Beach", 
      "Boat", "Ski-in/out", "Apartment", "New", "Woodlands", 
      "Lake", "Cabins", "Countryside", "Bed & Breakfasts", 
      "Campsite", "Historical Homes"
    ],
    required: true
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;