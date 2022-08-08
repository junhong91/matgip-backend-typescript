import StatusCodes from "http-status-codes";
import { Request, Response, Router } from "express";

import agencyService from "@services/agency-service";
import { ParamMissingError } from "@shared/errors";

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
 * @param req.params.agencyId agency identification
 * @return agency information (Please see @model/agency/agency-model/AgencyType)
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
 * @param agencyId The real estate agency identification
 * @return Real estate hit counts on age range e.g. { "20":1, "30": 3, }
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

export default router;
