import "dotenv/config";

import { db } from "./index";
import { roles, skillCategories, skills } from "./schema";

const roleData = [
  {
    name: "CANDIDATE",
    description: "Builds a profile, submits work, and gets skills verified.",
  },
  {
    name: "REVIEWER",
    description: "Reviews assigned assessments and verifies candidate work.",
  },
  {
    name: "RECRUITER",
    description: "Discovers and evaluates verified candidates.",
  },
  {
    name: "ADMIN",
    description: "Manages the platform, users, skills, assessments, and reviews.",
  },
];

const categoryData = [
  {
    name: "Frontend Development",
    slug: "frontend-development",
  },
  {
    name: "Backend Development",
    slug: "backend-development",
  },
  {
    name: "Mobile Development",
    slug: "mobile-development",
  },
  {
    name: "Database",
    slug: "database",
  },
  {
    name: "Design",
    slug: "design",
  },
  {
    name: "Cybersecurity",
    slug: "cybersecurity",
  },
  {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
  },
  {
    name: "DevOps & Systems",
    slug: "devops-systems",
  },
];

async function seed() {
  console.log("Seeding ProofWork database...");

  await db.insert(roles).values(roleData).onConflictDoNothing();

  const insertedCategories = await db
    .insert(skillCategories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning();

  const categoryRows =
    insertedCategories.length > 0 ? insertedCategories : await db.select().from(skillCategories);

  const categoryMap = new Map(categoryRows.map((category) => [category.slug, category.id]));

  const skillData = [
    {
      name: "React.js",
      slug: "react-js",
      categoryId: categoryMap.get("frontend-development"),
    },
    {
      name: "Next.js",
      slug: "next-js",
      categoryId: categoryMap.get("frontend-development"),
    },
    {
      name: "Node.js",
      slug: "node-js",
      categoryId: categoryMap.get("backend-development"),
    },
    {
      name: "Express.js",
      slug: "express-js",
      categoryId: categoryMap.get("backend-development"),
    },
    {
      name: "PostgreSQL",
      slug: "postgresql",
      categoryId: categoryMap.get("database"),
    },
    {
      name: "MongoDB",
      slug: "mongodb",
      categoryId: categoryMap.get("database"),
    },
    {
      name: "Flutter",
      slug: "flutter",
      categoryId: categoryMap.get("mobile-development"),
    },
    {
      name: "UI/UX Design",
      slug: "ui-ux-design",
      categoryId: categoryMap.get("design"),
    },
    {
      name: "Figma",
      slug: "figma",
      categoryId: categoryMap.get("design"),
    },
    {
      name: "Cybersecurity",
      slug: "cybersecurity",
      categoryId: categoryMap.get("cybersecurity"),
    },
    {
      name: "Python",
      slug: "python",
      categoryId: categoryMap.get("artificial-intelligence"),
    },
    {
      name: "AI/ML",
      slug: "ai-ml",
      categoryId: categoryMap.get("artificial-intelligence"),
    },
    {
      name: "Networking",
      slug: "networking",
      categoryId: categoryMap.get("devops-systems"),
    },
    {
      name: "Linux",
      slug: "linux",
      categoryId: categoryMap.get("devops-systems"),
    },
  ].filter(
    (
      skill,
    ): skill is {
      name: string;
      slug: string;
      categoryId: string;
    } => Boolean(skill.categoryId),
  );

  await db.insert(skills).values(skillData).onConflictDoNothing();

  console.log("ProofWork seed completed successfully.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
