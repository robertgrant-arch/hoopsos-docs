import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";
import { sendSms } from "../../lib/twilio";

export function registerMessagingRoutes(router: Router) {
  // List threads for current user
  router.get("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const threads = await repo.messages.listThreads();
      res.json(threads);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Create thread
  router.post("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const thread = await repo.messages.createThread({
        ...req.body,
        createdByUserId: ctx.userId,
      });
      res.status(201).json(thread);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Get messages in thread
  router.get("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msgs = await repo.messages.listMessages(req.params.threadId);
      res.json(msgs);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Send message
  router.post("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msg = await repo.messages.createMessage({
        threadId: req.params.threadId,
        senderUserId: ctx.userId,
        body: req.body.body,
      });

      // Optional SMS notification for parent DMs
      if (req.body.notifySms && req.body.recipientPhone) {
        try {
          await sendSms(
            req.body.recipientPhone,
            `HoopsOS message from your coach: ${req.body.body.substring(0, 140)}`
          );
        } catch (smsErr) {
          console.warn("SMS notification failed:", smsErr);
        }
      }

      res.status(201).json(msg);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Broadcast to all parents (SMS)
  router.post("/broadcast-sms", async (req, res) => {
    try {
      await requireOrg(req);
      const { recipients, message } = req.body;
      if (!Array.isArray(recipients) || !message) {
        return res.status(400).json({ error: "recipients[] and message required" });
      }
      const { sendBroadcastSms } = await import("../../lib/twilio");
      const result = await sendBroadcastSms(recipients, message);
      res.json(result);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
