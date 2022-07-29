import { client } from "../../../config/redis/client";
import {
  AgencyType,
  ReqAgencyViewType,
  TopHitAgencyType,
  TopHitAreaType,
  UserLikeAgencyOpType,
} from "@models/agency-model";
import { IAgencyRepo } from "../agency-repo";

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

type ScoreValueType = {
  value: string; // Format => agency:${id}
  score: number;
};

export class RedisAgencyRepoImpl implements IAgencyRepo {
  /**
   * 부동산 정보를 저장합니다.
   * @param {AgencyType} agency 부동산 정보
   */
  async persist(agency: AgencyType): Promise<void> {
    await client
      .multi()
      .HSET(`agency:${agency.id}`, "id", agency.id)
      .HSET(`agency:${agency.id}`, "y", agency.y)
      .HSET(`agency:${agency.id}`, "x", agency.x)
      .HSET(`agency:${agency.id}`, "phone", agency.phone)
      .HSET(`agency:${agency.id}`, "placeName", agency.placeName)
      .HSET(`agency:${agency.id}`, "addressName", agency.addressName)
      .geoAdd(`agency`, {
        longitude: agency.x,
        latitude: agency.y,
        member: agency.id,
      })
      .exec();
  }

  /**
   * 키워드 검색 결과 부동산 정보를 저장합니다.
   * @param {string} keyword 검색 키워드
   * @param {number} id 검색 키워드 결과에 일치하는 부동산 Id
   */
  async persistAgencyByKeyword(keyword: string, id: number): Promise<void> {
    await client.SADD(`agencies_keyword:${keyword}`, id);
  }

  /**
   * 검색 키워드 기준 반경, 부동산을 검색합니다.
   * @param {string} keyword 검색 키워드
   */
  async searchByKeyword(keyword: string): Promise<AgencyType[]> {
    const ids = await client.SMEMBERS(`agencies_keyword:${keyword}`);
    const agencies: AgencyType[] = [];
    await Promise.all(
      ids.map(async (id: any) => {
        const agency = (await this.get(+id)) as AgencyType;
        agencies.push(agency);
      })
    );
    return agencies;
  }

  /**
   * 매개변수 (위도/경도) 기준, radius 반경으로 부동산을 검색합니다.
   * @param {number} lat 위도
   * @param {number} lng 경도
   * @param {number} radius 검색 반경
   */
  async searchByRadius(
    lat: number,
    lng: number,
    radius: number
  ): Promise<AgencyType[]> {
    const ids = await client.GEOSEARCH(
      "agency",
      { latitude: lat, longitude: lng },
      { radius: radius, unit: "m" }
    );
    const agencies: AgencyType[] = [];
    await Promise.all(
      ids.map(async (id: any) => {
        const agency = (await this.get(+id)) as AgencyType;
        agencies.push(agency);
      })
    );
    return agencies;
  }

  /**
   * agencyId에 일치하는 부동산 정보를 반환합니다.
   * @param {number} id 부동산 Id
   */
  async get(id: number): Promise<AgencyType> {
    const agency = (await client.HGETALL(`agency:${id}`)) as AgencyType;
    // REFACTORING: Combining (likes/stars) into agency
    agency.likes = 0;
    agency.stars = 0.0;
    if (!this.isEmpty(agency)) {
      const likes = await client.SCARD(`agency:${id}:likes`);
      const sumOfRatings = await client.GET(`review:${id}:ratings`);
      const reviewCount = await client.ZCARD(`review:${id}:likes`);

      agency.likes = likes;
      agency.reviewCount = reviewCount;
      if (reviewCount != 0) {
        agency.stars = sumOfRatings / reviewCount;
      }
    }
    // 부동산 조회수
    agency.views = await this.getViews(id);
    return agency;
  }

  private isEmpty(agency: AgencyType): boolean {
    return (
      !agency.id ||
      !agency.y ||
      !agency.x ||
      !agency.placeName ||
      !agency.addressName
    );
  }

  /**
   * agencyId에 일치하는 부동산 조회수를 반환합니다.
   * @param {number} id 검색할 부동산 Id
   */
  async getViews(id: number): Promise<number> {
    const agencyViews = (await client.HGETALL(`agency:${id}:views`)) as number;
    return agencyViews === undefined ? 0 : agencyViews;
  }

  /**
   * 조회수가 가장 높은 최대 상위 15개 부동산 정보를 반환합니다.
   * @param {string} query Fetch할 부동산 개수(15개)
   */
  async getTopHitAgencies(query: string): Promise<TopHitAgencyType[]> {
    const range: string[] = query.split("~");
    const scoreValues = (await client.ZRANGE_WITHSCORES(
      "realtime_agencies_views",
      range[0],
      range[range.length - 1],
      { REV: true }
    )) as any[];

    const topHitAgencies: TopHitAgencyType[] = [];
    await Promise.all(
      scoreValues.map(async (scoreValue: any) => {
        const agencyId = +scoreValue.value.split(":")[1];
        const agency = (await this.get(agencyId)) as AgencyType;
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
  async getTopHitAreas(query: string): Promise<TopHitAreaType[]> {
    const range: string[] = query.split("~");
    const scoreValues = (await client.ZRANGE_WITHSCORES(
      "realtime_area_views",
      range[0],
      range[range.length - 1],
      {
        REV: true,
      }
    )) as any[];

    const topHitAreas: TopHitAreaType[] = [];
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
  async mergeViews(reqAgencyView: ReqAgencyViewType): Promise<void> {
    const { id, user, addressName } = reqAgencyView;
    if (!(await this.isPassed24Hours(id, user.id))) return;
    await client
      .multi()
      .HSET(
        `agency:${id}:last_view_time`,
        `user:${user.id}`,
        new Date().getTime() / 1000
      )
      .HINCRBY(`agency:${id}:views`, `range:${user.ageRange.split("~")[0]}`, 1)
      // 실시간 인기 검색어 +1
      .ZINCRBY(`realtime_agencies_views`, 1, `agency:${id}`)
      .ZINCRBY(
        `realtime_area_views`,
        1,
        `area:${this.getFullAreaName(addressName)}`
      )
      .exec();
  }

  private async isPassed24Hours(
    agencyId: number,
    userId: number
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
   * @param agencyId
   * @param userLikeAgencyOpType
   */
  async mergeLikes(
    agencyId: string,
    userLikeAgencyOpType: UserLikeAgencyOpType
  ): Promise<void> {
    const { userId, operation } = userLikeAgencyOpType;
    if (!(await this.isValidOperation(operation, { agencyId, userId })))
      return { result: "failed" };
    if (operation === "increase") {
      // 부동산 '좋아요'
      const result = await client.SADD(
        `agency:${agencyId}:likes`,
        `user:${userId}`
      );
      return { result: sortedSet.toString(result) };
    } else {
      // 부동산 '좋아요' 취소
      const result = await client.SREM(
        `agency:${agencyId}:likes`,
        `user:${userId}`
      );
      return { result: sortedSet.toString(result) };
    }
  }

  private isValidOperation(
    operation: string,
    agencyUserId: AgencyUserIdType
  ): boolean {}

  /**
   * user:{userId}가 agency:{agencyId}를 좋아하는지 확인합니다.
   * @param {number} agencyId 검색할 부동산 Id
   * @param {number} userId 검색할 부동산 Id
   */
  private async isUserLikeThisAgency(
    agencyId: number,
    userId: number
  ): Promise<boolean> {
    return await client.SISMEMBER(`agency:${agencyId}:likes`, `user:${userId}`);
  }
}
