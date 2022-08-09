import * as Model from "@models/agency/agency-model";
import * as Response from "@models/agency/response";

const AgencyRepo = require("../../infrastructure/repos/agency/redis/agency-repo");

async function get(agencyId: Model.Identification): Promise<Model.AgencyType> {
  return AgencyRepo.get(agencyId);
}

async function getViews(id: Model.Identification): Promise<Object> {
  return await AgencyRepo.getViews(id);
}

async function getLikes(
  agencyId: Model.Identification,
  userId: Model.Identification
): Promise<boolean> {
  return await AgencyRepo.isUserLikeAgency(agencyId, userId);
}

async function getTopHitAgencies(
  query: string
): Promise<Model.TopHitAgencyType[]> {
  return await AgencyRepo.getTopHitAgencies(query);
}

async function getTopHitAreas(query: string): Promise<Model.TopHitAreaType[]> {
  return await AgencyRepo.getTopHitAreas(query);
}

async function add(
  agency: Model.AgencyType,
  geoDbName: string = "agency"
): Promise<void> {
  await AgencyRepo.persist(agency, geoDbName);
}

async function updateViews(
  reqAgencyView: Model.ReqTypeForAgencyViewCount
): Promise<Response.ResponseType> {
  return AgencyRepo.mergeViews(reqAgencyView);
}

async function updateLikes(
  agencyId: Model.Identification,
  userLikeOperation: Model.UserLikeOperation
): Promise<Response.ResponseType> {
  return AgencyRepo.mergeLikes(agencyId, userLikeOperation);
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
