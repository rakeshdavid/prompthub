import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
  component: Docs,
});

function Docs() {
  return (
    <div className={cn("min-h-screen bg-background")}>
      <div className="sticky top-0 z-50 bg-background">
        <Header />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-3xl">
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-foreground">Documentation</h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about creating, organizing, and
              sharing enterprise AI prompts within your team.
            </p>

            <hr className="border-border" />

            <h2 className="text-foreground">Getting Started</h2>
            <p className="text-muted-foreground">
              Enterprise AI Hub is a centralized prompt library for your
              organization. Teams across Marketing, Legal, R&D, HR, Finance,
              Executive, Sales, and IT can discover and contribute prompt
              templates that standardize how AI is used across the business.
            </p>

            <h3 className="text-foreground">Browsing Prompts</h3>
            <p className="text-muted-foreground">You can find prompts by:</p>
            <ul className="text-muted-foreground">
              <li>
                Using the search bar to find prompts by keyword, title, or
                department
              </li>
              <li>Filtering by department using the sidebar categories</li>
              <li>
                Sorting by star rating to surface the most effective templates
              </li>
              <li>
                Switching between grid and list view for different browsing
                styles
              </li>
            </ul>

            <h3 className="text-foreground">Creating a Business Prompt</h3>
            <p className="text-muted-foreground">
              To submit a new prompt template:
            </p>
            <ol className="text-muted-foreground">
              <li>Sign in with your account</li>
              <li>Click the &ldquo;Share Prompt&rdquo; button</li>
              <li>
                Fill in the required fields: title, department, category,
                description, and the prompt template itself
              </li>
              <li>
                Choose visibility: public (available to all users) or private
                (visible only to you)
              </li>
              <li>Submit the prompt for others to discover and use</li>
            </ol>

            <hr className="border-border" />

            <h2 className="text-foreground">Department Guidelines</h2>
            <p className="text-muted-foreground">
              Each department has specific needs and contexts. Follow these
              guidelines to ensure your prompts are useful across the
              organization.
            </p>

            <h3 className="text-foreground">Marketing</h3>
            <p className="text-muted-foreground">
              Focus on campaign objectives, target audience, brand voice, and
              channel specifications. Include placeholders for campaign name,
              quarter, product line, and key messaging pillars. Always specify
              the expected deliverable format (brief, copy deck, social
              calendar).
            </p>

            <h3 className="text-foreground">Legal</h3>
            <p className="text-muted-foreground">
              Include jurisdiction context, relevant regulatory frameworks, and
              compliance standards. Use placeholders for contract type, parties
              involved, and applicable regulations. Clearly note that outputs
              are for drafting assistance only and require legal review.
            </p>

            <h3 className="text-foreground">R&D</h3>
            <p className="text-muted-foreground">
              Specify the research domain, methodology requirements, and
              literature scope. Include placeholders for study parameters,
              therapeutic areas, or technology domains. Reference relevant
              databases or publication standards where applicable.
            </p>

            <h3 className="text-foreground">HR</h3>
            <p className="text-muted-foreground">
              Address employee lifecycle stages: recruiting, onboarding,
              development, and offboarding. Include placeholders for role title,
              department, and company policies. Ensure prompts respect
              confidentiality and employment law considerations.
            </p>

            <h3 className="text-foreground">Finance</h3>
            <p className="text-muted-foreground">
              Structure prompts around reporting periods, account categories,
              and variance thresholds. Include placeholders for fiscal year,
              cost centers, and approval hierarchies. Reference applicable
              accounting standards or internal audit requirements.
            </p>

            <h3 className="text-foreground">Executive</h3>
            <p className="text-muted-foreground">
              Prioritize brevity, strategic framing, and actionable
              recommendations. Include placeholders for meeting date, attendees,
              and key decisions. Outputs should be presentation-ready with clear
              executive summaries.
            </p>

            <h3 className="text-foreground">Sales</h3>
            <p className="text-muted-foreground">
              Center prompts around pipeline stages, deal qualification
              criteria, and competitive positioning. Include placeholders for
              prospect name, deal size, and sales stage. Reference CRM fields
              and forecasting frameworks where relevant.
            </p>

            <h3 className="text-foreground">IT</h3>
            <p className="text-muted-foreground">
              Cover incident categories, severity levels, and escalation paths.
              Include placeholders for system name, environment, and affected
              services. Reference ITIL or internal runbook standards.
            </p>

            <hr className="border-border" />

            <h2 className="text-foreground">
              Best Practices for Enterprise Prompt Templates
            </h2>

            <h3 className="text-foreground">1. Use Structured Placeholders</h3>
            <p className="text-muted-foreground">
              Wrap variable content in square brackets so users know what to
              customize. For example: <code>[Company Name]</code>,{" "}
              <code>[Quarter]</code>, <code>[Department]</code>,{" "}
              <code>[Role Title]</code>. This makes prompts reusable across
              teams and time periods.
            </p>

            <h3 className="text-foreground">2. Define the Output Format</h3>
            <p className="text-muted-foreground">
              Specify what the response should look like. Should it be a
              bulleted summary? A formal memo? A table comparing options? Clear
              format expectations reduce back-and-forth and make outputs
              immediately useful.
            </p>

            <h3 className="text-foreground">3. Include Business Context</h3>
            <p className="text-muted-foreground">
              Prompts that include role context, business objectives, and
              audience produce significantly better results. A prompt for a CFO
              should frame things differently than one for a marketing manager.
            </p>

            <h3 className="text-foreground">
              4. Set Constraints and Guardrails
            </h3>
            <p className="text-muted-foreground">
              Include word limits, tone requirements, compliance notes, and any
              topics to avoid. Enterprise prompts should be safe to use across
              the organization without risk of generating inappropriate content.
            </p>

            <h3 className="text-foreground">5. Specify Measurable Outcomes</h3>
            <p className="text-muted-foreground">
              Where possible, describe what a successful response looks like.
              This could be a checklist of required sections, a minimum number
              of data points, or a specific structure that maps to an internal
              process.
            </p>

            <hr className="border-border" />

            <h2 className="text-foreground">Prompt Structure Guide</h2>
            <p className="text-muted-foreground">
              Every prompt in Enterprise AI Hub follows a consistent structure:
            </p>

            <div className="rounded-lg border border-border p-6 not-prose my-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-foreground">Title</dt>
                  <dd className="text-sm text-muted-foreground mt-1">
                    A clear, action-oriented name that describes what the prompt
                    does. Example: &ldquo;Quarterly Marketing Brief
                    Generator&rdquo;
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground">
                    Department
                  </dt>
                  <dd className="text-sm text-muted-foreground mt-1">
                    The primary business unit this prompt serves: Marketing,
                    Legal, R&D, HR, Finance, Executive, Sales, or IT.
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground">
                    Category
                  </dt>
                  <dd className="text-sm text-muted-foreground mt-1">
                    A functional subcategory within the department. Example:
                    &ldquo;Marketing Strategy&rdquo; or &ldquo;Legal
                    Compliance&rdquo;
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground">
                    Description
                  </dt>
                  <dd className="text-sm text-muted-foreground mt-1">
                    A short summary (one to two sentences) explaining when and
                    why to use this prompt.
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground">
                    Template
                  </dt>
                  <dd className="text-sm text-muted-foreground mt-1">
                    The full prompt body with structured placeholders, context
                    setting, format instructions, and constraints. This is the
                    content users copy and customize for their specific use
                    case.
                  </dd>
                </div>
              </dl>
            </div>

            <hr className="border-border" />

            <h2 className="text-foreground">Rating and Feedback</h2>
            <p className="text-muted-foreground">
              Use star ratings to indicate how effective a prompt template is
              for your workflow. Leave threaded comments to suggest
              improvements, share variations, or ask the author for
              clarifications. High-rated prompts surface to the top of search
              results, helping the entire organization benefit from the best
              templates.
            </p>

            <h2 className="text-foreground">Privacy and Visibility</h2>
            <p className="text-muted-foreground">
              Every prompt can be set to public or private. Public prompts are
              visible to all users of the platform. Private prompts are only
              visible to the author. Use private visibility when developing
              prompts that contain sensitive business context, then publish them
              once reviewed and approved.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Docs;
