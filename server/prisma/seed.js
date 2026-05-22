import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.interaction.deleteMany();
  await prisma.contactBusiness.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.business.deleteMany();
  await prisma.settings.deleteMany();

  // Create businesses
  const mbm = await prisma.business.create({
    data: { id: "mbm", name: "Made by Max", colour: "#3b82f6", type: "agency" },
  });
  const tradex = await prisma.business.create({
    data: { id: "tradex", name: "Tradex", colour: "#f59e0b", type: "product" },
  });

  // Settings
  await prisma.settings.createMany({
    data: [
      { key: "pin", value: "1234" },
      { key: "mbm_monthly_target", value: "5000" },
      { key: "tradex_monthly_target", value: "2000" },
      { key: "anthropic_api_key", value: "" },
    ],
  });

  // Projects for Made by Max
  const now = new Date();
  await prisma.project.createMany({
    data: [
      {
        businessId: mbm.id,
        clientName: "Hartley & Co",
        stage: "Build",
        deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        hoursLogged: 0,
        revenue: 0,
        notes: "",
      },
      {
        businessId: mbm.id,
        clientName: "Bloom Florist",
        stage: "Design",
        deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        hoursLogged: 0,
        revenue: 0,
        notes: "",
      },
      {
        businessId: mbm.id,
        clientName: "Peak Performance Gym",
        stage: "Revisions",
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        hoursLogged: 0,
        revenue: 0,
        notes: "",
      },
    ],
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        businessId: mbm.id,
        title: "Send revised homepage to Hartley",
        category: "Client Work",
        priority: "high",
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        businessId: mbm.id,
        title: "Finalise Bloom Florist wireframes",
        category: "Design",
        priority: "medium",
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        businessId: tradex.id,
        title: "Fix GPT prompt for pipe sizing",
        category: "Development",
        priority: "high",
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        businessId: tradex.id,
        title: "Write onboarding email sequence",
        category: "Marketing",
        priority: "medium",
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        completed: false,
      },
    ],
  });

  // Leads
  await prisma.lead.createMany({
    data: [
      {
        businessId: mbm.id,
        name: "Sarah Mitchell",
        company: "Mitchell Interiors",
        value: 0,
        source: "Referral",
        stage: "New",
        lastContact: now,
        nextFollowUp: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        notes: "",
      },
      {
        businessId: tradex.id,
        name: "Dave Plumbing Ltd",
        company: "Dave Plumbing",
        value: 0,
        source: "Website",
        stage: "New",
        lastContact: now,
        nextFollowUp: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        notes: "",
      },
    ],
  });

  // Goals
  await prisma.goal.createMany({
    data: [
      {
        businessId: mbm.id,
        type: "revenue",
        name: "Monthly Revenue",
        target: 5000,
        current: 0,
        period: "monthly",
        unit: "AUD",
      },
      {
        businessId: tradex.id,
        type: "revenue",
        name: "Monthly MRR",
        target: 2000,
        current: 0,
        period: "monthly",
        unit: "AUD",
      },
      {
        businessId: null,
        type: "performance",
        name: "Deep work hours per week",
        target: 30,
        current: 0,
        period: "weekly",
        unit: "hours",
      },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
