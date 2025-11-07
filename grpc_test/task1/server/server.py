#!/usr/bin/env python3

import os
import sys
from concurrent import futures

import grpc

sys.path.append(os.path.join(os.path.dirname(__file__), "pb"))

import user_pb2
import user_pb2_grpc


class UserServiceServicer(user_pb2_grpc.UserServiceServicer):
    def __init__(self):
        print("Initializing UserServiceServicer...")
        self.users = {}
        self.next_id = 1

        self.users[1] = user_pb2.UserResponse(
            id=1, name="Illia Kyselov", email="illia@kyselov.com", age=24
        )
        self.users[2] = user_pb2.UserResponse(
            id=2, name="Liza Vakulova", email="liza@vakulova.com", age=24
        )
        self.next_id = 3
        print(f"UserServiceServicer initialized with {len(self.users)} users")

    def GetUser(self, request, context):
        user_id = request.id
        print(f"GetUser called with id: {user_id}")

        if user_id not in self.users:
            print(f"User with id {user_id} not found")
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"User with id {user_id} not found")
            return user_pb2.UserResponse()

        user = self.users[user_id]
        print(f"Returning user: {user.name} ({user.email})")
        return user

    def CreateUser(self, request, context):
        print(f"CreateUser called with name: {request.name}, email: {request.email}, age: {request.age}")
        user = user_pb2.UserResponse(
            id=self.next_id, name=request.name, email=request.email, age=request.age
        )

        self.users[self.next_id] = user
        self.next_id += 1
        print(f"User created with id: {user.id}")

        return user

    def ListUsers(self, request, context):
        print(f"ListUsers called with limit: {request.limit}")
        limit = request.limit if request.limit > 0 else 100

        users_list = list(self.users.values())[:limit]
        print(f"Returning {len(users_list)} users")

        return user_pb2.ListUsersResponse(users=users_list)

    def DeleteUser(self, request, context):
        user_id = request.id
        print(f"DeleteUser called with id: {user_id}")

        if user_id not in self.users:
            print(f"User with id {user_id} not found - deletion failed")
            return user_pb2.DeleteUserResponse(
                success=False, message=f"User with id {user_id} not found"
            )

        del self.users[user_id]
        print(f"User with id {user_id} successfully deleted")

        return user_pb2.DeleteUserResponse(
            success=True, message="User successfully deleted"
        )


def serve():
    port = "50051"
    print(f"Starting gRPC server on port {port}...")

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    user_pb2_grpc.add_UserServiceServicer_to_server(UserServiceServicer(), server)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"Server is running on port {port} and ready to accept requests")
    print("Press Ctrl+C to stop the server")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
