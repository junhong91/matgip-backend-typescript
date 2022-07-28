import {
  AgencyType,
  AgencyViewType,
  TopHitAgencyType,
  TopHitAreaType,
} from "@models/agency-model";

export interface AgencyRepository {
  /**
   * 부동산 정보를 저장합니다.
   * @param {AgencyType} agency 부동산 정보
   */
  persist(agency: AgencyType): Promise<void>;

  /**
   * 키워드 검색 결과 부동산 정보를 저장합니다.
   * @param {string} keyword 검색 키워드
   * @param {number} id 검색 키워드 결과에 일치하는 부동산 Id
   */
  persistAgencyByKeyword(keyword: string, id: number): Promise<void>;

  /**
   * 검색 키워드 기준 반경, 부동산을 검색합니다.
   * @param {string} keyword 검색 키워드
   */
  searchByKeyword(keyword: string): Promise<AgencyType[]>;

  /**
   * 매개변수 (위도/경도) 기준, radius 반경으로 부동산을 검색합니다.
   * @param {number} lat 위도
   * @param {number} lng 경도
   * @param {number} radius 검색 반경
   */
  searchByRadius(
    lat: number,
    lng: number,
    radius: number
  ): Promise<AgencyType[]>;

  /**
   * agencyId에 일치하는 부동산 정보를 반환합니다.
   * @param {string} id 부동산 Id
   */
  get(id: string): Promise<AgencyType>;

  /**
   * agencyId에 일치하는 부동산 조회수를 반환합니다.
   * @param {number} id 검색할 부동산 Id
   */
  getViews(id: number): Promise<number>;

  /**
   * agencyId에 일치하는 부동산 '좋아요' 개수를 반환합니다.
   * @param {number} id 검색할 부동산 Id
   */
  getLikes(id: number): Promise<number>;

  /**
   * 조회수가 가장 높은 최대 상위 15개 부동산 정보를 반환합니다.
   * @param {string} query Fetch할 부동산 개수(15개)
   */
  getTopHitAgencies(query: string): Promise<TopHitAgencyType[]>;

  /**
   * 조회수가 높은 지역의 최대 상위 15개 정보를 반환합니다.
   * @param {string} query Fetch할 장소 개수(15개)
   */
  getTopHitAreas(query: string): Promise<TopHitAreaType[]>;

  /**
   * 실시간으로 선택된 부동산의 view count를 1 증가 시킵니다.
   * 동일한 user는 24시간이 지난 후에 view count가 1 증가됩니다.(24 이전 중복 불가)
   * @param agencyViewType
   */
  mergeViews(agencyViewType: AgencyViewType): Promise<void>;

  /**
   *
   * @param agencyId
   * @param userId
   */
  mergeLikes(agencyId: string, userId: string): Promise<void>;
}
