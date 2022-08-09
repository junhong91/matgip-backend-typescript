import StatusCodes from "http-status-codes";
import { Request, Response, Router } from "express";

import agencyService from "@services/agency-service";

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
router.get(paths.get, async (req: Request, res: Response) => {
  const { agencyId } = req.params;
  if (!agencyId) return res.status(BAD_REQUEST).end();

  try {
    const agency = await agencyService.get(agencyId);
    return res.status(OK).json({ agency });
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).end();
  }
});

/**
 * Get real estate agency views(ageRange:viewCounts)
 */
router.get(paths.getViews, async (req: Request, res: Response) => {
  const { agencyId } = req.params;
  if (!agencyId) return res.status(BAD_REQUEST).end();

  try {
    const agencyViews = await agencyService.getViews(agencyId);
    return res.status(OK).json({ agencyViews });
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).end();
  }
});

/**
 * Check if user like the agency
 * Fixed: get user id from req.params, not req.query
 */
router.get(paths.getLikes, async (req: Request, res: Response) => {
  const { agencyId, userId } = req.params;
  if (!agencyId || !userId) return res.status(BAD_REQUEST).end();

  try {
    const isUserLikeAgency = await agencyService.getLikes(agencyId, userId);
    res.status(OK).json(isUserLikeAgency);
  } catch (err) {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).end();
  }
});

export default router;
