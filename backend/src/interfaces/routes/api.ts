import { Router } from "express";
import userRouter from "./user-router";
import agencyRouter from "./agency-router";

// Export the base-router
const baseRouter = Router();

// Setup routers
baseRouter.use("/users", userRouter);
baseRouter.use("/agency", agencyRouter);

// Export default.
export default baseRouter;
