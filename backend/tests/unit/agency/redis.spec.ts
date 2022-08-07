/**
 * For a detailed explanation of setting jest, visit:
 * https://thewebdev.info/2022/03/04/how-to-fix-the-cannot-find-module-when-importing-components-with-absolute-paths-with-jest/
 * https://betterprogramming.pub/database-testing-made-easy-with-jest-db96ad5f1f46
 */
import { client } from "src/infrastructure/config/redis/client";
import * as RedisRepo from "src/infrastructure/repos/agency/redis/agency-repo";

describe("PERSIST real estate agency information", () => {
  /**
   * Set up db connection
   */
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.quit();
  });

  /**
   * Test to save/get real estate agency information
   */
  it("persist()/get() - save and get by agency id", async () => {
    const agencyId = "testAgency:1";
    const geoDbName = "testGeoDb";
    const agencyToStore = {
      id: agencyId,
      y: "37.257840112491124",
      x: "127.05992545407956",
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    const agencyExpected = {
      id: agencyId,
      y: "37.257840112491124",
      x: "127.05992545407956",
      phone: "",
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
      likes: 0,
      reviewCount: 0,
      views: {},
    };
    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    await agencyRepo.persist(agencyToStore, geoDbName);

    const agencyStored = await agencyRepo.get(agencyId);
    expect(agencyStored).toEqual(agencyExpected);

    let response;
    response = await agencyRepo.removeAgency(agencyId);
    expect(response.reason).toEqual("success");

    response = await agencyRepo.removeGeoDb(geoDbName);
    expect(response.reason).toEqual("success");
  });

  it("persist() - agency id can't be null/undefined", async () => {
    const geoDbName = "testGeoDb";
    const idCannotBeEmpty = {
      y: "37.257840112491124",
      x: "127.05992545407956",
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    await expect(async () => {
      await agencyRepo.persist(idCannotBeEmpty, geoDbName);
    }).rejects.toThrowError(
      new Error("agency [id/y/x] can't be null or undefined...")
    );
  });

  it("persist() - latitude can't be null/undefined", async () => {
    const agencyId = "testAgency:1";
    const geoDbName = "testGeoDb";
    const latitudeCannotBeEmpty = {
      id: agencyId,
      x: "127.05992545407956",
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    await expect(async () => {
      await agencyRepo.persist(latitudeCannotBeEmpty, geoDbName);
    }).rejects.toThrowError(
      new Error("agency [id/y/x] can't be null or undefined...")
    );
  });

  it("persist() - longitude can't be null/undefined", async () => {
    const agencyId = "testAgency:1";
    const geoDbName = "testGeoDb";
    const longitudeCannotBeEmpty = {
      id: agencyId,
      y: "37.257840112491124",
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    await expect(async () => {
      await agencyRepo.persist(longitudeCannotBeEmpty, geoDbName);
    }).rejects.toThrowError(
      new Error("agency [id/y/x] can't be null or undefined...")
    );
  });
});
