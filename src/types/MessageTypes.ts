import { UserOutput } from "./DBtypes";

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type UserResponse = MessageResponse & {
  user: UserOutput;
};

type LoginResponse = MessageResponse & {
  token: string;
  user: UserOutput;
};

export { MessageResponse, ErrorResponse, UserResponse, LoginResponse };
