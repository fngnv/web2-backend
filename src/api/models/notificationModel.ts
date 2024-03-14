import mongoose from "mongoose";
import { Notification } from "../../types/DBtypes";

const notificationModel = new mongoose.Schema<Notification>({
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

  expire: {
    type: Date,
    required: true,
  },

  link: {
    type: String
  }
});

export default mongoose.model<Notification>('Notification', notificationModel);
