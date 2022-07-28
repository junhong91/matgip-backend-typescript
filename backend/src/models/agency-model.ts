/**
 * Real estate agency Schema
 */
export type AgencyType = {
  id: number;
  y: number;
  x: number;
  phone: string;
  placeName: string;
  addressName: string;
};

type ViewUserEntityType = {
  id: string; // user id
  ageRange: string; // user age range
};

export type AgencyViewType = {
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
