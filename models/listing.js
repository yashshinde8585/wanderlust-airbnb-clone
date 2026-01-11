const mongoose = require("mongoose");
const Review = require("./review.js");
const Schema = mongoose.Schema;

// Define the schema for a listing
const listingSchema = new Schema({
  title: {
    type: String,
    required: true, // Title is a required field
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  price: Number,
  location: String,
  country: String,
  category: {
    type: String,
    enum: ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"],
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"], // Geometry type must be "Point"
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers (longitude, latitude)
      required: true,
    },
  },
});

// Middleware to delete related reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// Create and export the Listing model based on the listing schema
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
