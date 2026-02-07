import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SYSTEM_ADMIN_EMAIL || 'admin@gmail.com';
  const password = process.env.SEED_SYSTEM_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_SYSTEM_ADMIN_NAME || 'System Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, role: Role.SYSTEM_ADMIN, passwordHash },
    create: { name, email, role: Role.SYSTEM_ADMIN, passwordHash }
  });

  const moduleCount = await prisma.courseModule.count();
  if (moduleCount === 0) {
    await prisma.courseModule.createMany({
      data: [
        {
          title: 'UTL Methodology and Ethical Observation',
          description: 'Learn the UTL framework, ethical observation standards, and documentation practices.',
          order: 1,
          deadlineDays: 7,
          mediaType: 'VIDEO',
          mediaUrl: '',
          createdById: admin.id
        },
        {
          title: 'Personalised Learning Design and Scaffolding',
          description: 'Design adaptive learning plans and scaffold learner progress effectively.',
          order: 2,
          deadlineDays: 7,
          mediaType: 'VIDEO',
          mediaUrl: '',
          createdById: admin.id
        },
        {
          title: 'Emotional Regulation and Wellbeing Support',
          description: 'Build strategies for supporting learner wellbeing and regulation.',
          order: 3,
          deadlineDays: 7,
          mediaType: 'VIDEO',
          mediaUrl: '',
          createdById: admin.id
        },
        {
          title: 'Safeguarding and Data Ethics',
          description: 'Apply safeguarding principles and data ethics in the ALS ecosystem.',
          order: 4,
          deadlineDays: 7,
          mediaType: 'VIDEO',
          mediaUrl: '',
          createdById: admin.id
        },
        {
          title: 'Human-led, AI-supported Decision Making',
          description: 'Blend professional judgment with AI-assisted insights responsibly.',
          order: 5,
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
        {
          packageType: 'SINGLE',
          amount: 50,
          currency: 'USD',
          maxUsers: 1,
          label: 'Single User',
          summary: 'Ideal for individual Academic Guides who want certification and personal tracking.',
          features: ['Personal dashboard', 'All 5 modules', 'Certification included', 'No annual subscription'],
          highlight: false
        },
        {
          packageType: 'GROUP',
          amount: 100,
          currency: 'USD',
          maxUsers: 5,
          label: 'Group',
          summary: 'Best for small teams that need a shared learning plan and consistent standards.',
          features: ['Group admin access', 'Bulk user upload', 'Team progress view', 'Certification included'],
          highlight: true
        },
        {
          packageType: 'INSTITUTION',
          amount: 200,
          currency: 'USD',
          maxUsers: 10,
          label: 'Institution',
          summary: 'Built for institutions that need scalable onboarding and quality assurance.',
          features: ['Institution admin access', 'Bulk user upload', 'QA reporting', 'Certification included'],
          highlight: false
        }
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
