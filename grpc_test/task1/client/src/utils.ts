import { ServiceError } from "@grpc/grpc-js";

export function promisifyCall<TRequest, TResponse, TClient>(
  client: TClient,
  method: keyof TClient,
  request: TRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const clientMethod = client[method] as (
      req: TRequest,
      callback: (error: ServiceError | null, response: TResponse) => void,
    ) => void;

    clientMethod.call(
      client,
      request,
      (error: ServiceError | null, response: TResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
}
