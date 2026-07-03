# HelpMeDecide.ai Product Design

Date: 2026-07-03
Status: Draft for user review

## Product Thesis

HelpMeDecide.ai is an AI decision workspace that helps individuals and groups turn messy decisions into structured, evidence-backed workflows and clear recommendations.

The product is not a poll, a generic chatbot, or a single-purpose naming tool. It is a prompt-first workspace that understands what kind of decision is being made, identifies what inputs are needed, recommends an appropriate decision framework, runs that framework, and produces a decision dossier.

The first version should support both individual and collaborative decisions, with special emphasis on preference-heavy and subjective choices that still benefit from structure:

- Choosing a name, creative direction, campaign idea, or brand concept
- Picking a restaurant, activity, movie, shared purchase, or trip destination
- Comparing professional options such as vendors, agencies, venues, tools, or team activities
- Making personal decisions that require structured thinking, while avoiding regulated advice claims

The launch product should feel polished, heavyweight, and useful to professionals from day one. Social use cases are important for virality, but the product surface should also work for teams, founders, agencies, creators, and operators.

## Roadmap Boundaries

The product should launch broad enough to demonstrate a reusable decision engine, but not attempt to solve every decision category deeply.

### Now

- Prompt-first decision workspace
- Solo and group workflows
- Subjective and preference-heavy decisions
- Lightweight professional decisions
- Decision framework recommendation and execution
- Decision dossier output

### Next

- Richer social/group decision templates
- Better travel, food, event, and creative decision workflows
- More research connectors and data sources
- Team templates and reusable criteria libraries

### Later

- High-stakes personal decisions such as house bids, relocation, job offers, and major purchases
- Business/research decisions such as vendor selection, strategy choices, hiring shortlists, and procurement comparisons
- Deeper document parsing and integration with Slack, Google Drive, Notion, and calendar tools
- Specialized paid research packs

## Core Product Loop

The product starts with a natural-language prompt, not a long form.

Example prompts:

- "My friends and I are deciding where to go for a four-day trip in September. We care about food, walkability, nightlife, and keeping flights under $400."
- "Help our team choose between three agencies for a rebrand."
- "I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities."

The AI parses the prompt into an initial decision workspace:

- Decision type
- Solo or group mode
- Likely stakes
- Reversibility
- Timeline
- Options, if mentioned
- Criteria, if mentioned
- Constraints
- Stakeholders
- Input lanes that may be useful
- Missing information
- Candidate decision frameworks

The app then asks only the next most useful question or suggests the next best action. The user should not feel like they are completing an intake questionnaire. The principle is: freeform prompt in, structured decision workspace out.

## Input-First Architecture

Before recommending a decision framework, the app must understand the available and needed inputs. Each workspace has four input lanes.

### Opinions

Used when stakeholder preference matters.

Capabilities:

- Invite collaborators
- Collect comments
- Collect rankings, scores, votes, vetoes, and confidence levels
- Ask targeted questions of participants
- Summarize agreement, disagreement, and dissent

### Data

Used when facts, prices, availability, reviews, locations, comparisons, or external evidence matter.

Capabilities:

- AI-assisted web research
- Simple web search
- Source citation
- Price, review, availability, distance, or feature comparison where relevant
- "Could not verify" states when information is unavailable or uncertain

### AI Thinking

Used when the decision benefits from ideation, inference, or synthesis.

Capabilities:

- Generate options
- Discover criteria
- Identify tradeoffs
- Surface blind spots
- Simulate personas or stakeholder perspectives
- Summarize risks and assumptions
- Suggest decision frameworks

### Context

Used when the user already has relevant material.

Capabilities:

- Notes
- Links
- Pasted text
- Screenshots
- File attachment metadata in later versions, with full document parsing deferred beyond MVP
- Structured extraction into options, criteria, constraints, risks, and evidence

## Decision Map

The Decision Map is the structured state of the decision. It is editable by the user and updated by the AI as new inputs arrive.

It includes:

- Decision goal
- Options or candidates
- Criteria
- Constraints
- Stakeholders
- Evidence
- Opinions
- Assumptions
- Risks
- Open questions
- Confidence and uncertainty

The Decision Map is the main bridge between freeform prompting, collaboration, research, framework execution, and the final dossier.

## Framework Recommendation

The framework recommender should run after the app has enough initial context. It should explain its recommendation and allow user override.

Initial supported frameworks:

- Weighted scoring
- Ranked choice
- Pairwise comparison
- Owner-decides-with-input

Future frameworks:

- Majority vote
- Dot voting
- Consent or veto-based decisioning
- Pro/con matrix
- Expected value
- Risk matrix
- Regret minimization
- Satisficing
- Sensitivity analysis

Example recommendations:

- "Use ranked choice because this is a low-stakes group preference decision with several viable options."
- "Use weighted scoring because you have explicit criteria and tradeoffs across cost, convenience, and quality."
- "Use pairwise comparison because there are a few subjective options and participants may find direct scoring difficult."
- "Use owner-decides-with-input because one accountable person needs the final call, but stakeholder input should be captured."

## Workflow Runner

The workflow runner turns a framework into concrete UI steps.

For weighted scoring:

- Confirm criteria
- Set weights
- Score options
- Show ranked results
- Show sensitivity to weight changes

For ranked choice:

- Confirm options
- Invite participants if needed
- Collect rankings
- Calculate result
- Explain round-by-round or ranking logic

For pairwise comparison:

- Present option pairs
- Collect preferences
- Aggregate results
- Surface close calls and inconsistencies

For owner-decides-with-input:

- Collect stakeholder opinions
- Summarize themes and dissent
- Ask owner for final choice
- Generate rationale and next steps

## Decision Dossier

The dossier is the premium artifact. It should make the product feel valuable and defensible rather than like a chat transcript.

It includes:

- Decision summary
- Recommended option
- Ranked options
- Rationale
- Evidence summary
- Opinion summary
- Dissent and disagreement
- Risks and assumptions
- Uncertainty
- Sensitivity analysis where applicable
- Next steps
- Sources and citations where research was performed

The dossier should be shareable and exportable. Free users may receive a limited or lightly branded version. Paid users should receive full exports and richer research.

## Product Surface

### Home / Decision Composer

The home screen centers on one prompt: "What are you deciding?"

Template chips help users start without boxing the product into one category:

- Choose as a group
- Compare options
- Research a decision
- Pick a name or creative direction
- Plan a trip or event
- Make a personal decision
- Make a team decision

### Decision Workspace

The main workspace contains:

- Overview: current recommendation status, confidence, uncertainty, and next best action
- Map: options, criteria, constraints, stakeholders, evidence, open questions
- Inputs: opinions, data, AI thinking, and context lanes
- Workflow: selected framework and current step
- Dossier: generated report and final recommendation

Chat or prompting should always be available, but it should update structured objects rather than exist as the primary product surface.

### Collaborator View

Collaborators get a narrower share page:

- Read the decision context
- Add options
- Answer prompts
- Vote, rank, score, or compare options
- Comment
- Flag concerns
- View the final outcome if the owner permits

This lets collaborators contribute without needing to understand the full workspace.

## Revenue Model

The launch revenue model should be freemium, with paid upgrades around rigor, collaboration, research, and exportable value.

### Free

- Limited decision workspaces
- Prompt-first setup
- Basic Decision Map
- Small number of options and collaborators
- Basic frameworks
- Limited dossier

### Pro

- More workspaces
- Full Decision Dossier exports
- More AI research runs
- Saved context
- More frameworks
- Private share links
- Decision history

### Team

- Team workspace
- Admin and owner roles
- Shared templates
- Larger collaborator limits
- Audit trail
- Criteria libraries
- Branded or exportable dossiers
- Centralized billing

### Usage Add-ons

- Deep research credits
- Domain and social availability checks
- Travel planning research packs
- Real estate or major purchase research packs
- Vendor or procurement comparison packs

The paid boundary is: free helps you decide; paid helps you decide with confidence, evidence, and a professional artifact.

## MVP Scope

### Must Have

- Prompt-first decision creation
- AI-generated initial Decision Map
- Editable options, criteria, constraints, and stakeholders
- Visible input lanes
- Opinion lane with invite/share link and collaborator responses
- AI Thinking lane for option generation, criteria discovery, tradeoff synthesis, and blind spots
- Data lane with web research summaries and citations
- Context lane with notes and links
- Framework recommender
- Workflow runner for weighted scoring, ranked choice, pairwise comparison, and owner-decides-with-input
- Decision Dossier with recommendation, rationale, evidence, dissent, uncertainty, and next steps
- Modeled freemium/paywall structure, even if billing is not wired immediately

### Defer

- Full legal or trademark workflows
- Regulated financial advice
- Real estate bidding as a specialized module
- Complex enterprise permissions
- Slack, Google Drive, Notion, and calendar integrations
- Native mobile apps
- Sophisticated document parsing
- Marketplace or concierge services

### Launch Templates

- Choose a name or creative direction
- Pick a restaurant or activity
- Plan a group trip
- Compare vendors or tools
- Decide between personal options
- Make a team preference decision

## Domain Model

Initial domain objects:

- Decision: workspace container, prompt, owner, status, decision type, stakes, visibility
- Decision Map: options, criteria, constraints, stakeholders, assumptions, evidence, open questions
- Input Item: opinion, data source, AI inference, note, link, or attachment metadata
- Framework Run: selected method, configuration, participant inputs, scores, votes, and results
- Dossier: recommendation, rationale, ranked options, evidence summary, uncertainty, dissent, and next steps
- Collaborator: invited participant, role, permissions, and response state

## Data Flow

1. Prompt creates a draft Decision and inferred Decision Map.
2. Input lanes add structured and unstructured inputs.
3. AI normalization turns inputs into options, criteria, evidence, risks, assumptions, and open questions.
4. Framework recommender proposes one or more workflows.
5. Workflow runner collects votes, scores, rankings, comparisons, or owner input.
6. Dossier generator synthesizes the recommendation and exportable artifact.

## Error Handling And Trust

AI and research outputs must be treated as editable and uncertain.

Requirements:

- AI inferences are editable.
- Research outputs include citations.
- Research can explicitly say "could not verify."
- Framework recommendations explain assumptions.
- Dossiers include uncertainty and dissent.
- High-stakes domains show decision-support boundaries and avoid legal, financial, or medical advice claims.
- User-visible calculations for scoring and voting should be inspectable.

## Quality Bar And Testing

The first implementation should prioritize the core decision engine over visual novelty.

Test focus:

- Decision Map extraction from prompts
- Framework recommendation rules
- Weighted scoring calculations
- Ranked choice calculations
- Pairwise comparison aggregation
- Owner-decides-with-input summaries
- Dossier structure
- Collaborator permissions
- Launch template regressions

The user experience should feel structured, serious, and useful to professionals while remaining approachable enough for social decisions.
