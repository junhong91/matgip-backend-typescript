import { Response, ResponseType } from "../response";

export class ResponseImpl<T> implements Response<T> {
  constructor(private successValue: T, private alreadyAdded: T) {}

  toServiceResponse(result: T): ResponseType {
    switch (result) {
      case this.successValue:
        return { reason: "success" };
      case this.alreadyAdded:
        return { reason: "already-added" };
      default:
        return { reason: "failed" };
    }
  }
}
