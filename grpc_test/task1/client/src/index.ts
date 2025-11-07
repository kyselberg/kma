import { credentials } from "@grpc/grpc-js";
import {
  UserServiceClient,
  type CreateUserRequest,
  type DeleteUserRequest,
  type DeleteUserResponse,
  type GetUserRequest,
  type ListUsersRequest,
  type ListUsersResponse,
  type UserResponse,
} from "./generated/user";
import { promisifyCall } from "./utils";

const client = new UserServiceClient(
  "localhost:50051",
  credentials.createInsecure(),
);

async function listUsers(limit: number) {
  console.log("Listing all users:");
  const listResponse = await promisifyCall<
    ListUsersRequest,
    ListUsersResponse,
    UserServiceClient
  >(client, "listUsers", { limit });
  console.log("Users:", JSON.stringify(listResponse.users, null, 2));
  console.log("");
  return listResponse;
}

async function getUserById(id: number) {
  console.log(`Getting user with ID ${id}:`);

  const getResponse = await promisifyCall<
    GetUserRequest,
    UserResponse,
    UserServiceClient
  >(client, "getUser", { id });
  console.log("User:", JSON.stringify(getResponse, null, 2));
  console.log("");
  return getResponse;
}

async function createNewUser() {
  console.log("Creating a new user:");

  const createResponse = promisifyCall<
    CreateUserRequest,
    UserResponse,
    UserServiceClient
  >(client, "createUser", {
    name: "Лука Кисельов",
    email: "luka@kyselov.com",
    age: 24,
  });
  console.log("Created user:", JSON.stringify(createResponse, null, 2));
  console.log("");
  return createResponse;
}

async function deleteUserById(id: number) {
  console.log(`Deleting user with ID ${id}:`);
  const deleteResponse = await promisifyCall<
    DeleteUserRequest,
    DeleteUserResponse,
    UserServiceClient
  >(client, "deleteUser", { id });
  console.log("Delete response:", JSON.stringify(deleteResponse, null, 2));
  console.log("");
  return deleteResponse;
}

async function main() {
  console.log("Starting client...");

  try {
    await listUsers(10);
    await getUserById(1);
    await createNewUser();
    await listUsers(10);
    await deleteUserById(1);
    await listUsers(10);

    console.log("All operations completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
