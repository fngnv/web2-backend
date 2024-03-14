import {
  Review,
  User,
  Comment,
  Offer,
  UserInput,
  Notification,
} from "../../types/DBtypes";
import fetchData from "../../functions/fetchData";
import { UserResponse, LoginResponse } from "../../types/MessageTypes";
import MyContext from "../../types/MyContext";
import { isLoggedIn, isAdmin } from "../../functions/authorize";
import reviewModel from "../models/reviewModel";
import { off } from "process";
import offerModel from "../models/offerModel";
import commentModel from "../models/commentModel";

export default {
  Notification: {
    receiver: async (parent: Notification) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.receiver}`
      );
    },
  },
  Review: {
    author: async (parent: Review) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.author}`
      );
    },
  },
  Comment: {
    author: async (parent: Comment) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.author}`
      );
    },
  },
  Offer: {
    author: async (parent: Offer) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.author}`
      );
    },
  },
  Query: {
    users: async () => {
      return await fetchData<User[]>(`${process.env.AUTH_URL}/users`);
    },
    userById: async (_parent: undefined, args: { id: string }) => {
      return await fetchData<User>(`${process.env.AUTH_URL}/users/${args.id}`);
    },
    //Returns all the users who follow a category. Calls usersByCategory from auth server
    usersByCategory: async (
      _parent: undefined,
      args: { categoryId: string }
    ) => {
      return await fetchData<User[]>(
        `${process.env.AUTH_URL}/users/categories/${args.categoryId}`
      );
    },
    checkToken: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext
    ) => {
      return { message: "User data: ", user: context.userdata?.user };
    },
  },
  Mutation: {
    login: async (
      _parent: undefined,
      args: { credentials: { username: string; password: string } }
    ) => {
      return await fetchData<LoginResponse>(
        `${process.env.AUTH_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args.credentials),
        }
      );
    },
    register: async (_parent: undefined, args: { user: UserInput }) => {
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.user),
      });
    },
    addCategoryToUser: async (
      _parent: undefined,
      args: { categoryId: string },
      context: MyContext
    ) => {
      isLoggedIn(context);
      return await fetchData<Partial<User>>(
        `${process.env.AUTH_URL}/users/${context.userdata?.user.id}/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.userdata?.token}`,
          },
          body: JSON.stringify({ categoryId: args.categoryId }),
        }
      );
    },
    removeCategoryFromUser: async (
      _parent: undefined,
      args: { categoryId: string },
      context: MyContext
    ) => {
      return await fetchData<Partial<User>>(
        `${process.env.AUTH_URL}/users/${context.userdata?.user.id}/categories`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.userdata?.token}`,
          },
          body: JSON.stringify({ categoryId: args.categoryId }),
        }
      );
    },
    updateUser: async (
      _parent: undefined,
      args: { user: Partial<UserInput> },
      context: MyContext
    ) => {
      isLoggedIn(context);
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${context.userdata?.token}`,
        },
        body: JSON.stringify(args.user),
      });
    },
    deleteUser: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext
    ) => {
      isLoggedIn(context);
      await reviewModel.deleteMany({ author: context.userdata?.user.id });
      await offerModel.deleteMany({ author: context.userdata?.user.id });
      await commentModel.deleteMany({ author: context.userdata?.user.id });
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${context.userdata?.token}`,
        },
      });
    },
    updateUserAsAdmin: async (
      _parent: undefined,
      args: { user: Partial<UserInput>; id: string },
      context: MyContext
    ) => {
      isLoggedIn(context);
      isAdmin(context);
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${args.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.userdata?.token}`,
          },
          body: JSON.stringify(args.user),
        }
      );
    },
    deleteUserAsAdmin: async (
      _parent: undefined,
      args: { id: string },
      context: MyContext
    ) => {
      isLoggedIn(context);
      isAdmin(context);
      await reviewModel.deleteMany({ author: args.id });
      await offerModel.deleteMany({ author: args.id });
      await commentModel.deleteMany({ author: args.id });
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${args.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.userdata?.token}`,
          },
        }
      );
    },
  },
};
