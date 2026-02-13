import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  FileText,
  Edit2,
  Check,
  X,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DocumentSource {
  documentId: string;
  jsonPath: string;
  snippet: string;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  sources?: DocumentSource[];
}

interface DocumentArgs {
  documentType: string;
  title: string;
  sections: DocumentSection[];
  metadata?: {
    objective?: string;
    scope?: string;
    roles?: string[];
    slas?: string;
  };
}

type DocumentResult = string;

function DocumentContent({ args }: { args: DocumentArgs }) {
  const { documentType, title, sections, metadata } = args;
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>(
    {},
  );
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set(),
  );
  const [copied, setCopied] = useState(false);

  // Initialize edited content with original content
  useEffect(() => {
    if (Object.keys(editedContent).length === 0) {
      const initial: Record<string, string> = {};
      sections.forEach((section) => {
        initial[section.id] = section.content;
      });
      setEditedContent(initial);
    }
  }, [sections, editedContent]);

  const handleEdit = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSave = (sectionId: string) => {
    setEditingSection(null);
    // Content is already updated in editedContent state
  };

  const handleCancel = (sectionId: string) => {
    setEditingSection(null);
    // Restore original content
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      setEditedContent((prev) => ({ ...prev, [sectionId]: section.content }));
    }
  };

  const handleContentChange = (sectionId: string, content: string) => {
    setEditedContent((prev) => ({ ...prev, [sectionId]: content }));
  };

  const toggleSources = (sectionId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const copyDocument = async () => {
    const fullDocument = [
      `# ${title}`,
      `\n**Document Type:** ${documentType}\n`,
      ...(metadata?.objective
        ? [`## Metadata\n- **Objective:** ${metadata.objective}`]
        : []),
      ...(metadata?.scope ? [`- **Scope:** ${metadata.scope}`] : []),
      ...(metadata?.roles && Array.isArray(metadata.roles)
        ? [`- **Roles:** ${metadata.roles.join(", ")}`]
        : []),
      ...(metadata?.slas ? [`- **SLAs:** ${metadata.slas}`] : []),
      `\n---\n`,
      ...sections.map((section) => {
        const content = editedContent[section.id] || section.content;
        const sourcesText =
          section.sources && section.sources.length > 0
            ? `\n\n*Sources: ${section.sources.map((s) => s.documentId).join(", ")}*`
            : "";
        return `## ${section.title}\n\n${content}${sourcesText}\n`;
      }),
    ].join("\n");

    await navigator.clipboard.writeText(fullDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-card">
      {/* Header */}
      <div className="tool-card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-maslow-teal" />
          <div>
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {documentType} Document
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyDocument}
          className="h-7 text-xs"
        >
          {copied ? (
            <>
              <Check size={12} className="mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} className="mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {metadata.objective && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Objective:
                </span>{" "}
                <span className="text-foreground">{metadata.objective}</span>
              </div>
            )}
            {metadata.scope && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Scope:
                </span>{" "}
                <span className="text-foreground">{metadata.scope}</span>
              </div>
            )}
            {metadata.roles &&
              Array.isArray(metadata.roles) &&
              metadata.roles.length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Roles:
                  </span>{" "}
                  <span className="text-foreground">
                    {metadata.roles.join(", ")}
                  </span>
                </div>
              )}
            {metadata.slas && (
              <div>
                <span className="font-medium text-muted-foreground">SLAs:</span>{" "}
                <span className="text-foreground">{metadata.slas}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Sections */}
      <div className="divide-y divide-border/50">
        {sections.map((section) => {
          const isEditing = editingSection === section.id;
          const content = editedContent[section.id] || section.content;
          const hasSources = section.sources && section.sources.length > 0;
          const sourcesExpanded = expandedSources.has(section.id);

          return (
            <div key={section.id} className="px-4 py-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h4>
                <div className="flex items-center gap-2">
                  {hasSources && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSources(section.id)}
                      className="h-6 text-xs"
                    >
                      {sourcesExpanded ? (
                        <>
                          <ChevronUp size={12} className="mr-1" />
                          Hide Sources
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} className="mr-1" />
                          {section.sources?.length} Source
                          {section.sources && section.sources.length !== 1
                            ? "s"
                            : ""}
                        </>
                      )}
                    </Button>
                  )}
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(section.id)}
                        className="h-6 text-xs"
                      >
                        <Check size={12} className="mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(section.id)}
                        className="h-6 text-xs"
                      >
                        <X size={12} className="mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(section.id)}
                      className="h-6 text-xs"
                    >
                      <Edit2 size={12} className="mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Section Content */}
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) =>
                    handleContentChange(section.id, e.target.value)
                  }
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Edit document content (markdown supported)..."
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Sources */}
              {hasSources && sourcesExpanded && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Sources:
                  </p>
                  <div className="space-y-2">
                    {section.sources?.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-muted/50 rounded p-2 border border-border/30"
                      >
                        <div className="flex items-start gap-2">
                          <ExternalLink
                            size={12}
                            className="text-maslow-teal mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {source.documentId}
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-0.5 truncate">
                              {source.jsonPath}
                            </p>
                            {source.snippet && (
                              <p className="text-muted-foreground mt-1 text-[10px] line-clamp-2">
                                {source.snippet}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const DocumentToolUI = makeAssistantToolUI<DocumentArgs, DocumentResult>(
  {
    toolName: "generate_document",
    render: ({ result, status }) => {
      if (status.type === "running") {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card shadow-sm px-3 py-2 text-sm text-muted-foreground">
            <FileText size={14} className="animate-pulse text-maslow-teal" />
            <span>Generating document...</span>
          </div>
        );
      }

      if (!result) return null;

      try {
        const args: DocumentArgs =
          typeof result === "string" ? JSON.parse(result) : result;
        return <DocumentContent args={args} />;
      } catch {
        return null;
      }
    },
  },
);
