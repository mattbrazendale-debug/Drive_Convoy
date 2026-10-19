import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teacherId = process.env.TEACHER_DEMO_ID ?? "tch_demo";
  const schoolId = process.env.SCHOOL_DEMO_ID ?? "sch_demo";
  await prisma.teacher.upsert({
    where: { id: teacherId },
    create: { id: teacherId, schoolId, displayName: "Demo Teacher" },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
