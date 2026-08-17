import "dotenv/config";

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq, inArray, like } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  reviewerSkills,
  assessmentAssignments,
  assessmentSkills,
  assessments,
  candidateProfiles,
  candidateSkills,
  companies,
  companyMembers,
  projectSkills,
  projects,
  reviewCriterionScores,
  reviews,
  roles,
  rubricCriteria,
  skills,
  submissionEvidence,
  submissions,
  userRoles,
  users,
  verificationRequests,
} from "@/db/schema";
import { buildProfileSlug } from "@/features/profiles/utils/slug";

/**
 * Demo data.
 *
 * Recruiter search, the leaderboard and the admin analytics are impossible to
 * judge against two accounts, so this builds a realistic population with skills
 * spread across every verification state, plus completed assessment/review
 * chains so verified badges are backed by real rows rather than faked columns.
 *
 * Every account uses the demo@ prefix so `--clean` can remove them without
 * touching real data.
 */

const DEMO_PREFIX = "demo-";
const DEMO_PASSWORD = "ProofWork123";
const DEMO_DOMAIN = "@proofwork.test";

type CandidateSpec = {
  name: string;
  headline: string;
  city: string;
  country: string;
  availability: "AVAILABLE" | "OPEN_TO_OPPORTUNITIES" | "NOT_AVAILABLE";
  verified: { skill: string; score: number; level: string }[];
  inProgress?: string[];
  unverified?: string[];
  projects?: { title: string; description: string; tech: string[]; verified?: boolean }[];
};

const CANDIDATES: CandidateSpec[] = [
  {
    name: "Ayesha Khan",
    headline: "Frontend engineer focused on design systems",
    city: "Lahore",
    country: "Pakistan",
    availability: "AVAILABLE",
    verified: [
      { skill: "React.js", score: 92, level: "EXPERT" },
      { skill: "Next.js", score: 88, level: "ADVANCED" },
      { skill: "UI/UX Design", score: 81, level: "ADVANCED" },
    ],
    inProgress: ["Node.js"],
    projects: [
      {
        title: "Realtime analytics dashboard",
        description:
          "A dashboard rendering 50k rows with virtualised tables, live websocket updates and an accessible chart suite.",
        tech: ["React.js", "Next.js"],
        verified: true,
      },
    ],
  },
  {
    name: "Bilal Ahmed",
    headline: "Backend engineer, distributed systems",
    city: "Karachi",
    country: "Pakistan",
    availability: "OPEN_TO_OPPORTUNITIES",
    verified: [
      { skill: "Node.js", score: 90, level: "EXPERT" },
      { skill: "PostgreSQL", score: 85, level: "ADVANCED" },
      { skill: "Express.js", score: 78, level: "ADVANCED" },
    ],
    unverified: ["Python"],
    projects: [
      {
        title: "Rate-limited payments API",
        description:
          "Idempotent REST API with token-bucket rate limiting, structured audit logging and replayable webhooks.",
        tech: ["Node.js", "PostgreSQL", "Express.js"],
        verified: true,
      },
    ],
  },
  {
    name: "Fatima Noor",
    headline: "Product designer moving into frontend",
    city: "Islamabad",
    country: "Pakistan",
    availability: "AVAILABLE",
    verified: [
      { skill: "Figma", score: 95, level: "EXPERT" },
      { skill: "UI/UX Design", score: 89, level: "EXPERT" },
    ],
    inProgress: ["React.js"],
    projects: [
      {
        title: "Banking app redesign",
        description:
          "End-to-end mobile flow covering onboarding, transfers and disputes, with a documented component library.",
        tech: ["Figma", "UI/UX Design"],
      },
    ],
  },
  {
    name: "Hassan Raza",
    headline: "Full-stack developer",
    city: "Lahore",
    country: "Pakistan",
    availability: "OPEN_TO_OPPORTUNITIES",
    verified: [
      { skill: "React.js", score: 74, level: "INTERMEDIATE" },
      { skill: "Node.js", score: 71, level: "INTERMEDIATE" },
    ],
    unverified: ["MongoDB"],
  },
  {
    name: "Zara Sheikh",
    headline: "Security engineer",
    city: "Dubai",
    country: "United Arab Emirates",
    availability: "NOT_AVAILABLE",
    verified: [{ skill: "Cybersecurity", score: 87, level: "ADVANCED" }],
    inProgress: ["Linux"],
  },
  {
    name: "Omar Farooq",
    headline: "Mobile developer",
    city: "Karachi",
    country: "Pakistan",
    availability: "AVAILABLE",
    verified: [{ skill: "Flutter", score: 83, level: "ADVANCED" }],
    unverified: ["AI/ML"],
  },
  {
    name: "Sana Malik",
    headline: "Data and ML engineer",
    city: "Remote",
    country: "Pakistan",
    availability: "AVAILABLE",
    verified: [
      { skill: "Python", score: 91, level: "EXPERT" },
      { skill: "AI/ML", score: 79, level: "ADVANCED" },
    ],
  },
  {
    name: "Imran Yousaf",
    headline: "Junior developer building a portfolio",
    city: "Multan",
    country: "Pakistan",
    availability: "AVAILABLE",
    verified: [],
    unverified: ["React.js", "Node.js"],
  },
];

const ASSESSMENTS = [
  {
    title: "React.js — responsive product dashboard",
    skill: "React.js",
    difficulty: "INTERMEDIATE" as const,
    description:
      "Build a responsive product dashboard that consumes a public API, handles loading and error states, and remains usable on a phone.",
    requirements:
      "Fetch and render a paginated product list.\nFilter by category and search by name.\nHandle loading, empty and error states explicitly.\nResponsive from 360px upwards.\nNo UI kit: build the components yourself.",
    submissionInstructions:
      "Send a public GitHub repository and a deployed URL. Include a README explaining how to run it.",
  },
  {
    title: "Node.js — secure REST API with authentication",
    skill: "Node.js",
    difficulty: "ADVANCED" as const,
    description:
      "Create a REST API with token authentication, input validation and sensible error handling.",
    requirements:
      "Register and login endpoints issuing signed tokens.\nHash passwords with a modern algorithm.\nValidate every input at the boundary.\nProtect at least one route by role.\nWrite tests for the auth flow.",
    submissionInstructions:
      "Send a GitHub repository including tests and a short note on the security decisions you made.",
  },
  {
    title: "UI/UX — complete mobile application flow",
    skill: "UI/UX Design",
    difficulty: "INTERMEDIATE" as const,
    description:
      "Design a complete mobile flow in Figma, from first launch through the primary task and an error path.",
    requirements:
      "Cover onboarding, the core task and at least one failure state.\nProvide a reusable component set.\nDocument spacing, type scale and colour decisions.\nInclude a short rationale for the layout choices.",
    submissionInstructions: "Share a public Figma link with view access enabled.",
  },
];

const RUBRIC = [
  {
    name: "Functionality",
    description: "Does it do what was asked, end to end?",
    max: 30,
    weight: 30,
  },
  { name: "Code quality", description: "Structure, naming, and readability.", max: 25, weight: 25 },
  {
    name: "UI quality",
    description: "Layout, responsiveness and accessibility.",
    max: 20,
    weight: 20,
  },
  {
    name: "Documentation",
    description: "Can someone else run and understand it?",
    max: 15,
    weight: 15,
  },
  { name: "Problem solving", description: "Quality of the trade-offs made.", max: 10, weight: 10 },
];

async function roleId(name: string): Promise<string> {
  const [row] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);

  if (!row) {
    throw new Error(`Role ${name} missing. Run \`npm run db:seed\` first.`);
  }

  return row.id;
}

/**
 * Resolves a catalogue skill by name.
 *
 * Throws rather than returning null. A typo here previously dropped an entire
 * candidate out of recruiter search with no visible error, which is far harder
 * to notice than a failed seed.
 */
async function skillId(name: string): Promise<string> {
  const [row] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.name, name))
    .limit(1);

  if (!row) {
    throw new Error(
      `Skill "${name}" is not in the catalogue. Run "npm run db:seed" first, or correct the name in seed-demo.ts.`,
    );
  }

  return row.id;
}

async function createUser(
  email: string,
  roleName: string,
  status: "ACTIVE" | "PENDING" = "ACTIVE",
  displayName?: string,
) {
  const id = randomUUID();
  const rid = await roleId(roleName);

  await db.insert(users).values({
    id,
    email,
    // Derived from the address when no name is supplied, so no screen has to
    // fall back to showing an email as a person.
    name:
      displayName ??
      email
        .split("@")[0]
        .replace(/[.\-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    accountStatus: status,
    primaryRoleId: rid,
  });

  await db.insert(userRoles).values({ userId: id, roleId: rid });

  return id;
}

/**
 * Back-dated activity so the dashboard timeline and the contribution grid have
 * something real to render. Without these the demo looks inert even though the
 * underlying verification records exist.
 */
async function recordDemoActivity(
  candidateId: string,
  type:
    | "SKILL_ADDED"
    | "SKILL_VERIFIED"
    | "ASSESSMENT_STARTED"
    | "ASSESSMENT_SUBMITTED"
    | "PROJECT_CREATED",
  daysAgo: number,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(activityEvents).values({
    candidateId,
    type,
    metadata,
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  });
}

async function clean() {
  const demoUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `${DEMO_PREFIX}%${DEMO_DOMAIN}`));

  if (demoUsers.length === 0) {
    console.log("No demo data found.");
    return;
  }

  const ids = demoUsers.map((row) => row.id);

  const demoProfiles = await db
    .select({ id: candidateProfiles.id })
    .from(candidateProfiles)
    .where(inArray(candidateProfiles.userId, ids));

  const profileIds = demoProfiles.map((row) => row.id);

  /*
    Teardown order is dictated by the foreign keys rather than convenience:

      projects.created_by_id            -> users     ON DELETE RESTRICT
      assessments.created_by_id         -> users     ON DELETE RESTRICT
      assessment_assignments.assessment -> assessments ON DELETE RESTRICT

    So the restricted children have to go before their parents, and the
    assignments before the assessments they point at.
  */

  if (profileIds.length > 0) {
    await db.delete(projects).where(inArray(projects.candidateId, profileIds));

    const demoSkills = await db
      .select({ id: candidateSkills.id })
      .from(candidateSkills)
      .where(inArray(candidateSkills.candidateId, profileIds));

    if (demoSkills.length > 0) {
      // Cascades through submissions, evidence and reviews.
      await db.delete(assessmentAssignments).where(
        inArray(
          assessmentAssignments.candidateSkillId,
          demoSkills.map((row) => row.id),
        ),
      );
    }
  }

  const demoAssessments = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(inArray(assessments.createdById, ids));

  if (demoAssessments.length > 0) {
    const assessmentIdList = demoAssessments.map((row) => row.id);

    // Any assignment created against these outside the demo profiles above.
    await db
      .delete(assessmentAssignments)
      .where(inArray(assessmentAssignments.assessmentId, assessmentIdList));

    await db.delete(assessments).where(inArray(assessments.id, assessmentIdList));
  }

  await db.delete(companyMembers).where(inArray(companyMembers.userId, ids));
  await db.delete(companies).where(inArray(companies.createdById, ids));
  await db.delete(users).where(inArray(users.id, ids));

  console.log(`Removed ${ids.length} demo accounts and their data.`);
}

async function seed() {
  const stamp = Date.now().toString(36);

  console.log("Creating staff accounts...");

  const adminId = await createUser(`${DEMO_PREFIX}admin${DEMO_DOMAIN}`, "ADMIN");
  const reviewerId = await createUser(`${DEMO_PREFIX}reviewer${DEMO_DOMAIN}`, "REVIEWER");
  const recruiterId = await createUser(`${DEMO_PREFIX}recruiter${DEMO_DOMAIN}`, "RECRUITER");

  // Reviewers may only verify skills an admin has granted them, so the demo
  // reviewer is cleared across the catalogue. Without this their queue is
  // empty and the whole review flow looks broken.
  const catalogueSkills = await db.select({ id: skills.id }).from(skills);

  for (const skill of catalogueSkills) {
    await db
      .insert(reviewerSkills)
      .values({ reviewerId, skillId: skill.id, grantedById: adminId, canVerify: true })
      .onConflictDoNothing();
  }

  console.log(`  Granted the reviewer ${catalogueSkills.length} verification rights.`);

  const companyId = randomUUID();

  await db.insert(companies).values({
    id: companyId,
    name: "Northwind Talent",
    slug: buildProfileSlug("Northwind Talent", companyId),
    website: "https://example.com",
    industry: "Recruitment",
    status: "ACTIVE",
    createdById: recruiterId,
  });

  await db.insert(companyMembers).values({
    companyId,
    userId: recruiterId,
    jobTitle: "Talent Partner",
    membershipRole: "OWNER",
  });

  console.log("Creating assessments...");

  const assessmentIds = new Map<string, string>();

  for (const spec of ASSESSMENTS) {
    const sid = await skillId(spec.skill);

    const [created] = await db
      .insert(assessments)
      .values({
        title: spec.title,
        description: spec.description,
        requirements: spec.requirements,
        submissionInstructions: spec.submissionInstructions,
        difficulty: spec.difficulty,
        maximumScore: 100,
        passingScore: 70,
        maxAttempts: 2,
        estimatedDurationMinutes: 300,
        status: "PUBLISHED",
        createdById: adminId,
        publishedById: adminId,
        publishedAt: new Date(),
      })
      .returning({ id: assessments.id });

    if (!created) continue;

    assessmentIds.set(spec.skill, created.id);

    await db.insert(assessmentSkills).values({ assessmentId: created.id, skillId: sid });

    await db.insert(rubricCriteria).values(
      RUBRIC.map((criterion, index) => ({
        assessmentId: created.id,
        name: criterion.name,
        description: criterion.description,
        maximumPoints: criterion.max.toFixed(2),
        weight: criterion.weight.toFixed(2),
        displayOrder: index,
      })),
    );
  }

  console.log("Creating candidates...");

  for (const [index, spec] of CANDIDATES.entries()) {
    const email = `${DEMO_PREFIX}${spec.name.split(" ")[0].toLowerCase()}${index}${DEMO_DOMAIN}`;
    const userId = await createUser(email, "CANDIDATE", "ACTIVE", spec.name);

    const profileId = randomUUID();

    await db.insert(candidateProfiles).values({
      id: profileId,
      userId,
      fullName: spec.name,
      slug: buildProfileSlug(spec.name, profileId),
      headline: spec.headline,
      bio: `${spec.headline}. Demo account seeded for evaluation (${stamp}).`,
      city: spec.city,
      country: spec.country,
      availability: spec.availability,
      profileVisibility: "RECRUITERS_ONLY",
      githubUrl: "https://github.com/example",
    });

    for (const item of spec.verified) {
      const sid = await skillId(item.skill);

      const [candidateSkill] = await db
        .insert(candidateSkills)
        .values({
          candidateId: profileId,
          skillId: sid,
          experienceLevel: item.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
          verificationStatus: "VERIFIED",
          currentScore: item.score.toFixed(2),
          verifiedAt: new Date(),
          verifiedById: reviewerId,
        })
        .returning({ id: candidateSkills.id });

      const assessmentId = assessmentIds.get(item.skill);

      // Spread the history so consecutive skills do not all land on one day.
      const base = 8 + spec.verified.indexOf(item) * 11;

      await recordDemoActivity(profileId, "SKILL_ADDED", base + 6, { skillName: item.skill });
      await recordDemoActivity(profileId, "ASSESSMENT_STARTED", base + 4, { skill: item.skill });
      await recordDemoActivity(profileId, "ASSESSMENT_SUBMITTED", base + 2, { skill: item.skill });
      await recordDemoActivity(profileId, "SKILL_VERIFIED", base, {
        skill: item.skill,
        score: item.score,
      });

      // Build the full chain so a verified badge is backed by a real reviewed
      // submission rather than a column set in isolation.
      if (candidateSkill && assessmentId) {
        const [assignment] = await db
          .insert(assessmentAssignments)
          .values({
            assessmentId,
            candidateSkillId: candidateSkill.id,
            reviewerId,
            assignedById: adminId,
            status: "APPROVED",
            deadline: new Date(Date.now() + 7 * 86400000),
            maxAttempts: 2,
            startedAt: new Date(Date.now() - 5 * 86400000),
            submittedAt: new Date(Date.now() - 2 * 86400000),
            completedAt: new Date(Date.now() - 86400000),
          })
          .returning({ id: assessmentAssignments.id });

        if (assignment) {
          const [submission] = await db
            .insert(submissions)
            .values({
              assignmentId: assignment.id,
              attemptNumber: 1,
              notes: "Deployed on Vercel. README covers setup and trade-offs.",
              status: "APPROVED",
            })
            .returning({ id: submissions.id });

          if (submission) {
            await db.insert(submissionEvidence).values([
              {
                submissionId: submission.id,
                type: "GITHUB_REPOSITORY",
                title: "Repository",
                url: "https://github.com/example/submission",
              },
              {
                submissionId: submission.id,
                type: "LIVE_DEPLOYMENT",
                title: "Live deployment",
                url: "https://example.vercel.app",
              },
            ]);

            const [review] = await db
              .insert(reviews)
              .values({
                submissionId: submission.id,
                reviewerId,
                outcome: "APPROVED",
                totalScore: item.score.toFixed(2),
                candidateFeedback:
                  "Solid submission. Requirements met, states handled explicitly, and the README made it easy to run. Watch component size in the larger views.",
                internalNotes: "Seeded demo review.",
              })
              .returning({ id: reviews.id });

            if (review) {
              const criteria = await db
                .select()
                .from(rubricCriteria)
                .where(eq(rubricCriteria.assessmentId, assessmentId));

              await db.insert(reviewCriterionScores).values(
                criteria.map((criterion) => ({
                  reviewId: review.id,
                  rubricCriterionId: criterion.id,
                  score: (Number(criterion.maximumPoints) * (item.score / 100)).toFixed(2),
                  comment: null,
                })),
              );
            }
          }

          await db.insert(verificationRequests).values({
            candidateId: profileId,
            candidateSkillId: candidateSkill.id,
            status: "COMPLETED",
            reviewedById: adminId,
            reviewedAt: new Date(),
          });
        }
      }
    }

    for (const name of spec.inProgress ?? []) {
      const sid = await skillId(name);
      const assessmentId = assessmentIds.get(name);

      // Only claim a skill is under review when a real assessment chain backs
      // it; otherwise the status would contradict an empty review queue.
      const [candidateSkill] = await db
        .insert(candidateSkills)
        .values({
          candidateId: profileId,
          skillId: sid,
          experienceLevel: "INTERMEDIATE",
          verificationStatus: assessmentId ? "UNDER_REVIEW" : "UNVERIFIED",
        })
        .returning({ id: candidateSkills.id });

      if (candidateSkill && assessmentId) {
        const [assignment] = await db
          .insert(assessmentAssignments)
          .values({
            assessmentId,
            candidateSkillId: candidateSkill.id,
            reviewerId,
            assignedById: adminId,
            status: "SUBMITTED",
            deadline: new Date(Date.now() + 5 * 86400000),
            maxAttempts: 2,
            startedAt: new Date(Date.now() - 86400000),
            submittedAt: new Date(),
          })
          .returning({ id: assessmentAssignments.id });

        if (assignment) {
          const [submission] = await db
            .insert(submissions)
            .values({ assignmentId: assignment.id, attemptNumber: 1, status: "SUBMITTED" })
            .returning({ id: submissions.id });

          if (submission) {
            await db.insert(submissionEvidence).values({
              submissionId: submission.id,
              type: "GITHUB_REPOSITORY",
              title: "Repository",
              url: "https://github.com/example/in-progress",
            });
          }
        }

        await db.insert(verificationRequests).values({
          candidateId: profileId,
          candidateSkillId: candidateSkill.id,
          status: "IN_PROGRESS",
        });
      }
    }

    for (const name of spec.unverified ?? []) {
      const sid = await skillId(name);

      const [candidateSkill] = await db
        .insert(candidateSkills)
        .values({
          candidateId: profileId,
          skillId: sid,
          experienceLevel: "BEGINNER",
          verificationStatus: "UNVERIFIED",
        })
        .returning({ id: candidateSkills.id });

      // Leaves a pending request so the admin queue is not empty on first look.
      if (candidateSkill && index % 2 === 0) {
        await db.insert(verificationRequests).values({
          candidateId: profileId,
          candidateSkillId: candidateSkill.id,
          status: "PENDING",
        });
      }
    }

    for (const project of spec.projects ?? []) {
      const projectId = randomUUID();

      await db.insert(projects).values({
        id: projectId,
        candidateId: profileId,
        createdById: userId,
        title: project.title,
        slug: buildProfileSlug(project.title, projectId),
        description: project.description,
        githubUrl: "https://github.com/example/project",
        liveUrl: "https://example.vercel.app",
        verificationStatus: project.verified ? "VERIFIED" : "UNVERIFIED",
      });

      for (const tech of project.tech) {
        await db.insert(projectSkills).values({ projectId, skillId: await skillId(tech) });
      }

      await recordDemoActivity(profileId, "PROJECT_CREATED", 5, { title: project.title });
    }

    console.log(`  ${spec.name} (${email})`);
  }

  console.log("\nDemo data ready.");
  console.log(`  Password for every demo account: ${DEMO_PASSWORD}`);
  console.log(`  Admin:     ${DEMO_PREFIX}admin${DEMO_DOMAIN}`);
  console.log(`  Reviewer:  ${DEMO_PREFIX}reviewer${DEMO_DOMAIN}`);
  console.log(`  Recruiter: ${DEMO_PREFIX}recruiter${DEMO_DOMAIN}`);
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }

  await clean();
  await seed();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
