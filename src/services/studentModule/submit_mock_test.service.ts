import { MockTestMode } from "@prisma/client";

export const submitMockTestService = async ({ 
    test_mode 
}: { 
    test_mode: MockTestMode,
    correctAnswers_count: string,
    total_questions_count: string,
    student_id: string,
     
}) => {

}