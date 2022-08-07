export type ResponseType = {
  reason: string;
};

export interface Response<T> {
  respond(result: T): ResponseType;
}
