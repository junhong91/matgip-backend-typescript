export type Identification = string | number;
export type GeoLatitude = string | number;
export type GeoLongitude = string | number;

/**
 * Real estate agency Schema
 */
export type AgencyType = {
  id: Identification;
  y: GeoLatitude;
  x: GeoLongitude;
  phone?: string;
  placeName?: string;
  addressName?: string;
  likes?: number;
  stars?: number;
  views?: number;
  reviewCount?: number;
};

export type GeoSearchByRadius = {
  lat: GeoLatitude;
  lng: GeoLongitude;
  radius: number;
};

export type UserIdAndAgeRange = {
  id: Identification; // user id
  ageRange: string; // format => "from~to" (e.g. 20~29)
};

export type ReqTypeForAgencyViewCount = {
  agencyId: Identification; // agency id
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
export type UserOperationType = {
  userId: Identification;
  operation: Operation;
};
