const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js"); // REQUIRED: This registers the User schema

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    
    // Find the user you created via the /signup page
    const adminUser = await User.findOne({ username: "admin" }); 

    if(!adminUser) {
        console.log("ERROR: No user found! Please signup as 'admin' on localhost:8080 first.");
        return;
    }

    // Map through data to add owner and category
    const cleanData = initData.data.map((obj) => ({
        ...obj,
        owner: adminUser._id,
        // Ensure every listing has a valid category for your filters
        category: obj.category || "Trending" 
    }));

    await Listing.insertMany(cleanData);
    console.log("Data was initialized with 29 listings!");
};

initDB();