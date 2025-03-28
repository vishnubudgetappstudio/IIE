import csvParser from "csv-parser";
import { Readable } from "stream";
import { AppError } from "./errorHandler";
import { format } from "date-fns";
import { csvSchema } from "../zodSchema/common.schema";

/**
 * Parses and validates CSV stream into JSON.
 * If an error occurs, it stops processing immediately.
 */
export const parseCSVStream = async (stream: Readable): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const noSet = new Set(); // Track uniqueness of "No."

        const csvStream = stream.pipe(csvParser());

        csvStream
            .on("data", (data) => {
                // Validate row using safeParse
                const validationResult = csvSchema.safeParse(data);

                if (!validationResult.success) {
                    const firstErrorMessage = validationResult.error.errors[0].message;
                    csvStream.destroy(); // Stop stream immediately
                    return reject(new AppError({
                        statusCode: 400,
                        message: `Validation Error in row: ${firstErrorMessage}`,
                        data: {}
                    }));
                }

                const validatedData = validationResult.data;

                // Check uniqueness of "No."
                if (noSet.has(validatedData["No."])) {
                    csvStream.destroy(); // Stop stream immediately
                    return reject(new AppError({
                        statusCode: 400,
                        message: `Duplicate "No." found: ${validatedData["No."]}`,
                        data: {},
                    }));
                }
                noSet.add(validatedData["No."]);

                results.push(validatedData);
            })
            .on("end", () => resolve(results))
            .on("error", (error) => {
                console.error("❌ Error parsing CSV:", error);
                reject(new AppError({ statusCode: 400, message: "Failed to parse CSV file.", data: {} }));
            });
    });
};

/**
 * Converts bytes to a human-readable format (KB, MB, GB).
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`; // Bytes
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`; // Kilobytes
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`; // Megabytes
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`; // Gigabytes
};

/**
 * Converts a given date (ISO string or Date object) to a readable format.
 */
export const formatDateTime = (date: string | Date): string => {
    const parsedDate = date instanceof Date ? date : new Date(date);
    return format(parsedDate, "dd MMM yyyy, h:mm a"); // 28 Mar 2025, 2:30 PM
};

/**
 * Converts a given date (ISO string or Date object) to a readable date format only.
 */
export const formatDateOnly = (date: string | Date): string => {
    const parsedDate = date instanceof Date ? date : new Date(date);
    return format(parsedDate, "dd MMM yyyy"); // 28 Mar 2025
};

/**
 * Converts a given date (ISO string or Date object) to a readable time format only.
 */
export const formatTimeOnly = (date: string | Date): string => {
    const parsedDate = date instanceof Date ? date : new Date(date);
    return format(parsedDate, "h:mm a"); // 2:30 PM
};