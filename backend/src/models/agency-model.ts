/**
 * Real estate agency Schema
 */
export type AgencyType = {
  id: number;
  y: number;
  x: number;
  phone?: string;
  placeName?: string;
  addressName?: string;
  likes?: number;
  stars?: number;
  views?: number;
  reviewCount?: number;
};

export type ViewUserEntityType = {
  id: number; // user id
  ageRange: string; // format => "from~to" (e.g. 20~29)
};

export type ReqAgencyViewType = {
  id: number; // agency id
  user: ViewUserEntityType;
  addressName: string;
};

/**
 * Top hit real estate agency Schema
 */
export type TopHitAgencyType = {
  baseTime: string;
  agencyName: string;
  addressName: string;
  views: number;
};

/**
 * Top hit area Schema
 */
export type TopHitAreaType = {
  areaName: string;
  views: number;
};

export type UserLikeAgencyOpType = {
  userId: number;
  operation: string;
};
