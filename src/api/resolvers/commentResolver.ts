import commentModel from "../models/commentModel";
import { Comment } from "../../types/DBtypes";
import MyContext from "../../types/MyContext";
import { isLoggedIn } from "../../functions/authorize";

export default {
  Query: {
    commentById: async (_: any, args: { id: string }) => {
      try {
        return await commentModel.findById(args.id);
      } catch (error) {
        throw new Error("Failed to get comment by id");
      }
    },

    comments: async () => {
      try {
        return await commentModel.find();
      } catch (error) {
        throw new Error("Failed to get comments");
      }
    },
  },

  Mutation: {
    createComment: async (
      _: any,
      args: { input: Omit<Comment, "id"> },
      context: MyContext
    ) => {
      try {
        isLoggedIn(context);
        args.input.author = context.userdata?.user.id;
        args.input.publicationDate = new Date();
        return await commentModel.create(args.input);
      } catch (error) {
        throw new Error("Failed to create comment");
      }
    },

    updateComment: async (
      _: any,
      args: { id: String; input: Partial<Omit<Comment, "id">> },
      context: MyContext
    ) => {
      try {
        isLoggedIn(context);
        if (context.userdata?.user.role === "admin") {
          return await commentModel.findByIdAndUpdate(args.id, args.input, {
            new: true,
          });
        }
        const comment = await commentModel.findById(args.id);
        if (context.userdata?.user.id !== comment?.author.toString()) {
          throw new Error("Not authorized to update comment");
        }
        return await commentModel.findByIdAndUpdate(args.id, args.input, {
          new: true,
        });
      } catch (error) {
        throw new Error("Failed to update comment");
      }
    },

    deleteComment: async (_: any, args: { id: string }, context: MyContext) => {
      try {
        isLoggedIn(context);
        if (context.userdata?.user.role === "admin") {
          return await commentModel.findByIdAndDelete(args.id);
        }
        const filter = { _id: args.id, author: context.userdata?.user.id };
        return await commentModel.findOneAndDelete(filter);
      } catch (error) {
        throw new Error("Failed to delete comment");
      }
    },
  },
};
