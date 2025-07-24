import { Router } from "express";
import { contactUs, userStats } from "../controllers/miscellaneous.controllers.js";
import { isLoggedIn,authorisedRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/contacts').post(contactUs)
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authorisedRoles('ADMIN'), userStats);

export default router;
 