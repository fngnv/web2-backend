import offerModel from "../models/offerModel";
import { Offer } from "../../types/DBtypes";
import MyContext from "../../types/MyContext";
import { isLoggedIn } from "../../functions/authorize";
import commentModel from "../models/commentModel"; // Import the commentModel

export default {
  Query: {
    offerById: async (_: any, args: { id: string }) => {
      try {
        return await offerModel.findById(args.id);
      } catch (error) {
        throw new Error("Failed to get offer by id");
      }
    },

    offers: async () => {
      try {
        return await offerModel.find();
      } catch (error) {
        throw new Error("Failed to get offers");
      }
    },

    searchOffers: async (_: any, { searchTerm }: { searchTerm: string }) => {
      try {
        const offers = await offerModel.find({
          header: { $regex: searchTerm, $options: "i" },
        });
        return offers;
      } catch (error) {
        console.error("Error searching offers:", error);
        throw new Error("Failed to search offers");
      }
    },
  },
  Offer: {
    comments: async (parent: any) => {
      console.log("Parent id:", parent.id);
      return await commentModel.find({ post: parent.id });
    },
  },

  Mutation: {
    createOffer: async (
      _: any,
      args: { input: Omit<Offer, "id"> },
      context: MyContext
    ) => {
      try {
        isLoggedIn(context);
        args.input.author = context.userdata?.user.id;
        args.input.publicationDate = new Date();
        if (!args.input.deletionDate) {
          args.input.deletionDate = new Date();
          args.input.deletionDate.setDate(
            args.input.deletionDate.getDate() + 14
          );
        }
        return await offerModel.create(args.input);
      } catch (error) {
        throw new Error("Failed to create offer");
      }
    },

    updateOffer: async (
      _: any,
      args: { id: String; input: Partial<Omit<Offer, "id">> },
      context: MyContext
    ) => {
      try {
        isLoggedIn(context);
        if (context.userdata?.user.role === "admin") {
          return await offerModel.findByIdAndUpdate(args.id, args.input, {
            new: true,
          });
        }
        const offer = await offerModel.findById(args.id);
        if (context.userdata?.user.id !== offer?.author.toString()) {
          throw new Error("Not authorized to update offer");
        }
        return await offerModel.findByIdAndUpdate(args.id, args.input, {
          new: true,
        });
      } catch (error) {
        throw new Error("Failed to update offer");
      }
    },

    deleteOffer: async (_: any, args: { id: string }, context: MyContext) => {
      try {
        isLoggedIn(context);
        if (context.userdata?.user.role === "admin") {
          await commentModel.deleteMany({post: args.id});
          return await offerModel.findByIdAndDelete(args.id);
        }
        const offer = await offerModel.findById(args.id);
        if (context.userdata?.user.id !== offer?.author.toString()) {
          throw new Error("Not authorized to delete offer");
        }
        await commentModel.deleteMany({post: args.id});
        return await offerModel.findByIdAndDelete(args.id);
      } catch (error) {
        throw new Error("Failed to delete offer");
      }
    },
  },
};
