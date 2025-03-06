import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { createSupportTicket } from "../../services/counsellor/supportTicket.service";

export const raiseSupportTicket = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { query, attachments } = req.body;
    // `verifyToken` middleware ensures `req.user` exists
    const userId = req.user?.userId;
    console.log({userId})
    if (!userId) {
      res
        .status(401)
        .json({ status: false, message: "Unauthorized: Invalid token" });
      return;
    }

    if (!query || query.trim().length === 0) {
      res.status(400).json({ status: false, message: "Query is required" });
      return;
    }

    const ticket = await createSupportTicket(userId, query, attachments);

    res.status(201).json({
      status: true,
      data: ticket,
      message: "Support ticket created successfully",
    });
    return;
  } catch (error: unknown) {
    console.error("Error creating support ticket:", error);

    res.status(500).json({
      status: false,
      message: "Error creating support ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
