require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Not Found");
if (process.env.MONGO_URI) {
    const hidden = process.env.MONGO_URI.replace(/\/\/.*:.*@/, "//USER:PASSWORD@");
    console.log("URI Format:", hidden);
}
