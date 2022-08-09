import StatusCodes from "http-status-codes";
import { Request, Response, Router } from "express";

import agencyService from "../services/agency-service";
import { ClientClosedError } from "redis";

// Constants
const router = Router();
const { CREATED, BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } = StatusCodes;

export const paths = {
  get: "/:agencyId",
  getViews: "/:agencyId/views",
  getLikes: "/:agencyId/likes",
} as const;

/**
 * Get real estate agency information.
 */
router.get(paths.get, agencyHandler);
export async function agencyHandler(req: Request, res: Response) {
  const { agencyId } = req.params;
  if (!agencyId) return res.sendStatus(BAD_REQUEST);

  try {
    const agency = await agencyService.get(agencyId);
    return res.json({ agency });
  } catch (err) {
    console.error(err);
    return res.sendStatus(INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get real estate agency views(ageRange:viewCounts)
 */
router.get(paths.getViews, agencyViewHandler);

export async function agencyViewHandler(req: Request, res: Response) {
  const { agencyId } = req.params;
  if (!agencyId) return res.sendStatus(BAD_REQUEST);

  try {
    const agencyViews = await agencyService.getViews(agencyId);
    return res.json({ agencyViews });
  } catch (err) {
    console.error(err);
    return res.sendStatus(INTERNAL_SERVER_ERROR);
  }
}

/**
 * Check if user like the agency
 * Fixed: get user id from req.params, not req.query
 */
router.get(paths.getLikes, agencyLikeHandler);

export async function agencyLikeHandler(req: Request, res: Response) {
  const { agencyId, userId } = req.params;
  if (!agencyId || !userId) return res.sendStatus(BAD_REQUEST);

  try {
    const isUserLikeAgency = await agencyService.getLikes(agencyId, userId);
    res.json(isUserLikeAgency);
  } catch (err) {
    console.error(err);
    return res.sendStatus(INTERNAL_SERVER_ERROR);
  }
}

export default router;
