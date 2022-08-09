/**
 * For a detailed explanation of setting jest, visit:
 * https://thewebdev.info/2022/03/04/how-to-fix-the-cannot-find-module-when-importing-components-with-absolute-paths-with-jest/
 * https://betterprogramming.pub/database-testing-made-easy-with-jest-db96ad5f1f46
 */
import { client } from "src/infrastructure/config/redis/client";
import * as Model from "src/models/agency/agency-model";

const AgencyRepository = require("../../../src/infrastructure/repos/agency/index");

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
  it("should save and get by agency id", async () => {
    const agencyId = "testAgency1";
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
    await AgencyRepository.persist(agencyToStore, geoDbName);

    const agencyStored = await AgencyRepository.get(agencyId);
    expect(agencyStored).toEqual(agencyExpected);

    let response;
    response = await AgencyRepository.removeAgency(agencyId);
    expect(response.reason).toEqual("success");

    response = await AgencyRepository.removeGeoDb(geoDbName);
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
  it("should save and get agencies that meets the (lat/lng/radius) option", async () => {
    const geoDbName = "testGeoDb";
    const agenciesToStore = [
      {
        id: "testAgency1",
        y: 37.257840112491124,
        x: 127.05992545407956,
        placeName: "테라공인중개사사무소",
        addressName: "경기도 수원시 영통구 매탄동 409-26",
      },
      {
        id: "testAgency2",
        y: 37.25831364654198,
        x: 127.05895637456912,
        placeName: "황토 공인중개사사무소",
        addressName: "경기 수원시 영통구 매탄동 410-12",
      },
      {
        id: "testAgency3",
        y: 37.257481883788,
        x: 127.06005198710506,
        placeName: "굿애플공인중개사사무소",
        addressName: "경기 수원시 영통구 신원로250번길 2 엘타워 1층 102호",
      },
    ];

    for (let agency of agenciesToStore) {
      await AgencyRepository.persist(agency, geoDbName);
    }

    let results;
    results = await AgencyRepository.searchByRadius(
      {
        lat: 37.257481883788,
        lng: 127.06005198710506,
        radius: 140,
      },
      geoDbName
    );
    expect(results.length).toEqual(3);

    results = await AgencyRepository.searchByRadius(
      {
        lat: 37.257481883788,
        lng: 127.06005198710506,
        radius: 50,
      },
      geoDbName
    );
    expect(results.length).toEqual(2);

    results = await AgencyRepository.searchByRadius(
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
      response = await AgencyRepository.removeAgency(agency.id);
      expect(response.reason).toEqual("success");
    }

    response = await AgencyRepository.removeGeoDb(geoDbName);
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

  it("should increase/decrease like count and not performed in invalid operations", async () => {
    const agencyId = "testAgency1";
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
      userId: "testUser1",
      operation: "increase" as Model.Operation,
    };

    await AgencyRepository.persist(agencyToScore, geoDbName);

    let response;
    response = await AgencyRepository.mergeLikes(agencyId, userLikeOp);
    expect(response.reason).toEqual("success");

    // 1. Check if like count increased to 1
    let agency;
    agency = await AgencyRepository.get(agencyId);
    expect(agency.likes).toEqual(1);

    // 2. Check invalid operation: Cannot increase like count with same user in multiple times
    await expect(
      AgencyRepository.mergeLikes(agencyId, userLikeOp)
    ).rejects.toThrowError(new Error("Invalid operation"));

    // 3. Check if like count decreased to 0
    userLikeOp = {
      userId: "testUser1",
      operation: "decrease" as Model.Operation,
    };

    response = await AgencyRepository.mergeLikes(agencyId, userLikeOp);
    expect(response.reason).toEqual("success");

    agency = await AgencyRepository.get(agencyId);
    expect(agency.likes).toEqual(0);

    // 4. Check invalid operation: Cannot decrease like count if user doesn't like this agency
    await expect(
      AgencyRepository.mergeLikes(agencyId, userLikeOp)
    ).rejects.toThrowError(new Error("Invalid operation"));

    // Flush all test datas from redis database
    response = await AgencyRepository.removeAgency(agencyId);
    expect(response.reason).toEqual("success");
    response = await AgencyRepository.removeGeoDb(geoDbName);
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

  it("should (increase/decrease) view count and not performed if is passed 24 hours", async () => {
    const agencyId = "testAgency1";
    const geoDbName = "testGeoDb";
    const agencyToScore = {
      id: agencyId,
      y: 37.257840112491124,
      x: 127.05992545407956,
      placeName: "테라공인중개사사무소",
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    const reqAgencyView = {
      agencyId: agencyId,
      user: {
        id: "testUser1",
        ageRange: "30~39",
      },
      addressName: "경기도 수원시 영통구 매탄동 409-26",
    };
    let response;

    // 1. Save real estate agency & increase view count
    await AgencyRepository.persist(agencyToScore, geoDbName);
    response = await AgencyRepository.mergeViews(reqAgencyView);
    expect(response.reason).toEqual("success");

    // 2. Check if saved correctly...
    const agencyStored = await AgencyRepository.getViews(agencyId);
    expect(agencyStored["range:30"]).toEqual("1");

    // 3. Fetch top hits agencies
    const topHitsAgencies = await AgencyRepository.getTopHitAgencies("0~14");
    expect(topHitsAgencies.length).toEqual(1);
    expect(topHitsAgencies[0].agencyName).toEqual("테라공인중개사사무소");
    expect(topHitsAgencies[0].addressName).toEqual(
      "경기도 수원시 영통구 매탄동 409-26"
    );

    // 4. Fetch top hits areas
    const topHitsAreas = await AgencyRepository.getTopHitAreas("0~14");
    expect(topHitsAreas.length).toEqual(1);
    expect(topHitsAreas[0].views).toEqual(1);
    expect(topHitsAreas[0].areaName).toEqual("경기도 수원시 영통구");

    // Flush all test datas from redis database
    response = await AgencyRepository.removeAgency(agencyId);
    expect(response.reason).toEqual("success");
    response = await AgencyRepository.removeGeoDb(geoDbName);
    expect(response.reason).toEqual("success");
    await client.DEL("realtime_agencies_views");
    await client.DEL("realtime_area_views");
    await client.DEL(`agency:${agencyId}:views`);
    await client.DEL(`agency:${agencyId}:last_view_time`);
  });
});
