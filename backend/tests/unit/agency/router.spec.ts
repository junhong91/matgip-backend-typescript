import StatusCodes from "http-status-codes";
import { agencyHandler } from "../../../src/interfaces/routes/agency-router";

// const agencyId = { agencyId: "testAgency1" };
// const resp = {
//   id: agencyId,
//   y: "37.257840112491124",
//   x: "127.05992545407956",
//   phone: "",
//   placeName: "테라공인중개사사무소",
//   addressName: "경기도 수원시 영통구 매탄동 409-26",
//   likes: 0,
//   reviewCount: 0,
//   views: {},
// };

describe("GET - fetch agency", () => {
  it("BAD REQUEST - missing agency identification", async () => {
    const req = {
      params: {},
    };
    const res = {
      sendStatus: function (reasonCode: number): number {
        return reasonCode;
      },
    };
    expect(await agencyHandler(req, res)).toBe(StatusCodes.BAD_REQUEST);
  });

  it("INTERNAL SERVER ERROR - database client disconnected", async () => {
    const req = {
      params: {
        agencyId: "testAgency1",
      },
    };
    const res = {
      sendStatus: function (reasonCode: number): number {
        return reasonCode;
      },
    };

    expect(await agencyHandler(req, res)).toBe(
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  });
});
