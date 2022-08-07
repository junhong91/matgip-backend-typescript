import { Response, ResponseType } from "../../../../models/agency/response";

export class ResponseImpl<T> implements Response<T> {
  constructor(private successValue: T, private alreadyAdded?: T) {}

  respond(result: T): ResponseType {
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
