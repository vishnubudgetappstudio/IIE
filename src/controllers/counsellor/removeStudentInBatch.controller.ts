import { Request, Response } from "express";
import { addStudentToBatch } from "../../services/counsellor/addStudentInBatch.service";

export const removeStudentToBatchController = async (
  req: Request,
  res: Response
) => {
  try {
    const { batch_id, student_id } = req.body;
    const response = await addStudentToBatch(batch_id, student_id);

    res.status(201).json({ status: true, ...response });
  } catch (error: any) {
    res.status(400).json({ status: false, message: error.message });
  }
};
