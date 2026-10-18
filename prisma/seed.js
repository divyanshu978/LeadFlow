import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const leads = [
  {
    name: "Aarav Mehta",
    company: "Northstar Labs",
    phone: "+91 98765 43210",
    status: "QUALIFIED",
    followUpAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    notes: ["Interested in a quarterly financial planning review."],
  },
  {
    name: "Maya Sharma",
    company: "Bloom Retail",
    phone: "+91 99887 66554",
    status: "CONTACTED",
    notes: ["Sent the introductory brochure after our call."],
  },
  {
    name: "Rohan Kapoor",
    company: "Kapoor & Sons",
    status: "PROPOSAL_SENT",
    followUpAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    notes: ["Proposal sent; waiting for the finance team's feedback."],
  },
  {
    name: "Ishita Rao",
    company: "Rao Creative Studio",
    status: "NEW",
    notes: ["New referral from the partner network."],
  },
  {
    name: "Kabir Nair",
    company: "Nair Logistics",
    status: "WON",
    notes: ["Onboarding completed successfully."],
  },
];

async function main() {
  await prisma.discussion.deleteMany();
  await prisma.lead.deleteMany();

  for (const { notes, ...lead } of leads) {
    await prisma.lead.create({
      data: {
        ...lead,
        discussions: {
          create: notes.map((note) => ({ note })),
        },
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
