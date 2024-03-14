import mongoose from "mongoose";
import { Offer } from "../../types/DBtypes";

const offerSchema = new mongoose.Schema<Offer>({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  header: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  publicationDate: {
    type: Date,
    required: true,
  },
  deletionDate: {
    type: Date,
    required: true,
  },
});

export default mongoose.model<Offer>("Offer", offerSchema);
