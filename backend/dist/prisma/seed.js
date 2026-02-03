"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = process.env.SEED_SYSTEM_ADMIN_EMAIL || 'admin@gmail.com';
    const password = process.env.SEED_SYSTEM_ADMIN_PASSWORD || 'admin123';
    const name = process.env.SEED_SYSTEM_ADMIN_NAME || 'System Admin';
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email },
        update: { name, role: client_1.Role.SYSTEM_ADMIN, passwordHash },
        create: { name, email, role: client_1.Role.SYSTEM_ADMIN, passwordHash }
    });
    const moduleCount = await prisma.courseModule.count();
    if (moduleCount === 0) {
        await prisma.courseModule.createMany({
            data: [
                {
                    title: 'UTL Methodology and Ethical Observation',
                    description: 'Learn the UTL framework, ethical observation standards, and documentation practices.',
                    order: 1,
                    durationMinutes: 60,
                    deadlineDays: 7,
                    mediaType: 'VIDEO',
                    mediaUrl: '',
                    createdById: admin.id
                },
                {
                    title: 'Personalised Learning Design and Scaffolding',
                    description: 'Design adaptive learning plans and scaffold learner progress effectively.',
                    order: 2,
                    durationMinutes: 75,
                    deadlineDays: 7,
                    mediaType: 'VIDEO',
                    mediaUrl: '',
                    createdById: admin.id
                },
                {
                    title: 'Emotional Regulation and Wellbeing Support',
                    description: 'Build strategies for supporting learner wellbeing and regulation.',
                    order: 3,
                    durationMinutes: 60,
                    deadlineDays: 7,
                    mediaType: 'VIDEO',
                    mediaUrl: '',
                    createdById: admin.id
                },
                {
                    title: 'Safeguarding and Data Ethics',
                    description: 'Apply safeguarding principles and data ethics in the ALS ecosystem.',
                    order: 4,
                    durationMinutes: 60,
                    deadlineDays: 7,
                    mediaType: 'VIDEO',
                    mediaUrl: '',
                    createdById: admin.id
                },
                {
                    title: 'Human-led, AI-supported Decision Making',
                    description: 'Blend professional judgment with AI-assisted insights responsibly.',
                    order: 5,
                    durationMinutes: 70,
                    deadlineDays: 7,
                    mediaType: 'VIDEO',
                    mediaUrl: '',
                    createdById: admin.id
                }
            ]
        });
    }
    const pricingCount = await prisma.packagePrice.count();
    if (pricingCount === 0) {
        await prisma.packagePrice.createMany({
            data: [
                { packageType: 'SINGLE', amount: 50, currency: 'USD' },
                { packageType: 'GROUP', amount: 100, currency: 'USD' },
                { packageType: 'INSTITUTION', amount: 200, currency: 'USD' }
            ]
        });
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map