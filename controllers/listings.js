const { query } = require("express");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Fetch and display all listings
module.exports.index = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let queryObj = {};
    let allListings;

    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive search
      queryObj = {
        $or: [
          { title: regex },
          { location: regex },
          { country: regex },
          { category: regex },
        ],
      };
    } else if (category) {
      queryObj = { category };
    }

    // Build the query
    let listingQuery = Listing.find(queryObj);

    // Apply Sorting
    if (sort === "price_low") {
      listingQuery = listingQuery.sort({ price: 1 });
    } else if (sort === "price_high") {
      listingQuery = listingQuery.sort({ price: -1 });
    } else if (sort === "newest") {
      listingQuery = listingQuery.sort({ _id: -1 });
    }

    allListings = await listingQuery;

    res.render("listings/index", { allListings });
  } catch (error) {
    req.flash("error", "Unable to fetch listings. Please try again.");
    res.redirect("/");
  }
};

// Render form to create a new listing
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

// Display details of a specific listing
module.exports.showListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" },
      })
      .populate("owner", "username");

    if (!listing) {
      req.flash("error", "The listing you requested does not exist.");
      return res.redirect("/listings");
    }
    res.render("listings/show", { listing });
  } catch (error) {
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/listings");
  }
};

// Create a new listing
module.exports.createListing = async (req, res, next) => {
  try {
    const { listing } = req.body;

    // Geocode location
    let response = await geocodingClient
      .forwardGeocode({
        query: listing.location,
        limit: 1,
      })
      .send();

    if (!response.body.features || response.body.features.length === 0) {
      req.flash("error", "Invalid location. Please try again.");
      return res.redirect("/listings/new");
    }

    // Extract image details
    const { path: url, filename } = req.file || {};
    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.image = url && filename ? { url, filename } : {};
    newListing.geometry = response.body.features[0].geometry;

    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
  } catch (error) {
    next(error);
  }
};

// Render form to edit an existing listing
module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "The listing you requested does not exist.");
      return res.redirect("/listings");
    }

    const originalImageUrl = listing.image.url?.replace(
      "/upload",
      "/upload/h_300,w_250"
    );
    res.render("listings/edit", { listing, originalImageUrl });
  } catch (error) {
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/listings");
  }
};

// Update an existing listing
module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
    });

    if (req.file) {
      const { path: url, filename } = req.file;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    req.flash("error", "An error occurred while updating the listing.");
    res.redirect(`/listings/${id}`);
  }
};

// Delete an existing listing
module.exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  } catch (error) {
    req.flash("error", "An error occurred while deleting the listing.");
    res.redirect("/listings");
  }
};

// Toggle Wishlist (Like/Unlike)
module.exports.toggleWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    // Check if listing is already in wishlist
    // We convert ObjectId to string for comparison
    const isLiked = user.wishlist.some((listingId) => listingId.toString() === id);

    if (isLiked) {
      // Remove from wishlist
      await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: id } });
      res.status(200).json({ success: true, isLiked: false });
    } else {
      // Add to wishlist
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: id } });
      res.status(200).json({ success: true, isLiked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating wishlist" });
  }
};
