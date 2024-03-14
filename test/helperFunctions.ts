import request from "supertest";
import app from "../src/app";

const postOfferToTestMutations = async (token: string) => {
  const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({
      query: `
        mutation {
          createOffer(input: {
            header: "Test Offer To Be Updated or Removed",
            text: "This is a test offer",
          }) {
            id
          }
        }
      `,
    });
  return response.body.data.createOffer.id;
}

const postCategoryToTestMutations = async (token: string) => {
  const categoryName = `Test Category To Be Updated or Removed ${Date.now()}`;
  const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({
      query: `
        mutation {
          createCategory(name: "${categoryName}") {
            _id
          }
        }
      `,
    });
  return response.body.data.createCategory._id;
}

const postCommentToTestMutations = async (token: string) => {
  const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({
      query: `
        mutation {
          createComment(input: {
            text: "This is a test comment",
            post: "65f19f5548abaa8ffd8e4d89"
          }) {
            id
          }
        }
      `,
    });
  return response.body.data.createComment.id;
}

const postReviewToTestMutations = async (token: string) => {
  const response = await request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({
      query: `
      mutation {
        addReview(input: {
          header: "Test review to be updated or removed",
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
  return response.body.data.addReview.id;
}

const postUserToTestMutations = async () => {
  const email = `${Date.now()}@user.com`
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            register(user: {
              username: "newuser",
              password: "1234",
              email: "${email}"
            }) {
              user {
                email,
                id
              }
            }
          }
        `,
      });
    return response.body.data.register.user;
}

const getUserToTestMutations = async (id: string) => {
  const response = await request(app)
    .post("/graphql")
    .send({
      query: `
        query {
          userById(id: "${id}") {
            user {
              email
              username
              id
            }
          }
        }
      `,
    });
  return response.body.data.userById;
}

export  {
  postOfferToTestMutations,
  postCategoryToTestMutations,
  postCommentToTestMutations,
  postReviewToTestMutations,
  postUserToTestMutations,
  getUserToTestMutations
}
