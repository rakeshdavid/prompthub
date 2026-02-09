import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Send, User, Bot } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/prompt-guide")({
  component: PromptGuide,
});

interface Message {
  type: "user" | "bot";
  content: string;
}

function PromptGuide() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content:
        "Welcome to the Enterprise Prompt Guide. Paste any business prompt below and I will analyze its structure, clarity, and effectiveness for enterprise use. I will check for department context, role specification, business objectives, measurable outcomes, and compliance considerations.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", content: input }]);

    setTimeout(() => {
      const feedback = generateFeedback(input);
      setMessages((prev) => [...prev, { type: "bot", content: feedback }]);

      setTimeout(() => {
        const improvedPrompt = generateImprovedPrompt(input);
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: improvedPrompt },
        ]);
      }, 1000);
    }, 1000);

    setInput("");
  };

  const generateFeedback = (prompt: string) => {
    const lower = prompt.toLowerCase();

    const hasDepartmentContext =
      lower.includes("marketing") ||
      lower.includes("legal") ||
      lower.includes("finance") ||
      lower.includes("hr") ||
      lower.includes("r&d") ||
      lower.includes("sales") ||
      lower.includes("executive") ||
      lower.includes("it ") ||
      lower.includes("department");

    const hasRoleSpec =
      lower.includes("role") ||
      lower.includes("manager") ||
      lower.includes("director") ||
      lower.includes("analyst") ||
      lower.includes("cfo") ||
      lower.includes("ceo") ||
      lower.includes("vp ");

    const hasBusinessObjective =
      lower.includes("objective") ||
      lower.includes("goal") ||
      lower.includes("kpi") ||
      lower.includes("target") ||
      lower.includes("increase") ||
      lower.includes("reduce") ||
      lower.includes("improve");

    const hasMeasurableOutcomes =
      lower.includes("metric") ||
      lower.includes("measure") ||
      lower.includes("percentage") ||
      lower.includes("roi") ||
      lower.includes("revenue") ||
      lower.includes("cost") ||
      lower.includes("timeline");

    const hasComplianceConsiderations =
      lower.includes("compliance") ||
      lower.includes("regulation") ||
      lower.includes("policy") ||
      lower.includes("gdpr") ||
      lower.includes("hipaa") ||
      lower.includes("sox") ||
      lower.includes("legal review");

    const hasPlaceholders = prompt.includes("[") && prompt.includes("]");

    const hasOutputFormat =
      lower.includes("format") ||
      lower.includes("structure") ||
      lower.includes("table") ||
      lower.includes("bullet") ||
      lower.includes("memo") ||
      lower.includes("summary");

    const hasConstraints =
      lower.includes("limit") ||
      lower.includes("constraint") ||
      lower.includes("must") ||
      lower.includes("do not") ||
      lower.includes("avoid") ||
      lower.includes("word count");

    const feedback = [
      "Analysis of your enterprise prompt:\n",
      "Business Context:",
      `- Department context: ${hasDepartmentContext ? "Present" : "Missing - specify which department this prompt serves"}`,
      `- Role specification: ${hasRoleSpec ? "Present" : "Missing - define the intended user role"}`,
      `- Business objective: ${hasBusinessObjective ? "Present" : "Missing - state the business goal this prompt addresses"}`,
      "\nEffectiveness:",
      `- Measurable outcomes: ${hasMeasurableOutcomes ? "Present" : "Missing - include metrics or success criteria"}`,
      `- Compliance considerations: ${hasComplianceConsiderations ? "Present" : "Missing - note any regulatory or policy requirements"}`,
      `- Structured placeholders: ${hasPlaceholders ? "Present" : "Missing - use [Placeholder] syntax for reusable fields"}`,
      "\nClarity:",
      `- Output format defined: ${hasOutputFormat ? "Present" : "Missing - specify the expected response format"}`,
      `- Constraints set: ${hasConstraints ? "Present" : "Missing - add guardrails, limits, or tone requirements"}`,
      "\nRecommendations:",
      !hasDepartmentContext &&
        "- Add department context (e.g., 'This prompt is for the Finance team...')",
      !hasRoleSpec &&
        "- Specify the target role (e.g., 'Acting as a Senior Financial Analyst...')",
      !hasBusinessObjective && "- State the business objective clearly",
      !hasMeasurableOutcomes &&
        "- Include measurable outcomes or success criteria",
      !hasComplianceConsiderations &&
        "- Consider adding compliance or policy notes if applicable",
      !hasPlaceholders &&
        "- Add reusable placeholders like [Company Name], [Quarter], [Department]",
      !hasOutputFormat &&
        "- Define the expected output format (table, memo, bullet list, etc.)",
      !hasConstraints &&
        "- Set constraints such as word limits, tone, or topics to avoid",
    ]
      .filter(Boolean)
      .join("\n");

    return feedback;
  };

  const generateImprovedPrompt = (originalPrompt: string) => {
    let improvedPrompt = originalPrompt;

    const lower = originalPrompt.toLowerCase();

    const hasDepartmentContext =
      lower.includes("marketing") ||
      lower.includes("legal") ||
      lower.includes("finance") ||
      lower.includes("hr") ||
      lower.includes("r&d") ||
      lower.includes("sales") ||
      lower.includes("executive") ||
      lower.includes("it ") ||
      lower.includes("department");

    const hasRoleSpec =
      lower.includes("role") ||
      lower.includes("manager") ||
      lower.includes("analyst") ||
      lower.includes("director");

    if (!hasRoleSpec) {
      improvedPrompt =
        "You are a senior business analyst at [Company Name]. " +
        improvedPrompt;
    }

    if (!hasDepartmentContext) {
      improvedPrompt =
        "Context: This request is for the [Department] team at [Company Name] for [Quarter/Period].\n\n" +
        improvedPrompt;
    }

    if (!lower.includes("format") && !lower.includes("structure")) {
      improvedPrompt +=
        "\n\nPlease structure the response as follows:\n1. Executive Summary (2-3 sentences)\n2. Key Findings (bulleted list)\n3. Recommendations (numbered, with priority level)\n4. Next Steps and Timeline";
    }

    if (
      !lower.includes("limit") &&
      !lower.includes("constraint") &&
      !lower.includes("must")
    ) {
      improvedPrompt +=
        "\n\nConstraints:\n- Keep the response under 500 words\n- Use professional, executive-ready language\n- Include specific data points or examples where possible\n- Flag any items requiring legal or compliance review";
    }

    return (
      "Here is an improved version of your prompt with enterprise framing:\n\n---\n\n" +
      improvedPrompt +
      "\n\n---\n\nThis version adds role context, department framing, structured output format, and business constraints. Customize the placeholders in brackets before using."
    );
  };

  return (
    <div className={cn("min-h-screen bg-background flex flex-col")}>
      <div className="sticky top-0 z-50 bg-background">
        <Header />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Enterprise Prompt Guide
          </h1>
          <p className="text-muted-foreground">
            Paste a business prompt below to get feedback on its structure,
            clarity, and enterprise readiness. The analyzer will check for
            department context, role specification, business objectives, and
            more.
          </p>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.type === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.type === "bot" && (
                  <div className="p-2 rounded-full bg-muted shrink-0">
                    <Bot size={20} className="text-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] p-4 rounded-lg",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {message.content}
                  </pre>
                </div>
                {message.type === "user" && (
                  <div className="p-2 rounded-full bg-muted shrink-0">
                    <User size={20} className="text-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            <div className="flex gap-3">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your business prompt here for feedback..."
                className="flex-1"
              />
              <Button type="submit" size="default">
                <Send size={18} />
                <span className="hidden sm:inline">Analyze</span>
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PromptGuide;
