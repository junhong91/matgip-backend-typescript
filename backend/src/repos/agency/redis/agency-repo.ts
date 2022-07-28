import { AgencyType } from "@models/agency-model";
import { client } from "../../../config/redis/client";

/**
 * Persist real estate agency info.
 *
 * @param agency Real estate agency to persist
 * @returns
 */
async function persist(agency: AgencyType): Promise<void> {
  const result = await client
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
