const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const giftCardSchema = new Schema({
    amount: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    recipientEmail: { type: String, required: true },
    message: String,
    design: { type: String, default: "classic" }, // classic, nature, premium
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GiftCard", giftCardSchema);