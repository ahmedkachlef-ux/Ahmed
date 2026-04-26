import type { TrainingLite } from "@/components/TrainingCard";

export const CATEGORIES = [
  "Cloud", "Cybersecurity", "AI", "Data", "Telecom", "IT", "Project Management", "Productivity"
];

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const FORMATS = ["onsite", "online", "hybrid"] as const;

export type FullTraining = TrainingLite & {
  description: string;
  outcomes: string[];
  modules: { title: string; items: string[] }[];
  trainerBio: string;
  sessions: { code: string; startDate: string; endDate: string; location: string; seats: number; enrolled: number; state: string }[];
  popularity: number;
  tags: string[];
};

const FAKE_TRAINERS = [
  { name: "Imane Bensalah", bio: "Former AWS Solutions Architect, 10+ years building cloud-native platforms." },
  { name: "Omar El Idrissi", bio: "Lead Cyber consultant. CISSP, OSCP. Trained 2k+ professionals." },
  { name: "Sara Lagrini", bio: "Senior MLE. PhD in NLP. Speaker at DataCon Africa." },
  { name: "Karim Tazi", bio: "PMP & PRINCE2 trainer. 15 years across telecom megaprojects." },
  { name: "Lina Haddad", bio: "Microsoft 365 MVP. Productivity coach for Fortune 500 teams." }
];

export const SAMPLE_TRAININGS: FullTraining[] = [
  {
    slug: "aws-cloud-architect",
    title: "AWS Cloud Architect — From Zero to Hero",
    category: "Cloud", level: "intermediate", format: "online",
    durationHours: 40, price: 1290, rating: 4.9, popularity: 98,
    summary: "Design, deploy, and operate scalable AWS architectures with best practices.",
    description: "Master core AWS services, design highly-available architectures, and prepare for the SAA-C03 exam through labs.",
    outcomes: ["Design HA architectures", "Implement IAM, VPC, ECS", "Cost optimization", "Pass SAA-C03"],
    modules: [
      { title: "Foundations", items: ["IAM", "VPC", "EC2", "S3"] },
      { title: "Compute & Containers", items: ["ECS", "EKS", "Lambda"] },
      { title: "Data & Reliability", items: ["RDS", "DynamoDB", "DR strategies"] },
      { title: "Security & FinOps", items: ["KMS", "Org policies", "Cost guardrails"] }
    ],
    trainer: FAKE_TRAINERS[0].name, trainerBio: FAKE_TRAINERS[0].bio,
    tags: ["aws", "cloud", "architect", "saa-c03"],
    sessions: [
      { code: "AWS-2026-Q2-01", startDate: nextDate(14), endDate: nextDate(40), location: "Live online", seats: 25, enrolled: 12, state: "open" },
      { code: "AWS-2026-Q3-02", startDate: nextDate(70), endDate: nextDate(98), location: "Casablanca", seats: 18, enrolled: 4, state: "scheduled" }
    ]
  },
  {
    slug: "cybersecurity-defender",
    title: "Cybersecurity Defender — Blue Team Essentials",
    category: "Cybersecurity", level: "intermediate", format: "hybrid",
    durationHours: 32, price: 990, rating: 4.8, popularity: 92,
    summary: "Detect, respond and harden modern enterprise environments against active threats.",
    description: "Hands-on incident response, SIEM tuning, EDR triage, and threat hunting in realistic environments.",
    outcomes: ["Triage incidents", "Hunt with EDR/SIEM", "Harden Windows/Linux", "Tabletop exercises"],
    modules: [
      { title: "Modern threat landscape", items: ["TTPs", "Kill chain", "MITRE ATT&CK"] },
      { title: "Detection", items: ["SIEM rules", "EDR queries", "Log pipelines"] },
      { title: "Response", items: ["Containment", "Forensics", "Recovery"] }
    ],
    trainer: FAKE_TRAINERS[1].name, trainerBio: FAKE_TRAINERS[1].bio,
    tags: ["soc", "blueteam", "incident-response"],
    sessions: [
      { code: "CYB-2026-Q2-01", startDate: nextDate(7), endDate: nextDate(28), location: "Hybrid", seats: 20, enrolled: 17, state: "open" }
    ]
  },
  {
    slug: "ml-foundations",
    title: "Machine Learning Foundations with Python",
    category: "AI", level: "beginner", format: "online",
    durationHours: 36, price: 890, rating: 4.7, popularity: 88,
    summary: "Build and ship your first end-to-end ML projects with confidence.",
    description: "From data wrangling to model evaluation, learn the modern ML workflow with hands-on projects.",
    outcomes: ["Train classification & regression", "Use scikit-learn", "Evaluate properly", "Ship a model"],
    modules: [
      { title: "Python for ML", items: ["NumPy", "pandas"] },
      { title: "Models", items: ["Linear, Trees, Ensembles"] },
      { title: "Deployment", items: ["FastAPI", "Docker"] }
    ],
    trainer: FAKE_TRAINERS[2].name, trainerBio: FAKE_TRAINERS[2].bio,
    tags: ["ai", "ml", "python"],
    sessions: [{ code: "ML-2026-Q2-01", startDate: nextDate(21), endDate: nextDate(50), location: "Live online", seats: 30, enrolled: 9, state: "open" }]
  },
  {
    slug: "data-engineering-pipelines",
    title: "Data Engineering: Modern Pipelines",
    category: "Data", level: "advanced", format: "online",
    durationHours: 30, price: 1190, rating: 4.6, popularity: 84,
    summary: "Design lakehouse pipelines with Airflow, dbt, and Spark.",
    description: "Architect scalable batch + streaming pipelines, ensuring data quality and observability.",
    outcomes: ["Airflow DAGs", "dbt modeling", "Streaming with Kafka", "DataOps"],
    modules: [
      { title: "Ingest", items: ["Kafka", "CDC"] },
      { title: "Transform", items: ["dbt", "Spark"] },
      { title: "Serve", items: ["Warehouse", "BI"] }
    ],
    trainer: FAKE_TRAINERS[2].name, trainerBio: FAKE_TRAINERS[2].bio,
    tags: ["data", "engineering"],
    sessions: [{ code: "DAT-2026-Q3-01", startDate: nextDate(40), endDate: nextDate(70), location: "Live online", seats: 24, enrolled: 6, state: "scheduled" }]
  },
  {
    slug: "5g-telecom-essentials",
    title: "5G Telecom Essentials",
    category: "Telecom", level: "beginner", format: "onsite",
    durationHours: 24, price: 950, rating: 4.5, popularity: 70,
    summary: "Architecture, services and rollout strategies for modern 5G networks.",
    description: "Understand 5G core, radio, slicing, and operator-grade rollout playbooks.",
    outcomes: ["RAN/Core architecture", "Slicing", "Edge computing"],
    modules: [
      { title: "Architecture", items: ["RAN", "Core", "Transport"] },
      { title: "Operations", items: ["KPIs", "OSS/BSS"] }
    ],
    trainer: FAKE_TRAINERS[3].name, trainerBio: FAKE_TRAINERS[3].bio,
    tags: ["telecom", "5g"],
    sessions: [{ code: "TEL-2026-Q2-01", startDate: nextDate(10), endDate: nextDate(20), location: "Rabat", seats: 15, enrolled: 8, state: "open" }]
  },
  {
    slug: "pmp-bootcamp",
    title: "PMP® Exam Bootcamp",
    category: "Project Management", level: "intermediate", format: "hybrid",
    durationHours: 35, price: 1490, rating: 4.8, popularity: 90,
    summary: "Pass the PMP® exam with a structured, exam-ready bootcamp.",
    description: "Structured around the PMBOK® and PMP exam content outline with simulators and coaching.",
    outcomes: ["PMP-ready", "Agile mindset", "Stakeholder mgmt"],
    modules: [
      { title: "People", items: ["Leadership", "Conflict"] },
      { title: "Process", items: ["Schedule", "Risk", "Quality"] },
      { title: "Business", items: ["Value", "Compliance"] }
    ],
    trainer: FAKE_TRAINERS[3].name, trainerBio: FAKE_TRAINERS[3].bio,
    tags: ["pmp", "pmi"],
    sessions: [{ code: "PMP-2026-Q2-01", startDate: nextDate(15), endDate: nextDate(45), location: "Hybrid", seats: 22, enrolled: 14, state: "open" }]
  },
  {
    slug: "m365-power-user",
    title: "Microsoft 365 — Power User & Productivity",
    category: "Productivity", level: "beginner", format: "online",
    durationHours: 16, price: 390, rating: 4.6, popularity: 76,
    summary: "Make Outlook, Teams, OneDrive and Excel work for you, not against you.",
    description: "Practical productivity workflows with M365 — collaboration, search, automation.",
    outcomes: ["Inbox zero", "Power Automate basics", "Excel pro tips"],
    modules: [
      { title: "Communicate", items: ["Outlook", "Teams"] },
      { title: "Automate", items: ["Power Automate"] }
    ],
    trainer: FAKE_TRAINERS[4].name, trainerBio: FAKE_TRAINERS[4].bio,
    tags: ["m365", "productivity", "excel"],
    sessions: [{ code: "M365-2026-Q2-01", startDate: nextDate(5), endDate: nextDate(12), location: "Live online", seats: 40, enrolled: 25, state: "open" }]
  },
  {
    slug: "devops-platform-engineer",
    title: "DevOps & Platform Engineering",
    category: "IT", level: "advanced", format: "online",
    durationHours: 38, price: 1290, rating: 4.7, popularity: 86,
    summary: "Build internal developer platforms with Kubernetes, ArgoCD and Terraform.",
    description: "Design golden paths, GitOps workflows, and observability for product teams.",
    outcomes: ["IDP design", "GitOps", "K8s ops", "SRE practices"],
    modules: [
      { title: "Foundations", items: ["Linux", "Containers"] },
      { title: "Orchestration", items: ["K8s", "Helm"] },
      { title: "Delivery", items: ["GitOps", "CI/CD"] }
    ],
    trainer: FAKE_TRAINERS[0].name, trainerBio: FAKE_TRAINERS[0].bio,
    tags: ["devops", "k8s"],
    sessions: [{ code: "DEV-2026-Q3-01", startDate: nextDate(50), endDate: nextDate(85), location: "Live online", seats: 25, enrolled: 11, state: "scheduled" }]
  }
];

function nextDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}
