import { useState } from "react";
import { makeAssistantToolUI, useThreadRuntime } from "@assistant-ui/react";
import {
  MessageSquareMore,
  ChevronRight,
  ChevronLeft,
  Check,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepOption {
  id: string;
  label: string;
  description?: string;
}

interface QuestionStep {
  id: string;
  title: string;
  description?: string;
  options: StepOption[];
}

interface QuestionFlowArgs {
  id: string;
  title: string;
  steps: QuestionStep[];
}

type QuestionFlowResult = string;

function QuestionFlowContent({ args }: { args: QuestionFlowArgs }) {
  const { title, steps } = args;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const threadRuntime = useThreadRuntime();

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canGoBack = currentStep > 0;
  const hasCurrentAnswer = step ? !!answers[step.id] : false;

  const handleSelect = (stepId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [stepId]: optionId }));
  };

  const handleNext = () => {
    if (!hasCurrentAnswer) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (submitted) return;

    const answerLines = steps.map((s) => {
      const selectedOption = s.options.find((o) => o.id === answers[s.id]);
      return `- ${s.title}: ${selectedOption?.label ?? "Not answered"}`;
    });

    setSubmitted(true);

    threadRuntime.append({
      role: "user",
      content: [
        {
          type: "text",
          text: `Here are my answers:\n${answerLines.join("\n")}`,
        },
      ],
    });
  };

  const isDisabled = submitted;

  if (!step) return null;

  return (
    <div className="my-2 rounded-lg border border-border border-l-[3px] border-l-maslow-teal bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {/* Step indicators */}
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx < currentStep
                    ? "w-6 bg-primary"
                    : idx === currentStep
                      ? "w-6 bg-primary"
                      : "w-3 bg-muted-foreground/40",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {submitted ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <Check size={12} /> Submitted
              </span>
            ) : (
              `Step ${currentStep + 1} of ${steps.length}`
            )}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-foreground">{step.title}</p>
        {step.description && (
          <p className="text-xs text-foreground/60 mt-1">{step.description}</p>
        )}
      </div>

      {/* Options */}
      <div className="px-2 pb-2 space-y-1">
        {step.options.map((option) => {
          const isSelected = answers[step.id] === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(step.id, option.id)}
              disabled={isDisabled}
              className={cn(
                "w-full text-left rounded-md px-3 py-2.5 transition-all",
                "border border-transparent",
                isSelected
                  ? "bg-primary/10 border-primary/30"
                  : "hover:bg-[#EBF7F4]/50 dark:hover:bg-[#EBF7F4]/10",
                isDisabled && "opacity-60 cursor-not-allowed",
                !isDisabled && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/60",
                  )}
                >
                  {isSelected && (
                    <Check size={10} className="text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-xs text-foreground/60 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      {!isDisabled && (
        <div className="px-4 pb-3 flex items-center gap-2">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!hasCurrentAnswer}
            className={cn(
              "ml-auto flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              hasCurrentAnswer
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isLastStep ? (
              <>
                Submit <Send size={14} />
              </>
            ) : (
              <>
                Next <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export const QuestionFlowToolUI = makeAssistantToolUI<
  QuestionFlowArgs,
  QuestionFlowResult
>({
  toolName: "ask_questions",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <MessageSquareMore
            size={14}
            className="animate-pulse text-maslow-teal"
          />
          <span>Preparing questions...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: QuestionFlowArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <QuestionFlowContent args={args} />;
    } catch {
      return null;
    }
  },
});
