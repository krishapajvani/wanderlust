const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// This line is the fix: It looks for .env in the parent folder of 'init'
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// DEBUG: Check if keys are loading
if (!process.env.CLOUD_API_KEY) {
    console.log("❌ Error: .env file NOT found or API_KEY is missing!");
    process.exit(1); 
} else {
    console.log("✅ Credentials loaded for:", process.env.CLOUD_NAME);
}

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const dbUrl = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB for migration...");
        
        // Use .lean() to avoid Mongoose schema validation errors during the read
        const listings = await Listing.find({}).lean(); 
        
        for (let listing of listings) {
            let currentUrl = "";

            // Handle both String and Object formats for the image field
            if (typeof listing.image === "string") {
                currentUrl = listing.image;
            } else if (listing.image && listing.image.url) {
                currentUrl = listing.image.url;
            }

            // Only upload if there's a valid URL and it's an external link (unsplash)
            if (currentUrl && currentUrl.includes("unsplash.com")) {
                try {
                    console.log(`Uploading image for: ${listing.title}...`);
                    
                    const result = await cloudinary.uploader.upload(currentUrl, {
                        folder: "wanderlust_listings",
                    });

                    // Update using findByIdAndUpdate to bypass schema conflicts
                    await Listing.findByIdAndUpdate(listing._id, {
                        image: {
                            url: result.secure_url,
                            filename: result.public_id
                        }
                    });

                    console.log(`✅ Success: ${listing.title}`);
                } catch (err) {
                    console.log(`❌ Cloudinary Error for ${listing.title}:`, err.message);
                }
            } else {
                console.log(`⏩ Skipped: ${listing.title} (Already migrated or no external link)`);
            }
        }
        
        console.log("Migration complete!");
    } catch (err) {
        console.error("Database error:", err);
    } finally {
        mongoose.connection.close();
    }
}

main();