const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Try requiring the specific default function if the object export is the issue
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    }
});

// We wrap it in a check to prevent the crash and see exactly what is being loaded
if (typeof passportLocalMongoose === 'function') {
    userSchema.plugin(passportLocalMongoose);
} else {
    // If it's still an object, we use the .default property
    userSchema.plugin(passportLocalMongoose.default);
}

module.exports = mongoose.model("User", userSchema);