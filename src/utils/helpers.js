// ─── Text Extraction Helpers ─────────────────────────────────

const KNOWN_SKILLS = [
  "React","ReactJS","Angular","Vue","Vue.js","Next.js","Nuxt.js",
  "JavaScript","TypeScript","HTML","HTML5","CSS","CSS3","SCSS","Sass",
  "Redux","MobX","Zustand","Context API","GraphQL","REST","REST APIs",
  "Node.js","Express","NestJS","FastAPI","Django","Flask","Spring Boot",
  "Java","Python","Go","Rust","PHP","Laravel","Ruby on Rails",
  "MongoDB","PostgreSQL","MySQL","Redis","Elasticsearch","Firebase",
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Jenkins",
  "Git","CI/CD","Agile","Scrum","JIRA","Webpack","Vite","Babel",
  "Jest","Cypress","Playwright","Selenium","Testing Library",
  "Machine Learning","TensorFlow","PyTorch","NLP","Computer Vision",
  "SQL","Kafka","RabbitMQ","Microservices","Apollo",
  "Tailwind","Bootstrap","Material-UI","Chakra UI","Figma",
  "React Native","Flutter","Swift","Kotlin","Android","iOS",
  "Storybook","D3.js","Three.js","WebGL","WebAssembly",
  "Prometheus","Grafana","Datadog","Splunk","ELK Stack",
];

const ROLE_KEYWORDS = [
  "developer","engineer","designer","architect","analyst","manager",
  "lead","scientist","devops","qa","tester","consultant","specialist",
  "frontend","backend","fullstack","full stack","mobile","cloud",
  "data","product","security","sre","ml","ai","software",
];

const CITIES = [
  "Bangalore","Bengaluru","Mumbai","Delhi","Hyderabad","Chennai",
  "Pune","Kolkata","Noida","Gurugram","Kochi","Ahmedabad",
  "Jaipur","Coimbatore","Remote","Anywhere",
];

export function extractSkills(text) {
  const tl = text.toLowerCase();
  return KNOWN_SKILLS.filter((s) => tl.includes(s.toLowerCase()));
}

export function extractExperience(text) {
  const patterns = [
    /(\d+)\+?\s*(?:to\s*(\d+))?\s*years?\s*(?:of\s*)?experience/i,
    /experience[:\s]+(\d+)\+?\s*(?:to\s*(\d+))?\s*years?/i,
    /(\d+)-(\d+)\s*years?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return { min: parseInt(m[1]), max: m[2] ? parseInt(m[2]) : parseInt(m[1]) + 2 };
  }
  return null;
}

export function extractLocation(text) {
  const tl = text.toLowerCase();
  return CITIES.find((c) => tl.includes(c.toLowerCase())) || null;
}

export function detectRole(text) {
  const tl = text.toLowerCase();
  return ROLE_KEYWORDS.find((k) => tl.includes(k)) || null;
}

export function validateJD(parsed, rawText) {
  const skills = parsed?.skills?.length > 0 ? parsed.skills : extractSkills(rawText);
  const experience = parsed?.experience?.min !== undefined ? parsed.experience : extractExperience(rawText);
  const role = parsed?.title || detectRole(rawText);

  const skillsOk = skills.length > 0;
  const expOk = experience !== null;
  const roleOk = !!role;

  const confidence = (skillsOk ? 50 : 0) + (expOk ? 30 : 0) + (roleOk ? 20 : 0);

  const missingFields = [];
  if (!skillsOk) missingFields.push("Required skills (e.g. React, Python, AWS)");
  if (!expOk) missingFields.push("Experience level (e.g. 3+ years)");
  if (!roleOk) missingFields.push("Role or job title");

  if (confidence === 0) {
    return { isValid: false, confidence, state: "invalid", missingFields, message: "Unable to extract meaningful requirements from the job description." };
  }
  if (confidence < 70) {
    return { isValid: true, confidence, state: "partial", missingFields, message: "Limited information detected. Results may be less accurate." };
  }
  return { isValid: true, confidence, state: "good", missingFields: [], message: "Job description looks good. Matching candidates now." };
}
