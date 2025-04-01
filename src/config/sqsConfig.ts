import { SQSClient } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// ✅ Initialize AWS SQS Client
const sqs = new SQSClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export default sqs;
