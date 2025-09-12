import { Router } from "express";

const router = Router();

router.route("/:projectId")
.get(validateProjectPermission)
.post(validateProjectPermission)


export default router;
