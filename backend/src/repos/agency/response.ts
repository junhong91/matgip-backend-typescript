export type ResponseType = {
  reason: string;
};

export interface Response<T> {
  toServiceResponse(result: T): ResponseType;
}
