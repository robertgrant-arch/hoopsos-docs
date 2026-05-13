import { Router } from "express";
import { requireOrg } from "../auth/tenant";

export function registerMeRoute(router: Router) {
  router.get("/me", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      res.json({ userId: ctx.userId, orgId: ctx.orgId, role: ctx.role });
    } catch (e: any) {
      res.status(e.status ?? 401).json({ error: e.message ?? "Unauthorized" });
    }
  });
}
