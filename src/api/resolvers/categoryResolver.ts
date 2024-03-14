import { Review, User } from "../../types/DBtypes";
import MyContext from "../../types/MyContext";
import { isAdmin } from "../../functions/authorize";
import CategoryModel from "../models/categoryModel";
import ReviewModel from "../models/reviewModel";
import fetchData from "../../functions/fetchData";

export default {
  Review: {
    category: async (parent: Review) => {
      return await CategoryModel.findById(parent.category);
    },
  },
  User: {
    isFollowing: async (parent: User) => {
      return await CategoryModel.find({ _id: { $in: parent.isFollowing } });
    },
  },
  Query: {
    categories: async () => {
      return await CategoryModel.find();
    },

    categoriesByUser: async (_parent: undefined, args: { userId: string }) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${args.userId}/categories`
      );
    },
    categoryById: async (_parent: undefined, args: { id: string }) => {
      return await CategoryModel.findById(args.id);
    },

    searchCategories: async (
      _parent: undefined,
      { searchTerm }: { searchTerm: string }
    ) => {
      try {
        const categories = await CategoryModel.find({
          name: { $regex: searchTerm, $options: "i" },
        });
        return categories;
      } catch (error) {
        console.error("Error searching categories:", error);
        throw new Error("Failed to search categories");
      }
    },
  },
  Mutation: {
    createCategory: async (
      _parent: undefined,
      args: { name: string },
      context: MyContext
    ) => {
      isAdmin(context);
      return await CategoryModel.create(args);
    },
    deleteCategory: async (
      _parent: undefined,
      args: { id: string },
      context: MyContext
    ) => {
      isAdmin(context);
      await ReviewModel.deleteMany({ category: args.id });
      return await CategoryModel.findByIdAndDelete(args.id);
    },
    updateCategory: async (
      _parent: undefined,
      args: { id: string; name: string },
      context: MyContext
    ) => {
      isAdmin(context);
      return await CategoryModel.findByIdAndUpdate(
        args.id,
        { name: args.name },
        { new: true }
      );
    },
  },
};
