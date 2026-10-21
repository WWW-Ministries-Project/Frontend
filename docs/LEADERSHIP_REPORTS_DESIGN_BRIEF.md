# Leadership Reports — Design Brief

## 1. Context

WWM (Worldwide Word Ministries) runs a church management web app with several branches. Today each Head of Department (HOD) compiles a periodic report by hand and submits it to church leadership. We are automating those reports: the system pre-fills the numbers, the HOD adds commentary and submits, and leadership reviews, approves and compares.

**Who uses the reports**

| Role | What they do |
|---|---|
| Head of Department (Membership, Visitors/Follow-up, Events, Ushering/Attendance, Assets/Logistics, Finance, Life Centers) | Opens a pre-filled draft for the period, checks the numbers, writes commentary, submits |
| Branch pastor / branch leadership | Reviews and approves reports for their branch, comments, sends back |
| Senior leadership (head pastor, board) | Reads the executive summary across all branches, drills into one area |

**What leadership wants from a report**
- Are we growing or shrinking, and where?
- What needs attention now (people not followed up, overdue approvals, broken assets, money concerns)?
- How does this period compare with the last one, and with the same period last year?
- What does the HOD think, and what do they need from leadership?

## 2. Shared report anatomy (every report uses this frame)

Design one reusable report template, then vary the body per domain.

1. **Header**: report name, period (e.g. "October 2026" or "Week 42, 13–19 Oct 2026"), branch (or "All branches"), prepared by (HOD name and photo), status chip (Draft / Submitted / Returned / Approved), submitted and approved dates.
2. **Controls**: period type (Weekly / Monthly / Quarterly / Annual / Custom), branch switcher, compare to (previous period / same period last year), and export (PDF, DOCX, Print).
3. **Headline KPIs**: 4–6 stat tiles. Each shows the value, the change vs the comparison period (arrow plus % and absolute), and a small sparkline.
4. **"Needs attention" panel**: auto-generated, rule-based flags ranked by severity, e.g. "14 visitors have no follow-up after 7 days". Each flag links to the filtered list behind it.
5. **Auto-written highlights**: 3–5 plain-language sentences generated from the data, e.g. "Sunday attendance averaged 412, up 8% on September, driven by youth (+21%)."
6. **Domain sections**: charts and tables (specified per report below).
7. **HOD commentary** (editable while Draft): Highlights / wins, Challenges, Plans for next period, Requests to leadership (each request can be marked "needs decision"), and optional Testimonies / prayer points.
8. **Review and sign-off**: approval trail (who approved and when), leadership comments thread, "Return to HOD with note" action.

**States to design**: empty period (no data yet), partial data (e.g. finance not yet approved), restricted data (some member details are masked for privacy, so show counts but not names), loading, Draft vs Approved (locked, read-only), and a print/PDF layout (A4 portrait, no interactive controls).

**Branches**: every report works for a single branch or for "All branches". In all-branch view, add a "By branch" comparison table or small multiples to each section.

---

## 3. Reports

### 3.1 Membership Report
**Owner:** Membership HOD. **Cadence:** Monthly, plus a Quarterly and an Annual roll-up.
**Questions it answers:** Is the church growing? Are new people moving through the stages towards full membership? Who is drifting away?

**Headline KPIs**
- Total members (active)
- New members this period
- Net growth (new minus those who became inactive)
- Stage conversions: Unconfirmed → Confirmed → Member
- Inactive members
- Profile completeness %

**Sections**
- **Growth trend**: new members per month over 12 months, as a bar chart with a line for cumulative total.
- **Membership funnel**: Visitor → Unconfirmed → Confirmed → Member, with counts and conversion % at each step. Also show the average days spent in each stage.
- **Where new members came from**: converted visitors, souls won in life centers, direct registration.
- **Who we are (demographics)**: gender split, age bands (children / youth / young adults / adults / seniors), marital status, in-house vs online members, top cities/regions.
- **Ministry involvement**: % of members serving in at least one department, and % enrolled in or completed a School of Ministry programme.
- **Celebrations**: birthdays in the coming period (a list for pastoral care).
- **Data health**: members missing an emergency contact, incomplete profiles, possible duplicates.

**Needs-attention examples:** members stuck in "Unconfirmed" for more than 90 days; drop in new members of more than 20%; a rising inactive count.

### 3.2 Visitors & Follow-up Report
**Owner:** Visitors / Follow-up HOD. **Cadence:** Weekly (after Sunday), plus a Monthly roll-up.
**Questions it answers:** How many new people came? Did we follow every one of them up? How many are staying and joining?

**Headline KPIs**
- First-time visitors
- Returning visitors (repeat rate %)
- Follow-ups done vs due (completion %)
- Visitors converted to members
- Average days to first follow-up

**Sections**
- **Visitor trend**: first-time vs returning visitors per week.
- **How they heard about us**: source mix (invited by a member, social media, walk-in, event, etc.).
- **Follow-up pipeline**: Pending / In progress / Done, broken down by assigned follow-up person (a workload table showing who is overloaded or behind).
- **Visitor journey**: 1st visit → 2nd visit → 3+ visits → wants membership → converted.
- **Which events bring visitors**: visitors per event or service.
- **Visiting clergy**: list with church names, for leadership awareness.
- **Visitor profile**: gender, marital status, local vs foreign.

**Needs-attention examples:** visitors with no follow-up after 7 days (named list); visitors who asked for membership but have not been contacted; a follow-up person with more than 10 open items.

### 3.3 Events Report
**Owner:** Events / Programmes HOD. **Cadence:** Monthly, plus a per-event summary (one exists today; restyle it to match this template).
**Questions it answers:** What did we run? Did people register and turn up? Which events work best?

**Headline KPIs**
- Events held (by type: Service / Programme / Activity)
- Total registrations
- Turn-up rate (attended ÷ registered)
- No-show rate
- Capacity filled %
- Visitors attracted by events

**Sections**
- **Calendar strip** for the period: each event coloured by type, with its attendance shown on hover.
- **Event leaderboard**: a table with event, date, type, registered, attended, turn-up %, visitors and offering. It can be sorted.
- **Registered vs attended**: paired bars per event.
- **Event type performance**: average attendance by type, and weekly vs special events.
- **Day and time performance**: which days and slots draw the most people.
- **Coming up next period**: upcoming events with registration progress bars.

**Needs-attention examples:** events at more than 90% capacity (plan for space); events with a turn-up rate below 50%; upcoming events with low registration.

### 3.4 Church Attendance Report
**Owner:** Ushering / Attendance HOD. **Cadence:** Weekly, plus a Monthly roll-up.
**Questions it answers:** How many attend, who are they, are we growing, and are workers turning up on time?

**Headline KPIs**
- Average service attendance
- Peak attendance (which service)
- Adults / Youth / Children split
- Visitors present
- Department (worker) attendance %
- Workers' punctuality % (on time vs late, from the biometric clock-in)

**Sections**
- **Attendance trend**: weekly totals, as a stacked area of adults, youth and children, with a line for the 4-week moving average.
- **Composition**: gender by age group, and the members / visitors / clergy split.
- **Service comparison**: first service vs second service vs midweek.
- **Department attendance**: a table per department with members, present, absent, %, and late arrivals. Add a heatmap of department × week.
- **Punctuality**: distribution of arrival times relative to service start (early / on time / late / very late).
- **Year-on-year**: this month vs the same month last year.

**Needs-attention examples:** departments below 60% attendance for 2 or more weeks running; attendance down 3 weeks in a row; services with no headcount recorded (missing data).

### 3.5 Assets Report
**Owner:** Logistics / Assets HOD. **Cadence:** Monthly, plus a Quarterly stock-check report.
**Questions it answers:** What do we own, what is it worth, what is broken or missing, and who is responsible for it?

**Headline KPIs**
- Total assets and total value (GH₵)
- Assigned vs unassigned
- Needs repair / out for repair
- Lost or stolen (count and value)
- Last stock-check match rate %

**Sections**
- **Asset health**: status breakdown (Assigned, Unassigned, Needs repair, Out for repair, Not fixable, Lost/stolen), shown as a donut chart or segmented bar.
- **Value by department** and **value by category** (sound, music, media, furniture, appliance, vehicle).
- **Repairs**: open repairs with age in days, highlighting stale ones; repair requisition status.
- **Stock check results**: expected vs counted vs matched, the differences, and the value not found.
- **Asset age**: age distribution, plus an "ageing / due for replacement" list.
- **New purchases this period**: a procurement trend and a list.

**Needs-attention examples:** repairs older than the stale threshold; assets lost or stolen this period; departments with uncounted assets; high-value items unassigned.

### 3.6 Finance Report
**Owner:** Finance HOD / Treasurer. **Cadence:** Weekly (already captured as a weekly record), plus Monthly, Quarterly and Annual roll-ups.
**Questions it answers:** What came in, what went out, are we keeping the reserve and tithe rules, how is online giving and are pledges being paid?

**Headline KPIs**
- Total income (receipts)
- Total expenditure (payments)
- Surplus / deficit
- Tithe remitted (amount and %)
- Online giving (amount and number of givers)
- Pledge redemption % (paid ÷ pledged)

**Sections**
- **Income vs expenditure trend**: weekly or monthly bars, with a line for surplus.
- **Income breakdown**: by receipt line (tithes, offerings, special seeds, online giving, etc.) as a bar or treemap, with the change vs the previous period.
- **Expenditure breakdown**: by payment line.
- **Fund allocation**: reserves (savings, office maintenance, weekly refund), shown as actual vs required portion.
- **Online giving**: by giving option, by channel (mobile money, card), success vs failed or abandoned payments, fees paid.
- **Pledges**: per pledge campaign, target vs raised (progress bars), pledgers with outstanding balances, deadlines.
- **Requisitions (spend requests)**: submitted vs approved value, approved/rejected counts, median days to approval, top requesting departments, requests stuck in approval.
- **Weekly record status**: which weeks are Draft / Pending / Approved (a compliance strip).

**Needs-attention examples:** weekly records not submitted or not approved; deficit for 2 or more periods; pledge campaigns behind schedule near their deadline; requisitions waiting more than X days; a spike in failed online payments.

**Privacy:** show finance only to users with finance permission. Leadership sees totals; line-level detail sits behind a drill-down.

### 3.7 Life Centers Report
**Owner:** Life Centers / Evangelism HOD. **Cadence:** Monthly, plus a Quarterly roll-up.
**Questions it answers:** Are the cells meeting and growing? How many souls were won, and how many became members?

**Headline KPIs**
- Active life centers (that met in the period) out of total
- Meetings held
- Average attendance per meeting
- First-timers
- Souls won
- Souls converted to members (conversion %)
- Offering collected

**Sections**
- **Souls won trend**: per month, with converted vs not-yet-converted.
- **Soul-winning funnel**: Won → attended first meeting → attended 3+ meetings → became a member.
- **Center leaderboard**: a table per center with leader, members, meetings held, average attendance, first-timers, souls won, conversion % and last meeting date. Status dot: healthy / irregular / overdue.
- **Top soul winners**: individuals ranked by souls won (for recognition).
- **Where souls are being won**: by city or area.
- **Meeting regularity**: a heatmap of centers × weeks (met / missed).

**Needs-attention examples:** centers with no meeting in more than 2 weeks; centers with falling attendance; souls won not followed up; centers without a leader.

---

## 4. Executive Summary (leadership digest)

**Audience:** senior leadership. **Cadence:** Monthly, plus Quarterly and Annual.
This is a single page that pulls the headline KPI from each report above. It is the first thing leadership opens.

- **Scorecard grid**: one card per area (Membership, Visitors, Events, Attendance, Assets, Finance, Life Centers). Each card has 2 KPIs, a trend arrow, a health status (green / amber / red) and the report's submission status. Clicking a card opens the full report.
- **Top 5 things needing leadership attention** across all areas, ranked.
- **Requests to leadership**: all HOD "needs decision" items in one list, with approve / respond actions.
- **People pipeline (one flow)**: Visitors + Souls won → New members → Serving in a department.
- **Branch comparison** (all-branch view): a table of branches × key KPIs, with per-capita figures (e.g. giving per attendee, visitors per 100 attendees).
- **Report submission tracker**: which HODs have submitted, which are late.

---

## 5. Design asks

- One consistent report template and component set: stat tile with delta and sparkline, attention flag, auto-highlight block, commentary editor, approval trail, branch comparison table.
- Desktop first, but readable on a phone, because pastors often review on mobile.
- Print/PDF view per report (A4), since reports are still shared in leadership meetings.
- Colour status consistently: green = healthy, amber = watch, red = act now. Never rely on colour alone; always pair it with an icon or label.
- Plain-language labels, not system terms (e.g. "Follow-ups overdue", not "followup.status=pending").
- Currency is Ghana cedi (GH₵).

## 6. Data readiness (for the build team, not the design)

| Area | Data in the system today | Gap to build |
|---|---|---|
| Membership | Members, stages, demographics, source, departments | Period aggregation endpoint |
| Visitors | Visitors, visits, follow-ups, source, conversion | Follow-up status values are free text; standardise them |
| Events | Events, registrations, per-event report | Monthly roll-up |
| Attendance | Service headcounts, biometric clock-ins, department attendance per event report | Monthly roll-up |
| Assets | Full register, statuses, stock checks, repairs | — |
| Finance | Weekly records, online giving, pledges, requisition analytics | **No budgets** (a budget vs actual view would need new backend work); no finance analytics endpoint |
| Life Centers | Centers, meetings, souls won, overview endpoint | — |
| Cross-cutting | Branch scoping, per-event approval workflow | Period-report approval workflow, HOD commentary storage, cross-branch comparison endpoint, generic `analytics/{module}/aggregate` (documented, not built) |
