import * as Model from "@models/agency/agency-model";

import { ResponseType } from "./response";

export interface IAgencyRepo {
  /**
   * 부동산 정보를 저장합니다.
   * @param agency 부동산 정보
   * @param geoDbName 부동산 지리 정보를 저장할 database 이름
   */
  persist(agency: Model.AgencyType, geoDbName?: string): Promise<void>;

  /**
   * 키워드 검색 결과 부동산 정보를 저장합니다.
   * @param keyword 검색 키워드
   * @param id 검색 키워드 결과에 일치하는 부동산 Id
   */
  persistAgencyByKeyword(
    keyword: string,
    id: Model.Identification
  ): Promise<void>;

  /**
   * 검색 키워드 기준 부동산을 검색합니다.
   * @param keyword 검색 키워드
   * @return keyword를 만족하는 부동산 정보들
   */
  searchByKeyword(keyword: string): Promise<Model.AgencyType[]>;

  /**
   * 매개변수 (위도/경도) 기준, radius 반경으로 부동산을 검색합니다.
   * @param geoSearchUnit (위도,경도,검색반경) 정보
   * @param geoDbName 부동산 지리 정보를 검색할 database 이름
   * @return (위도/경도) 기준 radius 반경에 있는 부동산 정보들
   */
  searchByRadius(
    geoSearchUnit: Model.GeoSearchByRadius,
    geoDbName?: string
  ): Promise<Model.AgencyType[]>;

  /**
   * agencyId에 일치하는 부동산 정보를 반환합니다.
   * @param id 부동산 Id
   * @return 일치하는 부동산 정보
   */
  get(id: Model.Identification): Promise<Model.AgencyType>;

  /**
   * agencyId에 일치하는 부동산 연령대별 조회수를 반환합니다.
   * @param id 검색할 부동산 Id
   * @return 연령대별 부동산 조회수 e.g. { "20":1, "30": 3, }
   */
  getViews(id: Model.Identification): Promise<Object>;

  /**
   * 조회수가 가장 높은 최대 상위 15개 부동산 정보를 반환합니다.
   * @param query Fetch할 부동산 개수(15개)
   */
  getTopHitAgencies(query: string): Promise<Model.TopHitAgencyType[]>;

  /**
   * 조회수가 높은 지역의 최대 상위 15개 정보를 반환합니다.
   * @param query Fetch할 장소 개수(15개)
   */
  getTopHitAreas(query: string): Promise<Model.TopHitAreaType[]>;

  /**
   * 실시간으로 선택된 부동산의 view count를 1 증가 시킵니다.
   * 동일한 user는 24시간이 지난 후에 view count가 1 증가됩니다.(24 이전 중복 불가)
   * @param reqAgencyView
   */
  mergeViews(reqAgencyView: Model.ReqTypeForAgencyViewCount): Promise<void>;

  /**
   * 유저가 부동산 "좋아요" 버튼을 클릭했을 때, (좋아요/좋아요 취소) 를 수행합니다.
   * @param agencyId 선택된 부동산 Id
   * @param userLikeOperation 유저가 요청한 (좋아요/좋아요 취소) 정보
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  mergeLikes(
    agencyId: Model.Identification,
    userLikeOperation: Model.UserLikeOperation
  ): Promise<ResponseType>;

  /**
   * agencyId와 일치하는 부동산 정보를 db에서 삭제합니다.
   * @param agencyId 삭제할 agencyId
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  removeAgency(agencyId: Model.Identification): Promise<ResponseType>;

  /**
   * agencyId와 일치하는 부동산 '좋아요' 정보를 db에서 삭제합니다.
   * @param agencyId 삭제할 agencyId
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  removeAgencyLikes(agencyId: Model.Identification): Promise<ResponseType>;

  /**
   * geoDbName과 일치하는 위치정보 database를 삭제합니다.
   * @param geoDbName 삭제할 Geography database name
   * @return 삭제 수행 결과를 리턴합니다. e.g. { reason: "reason of operation" }
   */
  removeGeoDb(geoDbName: string): Promise<ResponseType>;
}
