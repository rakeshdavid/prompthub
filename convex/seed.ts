import { mutation } from "./_generated/server";

export const seedPrompts = mutation({
  args: {},
  handler: async (ctx) => {
    const prompts = [
      {
        title: "Duplicate Spend Analyzer",
        description:
          "Analyze accounts payable data to identify duplicate or overlapping vendor payments across cost centers.",
        prompt: `You are a senior financial analyst at [Company Name] responsible for accounts payable integrity. Analyze the following accounts payable dataset for [Quarter/Fiscal Year] to identify duplicate or overlapping vendor payments.

Data Context:
- Source system: [ERP System Name]
- Date range: [Start Date] to [End Date]
- Cost centers included: [List of Cost Centers]
- Currency: [Currency Code]

Analysis Requirements:
1. Identify exact duplicate invoices (same vendor, same amount, same date)
2. Flag near-duplicates (same vendor, amount within 2% tolerance, dates within 5 business days)
3. Detect split payments that may circumvent approval thresholds (e.g., two payments to the same vendor within 48 hours that sum to more than [Approval Threshold])
4. Cross-reference vendor master data to identify payments to different vendor IDs that share the same bank account or address
5. Flag any payments exceeding the average for that vendor by more than [Standard Deviation Threshold] standard deviations

Output Format:
Provide a structured report with the following sections:
- Executive Summary: Total duplicate spend identified, percentage of total AP spend
- High Priority: Confirmed duplicates requiring immediate action (table format with invoice number, vendor, amount, date, cost center)
- Medium Priority: Near-duplicates requiring review
- Low Priority: Statistical anomalies for investigation
- Recommendations: Process improvements to prevent future duplicates
- Estimated Recovery: Total recoverable amount with confidence level

Constraints:
- Do not flag known recurring payments (rent, subscriptions, utilities) as duplicates
- Apply materiality threshold of [Materiality Amount] — ignore items below this
- All amounts should be reported in [Reporting Currency]
- Flag any findings that may require disclosure under [Applicable Accounting Standard]`,
        categories: ["Finance & Audit"],
        department: "Finance",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "duplicate-spend-analyzer",
        createdAt: Date.now(),
        userId: undefined,
      },
      {
        title: "Quarterly Marketing Brief Generator",
        description:
          "Generate a structured quarterly marketing brief with campaign objectives, audience targeting, and channel strategy.",
        prompt: `You are the Head of Marketing at [Company Name]. Create a comprehensive quarterly marketing brief for [Quarter] [Year].

Business Context:
- Industry: [Industry]
- Target market: [Geographic Region(s)]
- Key product lines: [Product/Service Names]
- Quarterly revenue target: [Revenue Target]
- Previous quarter performance: [Brief Summary of Q-1 Results]

Brief Structure:

1. QUARTERLY THEME AND OBJECTIVES
Define the overarching marketing theme for the quarter. List 3-5 specific, measurable objectives tied to business goals. Each objective should include a KPI and target number.

2. TARGET AUDIENCE SEGMENTS
For each segment, provide:
- Segment name and size estimate
- Key pain points and motivations
- Preferred channels and content formats
- Stage in the buyer journey
- Messaging angle tailored to this segment

3. CAMPAIGN CALENDAR
Outline major campaigns for each month of the quarter. For each campaign include:
- Campaign name and type (awareness, lead gen, retention, upsell)
- Launch date and duration
- Primary and secondary channels
- Budget allocation as percentage of quarterly marketing spend
- Expected reach and conversion targets

4. CHANNEL STRATEGY
Break down the approach for each channel:
- Paid media (search, social, display, programmatic)
- Organic content (blog, SEO, social)
- Email marketing (nurture sequences, newsletters, product updates)
- Events and webinars
- Partner and co-marketing initiatives

5. BUDGET ALLOCATION
Provide a table showing budget split by channel, campaign, and month. Total budget: [Quarterly Marketing Budget].

6. SUCCESS METRICS AND REPORTING
Define weekly, monthly, and quarterly reporting cadence. List the dashboard metrics and tools used for tracking.

Constraints:
- Keep the brief under 2,000 words
- Use professional, presentation-ready language suitable for executive review
- All recommendations should be data-informed based on the previous quarter context provided
- Flag any campaigns that require creative assets more than 4 weeks before launch
- Note any regulatory or compliance considerations for [Industry] marketing`,
        categories: ["Marketing Strategy"],
        department: "Marketing",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "quarterly-marketing-brief-generator",
        createdAt: Date.now() - 86400000,
        userId: undefined,
      },
      {
        title: "Regulatory Compliance Checker",
        description:
          "Review business documents against regulatory requirements and flag potential compliance gaps.",
        prompt: `You are a regulatory compliance specialist at [Company Name] with expertise in [Industry] regulations. Review the following document for compliance with applicable regulatory frameworks.

Document Details:
- Document type: [Contract/Policy/Procedure/Marketing Material/Product Label]
- Business unit: [Department or Division]
- Jurisdiction: [Country/State/Region]
- Applicable regulations: [List Primary Regulations, e.g., GDPR, HIPAA, SOX, FDA 21 CFR, CCPA]
- Document effective date: [Date]
- Last review date: [Date]

Compliance Review Scope:
1. Regulatory Alignment
   - Verify the document references the correct and current version of applicable regulations
   - Identify any regulatory changes since the last review date that affect this document
   - Flag language that conflicts with regulatory requirements

2. Required Disclosures
   - Check that all mandatory disclosures are present and correctly worded
   - Verify placement and prominence meet regulatory standards
   - Identify any missing disclosures required by jurisdiction

3. Data Protection and Privacy
   - Review data handling provisions against [GDPR/CCPA/HIPAA] requirements
   - Verify consent mechanisms are adequately described
   - Check data retention and deletion provisions
   - Assess cross-border data transfer compliance

4. Risk Assessment
   For each finding, provide:
   - Severity: Critical / High / Medium / Low
   - Regulatory reference: Specific section and clause
   - Current language: Quote the problematic text
   - Recommended language: Suggested revision
   - Remediation deadline: Based on regulatory enforcement timelines

5. Attestation Readiness
   - Assess whether the document is ready for internal audit review
   - List any supporting documents or evidence needed
   - Identify stakeholders who must sign off before implementation

Output Format:
Provide a compliance review summary in table format, followed by detailed findings organized by severity. Include a remediation tracker with assigned priorities and suggested deadlines.

Constraints:
- This review is for internal advisory purposes only and does not constitute legal advice
- Flag any findings that require external legal counsel review
- All regulatory references should cite specific sections, not general frameworks
- Note if any provisions require board-level approval before modification`,
        categories: ["Legal Compliance"],
        department: "Legal",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "regulatory-compliance-checker",
        createdAt: Date.now() - 172800000,
        userId: undefined,
      },
      {
        title: "Drug Discovery Literature Review",
        description:
          "Conduct a structured literature review for drug discovery research across specified therapeutic areas.",
        prompt: `You are a principal research scientist at [Company Name] leading drug discovery efforts in [Therapeutic Area]. Conduct a structured literature review based on the following parameters.

Research Context:
- Therapeutic area: [e.g., Oncology, Immunology, Neuroscience, Cardiovascular]
- Target of interest: [Molecular Target or Pathway]
- Modality: [Small molecule / Biologic / Gene therapy / Cell therapy / Other]
- Development stage focus: [Preclinical / Phase I / Phase II / Phase III / Post-market]
- Time scope: Publications from [Start Year] to [End Year]

Review Objectives:
1. TARGET VALIDATION
   - Summarize the current evidence supporting [Target] as a viable therapeutic target
   - Document known mechanisms of action
   - Identify genetic and proteomic evidence linking the target to disease pathology
   - Note any conflicting evidence or failed clinical programs targeting this pathway

2. COMPETITIVE LANDSCAPE
   - List all known compounds in development against this target, organized by development stage
   - For each compound, provide: sponsor, modality, mechanism, current phase, and key clinical data
   - Identify potential differentiation opportunities for [Company Name]'s approach
   - Note any recent patent expirations or intellectual property developments

3. PRECLINICAL AND CLINICAL DATA
   - Summarize key efficacy data from animal models and clinical trials
   - Document safety signals and dose-limiting toxicities observed
   - Highlight any biomarker data that could inform patient selection
   - Note translational challenges between preclinical models and human studies

4. EMERGING RESEARCH
   - Identify novel approaches or combination strategies being explored
   - Document recent conference presentations (ASCO, AACR, AAN, AHA as applicable)
   - Highlight any breakthrough designations or accelerated approvals in related programs

5. GAPS AND OPPORTUNITIES
   - Identify unmet medical needs within this therapeutic space
   - Suggest areas where additional research could strengthen the development thesis
   - Recommend potential collaboration or licensing opportunities

Output Format:
Structure the review with numbered sections, in-text citations using [Author, Year] format, and a reference list at the end. Include summary tables for the competitive landscape and clinical data sections.

Constraints:
- Focus on peer-reviewed publications and regulatory filings; exclude non-peer-reviewed preprints unless directly relevant
- Clearly distinguish between established findings and preliminary data
- Note any data from [Company Name] proprietary research that should not be included in external communications
- All clinical data should reference ClinicalTrials.gov identifiers where available
- Keep the review under 3,000 words excluding tables and references`,
        categories: ["R&D Discovery"],
        department: "R&D",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "drug-discovery-literature-review",
        createdAt: Date.now() - 259200000,
        userId: undefined,
      },
      {
        title: "Employee Onboarding Checklist",
        description:
          "Generate a comprehensive onboarding checklist tailored to role, department, and seniority level.",
        prompt: `You are an HR Business Partner at [Company Name] responsible for onboarding. Create a comprehensive onboarding checklist for a new hire.

New Hire Details:
- Role: [Job Title]
- Department: [Department Name]
- Seniority level: [Entry / Mid / Senior / Director / VP / C-Suite]
- Start date: [Date]
- Location: [Office Location or Remote]
- Manager: [Manager Name]
- Direct reports: [Number, if applicable]

Generate a structured onboarding plan covering the following phases:

PRE-START (2 Weeks Before Day 1)
- IT provisioning: Equipment, accounts, software licenses, and access permissions needed for this role
- Workspace setup: Desk assignment, badge, parking, or remote office stipend
- Documentation: Offer letter signed, background check completed, I-9 verification, benefits enrollment materials sent
- Welcome package: Company swag, org chart, team directory, and role-specific reading materials
- Manager preparation: First-week calendar with key meetings pre-scheduled

WEEK 1: ORIENTATION AND FOUNDATIONS
Day-by-day schedule including:
- Day 1: Welcome session, HR orientation, benefits enrollment, IT setup walkthrough, meet the team lunch
- Day 2: Company mission, values, and culture session; compliance training (harassment prevention, data security, code of conduct)
- Day 3: Department overview, role-specific tool training, introduction to key stakeholders
- Day 4: First project or assignment briefing, buddy program introduction, review of 30/60/90-day expectations
- Day 5: Week 1 check-in with manager, questions and feedback session

WEEKS 2-4: RAMP-UP
- Complete all mandatory compliance and role-specific training modules
- Shadow key team members on core workflows
- Begin contributing to first project with buddy support
- Schedule introductory meetings with cross-functional partners listed: [Key Departments/Stakeholders]
- Attend first team meeting and department all-hands
- Review and discuss performance expectations and OKRs with manager

30/60/90 DAY MILESTONES
For each milestone, provide:
- Expected competencies achieved
- Key deliverables or contributions
- Feedback checkpoint format (self-assessment plus manager review)
- Training modules to be completed
- Social integration goals (team events, ERG introductions, mentorship pairing)

COMPLIANCE AND POLICY CHECKLIST
- List all mandatory training with due dates
- Required policy acknowledgments: [List company-specific policies]
- Security and data handling certifications
- Industry-specific certifications if applicable: [e.g., GxP, FINRA, HIPAA]

Constraints:
- Tailor complexity and scope to the seniority level provided
- For remote hires, include virtual onboarding alternatives for all in-person activities
- Include accessibility accommodations checklist
- All dates should be calculated relative to the provided start date
- Flag any items requiring manager action versus HR action versus IT action`,
        categories: ["HR Operations"],
        department: "HR",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "employee-onboarding-checklist",
        createdAt: Date.now() - 345600000,
        userId: undefined,
      },
      {
        title: "Board Meeting Summary Drafter",
        description:
          "Draft a concise board meeting summary with key decisions, action items, and strategic highlights.",
        prompt: `You are the Chief of Staff at [Company Name] responsible for board communications. Draft a board meeting summary based on the following meeting details.

Meeting Information:
- Date: [Meeting Date]
- Location: [In-person/Virtual/Hybrid]
- Duration: [Start Time] to [End Time]
- Attendees: [List of Board Members Present]
- Absentees: [List of Board Members Absent]
- Guests: [List of Non-Board Presenters]
- Quorum status: [Met/Not Met]

Generate a board meeting summary with the following structure:

1. EXECUTIVE SUMMARY
Provide a 3-5 sentence overview of the meeting covering the most significant discussions, decisions, and forward-looking statements. This summary should be suitable for distribution to the full executive team.

2. AGENDA ITEMS AND DISCUSSION
For each agenda item covered:
- Topic title and presenter
- Key points discussed (3-5 bullet points per item)
- Questions raised by board members and responses provided
- Any materials or data referenced during the discussion

3. DECISIONS AND RESOLUTIONS
For each decision made:
- Resolution text (formal language suitable for corporate records)
- Vote outcome: Approved/Rejected/Tabled, with vote count
- Effective date
- Any conditions or contingencies attached

4. FINANCIAL REVIEW HIGHLIGHTS
- Revenue performance vs. plan: [Actual] vs. [Budget]
- Key variance explanations
- Updated full-year guidance if discussed
- Capital allocation decisions or requests approved

5. STRATEGIC INITIATIVES UPDATE
For each strategic initiative reviewed:
- Initiative name and executive sponsor
- Status: On Track / At Risk / Off Track
- Key milestones achieved since last board meeting
- Upcoming milestones and timeline
- Resource or budget implications

6. ACTION ITEMS
Table format with columns:
- Action item description
- Owner (name and title)
- Due date
- Priority (High/Medium/Low)
- Status (New/In Progress/Carried Forward)

7. UPCOMING DATES
- Next board meeting: [Date]
- Committee meetings scheduled before next board meeting
- Key corporate events or deadlines

8. CONFIDENTIAL MATTERS
Section placeholder for any items discussed in executive session. Note: Details to be documented separately per governance protocol.

Constraints:
- Keep the summary under 1,500 words excluding tables
- Use formal corporate governance language appropriate for official board records
- Do not editorialize or include opinions — report factual discussion and decisions only
- All financial figures should be rounded to [thousands/millions] for readability
- Mark any items requiring follow-up legal review with [LEGAL REVIEW REQUIRED]
- This document may be subject to discovery — ensure accuracy and professionalism throughout`,
        categories: ["Executive Summaries"],
        department: "Executive",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "board-meeting-summary-drafter",
        createdAt: Date.now() - 432000000,
        userId: undefined,
      },
      {
        title: "Sales Pipeline Analysis",
        description:
          "Analyze the current sales pipeline to identify deal risks, forecast accuracy gaps, and acceleration opportunities.",
        prompt: `You are the VP of Sales Operations at [Company Name]. Analyze the current sales pipeline for [Quarter] [Year] and provide actionable insights.

Pipeline Data Context:
- CRM system: [Salesforce/HubSpot/Dynamics/Other]
- Reporting date: [Date]
- Pipeline coverage ratio target: [e.g., 3x]
- Quota for the quarter: [Total Team Quota]
- Average sales cycle: [Number] days
- Current pipeline value: [Total Pipeline Value]
- Weighted pipeline: [Weighted Value]

Analysis Framework:

1. PIPELINE HEALTH OVERVIEW
- Total pipeline by stage: Provide a breakdown of deal count and value at each stage (Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost)
- Pipeline coverage: Current coverage ratio vs. target, with gap analysis
- Quarter-over-quarter trend: Compare to same point last quarter
- New pipeline created this quarter vs. pipeline consumed

2. DEAL VELOCITY ANALYSIS
- Average days in each stage vs. benchmark
- Identify deals that have been in any single stage longer than [Threshold] days
- Calculate stage conversion rates and compare to historical averages
- Flag deals where velocity suggests risk of pushing to next quarter

3. FORECAST ACCURACY
- Compare current forecast categories (Commit, Best Case, Pipeline) to historical accuracy at this point in the quarter
- Identify reps whose forecast accuracy deviates more than [Threshold]% from the team average
- Recommend adjustments to the current forecast based on historical patterns

4. RISK ASSESSMENT
For each deal in Commit and Best Case categories, evaluate:
- Last customer engagement date (flag if more than [Days] days ago)
- Decision maker involvement (identified, engaged, champion status)
- Competitive threats (known competitors in the deal)
- Commercial terms alignment (discount level, payment terms, legal blockers)
- Technical validation status (POC complete, security review, integration assessment)

5. ACCELERATION OPPORTUNITIES
- Identify deals that could close faster with executive engagement
- Flag upsell or cross-sell opportunities within existing pipeline deals
- Recommend deals for marketing air cover (targeted content, events, customer references)
- Suggest pipeline generation activities needed to close the coverage gap

6. REP-LEVEL INSIGHTS
For each sales rep, provide:
- Individual pipeline vs. quota
- Number of deals and average deal size
- Win rate trend (last 3 quarters)
- Top 3 deals by value with current risk assessment
- Coaching recommendation based on pipeline composition

Output Format:
Lead with an executive summary (5-7 bullets), followed by detailed analysis in each section. Use tables for pipeline breakdowns and rep-level data. Include a priority action list at the end.

Constraints:
- Base all analysis on the data context provided; clearly note where assumptions are made
- Use [Company Name] stage definitions, not generic pipeline stages
- Financial figures in [Currency], rounded to nearest [thousand/million]
- All recommendations should include specific deal names or rep names where applicable
- Flag any data quality issues that could affect analysis accuracy`,
        categories: ["Sales Enablement"],
        department: "Sales",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "sales-pipeline-analysis",
        createdAt: Date.now() - 518400000,
        userId: undefined,
      },
      {
        title: "IT Incident Response Template",
        description:
          "Generate a structured incident response plan for IT service disruptions with severity classification and communication protocols.",
        prompt: `You are the IT Service Manager at [Company Name] responsible for incident management. Generate a structured incident response document for the following incident.

Incident Details:
- Incident ID: [Auto-generated or manual ID]
- Reported by: [Name and Department]
- Date/Time reported: [Timestamp]
- Affected system(s): [System Name(s)]
- Affected environment: [Production / Staging / Development]
- Affected users: [Number and scope — internal, external, customer-facing]
- Business impact: [Revenue-affecting / Operational / Informational]
- Current status: [Investigating / Identified / Monitoring / Resolved]

1. SEVERITY CLASSIFICATION
Based on the incident details, classify using the following matrix:
- SEV-1 (Critical): Complete service outage affecting external customers or revenue-generating systems
- SEV-2 (High): Significant degradation affecting a large number of internal users or partial customer impact
- SEV-3 (Medium): Limited impact, workaround available, affecting a single team or non-critical system
- SEV-4 (Low): Minor issue, no immediate business impact, can be addressed during normal business hours

Provide the classification and justification.

2. INCIDENT TIMELINE
Document the following timestamps:
- Time of first customer or user report
- Time incident was acknowledged by on-call
- Time initial triage was completed
- Time root cause was identified (if applicable)
- Time mitigation was implemented
- Time service was fully restored
- Time post-incident review was scheduled

3. IMPACT ASSESSMENT
- Number of users affected and by what severity
- Revenue impact estimate (if applicable): [Estimated $ per hour of downtime]
- SLA implications: List any SLA breaches or at-risk commitments
- Data integrity assessment: Was any data lost, corrupted, or exposed?
- Compliance implications: Does this incident trigger any regulatory notification requirements (e.g., breach notification under GDPR, HIPAA)?

4. RESPONSE ACTIONS
For each action taken:
- Action description
- Owner (name and role)
- Timestamp
- Outcome (successful/unsuccessful/pending)
- Dependencies or blockers

5. COMMUNICATION PLAN
Define communications for each audience:
- Internal engineering team: Technical details, Slack channel, war room link
- Internal stakeholders (VP+ and affected department heads): Business impact summary, ETA to resolution
- Customer-facing teams (Support, CSM, Sales): Talk track and FAQ for customer inquiries
- External customers (if applicable): Status page update, email notification, social media post
- Executive leadership: One-paragraph summary suitable for C-suite briefing

For each communication, include: audience, channel, frequency, owner, and template text.

6. ROOT CAUSE ANALYSIS (Preliminary)
If root cause is identified:
- Technical root cause description
- Contributing factors (process, people, technology)
- Why existing monitoring or alerting did not prevent or detect earlier
- Related incidents from the past 12 months

7. REMEDIATION AND PREVENTION
- Immediate fixes applied (with change management ticket references)
- Short-term improvements (1-2 weeks)
- Long-term prevention measures (30-90 days)
- Monitoring enhancements to detect similar issues earlier
- Runbook updates needed

8. POST-INCIDENT REVIEW
- Scheduled date: [Within 48 hours of resolution for SEV-1/SEV-2]
- Required attendees
- Pre-read materials to prepare
- Blameless retrospective format: What happened, what went well, what could improve

Constraints:
- Follow [Company Name] ITIL-aligned incident management process
- All timestamps in [Timezone] using 24-hour format
- Reference change management tickets for any production changes made during response
- Escalation path must follow the on-call rotation: [Primary > Secondary > Engineering Manager > VP Engineering > CTO]
- Document must be suitable for sharing with external auditors if requested`,
        categories: ["IT Operations"],
        department: "IT",
        stars: 0,
        likes: 0,
        isPublic: true,
        slug: "it-incident-response-template",
        createdAt: Date.now() - 604800000,
        userId: undefined,
      },
    ];

    const insertedIds = [];
    for (const prompt of prompts) {
      const id = await ctx.db.insert("prompts", prompt);
      insertedIds.push(id);
    }

    return {
      inserted: insertedIds.length,
      ids: insertedIds,
    };
  },
});
