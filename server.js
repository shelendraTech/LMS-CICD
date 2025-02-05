import app from "./app.js";
import connectToDB from "./config/databaseConfig.js";
import { config } from "dotenv";
config();
import cloudinary from "cloudinary";
import Rozarpay from "razorpay";

const PORT = process.env.PORT || 5011;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.CLOUDINARY_API_KEY,
});

export const rozarpay = new Rozarpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server is listning http://localhost:${PORT}`);
});
