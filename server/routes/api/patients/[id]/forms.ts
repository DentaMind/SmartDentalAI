import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/server/db";
import { patientFormRecords } from "@/shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const patientId = req.query.id as string;
    const { pdfBlob, fileName, submittedBy } = req.body;

    if (!pdfBlob || !fileName) {
      return res.status(400).json({ error: "Missing PDF or filename" });
    }

    // Create directory if it doesn't exist
    const dirPath = path.join(process.cwd(), "public", "records", `patient-${patientId}`);
    await fs.mkdir(dirPath, { recursive: true });

    // Save PDF file
    const buffer = Buffer.from(pdfBlob.split(",")[1], "base64");
    const filePath = `/records/patient-${patientId}/${fileName}`;
    await fs.writeFile(path.join(process.cwd(), "public", filePath), buffer);

    // Save record to database
    await db.insert(patientFormRecords).values({
      patientId: parseInt(patientId),
      filePath,
      fileName,
      submittedBy,
      createdAt: new Date(),
    });

    return res.status(200).json({ message: "Form saved successfully", path: filePath });
  } catch (error) {
    console.error("Error saving patient form:", error);
    return res.status(500).json({ error: "Failed to save form" });
  }
} 