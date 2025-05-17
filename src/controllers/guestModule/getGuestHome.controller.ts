import {  Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware"; // Update path if needed
import { guestGetMockTestQuestionsService } from "../../services/guestModule/guestGetMockTestQuestionsService"; // Update path if needed  

const prisma = new PrismaClient();

export const getGuestHome = async (
  req: AuthRequest, // Use extended request
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guestId = req.user?.userId;

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      res.status(404).json({ message: "Guest not found" });
      return;
    }

    res.json({
      guest: {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        course: guest.course,
        area: guest.area,
        createdAt: guest.createdAt,
      },
      data: {
        aboutTitle: "About IIE",
        aboutDesc:
          "Indra Institute of Education is a leading technical education platform...",
        aboutReadMore: "https://indrainstitute.com/about",
        courseData: [
          { title: "Python", image: "https://example.com/python.png" },
          { title: "Java", image: "https://example.com/java.png" },
        ],
        socialLinks: {
          instagram: "https://instagram.com/iie_indra_institute",
          facebook: "https://facebook.com/IndraInstitute",
        },
      },
    });
  } catch (error) {
    console.error("getGuestHome error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateGuestProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guestId = req.user?.userId;
    const { name, course, email, area } = req.body;

    if (!name || !course || !email || !area) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { name, course, email, area },
    });

    res.json({
      message: "Profile updated successfully.",
      guest: updatedGuest,
    });
  } catch (error) {
    console.error("updateGuestProfile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




export const guestGetMockTestQuestionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { test_type, test_mode } = req.query;

    if (!test_type || test_type !== "mock_test") {
      throw new AppError({ statusCode: 400, message: "Invalid or missing test_type" });
    }

    if (!test_mode) {
      throw new AppError({ statusCode: 400, message: "test_mode is required" });
    }

    const mockTestData = await guestGetMockTestQuestionsService({
      test_type: test_type as string,
      test_mode: test_mode as string,
    });

    res.status(200).json({
      status: true,
      data: mockTestData,
      message: "Mock test questions fetched successfully",
    });
  } catch (error) {
    console.error("Error in guestGetMockTestQuestionsController:", error);
    next(error);
  }
};
