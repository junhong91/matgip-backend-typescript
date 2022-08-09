import * as Model from "@models/agency/agency-model";
import * as Response from "@models/agency/response";

const AgencyRepository = require("../../../src/infrastructure/repos/agency/index");

async function get(agencyId: Model.Identification): Promise<Model.AgencyType> {
  return AgencyRepository.get(agencyId);
}

async function getViews(id: Model.Identification): Promise<Object> {
  return await AgencyRepository.getViews(id);
}

async function getLikes(
  agencyId: Model.Identification,
  userId: Model.Identification
): Promise<boolean> {
  return await AgencyRepository.isUserLikeAgency(agencyId, userId);
}

async function getTopHitAgencies(
  query: string
): Promise<Model.TopHitAgencyType[]> {
  return await AgencyRepository.getTopHitAgencies(query);
}

async function getTopHitAreas(query: string): Promise<Model.TopHitAreaType[]> {
  return await AgencyRepository.getTopHitAreas(query);
}

async function add(
  agency: Model.AgencyType,
  geoDbName: string = "agency"
): Promise<void> {
  await AgencyRepository.persist(agency, geoDbName);
}

async function updateViews(
  reqAgencyView: Model.ReqTypeForAgencyViewCount
): Promise<Response.ResponseType> {
  return AgencyRepository.mergeViews(reqAgencyView);
}

async function updateLikes(
  agencyId: Model.Identification,
  userLikeOperation: Model.UserLikeOperation
): Promise<Response.ResponseType> {
  return AgencyRepository.mergeLikes(agencyId, userLikeOperation);
}

// TODO: getLikes, search
export default {
  get,
  getViews,
  getTopHitAgencies,
  getTopHitAreas,
  getLikes,
  add,
  updateViews,
  updateLikes,
};
