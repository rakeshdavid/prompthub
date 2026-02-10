import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  component: About,
});

const departments = [
  {
    name: "Marketing",
    description:
      "Campaign briefs, content strategies, audience segmentation, and brand messaging templates.",
  },
  {
    name: "Legal",
    description:
      "Contract review checklists, regulatory compliance analysis, and policy documentation prompts.",
  },
  {
    name: "R&D",
    description:
      "Literature reviews, experiment design frameworks, and innovation pipeline summaries.",
  },
  {
    name: "HR",
    description:
      "Onboarding workflows, performance review templates, and employee engagement surveys.",
  },
  {
    name: "Finance",
    description:
      "Spend analysis, budget forecasting, audit preparation, and financial reporting prompts.",
  },
  {
    name: "Executive",
    description:
      "Board meeting summaries, strategic planning briefs, and stakeholder communication drafts.",
  },
  {
    name: "Sales",
    description:
      "Pipeline analysis, deal qualification frameworks, and competitive intelligence templates.",
  },
  {
    name: "IT",
    description:
      "Incident response playbooks, system architecture reviews, and change management templates.",
  },
];

const features = [
  {
    title: "Department-Organized Prompts",
    description:
      "Every prompt is tagged to a business department so teams can quickly find templates relevant to their workflows.",
  },
  {
    title: "Impact Scoring",
    description:
      "Rate and surface the highest-performing prompts through community star ratings and usage metrics.",
  },
  {
    title: "Enterprise Prompt Templates",
    description:
      "Pre-built templates with structured placeholders for company name, quarter, department, and role context.",
  },
  {
    title: "Team Collaboration",
    description:
      "Share prompts across departments, leave threaded comments, and iterate on templates together in real time.",
  },
  {
    title: "Privacy Controls",
    description:
      "Keep sensitive prompts private to your account or publish them for the entire organization to discover.",
  },
  {
    title: "Search and Filter",
    description:
      "Full-text search with category and department filters to locate the right prompt in seconds.",
  },
];

function About() {
  return (
    <div className={cn("min-h-screen bg-background")}>
      <div className="sticky top-0 z-50 bg-background">
        <Header />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-3xl">
          <div className="text-foreground font-sans space-y-10">
            <div>
              <h1 className="text-2xl font-semibold mb-4">
                About Enterprise AI Hub
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Enterprise AI Hub is a business prompt library built for
                enterprise teams. It gives every department a curated collection
                of AI prompt templates designed to accelerate day-to-day work,
                standardize outputs, and embed best practices into the way your
                organization uses AI.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Whether your Marketing team needs a campaign brief generator or
                your Finance team needs a duplicate spend analyzer, Enterprise
                AI Hub ensures every team has access to proven, reusable prompt
                templates that drive consistent, high-quality results.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-6">Platform Features</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-border p-4"
                  >
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-6">Departments</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Prompts are organized by the business departments that use them
                most. Each department has dedicated categories and templates
                tailored to its unique workflows.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {departments.map((dept) => (
                  <div
                    key={dept.name}
                    className="rounded-lg border border-border p-4"
                  >
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Built by Maslow AI</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Enterprise AI Hub is developed and maintained by{" "}
                <a
                  href="https://maslow.ai"
                  className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                >
                  Maslow AI
                </a>
                . Our mission is to help organizations unlock the full potential
                of generative AI through structured, reusable prompt
                infrastructure.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
