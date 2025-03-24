import { prisma } from "../../config/database";

export const studentHomeScreenService = async ({ student_id }: { student_id: string }) => {

    const studentHomeScreenDetails = await prisma.student.findUnique({
        where: {
            id: student_id,
            deletedAt: null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roll_number: true,
            alt_phone: true,
            batchWithStudentModel: {
                where: {
                    student_id: student_id,
                    deletedAt: null,
                },
                select: {
                    batch_id: true,
                    batch_detail_relation: {
                        select: {
                            batch_number: true,
                            slot: true,
                            from_date: true,
                            to_date: true,
                            management_staff_relation: {
                                select: {
                                    name: true,
                                    profile_img_url: true,
                                },
                            }
                        },
                    }
                }
            },
        }
    })

    return {
        name: studentHomeScreenDetails?.name,
        attendance_percentage: "78%",
        attendance_message: "Wow keep going",
        attendance_image: "http://emoji.png",
        course: "java",
        batch_number: studentHomeScreenDetails?.batchWithStudentModel.map(e => e.batch_detail_relation.batch_number)?.[0],
        roll_number: studentHomeScreenDetails?.roll_number,
        mentor_image: studentHomeScreenDetails?.batchWithStudentModel.map(e => e.batch_detail_relation.management_staff_relation.profile_img_url)?.[0],
        mentor: studentHomeScreenDetails?.batchWithStudentModel.map(e => e.batch_detail_relation.management_staff_relation.name)?.[0],
        course_start: studentHomeScreenDetails?.batchWithStudentModel.map(e => e.batch_detail_relation.from_date)?.[0],
        course_end: studentHomeScreenDetails?.batchWithStudentModel.map(e => e.batch_detail_relation.to_date)?.[0],
        duration: "2 months",
        progress: 25,
        updates: [
            {
                "title": "username",
                "image": "email@gmail.com",
                "sub_title": "guru",
                "from_time": "12.00 am",
                "to_time": "12.00 am",
                "type": "test"
            }
        ],
        insta_url: "http://insta.com",
        facebook_url: "http://facebook.com"

    }

}