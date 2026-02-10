import { internalMutation } from "./_generated/server";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DEMO_PROMPTS = [
  {
    title: "Competitor Supply Chain Benchmark",
    description:
      "Generate a comprehensive supply chain benchmarking analysis comparing your organization against major MedTech competitors across key performance indicators.",
    prompt: `You are a senior competitive intelligence analyst specializing in MedTech supply chain operations. Generate a comprehensive supply chain benchmarking report comparing our organization against our primary competitors: Medtronic, Stryker, Abbott, and Boston Scientific.

Structure your analysis as follows:

## 1. Executive Summary
Provide a 3-sentence overview of our competitive positioning in supply chain performance relative to the peer group.

## 2. KPI Benchmarking Matrix
Create a comparative table across these dimensions:
- **OTIF (On-Time In-Full):** Industry benchmark is 95%. Compare delivery reliability across competitors.
- **Inventory Turns:** Analyze working capital efficiency. MedTech average is 4-6 turns/year.
- **Cost-to-Serve:** As a percentage of revenue, benchmark against the peer set.
- **Supplier Lead Times:** Average days from PO to receipt for critical components.
- **Quality Rejection Rate:** Incoming material defect rates (PPM).

## 3. Competitive Advantages & Gaps
For each competitor, identify:
- Their strongest supply chain capability (e.g., Stryker's Mako robotics manufacturing integration, Medtronic's global distribution network)
- Where we outperform them
- Where we lag and by how much

## 4. Strategic Implications
Based on the gaps identified:
- List 3 quick wins achievable within 90 days
- List 2 strategic initiatives requiring 6-12 month investment
- Highlight any competitor moves that threaten our supply chain positioning (e.g., reshoring initiatives, supplier consolidation, automation investments)

## 5. Data Confidence Assessment
Rate the confidence level (High/Medium/Low) for each KPI comparison and note any data gaps that should be addressed through primary research.

Use specific MedTech industry context: GPO contract implications, consignment inventory models, UDI traceability requirements, and sterilization/cold chain logistics considerations.`,
    department: "Supply Chain",
    categories: ["Supply Chain", "Data Analytics", "Executive Summaries"],
  },
  {
    title: "Tariff Impact Scenario Modeler",
    description:
      "Model the financial and operational impact of tariff scenarios on MedTech supply chain costs, sourcing strategies, and competitive positioning.",
    prompt: `You are a supply chain finance analyst specializing in trade policy impact assessment for the MedTech industry. Develop a comprehensive tariff scenario analysis for our medical device supply chain.

## Context
The 2025-2026 tariff environment remains volatile with potential Section 301 expansions, retaliatory tariffs, and shifting trade agreements affecting medical device components sourced from China, Southeast Asia, Mexico, and the EU.

## Scenario Framework

### Scenario A: Status Quo (Baseline)
- Current tariff rates on Chinese-sourced components (25% on List 3/4A items)
- Existing USMCA benefits for Mexico-sourced goods
- EU MDR compliance costs as non-tariff barriers
- Calculate total landed cost impact as % of COGS

### Scenario B: Escalation
- Additional 10-15% tariffs on Chinese medical device components
- Potential tariffs on Mexican imports if USMCA renegotiation stalls
- Retaliatory tariffs affecting our exports to key markets
- Model the incremental cost impact on our top 20 SKUs by revenue

### Scenario C: De-escalation / Exemptions
- Medical device exemptions similar to 2020 COVID-era exclusions
- Bilateral trade agreements reducing Southeast Asia tariff exposure
- Model the savings opportunity and timeline to realize benefits

## For Each Scenario, Provide:
1. **Financial Impact:** Total annual cost increase/decrease in $M and as % of COGS
2. **Sourcing Shifts:** Recommended supplier migration paths (e.g., China → Vietnam, China → Mexico)
3. **Competitive Impact:** How Medtronic, Abbott, Stryker, and Boston Scientific are positioned differently based on their manufacturing footprints
4. **Timeline to Adapt:** Months required to shift sourcing under each scenario
5. **Risk-Adjusted Recommendation:** Weighted probability assessment and recommended hedging strategy

## Output Format
Present findings in a decision matrix with clear executive recommendations. Include a sensitivity analysis showing cost impact at different tariff rate assumptions (15%, 25%, 35%, 45%).`,
    department: "Finance",
    categories: ["Finance & Audit", "Supply Chain", "Data Analytics"],
  },
  {
    title: "CI Executive Briefing Generator",
    description:
      "Generate a weekly competitive intelligence briefing for MedTech business unit leaders covering market moves, supply chain shifts, and strategic implications.",
    prompt: `You are the Head of Competitive Intelligence for a major MedTech company's supply chain organization. Generate a weekly CI executive briefing for distribution to BU leaders and the SVP of Supply Chain.

## Briefing Structure

### HEADER
- **Week of:** [Current date range]
- **Classification:** Internal — Confidential
- **Prepared by:** Competitive Intelligence, Supply Chain Division

### 1. Top 3 Competitive Signals This Week
For each signal, provide:
- **What happened:** One-sentence factual summary
- **Who's affected:** Which competitor(s) and which of our business units
- **So what:** Strategic implication for our supply chain in 2-3 sentences
- **Confidence level:** High / Medium / Low based on source reliability

Focus on moves by Medtronic, Stryker, Abbott, Boston Scientific, and Intuitive Surgical across:
- Manufacturing facility investments or closures
- Supplier relationship changes
- Logistics network modifications
- Technology/automation deployments
- Regulatory or trade policy developments

### 2. Supply Chain KPI Watch
Compare our latest performance against competitor benchmarks:
- OTIF delivery rate vs. industry benchmark (95%)
- Inventory days on hand vs. peer average
- Supplier quality metrics (PPM defect rates)
- Freight cost per unit trends

### 3. Market & Regulatory Radar
- Any new FDA guidance affecting supply chain operations
- EU MDR implementation milestones impacting competitors
- ESG/sustainability requirements affecting sourcing decisions
- Trade policy changes (tariffs, sanctions, export controls)

### 4. Recommended Actions
List 3-5 specific, actionable recommendations with:
- Priority level (Critical / High / Medium)
- Owner suggestion (which function should lead)
- Deadline recommendation

### 5. Intelligence Gaps
Identify 2-3 questions we cannot currently answer and suggest research methods to close the gap (analyst calls, trade show intelligence, supplier interviews, patent monitoring).

Write in a concise, executive-friendly tone. Use bullet points. Avoid jargon where plain language works. Every paragraph should pass the "so what" test.`,
    department: "Executive",
    categories: ["Executive Summaries", "Supply Chain", "Data Analytics"],
  },
  {
    title: "Supplier Risk Intelligence Matrix",
    description:
      "Build a multi-dimensional risk assessment matrix for critical suppliers using financial health, geopolitical, operational, compliance, and concentration risk factors.",
    prompt: `You are a supply chain risk management specialist for a global MedTech company. Create a comprehensive Supplier Risk Intelligence Matrix for our critical supplier base.

## Risk Assessment Framework

### Dimension 1: Financial Health Risk (Weight: 25%)
Evaluate suppliers on:
- Revenue trend (3-year CAGR)
- Debt-to-equity ratio and credit rating
- Customer concentration (% of revenue from top 3 customers)
- Profit margin stability
- Score: 1 (Minimal Risk) to 5 (Critical Risk)

### Dimension 2: Geopolitical Risk (Weight: 25%)
Assess based on:
- Manufacturing location country risk index
- Exposure to active or potential trade sanctions
- Tariff vulnerability (current and projected)
- Political stability of operating regions
- Supply route chokepoints (Suez, Strait of Malacca, Panama Canal)

### Dimension 3: Operational Risk (Weight: 20%)
Evaluate:
- Single-site vs. multi-site manufacturing
- Capacity utilization rates (>85% = elevated risk)
- Historical quality performance (PPM defect trends)
- Lead time variability (coefficient of variation)
- Business continuity / disaster recovery maturity

### Dimension 4: Regulatory Compliance Risk (Weight: 15%)
Review:
- FDA registration status and inspection history
- EU MDR certification status and timeline
- ISO 13485 audit findings
- UDI (Unique Device Identification) traceability compliance
- Environmental/ESG regulatory exposure

### Dimension 5: Concentration Risk (Weight: 15%)
Analyze:
- Are they sole-source for any critical component?
- What % of our spend do they represent?
- Switching cost and qualification timeline
- Alternative supplier availability and readiness

## Output Requirements

1. **Risk Heat Map:** Create a 5x5 matrix visualization showing each supplier plotted by likelihood vs. impact
2. **Top 10 Highest Risk Suppliers:** Ranked composite score with breakdown by dimension
3. **Mitigation Playbook:** For each top-10 supplier, provide:
   - Immediate risk mitigation action (30 days)
   - Medium-term diversification strategy (6 months)
   - Long-term structural fix (12+ months)
4. **Early Warning Indicators:** Define 3 leading indicators per risk dimension to monitor quarterly
5. **Peer Comparison:** Note where competitors (Medtronic, Stryker, Abbott) have diversified away from shared suppliers

Format as an executive-ready report suitable for presentation to the Chief Supply Chain Officer.`,
    department: "Supply Chain",
    categories: ["Supply Chain", "Data Analytics", "Finance & Audit"],
  },
  {
    title: "Reshoring vs. Offshoring Analyzer",
    description:
      "Evaluate reshoring, nearshoring, and offshoring options for MedTech manufacturing with TCO analysis, risk scoring, and implementation roadmaps.",
    prompt: `You are a strategic supply chain consultant specializing in MedTech manufacturing location decisions. Conduct a comprehensive reshoring vs. nearshoring vs. offshoring analysis for our medical device component manufacturing.

## Analysis Framework

### Option 1: Domestic Reshoring (US)
Evaluate:
- Total Cost of Ownership (TCO) including labor, facilities, utilities, regulatory compliance
- Labor availability for precision manufacturing (CNC, injection molding, clean room)
- Proximity benefits: reduced lead times, lower inventory requirements, easier quality oversight
- "Made in USA" brand value for GPO negotiations and hospital system procurement
- Tax incentives: CHIPS Act applicability, state-level manufacturing incentives
- Timeline to operational: facility build/retrofit, equipment qualification, FDA registration

### Option 2: Nearshoring (Mexico / Costa Rica)
Evaluate:
- USMCA tariff advantages and rules of origin compliance
- Labor cost differential vs. US (typically 60-70% savings)
- Existing MedTech manufacturing ecosystem (Juarez, Tijuana, Alajuela corridors)
- Logistics: 2-3 day truck transit vs. 30-45 day ocean freight from Asia
- Risk factors: cartel activity in certain regions, peso volatility, regulatory harmonization
- Competitor precedent: Which competitors already manufacture in these locations?

### Option 3: Status Quo (Asia Manufacturing)
Evaluate:
- Current landed cost including tariffs, freight, inventory carrying costs
- Lead time risk: 60-90 day ocean freight + port congestion variability
- IP protection concerns and mitigation measures
- Tariff trajectory risk (Section 301 escalation scenarios)
- Quality control overhead for remote manufacturing

## Comparative TCO Model
For a representative product family, build a TCO comparison:
| Cost Element | US | Mexico | China | Vietnam |
|---|---|---|---|---|
| Direct labor per unit | | | | |
| Facility cost (amortized) | | | | |
| Raw material (landed) | | | | |
| Tariffs & duties | | | | |
| Freight & logistics | | | | |
| Inventory carrying cost | | | | |
| Quality cost of poor quality | | | | |
| Regulatory compliance | | | | |
| **Total landed cost per unit** | | | | |

## Strategic Recommendation
Provide a phased recommendation:
1. **Phase 1 (0-6 months):** Quick wins — what can shift now?
2. **Phase 2 (6-18 months):** Major sourcing transitions
3. **Phase 3 (18-36 months):** Full network optimization

Include a risk-adjusted NPV comparison and sensitivity analysis on key variables (tariff rates, labor inflation, freight costs).

Reference what Medtronic, Stryker, and Abbott are doing with their manufacturing footprint strategies for competitive context.`,
    department: "Supply Chain",
    categories: ["Supply Chain", "Finance & Audit", "Executive Summaries"],
  },
  {
    title: "OTIF Performance Root Cause Analyzer",
    description:
      "Diagnose root causes of OTIF (On-Time In-Full) delivery failures using fishbone analysis, Pareto prioritization, and corrective action planning.",
    prompt: `You are a supply chain performance analyst specializing in delivery reliability for MedTech companies. Conduct a comprehensive root cause analysis of OTIF (On-Time In-Full) delivery performance to identify systemic issues and develop corrective action plans.

## Performance Context
- Industry benchmark OTIF rate: 95%
- Analyze the gap between current performance and target, structured by failure mode

## Ishikawa (Fishbone) Analysis

Map root causes across 6 dimensions:

### 1. Supplier Performance
- Late raw material deliveries
- Quality rejections requiring re-orders
- Capacity constraints at key suppliers
- Communication gaps on lead time changes

### 2. Manufacturing / Internal Operations
- Production scheduling conflicts
- Equipment downtime / maintenance backlogs
- Clean room availability constraints
- Batch failure / rework cycles
- Sterilization bottlenecks (EtO, gamma, e-beam)

### 3. Demand Planning & Forecasting
- Forecast accuracy by product family (MAPE analysis)
- Demand signal latency from hospital systems
- Promotional / surgeon preference surges not captured
- New product launch demand uncertainty

### 4. Logistics & Distribution
- Carrier performance variability
- Warehouse pick/pack accuracy
- Cold chain compliance failures
- Last-mile delivery challenges to hospital loading docks
- International customs clearance delays

### 5. Systems & Data
- ERP/MRP data accuracy (BOM errors, lead time settings)
- Inventory visibility gaps across nodes
- Order management system limitations
- EDI/integration failures with distributor partners

### 6. Process & Organization
- Cross-functional handoff gaps (Sales → Supply Planning → Manufacturing)
- Escalation protocols when OTIF risk is detected
- KPI ownership and accountability clarity
- Consignment inventory replenishment triggers

## Required Output

1. **Pareto Analysis:** Rank the top 10 root causes by frequency and impact on OTIF misses. Identify the vital few (typically 3-4 causes driving 80% of failures).

2. **Corrective Action Plan:** For each top-5 root cause:
   - Immediate containment action (this week)
   - Short-term fix (30 days)
   - Long-term systemic solution (90 days)
   - Owner and success metric

3. **Performance Recovery Trajectory:** Model the expected OTIF improvement curve as corrective actions take effect. Show monthly targets for the next 6 months.

4. **Competitive Benchmark:** Compare our OTIF performance against known industry data for Medtronic, Stryker, and Abbott where available.

5. **Early Warning Dashboard:** Define 5 leading indicators that predict OTIF failures 2-4 weeks before they occur, enabling proactive intervention.`,
    department: "Supply Chain",
    categories: ["Supply Chain", "Data Analytics"],
  },
  {
    title: "Competitor M&A Impact Assessment",
    description:
      "Assess the supply chain and competitive implications of major MedTech M&A transactions, divestitures, and strategic partnerships.",
    prompt: `You are a competitive intelligence strategist specializing in MedTech M&A analysis with deep supply chain expertise. Assess the supply chain and competitive implications of recent and anticipated M&A activity in the medical device industry.

## Current M&A Landscape to Analyze

### Active Transactions
1. **J&J MedTech Restructuring (Jan 2026):** Transition to BU-led model with potential DePuy Synthes orthopaedics separation. Assess supply chain integration/separation implications.
2. **Medtronic Diabetes Spinoff:** Impact on Medtronic's remaining supply chain scale and shared services.
3. **Recent Acquisitions:** Evaluate integration status of recent deals (e.g., J&J/Shockwave Medical in cardiovascular, Stryker's recent tuck-in acquisitions).

### Potential Future Transactions
Based on strategic gaps and market signals, assess likelihood and impact of:
- Boston Scientific expanding into adjacent therapeutic areas
- Stryker pursuing robotics platform acquisitions
- Private equity portfolio company consolidation in specialty devices

## Analysis Framework Per Transaction

### 1. Supply Chain Synergy Assessment
- Manufacturing footprint overlap/complementarity
- Supplier base consolidation opportunities
- Distribution network integration potential
- Estimated synergy value ($M) and timeline to realize

### 2. Competitive Impact Matrix
| Dimension | Impact on Us | Impact on Market | Timeframe |
|---|---|---|---|
| Market share shift | | | |
| Pricing power change | | | |
| Supply chain scale advantage | | | |
| Innovation pipeline impact | | | |
| GPO/IDN contract implications | | | |

### 3. Supplier Ecosystem Effects
- Will the combined entity gain leverage over shared suppliers?
- Are any of our critical suppliers at risk of being acquired or exclusive-contracted?
- Does the deal create new single-source dependencies?

### 4. Talent & Capability Impact
- Key supply chain leaders who may be displaced or recruited
- Centers of excellence that may be consolidated or eliminated
- Technology platforms (ERP, planning systems) that may change

### 5. Strategic Response Options
For each significant transaction, recommend:
- **Defensive moves:** How to protect our competitive position
- **Offensive opportunities:** How to exploit competitor distraction during integration
- **Partnership plays:** Strategic alliances to counterbalance competitor scale

## Output Format
Deliver as a board-ready briefing document with:
- One-page executive summary with heat map of overall M&A threat level
- Detailed analysis per transaction (2-3 pages each)
- 90-day action plan with specific recommendations and owners
- Intelligence collection priorities to track integration progress`,
    department: "Executive",
    categories: ["Executive Summaries", "Supply Chain", "Data Analytics"],
  },
  {
    title: "Supply Chain Cost Optimizer",
    description:
      "Identify and prioritize cost reduction opportunities across the MedTech supply chain with projected savings, implementation complexity, and risk assessment.",
    prompt: `You are a supply chain cost optimization expert for a global MedTech company. Develop a comprehensive cost reduction roadmap targeting 8-12% savings across the end-to-end supply chain while maintaining quality and service levels.

## Cost Optimization Levers

### Lever 1: Procurement & Sourcing (Target: 3-5% savings)
- Strategic sourcing: Consolidate spend across BUs for volume leverage
- Should-cost modeling: Identify suppliers with margin above fair value
- Low-cost country sourcing: Shift non-critical components (packaging, accessories)
- Specification optimization: Reduce over-engineered component specs
- Payment term optimization: Early payment discounts vs. extended terms

### Lever 2: Manufacturing Efficiency (Target: 2-3% savings)
- OEE (Overall Equipment Effectiveness) improvement from typical 65% to 80%+
- Lean manufacturing: Reduce changeover times, minimize WIP inventory
- Automation ROI: Identify manual processes with >18-month payback
- Yield improvement: Reduce scrap and rework rates
- Energy cost reduction: Utility optimization in clean room and sterilization

### Lever 3: Inventory Optimization (Target: 1-2% savings)
- Safety stock recalculation using demand variability analysis
- SKU rationalization: Identify slow-moving and obsolete inventory
- Consignment model optimization with hospital systems
- VMI (Vendor Managed Inventory) expansion with key suppliers
- Inventory turns improvement from current to industry-best benchmarks

### Lever 4: Logistics & Distribution (Target: 1-2% savings)
- Network optimization: DC location and allocation modeling
- Mode shift: Air-to-ocean conversion for non-urgent shipments
- Carrier consolidation and rate renegotiation
- Packaging optimization: Cube utilization improvement
- Last-mile delivery efficiency (direct ship vs. distributor)

### Lever 5: Indirect & Overhead (Target: 0.5-1% savings)
- Shared services consolidation across BUs
- MRO (Maintenance, Repair, Operations) spend management
- Contract labor optimization
- Travel and expediting cost reduction
- System licensing and IT cost rationalization

## For Each Lever, Provide:

| Metric | Detail |
|---|---|
| Estimated savings ($M and %) | Range with confidence level |
| Implementation complexity | Low / Medium / High |
| Time to realize | Months to first savings |
| Risk to quality/service | Low / Medium / High |
| Capital required | $M investment needed |
| Dependencies | What must be true for this to work |

## Output Requirements

1. **Savings Waterfall Chart:** Show cumulative savings build from each lever
2. **Prioritization Matrix:** Plot all initiatives on Impact vs. Effort 2x2
3. **Quick Wins (90 days):** Top 5 initiatives with fastest payback
4. **Phased Roadmap:** Quarter-by-quarter implementation plan for 12 months
5. **Competitive Context:** Where do Medtronic, Stryker, Abbott benchmark on cost-to-serve as % of revenue?
6. **Risk Mitigation:** For each high-savings initiative, identify the top risk and mitigation plan`,
    department: "Finance",
    categories: ["Finance & Audit", "Supply Chain", "Data Analytics"],
  },
  {
    title: "Regulatory Change Impact Tracker",
    description:
      "Monitor and assess the supply chain impact of evolving regulatory requirements across FDA, EU MDR, and global markets for MedTech compliance.",
    prompt: `You are a regulatory intelligence analyst specializing in how evolving medical device regulations impact supply chain operations. Create a comprehensive regulatory change impact assessment for our MedTech supply chain.

## Regulatory Domains to Monitor

### 1. FDA (United States)
- **QMSR Transition:** FDA's transition from QSR (21 CFR 820) to ISO 13485 harmonization. Impact on supplier quality agreements, audit requirements, and documentation.
- **UDI Compliance:** Unique Device Identification requirements for supply chain traceability from component to patient.
- **GUDID Database:** Registration and labeling requirements affecting packaging and distribution.
- **510(k) Modernization:** How predicate device changes may affect component specifications and sourcing.
- **Cybersecurity Requirements:** Supply chain implications for connected medical devices (pre-market and post-market).

### 2. EU MDR/IVDR (European Union)
- **MDR Implementation Status:** Which competitors have completed transition? Where are bottleneck Notified Bodies?
- **Technical Documentation Requirements:** Impact on supplier documentation and traceability.
- **Post-Market Surveillance:** Supply chain data collection requirements for PMCF studies.
- **EUDAMED Database:** Registration timeline and data submission requirements.
- **UDI-DI Assignment:** European UDI requirements vs. US requirements — harmonization gaps.

### 3. Global Market Regulations
- **MDSAP (Medical Device Single Audit Program):** Coverage across US, Canada, Australia, Brazil, Japan.
- **China NMPA:** Registration requirements and in-country testing mandates affecting sourcing.
- **Japan PMDA:** J-PAL requirements and market-specific packaging/labeling.
- **Brazil ANVISA:** GMP certification requirements for manufacturers and suppliers.

### 4. ESG & Sustainability Requirements
- **EU CSRD (Corporate Sustainability Reporting Directive):** Supply chain carbon footprint reporting.
- **Conflict minerals (Dodd-Frank Section 1502):** Tin, tantalum, tungsten, gold sourcing compliance.
- **PFAS restrictions:** Impact on medical device manufacturing (coatings, lubricants).
- **Extended Producer Responsibility:** Packaging and end-of-life device disposal.

## For Each Regulatory Change, Provide:

1. **Effective Date / Timeline:** When does compliance become mandatory?
2. **Supply Chain Impact Assessment:**
   - Affected products / product families
   - Affected suppliers (count and criticality)
   - Required process changes
   - Estimated compliance cost ($M)
3. **Competitive Intelligence:**
   - How are Medtronic, Stryker, Abbott, Boston Scientific approaching compliance?
   - Any competitive advantage/disadvantage from compliance timing?
4. **Action Items:**
   - Immediate (30 days): What must start now?
   - Medium-term (6 months): What requires planning?
   - Long-term (12+ months): What structural changes are needed?
5. **Risk Rating:** Likelihood × Impact score (1-25) with color coding

## Output Format
Deliver as a quarterly regulatory radar report with:
- Executive dashboard (1 page) with traffic light status per regulatory domain
- Detailed assessments per regulation (2-3 pages each)
- Cross-regulation dependency map (where multiple regulations interact)
- Budget impact summary for next fiscal year`,
    department: "Legal",
    categories: ["Legal Compliance", "Supply Chain", "Data Analytics"],
  },
  {
    title: "Demand Signal Intelligence Brief",
    description:
      "Analyze procedure volume trends, surgeon adoption patterns, and market signals to generate demand forecasts for MedTech supply chain planning.",
    prompt: `You are a demand intelligence analyst for a MedTech company, bridging commercial insights and supply chain planning. Generate a demand signal intelligence brief that translates market activity into actionable supply chain forecasts.

## Demand Signal Sources

### 1. Procedure Volume Analytics
- **Orthopedic procedures:** Hip/knee replacement volumes, revision surgery trends, ASC (Ambulatory Surgery Center) migration impact
- **Cardiovascular:** PCI volumes, structural heart procedure growth, electrophysiology ablation trends
- **Surgical robotics:** Robotic-assisted procedure adoption curves by hospital tier
- **Spine:** Fusion vs. motion preservation procedure mix shifts
- Analyze by geography (US regions, EU5, APAC) and by hospital tier (Academic Medical Centers, community hospitals, ASCs)

### 2. Surgeon & Hospital Adoption Signals
- New surgeon training completion rates for our platforms
- Hospital capital equipment purchase cycles and budget approval patterns
- GPO contract renewal timelines and competitive switching indicators
- IDN (Integrated Delivery Network) standardization decisions
- Value Analysis Committee (VAC) pipeline for product evaluations

### 3. Market & Competitive Signals
- Competitor product launches and their expected market share capture
- Clinical trial results that may shift standard of care (and therefore device demand)
- Reimbursement changes (CMS rate updates, new CPT codes, prior authorization requirements)
- Patient demographic trends: aging population curves by region, obesity-related procedure growth

### 4. Leading Indicators
- Hospital capital budgets (published in Q4 for following year)
- Surgeon conference attendance and training registrations
- Distributor inventory levels and order patterns
- Google Trends and medical literature publication volumes for key procedures

## Output Requirements

### Demand Forecast Summary
| Product Family | Current Quarter | Next Quarter | YoY Trend | Confidence |
|---|---|---|---|---|
| [Product A] | Units / $M | Units / $M | +/-% | H/M/L |
| [Product B] | Units / $M | Units / $M | +/-% | H/M/L |

### Signal-to-Action Translation
For each significant demand signal detected:
1. **Signal:** What was observed (procedure volume shift, competitive launch, reimbursement change)
2. **Magnitude:** Estimated demand impact in units and revenue
3. **Timing:** When the impact will hit our supply chain (weeks/months)
4. **Supply Chain Action Required:**
   - Capacity adjustment (increase/decrease production scheduling)
   - Inventory positioning (pre-build, forward deploy, or reduce)
   - Supplier notification (increase/decrease component orders)
   - Logistics adjustment (expedite or defer shipments)

### Forecast Risk Assessment
- **Upside scenarios:** What could drive demand above forecast? (e.g., competitor recall, favorable clinical data, expanded reimbursement)
- **Downside scenarios:** What could reduce demand below forecast? (e.g., competitor launch, reimbursement cuts, procedure moratorium)
- **Probability-weighted demand range:** P10 / P50 / P90 scenarios

### Competitive Demand Intelligence
How are Medtronic, Stryker, Abbott, and Boston Scientific positioning their supply chains for demand shifts? Any signals of capacity expansion, inventory builds, or distribution network changes?

Write for a supply chain planning audience. Translate all commercial signals into specific units, timelines, and operational actions.`,
    department: "Data",
    categories: ["Data Analytics", "Supply Chain", "Sales Enablement"],
  },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Step 1: Delete all messages (depends on conversations)
    const allMessages = await ctx.db.query("messages").collect();
    for (const message of allMessages) {
      await ctx.db.delete(message._id);
    }

    // Step 2: Delete all conversations (depends on prompts)
    const allConversations = await ctx.db.query("conversations").collect();
    for (const conversation of allConversations) {
      await ctx.db.delete(conversation._id);
    }

    // Step 3: Delete all comments (depends on prompts)
    const allComments = await ctx.db.query("comments").collect();
    for (const comment of allComments) {
      await ctx.db.delete(comment._id);
    }

    // Step 4: Delete all star ratings (depends on prompts)
    const allRatings = await ctx.db.query("starRatings").collect();
    for (const rating of allRatings) {
      await ctx.db.delete(rating._id);
    }

    // Step 5: Delete all prompts
    const allPrompts = await ctx.db.query("prompts").collect();
    for (const prompt of allPrompts) {
      await ctx.db.delete(prompt._id);
    }

    // Step 6: Insert all demo prompts
    const now = Date.now();
    for (let i = 0; i < DEMO_PROMPTS.length; i++) {
      const p = DEMO_PROMPTS[i];
      await ctx.db.insert("prompts", {
        title: p.title,
        description: p.description,
        prompt: p.prompt,
        categories: p.categories,
        department: p.department,
        isPublic: true,
        slug: slugify(p.title),
        stars: 0,
        likes: 0,
        // Stagger creation times so ordering is predictable
        createdAt: now - (DEMO_PROMPTS.length - i) * 60000,
      });
    }
  },
});
