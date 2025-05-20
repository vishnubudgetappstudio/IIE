import csvParser from "csv-parser";
import { Readable } from "stream";
import { AppError } from "./errorHandler";
import { format } from "date-fns";
import { csvSessionSheetSchema, csvTestCourseOrMockSchema } from "../zodSchema/common.schema";

/**
 * Parses and validates CSV stream into JSON.
 * If an error occurs, it stops processing immediately.
 */

interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export const parseSessionSheet_CSV_Stream = async (stream: Readable, noParam?: string,
    statusParam?: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const noSet = new Set(); // Track uniqueness of "No."
        

        const csvStream = stream.pipe(csvParser());

        csvStream
            .on("data", (data) => {
                // Validate row using safeParse
                const validationResult = csvSessionSheetSchema.safeParse(data);

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
                

                if (
                    validatedData["No."] === noParam &&
                    (statusParam === "completed" || statusParam === "pending" || statusParam === "Completed" || statusParam === "Pending")
                ) {
                    validatedData.Status = statusParam;
                }
                
                results.push(validatedData);
            })
            .on("end", () => resolve(results))
            .on("error", (error) => {
                console.error("❌ Error parsing SessionSheets CSV:", error);
                reject(new AppError({ statusCode: 400, message: "Failed to parse SessionSheet CSV file.", data: {} }));
            });
    });
};

// export const parseTestCourseOrMock_CSV_Stream = async (stream: Readable): Promise<any[]> => {
//     return new Promise((resolve, reject) => {
//         const results: any[] = [];
//         const noSet = new Set(); // Track uniqueness of "No."

//         const csvStream = stream.pipe(csvParser());

//         csvStream
//             .on("data", (data) => {
//                 // Validate row using safeParse
//                 const validationResult = csvTestCourseOrMockSchema.safeParse(data);

//                 if (!validationResult.success) {
//                     const firstErrorMessage = validationResult.error.errors[0].message;
//                     csvStream.destroy(); // Stop stream immediately
//                     return reject(new AppError({
//                         statusCode: 400,
//                         message: `Validation Error in row: ${firstErrorMessage}`,
//                         data: {}
//                     }));
//                 }

//                 const validatedData = validationResult.data;

//                 // Check uniqueness of "No."
//                 if (noSet.has(validatedData["No."])) {
//                     csvStream.destroy(); // Stop stream immediately
//                     return reject(new AppError({
//                         statusCode: 400,
//                         message: `Duplicate "No." found: ${validatedData["No."]}`,
//                         data: {},
//                     }));
//                 }
//                 noSet.add(validatedData["No."]);

//                 results.push(validatedData);
//             })
//             .on("end", () => resolve(results))
//             .on("error", (error) => {
//                 console.error("❌ Error parsing TestCourseOrMockCSV CSV:", error);
//                 reject(new AppError({ statusCode: 400, message: "Failed to parse TestCourseOrMockCSV file.", data: {} }));
//             });
//     });
// };

export const parseTestCourseOrMock_CSV_Stream = async (
  stream: Readable
): Promise<ParsedQuestion[]> => {
  return new Promise((resolve, reject) => {
    const results: ParsedQuestion[] = [];
    const noSet = new Set<string | number>();

    const csvStream = stream.pipe(csvParser());

    csvStream
      .on("data", (row) => {
        const validationResult = csvTestCourseOrMockSchema.safeParse(row);

        if (!validationResult.success) {
          const firstErrorMessage = validationResult.error.errors[0].message;
          csvStream.destroy(); // stop stream on error
          return reject(
            new AppError({
              statusCode: 400,
              message: `Validation Error in row: ${firstErrorMessage}`,
              data: {},
            })
          );
        }

        const validatedData = validationResult.data;

        // Uniqueness check
        const no = validatedData["No."];
        if (noSet.has(no)) {
          csvStream.destroy();
          return reject(
            new AppError({
              statusCode: 400,
              message: `Duplicate "No." found: ${no}`,
              data: {},
            })
          );
        }
        noSet.add(no);

        // Construct transformed object
        const question: ParsedQuestion = {
          question: validatedData["Question"]?.trim(),
          options: [],
          correctAnswer: validatedData["Correct Answer"]?.trim(),
        };

        for (let i = 1; i <= 4; i++) {
          const optionValue = validatedData[`Option_${i}`]?.trim();
          if (optionValue) {
            question.options.push(optionValue);
          }
        }

        if (validatedData["Explanation"]) {
          question.explanation = validatedData["Explanation"].trim();
        }

        results.push(question);
      })
      .on("end", () => resolve(results))
      .on("error", (error) => {
        console.error("❌ Error parsing TestCourseOrMockCSV CSV:", error);
        reject(
          new AppError({
            statusCode: 400,
            message: "Failed to parse TestCourseOrMockCSV file.",
            data: {},
          })
        );
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

export const formatDurationFromTimeString = (time: string): string => {
    const [hoursStr, minutesStr] = time.split(":");

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    const hourPart = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
    const minutePart = minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";

    if (hourPart && minutePart) {
        return `${hourPart} ${minutePart}`;
    }

    return hourPart || minutePart || "0 minutes";
};


export const convertToEpoch = ({ date, time }: { date: string, time: string }): number => {
    const dateStr = `${date}, ${time} `
    const dateObj = new Date(dateStr);
    return Math.floor(dateObj.getTime() / 1000); // Convert to seconds
}

export const parseDDMMYYYYToDate = (dateStr: string): Date => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);

    if (!match) {
        throw new AppError({
            statusCode: 400,
            message: "Invalid date format. Use DD/MM/YYYY.",
        });
    }

    const [, dayStr, monthStr, yearStr] = match;
    const day = Number(dayStr);
    const month = Number(monthStr) - 1; // JavaScript months are 0-indexed
    const year = Number(yearStr);

    const date = new Date(Date.UTC(year, month, day));

    // Additional sanity check: ensure JS Date object matches input (prevents invalid dates like 32/01/2025)
    if (
        date.getDate() !== day ||
        date.getMonth() !== month ||
        date.getFullYear() !== year
    ) {
        throw new AppError({
            statusCode: 400,
            message: "Invalid date provided.",
        });
    }

    return date;
};


export const convertTimeToDateFormat = (timeStr: string): Date => {
    const [time, modifier] = timeStr.split(" "); // Split "12:30 PM" into ["12:30", "PM"]
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toLowerCase() === "pm" && hours !== 12) {
        hours += 12; // Convert PM hours (except 12 PM)
    } else if (modifier.toLowerCase() === "am" && hours === 12) {
        hours = 0; // Convert 12 AM to 00:00
    }

    const now = new Date(); // Get current date
    now.setHours(hours, minutes, 0, 0); // Set time (HH:MM:SS:MS)

    return now;
};

export const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const calculateAttendancePercentage = ({ present, total }: { present: bigint | null, total: bigint | null }): {
    presentPercentage: number;
    absentPercentage: number;
} => {
    const presentCount = Number(present || 0);
    const totalCount = Number(total || 0);
    const presentPercentage = totalCount > 0 ? +(presentCount / totalCount * 100).toFixed(2) : 0;
    return {
        presentPercentage,
        absentPercentage: +(100 - presentPercentage).toFixed(2),
    };
};

export const getCourseDuration = (startDate: Date, endDate: Date): string => {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "";
    }

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const totalMonths = years * 12 + months;

    const parts: string[] = [];

    if (totalMonths > 0) parts.push(`${totalMonths} month${totalMonths > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

    return parts.join(" ") || "0 days";
};
