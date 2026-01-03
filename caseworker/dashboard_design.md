# AI-Assisted SSDI Review Dashboard Design

## Overview
The dashboard is designed to present a "Human-in-the-Loop" workflow where the AI acts as a junior analyst, surfacing insights, flagging issues, and preparing a preliminary determination for the Senior Caseworker (Human).

The interface should be clean, scannable, and allow caseworkers to quickly understand the AI's analysis while maintaining full control over the final decision.

> **Note:** For technical data mapping details, see `data_mapping.md`

---

## Layout Structure

### 1. Header / Applicant Summary Card
A prominent card at the top providing immediate context about the applicant and AI's overall assessment.

**Visual Design:**
- Large, readable applicant name
- Application ID in smaller, monospace font
- Submission date with relative time indicator (e.g., "Submitted 3 days ago")
- **AI Recommendation Badge** - Large, color-coded badge:
  - 🟢 **APPROVE** - Green badge with checkmark icon
  - 🔴 **DENY** - Red badge with X icon  
  - 🟡 **NEEDS REVIEW** - Yellow/amber badge with warning icon
- **Confidence Score** - Circular progress indicator or percentage badge
- **AI Summary** - 2-3 sentence executive summary in a subtle card or callout box

**Interaction:**
- Clicking the summary expands to show more detail
- Badge tooltip shows confidence breakdown

---

### 2. Progress Tracker (The 5-Step Sequential Evaluation)
A horizontal stepper component showing the status of each evaluation phase at a glance.

**Visual Design:**
- Horizontal timeline/stepper with 6 phases (Phase 0-5)
- Each phase shows:
  - Phase number and name
  - Status indicator (icon + color):
    - ✅ **PASS** - Green checkmark
    - ❌ **FAIL** - Red X
    - ⚠️ **WARN** - Yellow warning triangle
    - For Phase 3: **MET** (green), **NOT_MET** (red), **EQUALED** (blue), **WARN** (yellow)
    - For Phase 5: **DISABLED** (green), **NOT_DISABLED** (red), **WARN** (yellow)
- Connecting lines between phases (colored based on status)
- Clickable phases that expand to show details

**Interaction:**
- Hover shows phase status and brief summary
- Click expands/collapses detailed phase view
- Visual connection shows sequential flow

---

## Detailed Phase Views (Expandable Cards)

Each phase is displayed as an expandable card that can be opened to see full analysis. Cards should be visually distinct but consistent in structure.

### Phase 0: Basic Eligibility & Insured Status
**Card Header:**
- Phase name and number
- Status badge (PASS/FAIL/WARN)
- Expand/collapse toggle

**Card Content (when expanded):**
- **AI Reasoning** - Prominent text block explaining the AI's analysis
- **Key Data Points** - Summary table or list:
  - Age (calculated from birthdate)
  - Alleged Onset Date (AOD)
  - Date Last Insured (DLI)
  - Quarters of Coverage
- **Citations** - Chips or badges showing legal references (e.g., "42 U.S.C. § 423(c)")
- **Evidence** - List of supporting evidence with links to source documents/fields

**Visual Treatment:**
- Subtle background color based on status
- Icons for different data types
- Clickable citations that could link to reference materials

---

### Phase 1: Substantial Gainful Activity (SGA)
**Card Content:**
- **Status Badge** (PASS/FAIL/WARN)
- **AI Reasoning** - Explanation of SGA determination
- **Calculated Monthly Earnings** - Large, prominent number if available
- **Supporting Data:**
  - Current work status
  - Post-AOD earnings breakdown
  - SGA threshold for comparison
- **Citations** - Legal references
- **Evidence** - Supporting documents/fields

**Visual Treatment:**
- Earnings displayed in comparison chart (earnings vs. threshold)
- Color coding (green if below threshold, red if above)

---

### Phase 2: Severe Impairment(s)
**Card Content:**
- **Status Badge** (PASS/FAIL/WARN)
- **AI Reasoning** - Analysis of impairment severity
- **Identified Impairments** - List or cards showing:
  - Impairment name
  - Severity indicator
  - ICD-10 code (if available)
- **Evidence Summary** - Key medical evidence points
- **Duration Check** - Prognosis and expected duration
- **Citations** and **Evidence** sections

**Visual Treatment:**
- Impairment cards with color coding by severity
- Medical iconography
- Expandable evidence items

---

### Phase 3: Listed Impairments (The "Blue Book")
**Card Content:**
- **Status Badge** (MET/NOT_MET/EQUALED/WARN)
- **AI Reasoning** - Explanation of listing evaluation
- **Considered Listings** - List of Blue Book listings evaluated:
  - Listing number and name (e.g., "1.15 - Disorders of the skeletal spine")
  - Status for each (Met/Not Met/Equaled)
  - Brief explanation of why criteria were/were not met
- **Citations** and **Evidence** sections

**Visual Treatment:**
- Listing items as expandable accordions
- Color coding: Green (Met), Red (Not Met), Blue (Equaled)
- Visual hierarchy showing which listings were primary considerations

---

### Phase 4: Residual Functional Capacity (RFC) & Past Work
**Card Content:**
- **Status Badge** (PASS/FAIL/WARN)
- **AI Reasoning** - RFC determination explanation
- **Estimated RFC** - Large badge showing work level:
  - **SEDENTARY** | **LIGHT** | **MEDIUM** | **HEAVY**
- **RFC Breakdown** - Visual representation of limitations:
  - Lifting capacity
  - Standing/Walking hours
  - Sitting hours
  - Other limitations
- **Past Work Analysis** - Summary of past relevant work evaluation
- **Past Work Comparison** - List of past jobs with ability to perform assessment
- **Citations** and **Evidence** sections

**Visual Treatment:**
- RFC displayed as a visual capacity meter or chart
- Past work items as cards with clear pass/fail indicators
- Comparison view showing RFC vs. job requirements

---

### Phase 5: Adjustment to Other Work (The Grid)
**Card Content:**
- **Status Badge** (DISABLED/NOT_DISABLED/WARN)
- **AI Reasoning** - Grid rule application and analysis
- **Grid Rule Applied** - Prominent display of rule number (e.g., "201.28")
- **Vocational Profile** - Summary of:
  - Age category
  - Education level
  - Skill level
- **Grid Rule Explanation** - What the rule means and why it applies
- **AI Flags** - Warnings about non-exertional limitations or special considerations
- **Citations** and **Evidence** sections

**Visual Treatment:**
- Grid rule displayed prominently (possibly with visual grid reference)
- Vocational profile as a summary card
- Warning flags highlighted in yellow/amber

---

## AI Recommendations Section

A dedicated section highlighting what the AI thinks is missing or what actions should be taken.

### Missing Information Panel
**Visual Design:**
- Collapsible panel or card
- List of missing items with:
  - Clear, actionable descriptions
  - Icons indicating type (medical, financial, etc.)
  - Priority indicators if applicable

**Interaction:**
- Each item can be checked off when obtained
- Click to add to action items
- Filter/sort options

### Suggested Actions Panel
**Visual Design:**
- Similar to Missing Information panel
- Action items displayed as cards or list items
- Each action shows:
  - Action description
  - Suggested priority
  - Related phase or evidence

**Interaction:**
- Actions can be converted to tasks
- Check off when completed
- Add notes or assign to team members

---

## Action Panel (Human Operator)

A sticky or prominent panel for the caseworker to take action on the application.

### Review Status Indicator
- Current review status badge:
  - **Unopened** - Gray
  - **In Progress** - Blue
  - **Completed** - Green
- Time tracking (time spent reviewing)

### Review Actions
Primary action buttons for final decision:
- **Approve** - Green, prominent button
- **Deny** - Red button
- **Request More Info** - Yellow/amber button
- **Escalate** - Orange button
- **Needs Medical Review** - Blue button

**Interaction:**
- Clicking opens a modal with:
  - Confirmation message
  - Required notes field
  - Optional recommendation notes
  - Submit button

### Reviewer Notes Section
- **Internal Notes** - Rich text editor for private notes (not visible to applicant)
- **Recommendation Notes** - Notes that accompany the recommendation
- Auto-save functionality
- Character count indicators

### Assignment Metadata (Collapsible)
- Assigned by (admin name)
- Assignment date
- Priority level (visual indicator)
- Due date (with countdown if approaching)
- Time tracking (first opened, last accessed, completed)

---

## Visual Design Principles

### Color System
- **Success/Pass:** Green (#10B981 or similar)
- **Failure/Deny:** Red (#EF4444 or similar)
- **Warning/Needs Review:** Yellow/Amber (#F59E0B or similar)
- **Info/In Progress:** Blue (#3B82F6 or similar)
- **Neutral:** Gray (#6B7280 or similar)

### Typography
- Clear hierarchy with distinct heading sizes
- Monospace font for IDs and codes
- Readable body text (16px minimum)

### Spacing & Layout
- Generous white space
- Clear visual separation between sections
- Responsive design for different screen sizes
- Sticky header with applicant summary
- Collapsible sections to reduce cognitive load

### Icons
- Consistent icon set throughout
- Status indicators (checkmarks, X's, warnings)
- Document/file icons
- Action icons (approve, deny, etc.)

---

## User Experience Considerations

### Information Hierarchy
1. **Most Important:** AI recommendation and confidence
2. **Secondary:** Phase status overview
3. **Tertiary:** Detailed phase analysis
4. **Supporting:** Citations, evidence, metadata

### Progressive Disclosure
- Show summary first, details on demand
- Expandable cards for phases
- Collapsible sections for metadata
- Tooltips for abbreviations and technical terms

### Accessibility
- High contrast ratios
- Keyboard navigation support
- Screen reader friendly
- Clear focus states
- Alt text for icons and images

### Performance
- Lazy load detailed phase views
- Virtual scrolling for long lists
- Optimistic UI updates for actions
- Loading states for async operations

---

## Example User Flow

1. **Caseworker opens application**
   - Sees header with AI recommendation badge
   - Scans progress tracker for overall status
   - Reads AI summary

2. **Caseworker reviews phases**
   - Clicks through phases that show warnings or failures
   - Expands phase cards to read AI reasoning
   - Reviews citations and evidence
   - Checks supporting data from application

3. **Caseworker checks recommendations**
   - Reviews missing information list
   - Considers suggested actions
   - Takes notes in reviewer notes section

4. **Caseworker makes decision**
   - Reviews all phases and evidence
   - Adds internal notes
   - Selects recommendation action
   - Adds recommendation notes
   - Submits decision
