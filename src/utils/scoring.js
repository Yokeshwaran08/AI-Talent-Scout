// ─────────────────────────────────────────────
// Scoring Utilities (pure JS, no LLM dependency)
// ─────────────────────────────────────────────

/**
 * Extract skills from a JD text using simple NLP-like pattern matching.
 * The LLM handles the real extraction — this is the fallback / supplement.
 */
export function extractSkillsFromText(text) {
  const knownSkills = [
    "React", "ReactJS", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js",
    "JavaScript", "TypeScript", "HTML", "HTML5", "CSS", "CSS3", "SCSS", "Sass",
    "Redux", "MobX", "Zustand", "Context API", "GraphQL", "REST", "REST APIs",
    "Node.js", "Express", "NestJS", "FastAPI", "Django", "Flask", "Spring Boot",
    "Java", "Python", "Go", "Rust", "PHP", "Laravel", "Ruby on Rails",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "Firebase",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins",
    "Git", "CI/CD", "Agile", "Scrum", "JIRA", "Webpack", "Vite", "Babel",
    "Jest", "Cypress", "Playwright", "Selenium", "Testing Library",
    "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
    "SQL", "Kafka", "RabbitMQ", "Microservices", "Apollo",
    "Tailwind", "Bootstrap", "Material-UI", "Chakra UI", "Figma",
    "React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS",
    "Storybook", "D3.js", "Three.js", "WebGL", "WebAssembly",
    "Accessibility", "A11y", "Performance", "SEO", "Analytics",
    "Prometheus", "Grafana", "Datadog", "Splunk", "ELK Stack",
  ];

  const text_lower = text.toLowerCase();
  return knownSkills.filter((skill) =>
    text_lower.includes(skill.toLowerCase())
  );
}

/**
 * Extract years of experience requirement from JD text
 */
export function extractExperienceFromText(text) {
  const patterns = [
    /(\d+)\+?\s*(?:to\s*(\d+))?\s*years?\s*(?:of\s*)?experience/i,
    /experience[:\s]+(\d+)\+?\s*(?:to\s*(\d+))?\s*years?/i,
    /(\d+)-(\d+)\s*years?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min + 2;
      return { min, max };
    }
  }
  return null;
}

/**
 * Extract location preference from JD text
 */
export function extractLocationFromText(text) {
  const cities = [
    "Bangalore", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai",
    "Pune", "Kolkata", "Noida", "Gurugram", "Kochi", "Ahmedabad",
    "Jaipur", "Coimbatore", "Remote", "Anywhere",
  ];
  const text_lower = text.toLowerCase();
  return cities.find((city) => text_lower.includes(city.toLowerCase())) || null;
}

/**
 * Detect if a role/title keyword is present in the JD text
 */
export function detectRoleFromText(text) {
  const roleKeywords = [
    "developer", "engineer", "designer", "architect", "analyst", "manager",
    "lead", "scientist", "devops", "qa", "tester", "consultant", "specialist",
    "frontend", "backend", "fullstack", "full stack", "mobile", "cloud",
    "data", "product", "security", "sre", "ml", "ai", "software",
  ];
  const text_lower = text.toLowerCase();
  return roleKeywords.find((kw) => text_lower.includes(kw)) || null;
}

// ─────────────────────────────────────────────
// JD Validation & Confidence Scoring
// ─────────────────────────────────────────────

/**
 * Validate a parsed JD and return a confidence score + validation state.
 *
 * Returns:
 * {
 *   isValid: boolean,        // false = block, true = proceed
 *   confidence: number,      // 0–100
 *   state: "good" | "partial" | "invalid",
 *   missingFields: string[], // what's missing
 *   message: string,         // user-facing message
 * }
 */
export function validateJD(parsed, rawText) {
  const skills = parsed?.skills || extractSkillsFromText(rawText);
  const experience = parsed?.experience || extractExperienceFromText(rawText);
  const role = parsed?.title || detectRoleFromText(rawText);

  const skillsDetected = skills.length > 0;
  const experienceDetected = experience !== null && experience?.min !== undefined;
  const roleDetected = !!role;

  // Confidence formula
  const confidence = Math.round(
    (skillsDetected ? 50 : 0) +
    (experienceDetected ? 30 : 0) +
    (roleDetected ? 20 : 0)
  );

  const missingFields = [];
  if (!skillsDetected) missingFields.push("Required skills (e.g. React, Python, AWS)");
  if (!experienceDetected) missingFields.push("Experience level (e.g. 3+ years)");
  if (!roleDetected) missingFields.push("Role or job title");

  // ── Case 1: Completely invalid ─────────────────
  if (confidence === 0) {
    return {
      isValid: false,
      confidence,
      state: "invalid",
      missingFields,
      message: "Unable to extract meaningful requirements from the job description.",
    };
  }

  // ── Case 2: Partial info ───────────────────────
  if (confidence < 70) {
    return {
      isValid: true,
      confidence,
      state: "partial",
      missingFields,
      message: "Limited information detected. Results may be less accurate.",
    };
  }

  // ── Case 3: Good JD ───────────────────────────
  return {
    isValid: true,
    confidence,
    state: "good",
    missingFields: [],
    message: "Job description looks good. Matching candidates now.",
  };
}

// ─────────────────────────────────────────────
// Match & Rank Scoring
// ─────────────────────────────────────────────

export function calculateSkillMatchScore(requiredSkills, candidateSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 50;
  const candidateLower = candidateSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((skill) =>
    candidateLower.includes(skill.toLowerCase())
  );
  return Math.round((matched.length / requiredSkills.length) * 100);
}

export function calculateExperienceScore(required, candidateYears) {
  if (!required || required.min === undefined) return 70;
  const { min, max } = required;
  if (candidateYears >= min && candidateYears <= max) return 100;
  if (candidateYears < min) {
    const gap = min - candidateYears;
    return Math.max(0, 100 - gap * 20);
  }
  const overage = candidateYears - max;
  return Math.max(60, 100 - overage * 5);
}

export function calculateLocationScore(preferredLocation, candidateLocation) {
  if (!preferredLocation) return 80;
  if (!candidateLocation) return 60;
  const pref = preferredLocation.toLowerCase();
  const cand = candidateLocation.toLowerCase();
  if (cand === "remote" || pref === "remote" || pref === "anywhere") return 90;
  if (cand === pref) return 100;
  const regionGroups = [
    ["bangalore", "bengaluru", "mysore"],
    ["mumbai", "pune", "thane"],
    ["delhi", "noida", "gurugram", "gurgaon", "ncr"],
    ["hyderabad", "secunderabad"],
    ["chennai", "coimbatore", "madurai", "trichy"],
    ["kochi", "trivandrum", "kottayam"],
  ];
  for (const group of regionGroups) {
    if (group.includes(pref) && group.includes(cand)) return 75;
  }
  return 30;
}

export function calculateMatchScore(skillScore, expScore, locScore) {
  return Math.round(0.6 * skillScore + 0.3 * expScore + 0.1 * locScore);
}

export function calculateRankScore(matchScore, interestScore) {
  return Math.round(0.7 * matchScore + 0.3 * interestScore);
}

export function buildExplanation(
  requiredSkills, candidateSkills, expRequired, candidateExp, matchScore, locationMatch
) {
  const candidateLower = candidateSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) =>
    candidateLower.includes(s.toLowerCase())
  );
  const missing = requiredSkills.filter(
    (s) => !candidateLower.includes(s.toLowerCase())
  );

  const lines = [];

  if (requiredSkills.length > 0) {
    lines.push(
      `Matched ${matched.length}/${requiredSkills.length} required skill${requiredSkills.length > 1 ? "s" : ""}${matched.length > 0 ? ` (${matched.slice(0, 3).join(", ")})` : ""}`
    );
  }

  if (expRequired && expRequired.min > 0) {
    if (candidateExp >= expRequired.min) {
      lines.push(`Experience aligns (${candidateExp} yrs vs required ${expRequired.min}+)`);
    } else {
      lines.push(`Slightly under-experienced (${candidateExp} yrs vs required ${expRequired.min}+)`);
    }
  }

  if (locationMatch >= 90) lines.push("Location matches perfectly");
  else if (locationMatch >= 70) lines.push("Location is in the same region");
  else if (locationMatch < 50) lines.push("Location is outside preferred area");

  if (missing.length > 0 && missing.length <= 3) {
    lines.push(`Missing: ${missing.slice(0, 2).join(", ")}`);
  }

  return lines;
}

export function interestLevelToScore(level) {
  const map = {
    High: 88,
    "Medium-High": 72,
    Medium: 58,
    "Medium-Low": 44,
    Low: 22,
  };
  return map[level] ?? 50;
}

export function getAvailabilitySignal(availability) {
  switch (availability) {
    case "open":
      return { level: "High", hint: "Currently actively looking for roles" };
    case "passive":
      return { level: "Medium", hint: "Open to hearing the right opportunity" };
    case "conditional":
      return { level: "Medium-High", hint: "Interested if conditions are right" };
    case "not_looking":
      return { level: "Low", hint: "Recently joined or not considering switch" };
    default:
      return { level: "Medium", hint: "Status unknown" };
  }
}
