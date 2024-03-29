export type Identification = string | number;
export type GeoLatitude = string | number;
export type GeoLongitude = string | number;

/**
 * Real estate agency Schema
 */
export type AgencyType = {
  readonly id: Identification;
  readonly y: GeoLatitude;
  readonly x: GeoLongitude;
  readonly phone?: string;
  readonly placeName?: string;
  readonly addressName?: string;
  likes?: number;
  stars?: number;
  views?: Object;
  reviewCount?: number;
};

export type GeoSearchByRadius = {
  readonly lat: GeoLatitude;
  readonly lng: GeoLongitude;
  readonly radius: number;
};

export type UserIdAndAgeRange = {
  readonly id: Identification; // user id
  ageRange: string; // format => "from~to" (e.g. 20~29)
};

export type ReqTypeForAgencyViewCount = {
  readonly agencyId: Identification; // agency id
  user: UserIdAndAgeRange;
  addressName: string;
};

/**
 * Top hit real estate agency Schema
 */
export type TopHitAgencyType = {
  baseTime: string;
  agencyName?: string;
  addressName?: string;
  views: number;
};

/**
 * Top hit area Schema
 */
export type TopHitAreaType = {
  areaName: string;
  views: number;
};

export type Operation = "increase" | "decrease";
export type UserLikeOperation = {
  readonly userId: Identification;
  readonly operation: Operation;
};
