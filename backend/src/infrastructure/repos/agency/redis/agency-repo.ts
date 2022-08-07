import { client } from "../../../config/redis/client";
import * as Model from "@models/agency/agency-model";
import { ResponseType } from "../../../../models/agency/response";
import * as Responser from "./redis-response";
import { IAgencyRepo } from "../../../../models/agency/agency-repo";

let baseTime: string = new Date().toLocaleDateString();
function flush() {
  baseTime = new Date().toLocaleDateString();
  client
    .multi()
    .DEL("realtime_agencies_views")
    .DEL("realtime_area_views")
    .exec();
}
setInterval(flush, 24 * 3600 * 1000);

export class RedisAgencyRepoImpl implements IAgencyRepo {
  /**
   * 부동산 정보를 저장합니다.
   * @param agency 부동산 정보
   * @param geoDbName 부동산 지리 정보를 저장할 database 이름
   */
  async persist(
    agency: Model.AgencyType,
    geoDbName: string = "agency"
  ): Promise<void> {
    if (agency.id == null || agency.y == null || agency.x == null)
      throw new Error("agency [id/y/x] can't be null or undefined...");
    await client
      .multi()
      .HSET(`agency:${agency.id}`, "id", agency.id)
      .HSET(`agency:${agency.id}`, "y", agency.y)
      .HSET(`agency:${agency.id}`, "x", agency.x)
      .HSET(`agency:${agency.id}`, "phone", agency.phone || "")
      .HSET(`agency:${agency.id}`, "placeName", agency.placeName || "")
      .HSET(`agency:${agency.id}`, "addressName", agency.addressName || "")
      .geoAdd(geoDbName, {
        longitude: agency.x,
        latitude: agency.y,
        member: agency.id.toString(),
      })
      .exec();
  }

  /**
   * 키워드 검색 결과 부동산 정보를 저장합니다.
   * @param keyword 검색 키워드
   * @param id 검색 키워드 결과에 일치하는 부동산 Id
   */
  async persistAgencyByKeyword(
    keyword: string,
    id: Model.Identification
  ): Promise<void> {
    await client.SADD(`agencies_keyword:${keyword}`, id);
  }

  /**
   * 검색 키워드 기준 반경, 부동산을 검색합니다.
   * @param keyword 검색 키워드
   * @return keyword를 만족하는 부동산 정보들
   */
  async searchByKeyword(keyword: string): Promise<Model.AgencyType[]> {
    const ids = await client.SMEMBERS(`agencies_keyword:${keyword}`);
    const agencies: Model.AgencyType[] = [];
    await Promise.all(
      ids.map(async (id: Model.Identification) => {
        const agency = await this.get(id);
        agencies.push(agency);
      })
    );
    return agencies;
  }

  /**
   * 매개변수 (위도/경도) 기준, radius 반경으로 부동산을 검색합니다.
   * @param geoSearchUnit (위도,경도,검색 반경) 정보
   * @param geoDbName 부동산 지리 정보를 검색할 database 이름
   * @return (위도/경도) 기준 radius 반경에 있는 부동산 정보들
   */
  async searchByRadius(
    geoSearchUnit: Model.GeoSearchByRadius,
    geoDbName?: string
  ): Promise<Model.AgencyType[]> {
    const ids = await client.GEOSEARCH(
      geoDbName,
      { latitude: geoSearchUnit.lat, longitude: geoSearchUnit.lng },
      { radius: geoSearchUnit.radius, unit: "m" }
    );
    const agencies: Model.AgencyType[] = [];
    await Promise.all(
      ids.map(async (id: Model.Identification) => {
        const agency = await this.get(id);
        agencies.push(agency);
      })
    );
    return agencies;
  }

  /**
   * agencyId에 일치하는 부동산 정보를 반환합니다.
   * @param id 부동산 Id
   * @return 일치하는 부동산 정보
   */
  async get(id: Model.Identification): Promise<Model.AgencyType> {
    let agency: Model.AgencyType;
    agency = await client.HGETALL(`agency:${id}`);
    if (this.isEmpty(agency)) {
      throw new Error("real estate agency is not exist...");
    }
    // REFACTORING: Combining (likes/stars) into agency
    const likes = await client.SCARD(`agency:${id}:likes`);
    agency.likes = likes;

    const sumOfRatings = await client.GET(`review:${id}:ratings`);
    const reviewCount = await client.ZCARD(`review:${id}:likes`);
    agency.reviewCount = reviewCount;
    if (reviewCount != 0) {
      agency.stars = sumOfRatings / reviewCount;
    }

    // 부동산 연령대별 조회수
    agency.views = await this.getViews(id);
    return agency;
  }

  private isEmpty(agency: Model.AgencyType): boolean {
    return (
      !agency.id ||
      !agency.y ||
      !agency.x ||
      !agency.placeName ||
      !agency.addressName
    );
  }

  /**
   * agencyId에 일치하는 부동산 연령대별 조회수를 반환합니다.
   * @param id 검색할 부동산 Id
   * @return 연령대별 부동산 조회수 e.g. { "20":1, "30": 3, }
   */
  async getViews(id: Model.Identification): Promise<Object> {
    const agencyViews = await client.HGETALL(`agency:${id}:views`);
    return agencyViews;
  }

  /**
   * 조회수가 가장 높은 최대 상위 15개 부동산 정보를 반환합니다.
   * @param query Fetch할 부동산 개수(15개)
   */
  async getTopHitAgencies(query: string): Promise<Model.TopHitAgencyType[]> {
    const range: string[] = query.split("~");
    const scoreValues = (await client.ZRANGE_WITHSCORES(
      "realtime_agencies_views",
      range[0],
      range[range.length - 1],
      { REV: true }
    )) as any[];

    const topHitAgencies: Model.TopHitAgencyType[] = [];
    await Promise.all(
      scoreValues.map(async (scoreValue: any) => {
        const agencyId = +scoreValue.value.split(":")[1];
        const agency = (await this.get(agencyId)) as Model.AgencyType;
        topHitAgencies.push({
          baseTime: baseTime,
          agencyName: agency.placeName,
          addressName: agency.addressName,
          views: scoreValue.score,
        });
      })
    );
    return topHitAgencies;
  }

  /**
   * 조회수가 높은 지역의 최대 상위 15개 정보를 반환합니다.
   * @param {string} query Fetch할 장소 개수(15개)
   */
  async getTopHitAreas(query: string): Promise<Model.TopHitAreaType[]> {
    const range: string[] = query.split("~");
    const scoreValues = (await client.ZRANGE_WITHSCORES(
      "realtime_area_views",
      range[0],
      range[range.length - 1],
      {
        REV: true,
      }
    )) as any[];

    const topHitAreas: Model.TopHitAreaType[] = [];
    await Promise.all(
      scoreValues.map(async (scoreValue) => {
        const areaName = scoreValue.value.split(":")[1];
        topHitAreas.push({
          areaName,
          views: +scoreValue.score,
        });
      })
    );
    return topHitAreas;
  }

  /**
   * 실시간으로 선택된 부동산의 view count를 1 증가 시킵니다.
   * 동일한 user는 24시간이 지난 후에 view count가 1 증가됩니다.(24 이전 중복 불가)
   * @param reqAgencyView
   */
  async mergeViews(
    reqAgencyView: Model.ReqTypeForAgencyViewCount
  ): Promise<void> {
    const { agencyId, user, addressName } = reqAgencyView;
    if (!(await this.isPassed24Hours(agencyId, user.id))) return;
    await client
      .multi()
      .HSET(
        `agency:${agencyId}:last_view_time`,
        `user:${user.id}`,
        new Date().getTime() / 1000
      )
      .HINCRBY(
        `agency:${agencyId}:views`,
        `range:${user.ageRange.split("~")[0]}`,
        1
      )
      // 실시간 인기 검색어 +1
      .ZINCRBY(`realtime_agencies_views`, 1, `agency:${agencyId}`)
      .ZINCRBY(
        `realtime_area_views`,
        1,
        `area:${this.getFullAreaName(addressName)}`
      )
      .exec();
  }

  private async isPassed24Hours(
    agencyId: Model.Identification,
    userId: Model.Identification
  ): Promise<boolean> {
    const lastViewTime = await client.HGET(
      `agency:${agencyId}:last_view_time`,
      `user:${userId}`
    );
    const currentTime = new Date().getTime() / 1000;
    return currentTime - lastViewTime > 24 * 3600;
  }

  private getFullAreaName(addressName: string): string {
    const split = addressName.split(" ");
    return split.slice(0, split.length - 2).join(" ");
  }

  /**
   * 유저가 부동산 "좋아요" 버튼을 클릭했을 때, (좋아요/좋아요 취소) 를 수행합니다.
   * @param agencyId 선택된 부동산 Id
   * @param userLikeOperation 유저가 요청한 (좋아요/좋아요 취소) 정보
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  async mergeLikes(
    agencyId: Model.Identification,
    userLikeOperation: Model.UserLikeOperation
  ): Promise<ResponseType> {
    const { userId, operation } = userLikeOperation;
    if (userId == null || agencyId == null || operation == null)
      throw new Error("[userId/agencyId/operation] can not be null");

    if (!(await this.isValidOperation(operation, agencyId, userId)))
      throw new Error("Invalid operation");

    let result: number;
    const enum SortedSetState {
      SUCCESS = 1,
    }
    const sortedSetResponder = new Responser.ResponseImpl<number>(
      SortedSetState.SUCCESS
    );
    switch (operation) {
      case "increase":
        result = (await client.SADD(
          `agency:${agencyId}:likes`,
          `user:${userId}`
        )) as number;
        return sortedSetResponder.respond(result);
      case "decrease":
        result = (await client.SREM(
          `agency:${agencyId}:likes`,
          `user:${userId}`
        )) as number;
        return sortedSetResponder.respond(result);
      default:
        throw new Error(
          "Invalid operations...(increase/decrease) are valid operations."
        );
    }
  }

  private async isValidOperation(
    operation: Model.Operation,
    agencyId: Model.Identification,
    userId: Model.Identification
  ): Promise<boolean> {
    const isUserLike = await this.isUserLikeThisAgency(agencyId, userId);
    if (isUserLike && operation === "decrease") return true;
    if (!isUserLike && operation === "increase") return true;
    return false;
  }

  /**
   * user:{userId}가 agency:{agencyId}를 좋아하는지 확인합니다.
   * @param agencyId 검색할 부동산 Id
   * @param userId 검색할 부동산 Id
   * @return 좋아하면 true, 좋아하지 않으면 false
   */
  private async isUserLikeThisAgency(
    agencyId: Model.Identification,
    userId: Model.Identification
  ): Promise<boolean> {
    return await client.SISMEMBER(`agency:${agencyId}:likes`, `user:${userId}`);
  }

  /**
   * agencyId와 일치하는 부동산 정보를 db에서 삭제합니다.
   * @param agencyId 삭제할 agencyId
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  async removeAgency(agencyId: Model.Identification): Promise<ResponseType> {
    enum state {
      SUCCESS = 1,
    }
    const responder = new Responser.ResponseImpl<number>(state.SUCCESS);
    const cmdResult = await client.DEL(`agency:${agencyId}`);
    return responder.respond(cmdResult);
  }

  /**
   * agencyId와 일치하는 부동산 '좋아요' 정보를 db에서 삭제합니다.
   * @param agencyId 삭제할 agencyId
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  async removeAgencyLikes(
    agencyId: Model.Identification
  ): Promise<ResponseType> {
    enum state {
      SUCCESS = 1,
    }
    const responder = new Responser.ResponseImpl<number>(state.SUCCESS);
    const cmdResult = await client.DEL(`agency:${agencyId}:likes`);
    return responder.respond(cmdResult);
  }

  /**
   * geoDbName과 일치하는 위치정보 database를 삭제합니다.
   * @param geoDbName 삭제할 Geography database name
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  async removeGeoDb(geoDbName: string): Promise<ResponseType> {
    enum state {
      SUCCESS = 1,
    }
    const responder = new Responser.ResponseImpl<number>(state.SUCCESS);
    const cmdResult = await client.DEL(geoDbName);
    return responder.respond(cmdResult);
  }
}
