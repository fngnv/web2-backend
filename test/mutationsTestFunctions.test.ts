import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import CategoryModel from "../src/api/models/categoryModel";
import offerModel from "../src/api/models/offerModel";
import commentModel from "../src/api/models/commentModel";
import notificationModel from "../src/api/models/notificationModel";
import reviewModel from "../src/api/models/reviewModel";
import { isLoggedIn } from "../src/functions/authorize";
import { getUserToTestMutations, postCategoryToTestMutations, postCommentToTestMutations, postOfferToTestMutations, postReviewToTestMutations, postUserToTestMutations } from "./helperFunctions";
import { User } from "../src/types/DBtypes";

describe("Mutations tests", () => {
  let token: string;
  let token2: string;
  let token3: string;
  let token4: string;

  const user = {
    id: new mongoose.Types.ObjectId().toString(),
    username: "testUser",
    email: "testUser@example.com",
    role: "admin",
  };

  const anotherUser = {
    id: new mongoose.Types.ObjectId().toString(),
    username: "anotherTestUser",
    email: "anotherTestUser@example.com",
    role: "admin",
  };

  const categoryTestID = "65e3174757f0cfbcc5f4ee50";

  const postTestID = "65f0b32d38475ee76f4666bc";

  const commentTestID = "65f2b877fec7e6e54debae91";

  const reviewTestID = "65f0b32d38475ee76f4666bc";

  const user3 = {
    id: "65e1bca00f4e21cc652c8929",
    username: "admin user",
    email: "admin@null.com",
    role: "admin",
  };

  const user4 = {
    id: "65f07d06730d18865f5f1f03",
    username: "vera",
    email: "vera@vera.com",
    role: "user",
  };

  token = jwt.sign(user, <string>process.env.JWT_SECRET);

  token2 = jwt.sign(anotherUser, <string>process.env.JWT_SECRET);

  token3 = jwt.sign(user3, <string>process.env.JWT_SECRET);

  token4 = jwt.sign(user4, <string>process.env.JWT_SECRET);

  beforeAll(async () => {
    await mongoose.connect(<string>process.env.DATABASE_URL2);

    const response = await request(app).post("/graphql").send({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a new category", async () => {
    const categoryName = `New Category${Date.now()}`;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: `
          mutation {
            createCategory(name: "${categoryName}") {
              id
              name
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.createCategory.name).toBe(categoryName);
    const category = await CategoryModel.findOne({ name: categoryName});
    expect(category).not.toBeNull();
  });

  it("should not create a new category as non-admin", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            createCategory(name: "Test Category") {
              id
              name
            }
          }
        `,
      });

    const { errors } = response.body;
    expect(errors[0].message).toBe("Not authorized");
  } )

  it("should update a category", async () => {
    const categoryId = await postCategoryToTestMutations(token3);
    const categoryName = `New Category${Date.now()}`;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateCategory(id: "${categoryId}", name: "${categoryName}") {
              id
              name
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.updateCategory.name).toBe(categoryName);
    const updatedCategory = await CategoryModel.findOne({ _id: `${categoryId}` });
    expect(updatedCategory).not.toBeNull();
  });

  it("should not update a category as non-admin", async () => {
    const categoryId = await postCategoryToTestMutations(token3);
    const categoryName = `New Category${Date.now()}`;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateCategory(id: "${categoryId}", name: "${categoryName}") {
              id
              name
            }
          }
        `,
      });
      const { errors } = response.body;
      expect(errors[0].message).toBe("Not authorized");
  })

  it("should delete a category", async () => {
    const categoryId = await postCategoryToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({
        query: `
          mutation {
            deleteCategory(id: "${categoryId}") {
              id
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.deleteCategory.id).toBe(categoryId);
    const deletedCategory = await CategoryModel.findById(categoryId);
    expect(deletedCategory).toBeNull();
  });

  it("should not delete a category as non-admin", async () => {
    const categoryId = await postCategoryToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            deleteCategory(id: "${categoryId}") {
              id
            }
          }
        `,
      });

    const { errors } = response.body;
    expect(errors[0].message).toBe("Not authorized");
  })

  it("should create a new comment", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `mutation { createComment(input: { text: "Test Comment", post: "${postTestID}" }) { id text } }`,
      });
    console.log(response.body);
    const { data } = response.body;
    expect(data.createComment.text).toBe("Test Comment");
    const comment = commentModel.findOne({ text: "Test Comment" });
    expect(comment).not.toBeNull();
  });

  it("should not create a comment if not logged in", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation { createComment(input: { text: "Test Comment", post: "${postTestID}" }) { id text } }`,
      });
    const { errors } = response.body;
    expect(errors[0].message).toBe("Failed to create comment");
  })

  it("should update a comment", async () => {
    const commentId = await postCommentToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateComment(id: "${commentId}", input:
              { text: "Updated Comment" }) {
              id
              text
            }
          }`,
      });
    const { data } = response.body;
    console.log(data);
    expect(data.updateComment.text).toBe("Updated Comment");
    const updatedComment = await commentModel.findOne({_id: commentId});
    expect(updatedComment).not.toBeNull();
  });

  it("should not update a comment as a different user", async () => {
    const commentId = await postCommentToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateComment(id: "${commentId}", input:
              { text: "Updated Comment" }) {
              id
              text
            }
          }`,
      });
    const { errors } = response.body;
    expect(errors[0].message).toBe("Failed to update comment");
  });

  it("should update a comment as an admin", async () => {
    const commentId = await postCommentToTestMutations(token4);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateComment(id: "${commentId}", input:
              { text: "Updated Comment" }) {
              id
              text
            }
          }`,
      });
    const { data } = response.body;
    expect(data.updateComment.text).toBe("Updated Comment");
    const updatedComment = await commentModel.findOne({_id: commentId});
    expect(updatedComment).not.toBeNull();
  })

  it("should delete a comment", async () => {
    const comment = await commentModel.create({
      text: "Comment to delete",
      author: anotherUser.id,
      publicationDate: new Date(),
    });
    const commentID = comment.id;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        query: `mutation { deleteComment(id: "${commentID}") { id } }`,
      });
    const { data } = response.body;
    expect(data.deleteComment.id).toBe(commentID);
    const deletedComment = await commentModel.findById(commentID);
    expect(deletedComment).toBeNull();
  });

  it("should not delete a comment as a different user", async () => {
    const commentId = await postCommentToTestMutations(token3);
    console.log("comment id ", commentId);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `mutation { deleteComment(id: "${commentId}") { text } }`,
      });
    const { data } = response.body;
    expect(data.deleteComment).toBeNull();
  });

  it("should delete a comment as an admin", async () => {
    const commentId = await postCommentToTestMutations(token4);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `mutation { deleteComment(id: "${commentId}") { id } }`,
      });
    const { data } = response.body;
    expect(data.deleteComment.id).toBe(commentId);
    const deletedComment = await commentModel.findById(commentId);
    expect(deletedComment).toBeNull();

  })

  it("should add a new notification", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `mutation {
          addNotification(input: {
            receiver: "${anotherUser.id}",
            text: "This is a test notification"
          }) {
            id
            text
            publicationDate
            expire
          }
        }`,
      });

    const { data } = response.body;
    expect(data.addNotification.text).toBe("This is a test notification");
    const notification = await notificationModel.findById(
      data.addNotification.id
    );
    expect(notification).not.toBeNull();
  });

  it("should send a notification to a single user", async () => {
    const userId = anotherUser.id;
    const text = "Test notification";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        query: `
          mutation {
            sendNotificationToManyUsers(userIds: ["${userId}"], text: "${text}") {
              receiver {
                id
              }
              text
              publicationDate
              expire
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.sendNotificationToManyUsers).toHaveLength(1);
    const notification = await notificationModel.findOne({
      receiver: userId,
      text: text,
    });
    expect(notification).not.toBeNull();
  });

  it("should delete a notification", async () => {
    const notification = await notificationModel.create({
      receiver: anotherUser.id,
      text: "This is a test notification to delete",
      publicationDate: new Date(),
      expire: new Date(new Date().setDate(new Date().getDate() + 14)),
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        query: `
          mutation {
            deleteNotification(id: "${notification.id}") {
              id
              receiver {
                id
              }
              text
              publicationDate
              expire
            }
          }
        `,
      });
    const deletedNotification = await notificationModel.findById(
      notification.id
    );
    expect(deletedNotification).toBeNull();
  });

  it("should add a review", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            addReview(input: { header: "Test review", text: "This is a test review", rating: 5, category: "65f19f5448abaa8ffd8e4d6b", filename: "test.jpg"}) {
              id
              header
              text
              rating
              category {
                id
              }
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.addReview.header).toBe("Test review");
    expect(data.addReview.text).toBe("This is a test review");
    expect(data.addReview.rating).toBe(5);
    expect(data.addReview.category.id).toBe("65f19f5448abaa8ffd8e4d6b");
    const review = reviewModel.findOne({ text: "This is a test review" });
    expect(review).not.toBeNull();
  });

  it("should not add a review if not logged in", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            addReview(input: {
              header: "Test review",
              text: "This is a test review",
              rating: 5,
              category: "65f19f5448abaa8ffd8e4d6b",
              filename: "test.jpg"
            }) {
            id
            header
            text
            rating
            category {
              name
            }
            }
          }
        `,
      });
    const { errors } = response.body;
    expect(errors[0].message).toBe("Not authenticated");
  })

  it("should update a review", async () => {
    const reviewId = await postReviewToTestMutations(token3);
    console.log("review id ", reviewId);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateReview(
              id: "${reviewId}",
              input: {
                header: "Updated review",
                text: "This is an updated review",
                rating: 4
              })
            {
              id
              header
              text
              rating
            }
          }
        `,
      });
    console.log(response.body);
    const { data } = response.body;
    expect(data.updateReview.id).toBe(reviewId);
    expect(data.updateReview.header).toBe("Updated review");
    expect(data.updateReview.text).toBe("This is an updated review");
    expect(data.updateReview.rating).toBe(4);

    const updatedReview = await reviewModel.findOne({
      text: "This is an updated review",
    });
    expect(updatedReview).not.toBeNull();
  });

  it("should not update a review as a different user", async () => {
    const reviewId = await postReviewToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateReview(
              id: "${reviewId}",
              input: {
                header: "Updated review",
                text: "This is an updated review",
                rating: 4
              })
            {
              id
              header
              text
              rating
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.updateReview).toBeNull();
  });

  it("should update a review as an admin", async () => {
    const reviewId = await postReviewToTestMutations(token4);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateReview(
              id: "${reviewId}",
              input: {
                header: "Updated review",
                text: "This is an updated review",
                rating: 4
              })
            {
              id
              header
              text
              rating
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.updateReview.id).toBe(reviewId);
    expect(data.updateReview.header).toBe("Updated review");
    expect(data.updateReview.text).toBe("This is an updated review");
    expect(data.updateReview.rating).toBe(4);

    const updatedReview = await reviewModel.findOne({
      text: "This is an updated review",
    });
    expect(updatedReview).not.toBeNull();
  });

  it("should delete a review", async () => {
    const reviewTest = await reviewModel.create({
      header: "Test Review",
      text: "This is a test review that should be deleted.",
      rating: 5,
      author: anotherUser.id,
      category: categoryTestID,
      publicationDate: new Date(),
    });
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        query: `
          mutation {
            deleteReview(id: "${reviewTest.id}") {
              id
            }
          }
        `,
      });

    const deletedReview = await reviewModel.findById(reviewTest.id);
    expect(deletedReview).toBeNull();
  });

  it("should not delete a review as a different user", async () => {
    const reviewId = await postReviewToTestMutations(token3);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            deleteReview(id: "${reviewId}") {
              id
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.deleteReview).toBeNull();
  });

  it("should delete a review as an admin", async () => {
    const reviewId = await postReviewToTestMutations(token4);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            deleteReview(id: "${reviewId}") {
              id
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.deleteReview.id).toBe(reviewId);
    const deletedReview = await reviewModel.findById(reviewId);
    expect(deletedReview).toBeNull();
  });

  it("should login a user", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            login(credentials: { username: "testuser", password: "testpassword" }) {
              token
              user {
                id
                username
              }
            }
          }
        `,
      });
    expect(isLoggedIn);
  });

  it("should register a user", async () => {
    const email = `${Date.now()}@user.com`
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            register(user: {
              username: "newuser",
              password: "newpassword",
              email: "${email}"
            }) {
              user {
                id
                username
                email
              }
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.register.user.username).toBe("newuser");
    expect(data.register.user.email).toBe(email);
  });

  it("should login a user", async () => {
    const user = await postUserToTestMutations();
    const email = user.email;
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            login(credentials: { email: "${email}", password: "1234" }) {
              token
              user {
                id
                username
              }
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.login.user).not.toBeNull();
    expect(data.login.user.username).toBe("newuser");
    expect(data.login.user.id).not.toBeNull();
    expect(data.login.token).not.toBeNull();
  })

  it("should add a category to a user", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            addCategoryToUser(categoryId: "65e8a95f7d33114f9ae5b301") {
              id
              username
              isFollowing {
                id
              }
            }
          }
        `,
      });

    const { data } = response.body;
    console.log(data.addCategoryToUser.isFollowing);
    expect(data.addCategoryToUser.isFollowing).not.toBeNull();
    expect(data.addCategoryToUser.isFollowing).not.toHaveLength(0);
  });

  it ("should update a user", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateUser(user: {username: "vera"}) {
              user {
                id
                username
              }
            }
          }
        `,
      });

    const { data } = response.body;
    console.log(response.body);
    console.log(data);
    expect(data.updateUser.user.username).toBe("vera");
  });

  it("should update a user as an admin", async () => {
    const user = await postUserToTestMutations();
    const userId = user.id;
    console.log("user id ", userId);
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateUserAsAdmin(id: "${userId}", user: {username: "not admin"}) {
              user {
                id
                username
              }
            }
          }
        `,
      });

      const { data } = response.body;
      expect(data.updateUserAsAdmin.user.username).toBe("not admin");
  });

  it("should not update a user as non-admin", async () => {
    const user = await postUserToTestMutations();
    const userId = user.id;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateUserAsAdmin(id: "${userId}", user: {username: "not admin"}) {
              user {
                id
                username
              }
            }
          }
        `,
      });

      const { errors } = response.body;
      expect(errors[0].message).toBe("Not authorized");
  });

  it("should delete a user", async () => {
    const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token4}`)
    .send({
      query: `
        mutation { deleteUser { user {id username} } }
      `,
    });

    const deletedUser = await getUserToTestMutations(user4.id);
    const { data } = response.body;
    expect(data.deleteUser.user.username).toBe("vera");
    expect(deletedUser).toBe(undefined);
  });

  it("should delete a user as an admin", async () => {
    const user = await postUserToTestMutations();
    const userId = user.id;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            deleteUserAsAdmin(id: "${userId}") {
              user {
                id
                username
              }
            }
          }
        `,
      });

      const { data } = response.body;
      const deletedUser = await getUserToTestMutations(userId);
      expect(data.deleteUserAsAdmin.user.username).not.toBeNull();
      expect(deletedUser).toBe(undefined);
  });

  it("should not delete a user as non-admin", async () => {
    const user = await postUserToTestMutations();
    const userId = user.id;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            deleteUserAsAdmin(id: "${userId}") {
              user {
                id
                username
              }
            }
          }
        `,
      });

      const { errors } = response.body;
      expect(errors[0].message).toBe("Not authorized");
  })

  it("should create a new offer", async () => {
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            createOffer(input: {
              header: "Test Offer",
              text: "This is a test offer",
            }) {
              header
              text
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.createOffer.header).toBe("Test Offer");
    const offer = await offerModel.findOne({ header: "Test Offer" });
    expect(offer).not.toBeNull();
  });

  it("should not create an offer if not logged in", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            createOffer(input: {
              header: "Test Offer",
              text: "This is a test offer",
            }) {
              header
              text
            }
          }
        `,
      });
    const { errors } = response.body;
    console.log(errors);
    expect(errors[0].message).toBe("Failed to create offer");
  });

  it("should update an offer", async () => {
    const offerId = await postOfferToTestMutations(token3);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateOffer(id: "${offerId}", input: {
              header: "Updated Offer",
              text: "This is an updated test offer",
            }) {
              header
              text
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.updateOffer.header).toBe("Updated Offer");
    const updatedOffer = await offerModel.findOne({ _id: `${offerId}` });
    expect(updatedOffer).not.toBeNull();
  });

  it("should not update an offer as a different user", async () => {
    const offerId = await postOfferToTestMutations(token3);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            updateOffer(id: "${offerId}", input: {
              header: "Updated Offer",
              text: "This is an updated test offer",
            }) {
              header
              text
            }
          }
        `,
      });

    const { errors } = response.body;
    expect(errors[0].message).toBe("Failed to update offer");
  });

  it("should update an offer as an admin", async () => {
    const offerId = await postOfferToTestMutations(token4);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            updateOffer(id: "${offerId}", input: {
              header: "Updated Offer",
              text: "This is an updated test offer",
            }) {
              header
              text
            }
          }
        `,
      });
    const { data } = response.body;
    expect(data.updateOffer.header).toBe("Updated Offer");
    const updatedOffer = await offerModel.findOne({ _id: `${offerId}` });
    expect(updatedOffer).not.toBeNull();
  });

  it("should delete an offer", async () => {
    const offerId = await postOfferToTestMutations(token3);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            deleteOffer(id: "${offerId}") {
              header
              text
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.deleteOffer.header).toBe("Test Offer To Be Updated or Removed");
    const deletedOffer = await offerModel.findOne({ _id: `${offerId}` });
    expect(deletedOffer).toBeNull();
  });

  it("should not delete an offer as a different user", async () => {
    const offerId = await postOfferToTestMutations(token3);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token4}`)
      .send({
        query: `
          mutation {
            deleteOffer(id: "${offerId}") {
              header
              text
            }
          }
        `,
      });

    const { errors } = response.body;
    expect(errors[0].message).toBe("Failed to delete offer");
  });

  it("should delete an offer as an admin", async () => {
    const offerId = await postOfferToTestMutations(token4);

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token3}`)
      .send({
        query: `
          mutation {
            deleteOffer(id: "${offerId}") {
              header
              text
            }
          }
        `,
      });

    const { data } = response.body;
    expect(data.deleteOffer.header).toBe("Test Offer To Be Updated or Removed");
    const deletedOffer = await offerModel.findOne({ _id: `${offerId}` });
    expect(deletedOffer).toBeNull();
  });
});
