import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
|--------------------------------------------------------------------------
| ENUMS
|--------------------------------------------------------------------------
*/

export const accountStatusEnum = pgEnum("account_status", [
  "PENDING",
  "ACTIVE",
  "DISABLED",
  "SUSPENDED",
]);

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "PRIVATE",
  "RECRUITERS_ONLY",
  "PUBLIC",
]);

export const availabilityStatusEnum = pgEnum("availability_status", [
  "AVAILABLE",
  "OPEN_TO_OPPORTUNITIES",
  "NOT_AVAILABLE",
]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

export const skillVerificationStatusEnum = pgEnum("skill_verification_status", [
  "UNVERIFIED",
  "ASSESSMENT_ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
]);

/*
|--------------------------------------------------------------------------
| ASSESSMENT & REVIEW ENUMS
|--------------------------------------------------------------------------
*/

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "PUBLISHED",
  "ARCHIVED",
]);

export const assessmentDifficultyEnum = pgEnum("assessment_difficulty", [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "GITHUB_REPOSITORY",
  "LIVE_DEPLOYMENT",
  "FIGMA_URL",
  "SCREENSHOT",
  "DOCUMENT",
  "OTHER",
]);

export const reviewOutcomeEnum = pgEnum("review_outcome", [
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
]);

export const projectVerificationStatusEnum = pgEnum("project_verification_status", [
  "UNVERIFIED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);

export const companyMemberRoleEnum = pgEnum("company_member_role", [
  "OWNER",
  "ADMIN",
  "RECRUITER",
  "MEMBER",
]);

export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "INVITED",
  "ACTIVE",
  "DECLINED",
  "REMOVED",
]);

export const contributionVerificationStatusEnum = pgEnum("contribution_verification_status", [
  "UNVERIFIED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
]);

export const skillRequestStatusEnum = pgEnum("skill_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const verificationRequestStatusEnum = pgEnum("verification_request_status", [
  "PENDING",
  "ASSESSMENT_ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "ASSESSMENT_ASSIGNED",
  "DEADLINE_APPROACHING",
  "SUBMISSION_RECEIVED",
  "CHANGES_REQUESTED",
  "ASSESSMENT_APPROVED",
  "SKILL_VERIFIED",
  "SKILL_REJECTED",
  "REVIEW_ASSIGNED",
  "TEAM_INVITATION",
  "SYSTEM",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "SKILL_ADDED",
  "SKILL_VERIFIED",
  "ASSESSMENT_STARTED",
  "ASSESSMENT_SUBMITTED",
  "ASSESSMENT_COMPLETED",
  "REVIEW_RECEIVED",
  "PROJECT_CREATED",
  "PROJECT_VERIFIED",
  "TEAM_JOINED",
  "TEAM_CONTRIBUTION_ADDED",
]);

export const socialPlatformEnum = pgEnum("social_platform", [
  "LINKEDIN",
  "GITHUB",
  "PORTFOLIO",
  "BEHANCE",
  "DRIBBBLE",
  "WEBSITE",
  "OTHER",
]);

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull().unique(),

  description: text("description"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull().unique(),

    /** Display name for every role. Candidates also keep fullName on their profile. */
    name: text("name"),

    passwordHash: text("password_hash"),

    image: text("image"),

    accountStatus: accountStatusEnum("account_status").notNull().default("PENDING"),

    primaryRoleId: uuid("primary_role_id").references(() => roles.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_account_status_idx").on(table.accountStatus)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
      }),

    assignedById: uuid("assigned_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_roles_user_role_unique").on(table.userId, table.roleId),

    index("user_roles_role_id_idx").on(table.roleId),
  ],
);

/*
|--------------------------------------------------------------------------
| CANDIDATE PROFILE
|--------------------------------------------------------------------------
*/

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    fullName: text("full_name").notNull(),

    /** Stable public identifier used by the shareable profile URL. */
    slug: text("slug").notNull().unique(),

    headline: text("headline"),

    bio: text("bio"),

    profileImageUrl: text("profile_image_url"),

    location: text("location"),

    country: text("country"),

    city: text("city"),

    availability: availabilityStatusEnum("availability"),

    profileVisibility: profileVisibilityEnum("profile_visibility")
      .notNull()
      .default("RECRUITERS_ONLY"),

    githubUrl: text("github_url"),

    portfolioUrl: text("portfolio_url"),

    websiteUrl: text("website_url"),

    profileImageStoragePath: text("profile_image_storage_path"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("candidate_profiles_availability_idx").on(table.availability),

    index("candidate_profiles_country_city_idx").on(table.country, table.city),
  ],
);

/*
|--------------------------------------------------------------------------
| SKILLS
|--------------------------------------------------------------------------
*/

export const skillCategories = pgTable("skill_categories", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull().unique(),

  slug: text("slug").notNull().unique(),

  description: text("description"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    categoryId: uuid("category_id").references(() => skillCategories.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull().unique(),

    slug: text("slug").notNull().unique(),

    description: text("description"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("skills_category_id_idx").on(table.categoryId),
    index("skills_is_active_idx").on(table.isActive),
  ],
);

export const candidateSkills = pgTable(
  "candidate_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, {
        onDelete: "restrict",
      }),

    experienceLevel: experienceLevelEnum("experience_level").notNull(),

    verificationStatus: skillVerificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),

    currentScore: decimal("current_score", {
      precision: 5,
      scale: 2,
    }),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
    }),

    verifiedById: uuid("verified_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("candidate_skills_candidate_skill_unique").on(table.candidateId, table.skillId),

    index("candidate_skills_skill_status_idx").on(table.skillId, table.verificationStatus),

    index("candidate_skills_candidate_status_idx").on(table.candidateId, table.verificationStatus),

    index("candidate_skills_current_score_idx").on(table.currentScore),
  ],
);
/*
|--------------------------------------------------------------------------
| ASSESSMENTS
|--------------------------------------------------------------------------
*/

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    difficulty: assessmentDifficultyEnum("difficulty").notNull(),

    requirements: text("requirements").notNull(),

    submissionInstructions: text("submission_instructions").notNull(),

    maximumScore: integer("maximum_score").notNull().default(100),

    passingScore: integer("passing_score").notNull().default(70),

    maxAttempts: integer("max_attempts").notNull().default(1),

    estimatedDurationMinutes: integer("estimated_duration_minutes"),

    status: assessmentStatusEnum("status").notNull().default("DRAFT"),

    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    publishedById: uuid("published_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assessments_status_idx").on(table.status),

    index("assessments_difficulty_idx").on(table.difficulty),

    index("assessments_created_by_idx").on(table.createdById),
  ],
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT SKILLS
|--------------------------------------------------------------------------
*/

export const assessmentSkills = pgTable(
  "assessment_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, {
        onDelete: "cascade",
      }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    uniqueIndex("assessment_skills_assessment_skill_unique").on(table.assessmentId, table.skillId),

    index("assessment_skills_skill_id_idx").on(table.skillId),
  ],
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT RESOURCES
|--------------------------------------------------------------------------
*/

export const assessmentResources = pgTable(
  "assessment_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, {
        onDelete: "cascade",
      }),

    title: text("title").notNull(),

    url: text("url").notNull(),

    resourceType: text("resource_type"),

    displayOrder: integer("display_order").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("assessment_resources_assessment_id_idx").on(table.assessmentId)],
);

/*
|--------------------------------------------------------------------------
| RUBRIC CRITERIA
|--------------------------------------------------------------------------
*/

export const rubricCriteria = pgTable(
  "rubric_criteria",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),

    description: text("description"),

    maximumPoints: decimal("maximum_points", {
      precision: 6,
      scale: 2,
    }).notNull(),

    weight: decimal("weight", {
      precision: 5,
      scale: 2,
    }).notNull(),

    displayOrder: integer("display_order").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("rubric_criteria_assessment_id_idx").on(table.assessmentId)],
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT ASSIGNMENTS
|--------------------------------------------------------------------------
*/

export const assessmentAssignments = pgTable(
  "assessment_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, {
        onDelete: "restrict",
      }),

    candidateSkillId: uuid("candidate_skill_id")
      .notNull()
      .references(() => candidateSkills.id, {
        onDelete: "cascade",
      }),

    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),

    assignedById: uuid("assigned_by_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    status: assignmentStatusEnum("status").notNull().default("ASSIGNED"),

    deadline: timestamp("deadline", {
      withTimezone: true,
    }).notNull(),

    maxAttempts: integer("max_attempts").notNull().default(1),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assessment_assignments_candidate_skill_idx").on(table.candidateSkillId),

    index("assessment_assignments_assessment_idx").on(table.assessmentId),

    index("assessment_assignments_reviewer_status_idx").on(table.reviewerId, table.status),

    index("assessment_assignments_status_deadline_idx").on(table.status, table.deadline),
  ],
);

/*
|--------------------------------------------------------------------------
| SUBMISSIONS
|--------------------------------------------------------------------------
*/

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assessmentAssignments.id, {
        onDelete: "cascade",
      }),

    attemptNumber: integer("attempt_number").notNull(),

    notes: text("notes"),

    status: submissionStatusEnum("status").notNull().default("SUBMITTED"),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submissions_assignment_attempt_unique").on(
      table.assignmentId,
      table.attemptNumber,
    ),

    index("submissions_assignment_status_idx").on(table.assignmentId, table.status),

    index("submissions_submitted_at_idx").on(table.submittedAt),
  ],
);

/*
|--------------------------------------------------------------------------
| SUBMISSION EVIDENCE
|--------------------------------------------------------------------------
*/

export const submissionEvidence = pgTable(
  "submission_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, {
        onDelete: "cascade",
      }),

    type: evidenceTypeEnum("type").notNull(),

    title: text("title"),

    url: text("url"),

    storageKey: text("storage_key"),

    mimeType: text("mime_type"),

    fileSize: integer("file_size"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("submission_evidence_submission_id_idx").on(table.submissionId)],
);

/*
|--------------------------------------------------------------------------
| REVIEWS
|--------------------------------------------------------------------------
*/

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .unique()
      .references(() => submissions.id, {
        onDelete: "cascade",
      }),

    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    outcome: reviewOutcomeEnum("outcome").notNull(),

    totalScore: decimal("total_score", {
      precision: 6,
      scale: 2,
    }).notNull(),

    candidateFeedback: text("candidate_feedback").notNull(),

    internalNotes: text("internal_notes"),

    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reviews_reviewer_id_idx").on(table.reviewerId),

    index("reviews_outcome_idx").on(table.outcome),
  ],
);

/*
|--------------------------------------------------------------------------
| REVIEW CRITERION SCORES
|--------------------------------------------------------------------------
*/

export const reviewCriterionScores = pgTable(
  "review_criterion_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, {
        onDelete: "cascade",
      }),

    rubricCriterionId: uuid("rubric_criterion_id")
      .notNull()
      .references(() => rubricCriteria.id, {
        onDelete: "restrict",
      }),

    score: decimal("score", {
      precision: 6,
      scale: 2,
    }).notNull(),

    comment: text("comment"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("review_criterion_scores_review_criterion_unique").on(
      table.reviewId,
      table.rubricCriterionId,
    ),

    index("review_criterion_scores_criterion_idx").on(table.rubricCriterionId),
  ],
);
/*
|--------------------------------------------------------------------------
| PROJECTS
|--------------------------------------------------------------------------
*/

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id").references(() => candidateProfiles.id, {
      onDelete: "cascade",
    }),

    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    title: text("title").notNull(),

    slug: text("slug").notNull(),

    description: text("description").notNull(),

    coverImageUrl: text("cover_image_url"),

    githubUrl: text("github_url"),

    liveUrl: text("live_url"),

    figmaUrl: text("figma_url"),

    verificationStatus: projectVerificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("projects_creator_slug_unique").on(table.createdById, table.slug),

    index("projects_candidate_id_idx").on(table.candidateId),

    index("projects_verification_status_idx").on(table.verificationStatus),
  ],
);

export const projectSkills = pgTable(
  "project_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, {
        onDelete: "restrict",
      }),
  },
  (table) => [
    uniqueIndex("project_skills_project_skill_unique").on(table.projectId, table.skillId),

    index("project_skills_skill_id_idx").on(table.skillId),
  ],
);

export const projectMedia = pgTable(
  "project_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    type: text("type").notNull(),

    url: text("url").notNull(),

    caption: text("caption"),

    displayOrder: integer("display_order").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("project_media_project_id_idx").on(table.projectId)],
);

/*
|--------------------------------------------------------------------------
| COMPANIES & RECRUITERS
|--------------------------------------------------------------------------
*/

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull().unique(),

    logoUrl: text("logo_url"),

    description: text("description"),

    website: text("website"),

    industry: text("industry"),

    location: text("location"),

    status: companyStatusEnum("status").notNull().default("PENDING"),

    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("companies_status_idx").on(table.status),
    index("companies_industry_idx").on(table.industry),
  ],
);

export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    jobTitle: text("job_title"),

    membershipRole: companyMemberRoleEnum("membership_role").notNull().default("RECRUITER"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("company_members_company_user_unique").on(table.companyId, table.userId),

    index("company_members_user_id_idx").on(table.userId),
  ],
);

/*
|--------------------------------------------------------------------------
| TEAMS
|--------------------------------------------------------------------------
*/

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),

  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, {
      onDelete: "cascade",
    }),

  name: text("name").notNull(),

  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "restrict",
    }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    projectRole: text("project_role").notNull(),

    status: teamMemberStatusEnum("status").notNull().default("INVITED"),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("team_members_team_user_unique").on(table.teamId, table.userId),

    index("team_members_user_id_idx").on(table.userId),
  ],
);

export const teamContributions = pgTable(
  "team_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, {
        onDelete: "cascade",
      }),

    title: text("title").notNull(),

    description: text("description").notNull(),

    evidenceUrl: text("evidence_url"),

    verificationStatus: contributionVerificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_contributions_team_member_idx").on(table.teamMemberId),

    index("team_contributions_verification_status_idx").on(table.verificationStatus),
  ],
);
/*
|--------------------------------------------------------------------------
| REVIEWER AUTHORIZATION
|--------------------------------------------------------------------------
*/

export const reviewerSkills = pgTable(
  "reviewer_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, {
        onDelete: "cascade",
      }),

    grantedById: uuid("granted_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    canVerify: boolean("can_verify").notNull().default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reviewer_skills_reviewer_skill_unique").on(table.reviewerId, table.skillId),

    index("reviewer_skills_skill_id_idx").on(table.skillId),
  ],
);

/*
|--------------------------------------------------------------------------
| SKILL REQUESTS
|--------------------------------------------------------------------------
*/

export const skillRequests = pgTable(
  "skill_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    requestedById: uuid("requested_by_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    skillId: uuid("skill_id").references(() => skills.id, {
      onDelete: "set null",
    }),

    proposedName: text("proposed_name").notNull(),

    description: text("description"),

    status: skillRequestStatusEnum("status").notNull().default("PENDING"),

    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("skill_requests_status_idx").on(table.status),
    index("skill_requests_requested_by_idx").on(table.requestedById),
  ],
);

/*
|--------------------------------------------------------------------------
| VERIFICATION REQUESTS
|--------------------------------------------------------------------------
*/

export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    candidateSkillId: uuid("candidate_skill_id")
      .notNull()
      .references(() => candidateSkills.id, {
        onDelete: "cascade",
      }),

    status: verificationRequestStatusEnum("status").notNull().default("PENDING"),

    requestedAt: timestamp("requested_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
    }),

    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("verification_requests_status_idx").on(table.status),
    index("verification_requests_candidate_idx").on(table.candidateId),
    index("verification_requests_candidate_skill_idx").on(table.candidateSkillId),
  ],
);

/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    type: notificationTypeEnum("type").notNull(),

    title: text("title").notNull(),

    message: text("message").notNull(),

    entityType: text("entity_type"),

    entityId: uuid("entity_id"),

    isRead: boolean("is_read").notNull().default(false),

    readAt: timestamp("read_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.isRead),

    index("notifications_created_at_idx").on(table.createdAt),
  ],
);

/*
|--------------------------------------------------------------------------
| ACTIVITY EVENTS
|--------------------------------------------------------------------------
*/

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    type: activityTypeEnum("type").notNull(),

    entityType: text("entity_type"),

    entityId: uuid("entity_id"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_events_candidate_created_idx").on(table.candidateId, table.createdAt),

    index("activity_events_type_idx").on(table.type),
  ],
);

/*
|--------------------------------------------------------------------------
| AUDIT LOGS
|--------------------------------------------------------------------------
*/

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    action: text("action").notNull(),

    entityType: text("entity_type").notNull(),

    entityId: uuid("entity_id"),

    oldValues: jsonb("old_values"),

    newValues: jsonb("new_values"),

    ipAddress: text("ip_address"),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_user_idx").on(table.actorUserId),

    index("audit_logs_entity_idx").on(table.entityType, table.entityId),

    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

/*
|--------------------------------------------------------------------------
| EDUCATION
|--------------------------------------------------------------------------
*/

export const education = pgTable(
  "education",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    institution: text("institution").notNull(),

    degree: text("degree"),

    fieldOfStudy: text("field_of_study"),

    startDate: date("start_date", {
      mode: "string",
    }),

    endDate: date("end_date", {
      mode: "string",
    }),

    currentlyStudying: boolean("currently_studying").notNull().default(false),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("education_candidate_id_idx").on(table.candidateId)],
);

/*
|--------------------------------------------------------------------------
| EXPERIENCE
|--------------------------------------------------------------------------
*/

export const experience = pgTable(
  "experience",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    company: text("company").notNull(),

    jobTitle: text("job_title").notNull(),

    employmentType: text("employment_type"),

    location: text("location"),

    startDate: date("start_date", {
      mode: "string",
    }),

    endDate: date("end_date", {
      mode: "string",
    }),

    currentlyWorking: boolean("currently_working").notNull().default(false),

    description: text("description"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("experience_candidate_id_idx").on(table.candidateId)],
);

/*
|--------------------------------------------------------------------------
| SOCIAL LINKS
|--------------------------------------------------------------------------
*/

export const socialLinks = pgTable(
  "social_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, {
        onDelete: "cascade",
      }),

    platform: socialPlatformEnum("platform").notNull(),

    label: text("label"),

    url: text("url").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("social_links_candidate_platform_unique").on(table.candidateId, table.platform),

    index("social_links_candidate_id_idx").on(table.candidateId),
  ],
);
