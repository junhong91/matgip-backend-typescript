/**
 * For a detailed explanation of setting jest, visit:
 * https://thewebdev.info/2022/03/04/how-to-fix-the-cannot-find-module-when-importing-components-with-absolute-paths-with-jest/
 * https://betterprogramming.pub/database-testing-made-easy-with-jest-db96ad5f1f46
 */
import { client } from "src/infrastructure/config/redis/client";
import * as RedisRepo from "src/infrastructure/repos/agency/redis/agency-repo";
import * as Model from "src/models/agency/agency-model";

describe("PERSIST - real estate agency information", () => {
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
      y: 37.257840112491124,
      x: 127.05992545407956,
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
});

describe("SEARCHBYRADIUS - search estate agency by (lat/lng/radius)", () => {
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
   * Test for searching real estate agencies by (lat/lng/radius)
   */
  it("searchByRadius() - save and get agencies that meets the (lat/lng/radius) option", async () => {
    const geoDbName = "testGeoDb";
    const agenciesToStore = [
      {
        id: "testAgency:1",
        y: 37.257840112491124,
        x: 127.05992545407956,
        placeName: "테라공인중개사사무소",
        addressName: "경기도 수원시 영통구 매탄동 409-26",
      },
      {
        id: "testAgency:2",
        y: 37.25831364654198,
        x: 127.05895637456912,
        placeName: "황토 공인중개사사무소",
        addressName: "경기 수원시 영통구 매탄동 410-12",
      },
      {
        id: "testAgency:3",
        y: 37.257481883788,
        x: 127.06005198710506,
        placeName: "굿애플공인중개사사무소",
        addressName: "경기 수원시 영통구 신원로250번길 2 엘타워 1층 102호",
      },
    ];

    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    for (let agency of agenciesToStore) {
      await agencyRepo.persist(agency, geoDbName);
    }

    let results;
    results = await agencyRepo.searchByRadius(
      {
        lat: 37.257481883788,
        lng: 127.06005198710506,
        radius: 140,
      },
      geoDbName
    );
    expect(results.length).toEqual(3);

    results = await agencyRepo.searchByRadius(
      {
        lat: 37.257481883788,
        lng: 127.06005198710506,
        radius: 50,
      },
      geoDbName
    );
    expect(results.length).toEqual(2);

    results = await agencyRepo.searchByRadius(
      {
        lat: 37.257481883788,
        lng: 127.06005198710506,
        radius: 20,
      },
      geoDbName
    );
    expect(results.length).toEqual(1);

    let response;
    for (let agency of agenciesToStore) {
      response = await agencyRepo.removeAgency(agency.id);
      expect(response.reason).toEqual("success");
    }

    response = await agencyRepo.removeGeoDb(geoDbName);
    expect(response.reason).toEqual("success");
  });
});

describe("LIKES - increase/decrease like count of real estate agency", () => {
  /**
   * Set up db connection
   */
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.quit();
  });

  it("mergeLikes() - increase like / decrease like and check if is invalid operation", async () => {
    const agencyId = "testAgency:1";
    const geoDbName = "testGeoDb";
    const agencyToScore = {
      id: agencyId,
      y: 37.257840112491124,
      x: 127.05992545407956,
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };

    let userLikeOp;
    userLikeOp = {
      userId: "testUser:1",
      operation: "increase" as Model.Operation,
    };

    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    await agencyRepo.persist(agencyToScore, geoDbName);

    let response;
    response = await agencyRepo.mergeLikes(agencyId, userLikeOp);
    expect(response.reason).toEqual("success");

    // 1. Check if like count increased to 1
    let agency;
    agency = await agencyRepo.get(agencyId);
    expect(agency.likes).toEqual(1);

    // 2. Check invalid operation: Cannot increase like count with same user in multiple times
    await expect(
      agencyRepo.mergeLikes(agencyId, userLikeOp)
    ).rejects.toThrowError(new Error("Invalid operation"));

    // 3. Check if like count decreased to 0
    userLikeOp = {
      userId: "testUser:1",
      operation: "decrease" as Model.Operation,
    };

    response = await agencyRepo.mergeLikes(agencyId, userLikeOp);
    expect(response.reason).toEqual("success");

    agency = await agencyRepo.get(agencyId);
    expect(agency.likes).toEqual(0);

    // 4. Check invalid operation: Cannot decrease like count if user doesn't like this agency
    await expect(
      agencyRepo.mergeLikes(agencyId, userLikeOp)
    ).rejects.toThrowError(new Error("Invalid operation"));

    // Flush all test datas from redis database
    response = await agencyRepo.removeAgency(agencyId);
    expect(response.reason).toEqual("success");

    response = await agencyRepo.removeGeoDb(geoDbName);
    expect(response.reason).toEqual("success");
  });
});

describe("VIEWS - increase/decrease view count of real estate agency", () => {
  /**
   * Set up db connection
   */
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.quit();
  });

  it("mergeViews() - increase / decrease view count and check if is passed 24 hours", async () => {
    const agencyId = "testAgency:1";
    const reqAgencyView = {
      agencyId: agencyId,
      user: {
        id: "testUser:1",
        ageRange: "30~39",
      },
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    let response;

    const agencyRepo = new RedisRepo.RedisAgencyRepoImpl();
    response = await agencyRepo.mergeViews(reqAgencyView);
    expect(response.reason).toEqual("success");

    // Check if saved correctly...
    expect(await client.HGET(`agency:${agencyId}:views`, "range:30")).toEqual(
      "1"
    );
  });
});
