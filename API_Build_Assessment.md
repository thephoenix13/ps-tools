# Build Assessment — Anthropic / Claude API
**Can all 130 tools and agents be built on Claude API alone?**

---

## TL;DR

| | Count | Verdict |
|---|---|---|
| **Tools** | 100 | ✅ 100% — all buildable with Claude API only |
| **Agents — Claude only** | 15 | ✅ Multi-turn conversations, document analysis, adaptive logic |
| **Agents — Claude + 1 extra service** | 15 | ⚠️ Claude is the brain; one external integration needed per agent |

**No tool or agent requires a different AI platform.** Claude API handles all reasoning, generation, and analysis. The 15 ⚠️ agents need one additional service each — typically web search, an email API, or a data feed — wired in via Claude's tool use (function calling).

---

## What Claude API handles natively

- Text generation, rewriting, summarisation — any length, any format
- Document and PDF processing (upload and analyse directly)
- Multi-turn conversations and agentic loops
- Structured output (JSON schemas with validation)
- Tool use / function calling (hook in any external API as a tool)
- 200K token context window — handles large document sets in one call
- Prompt caching — reduces cost on repeated context (e.g. handbooks, contracts)

---

## All 100 Tools — ✅ Claude API Only

Every tool in the kit is a **prompt-in → output** pattern: the user provides context, Claude generates the result. No external services needed.

---

## 30 Agents — Detailed Assessment

### Domain 1 · HR

| Agent | Verdict | Notes |
|-------|---------|-------|
| AI Interview Bot | ✅ Claude only | Multi-turn structured conversation; summary generated at end |
| Mock Interview Simulator | ✅ Claude only | Multi-turn roleplay with real-time adaptive feedback |
| AI Agents for Bulk Voice Calling | ⚠️ + Voice stack | Claude handles scripts & logic; needs TTS + STT + telephony (e.g. Twilio + ElevenLabs) |
| Bulk Email Script with Research Agent | ⚠️ + Web search + Email API | Claude writes and personalises; needs a search tool (Brave/Serper) + email sender (SendGrid) |
| Salary Negotiation Coach | ⚠️ + Salary data API | Roleplay is fully Claude; "real market data" requires a salary/compensation API or web search |

---

### Domain 2 · Sales & Outreach

| Agent | Verdict | Notes |
|-------|---------|-------|
| Customer Discovery Agent | ✅ Claude only | Structured multi-turn discovery conversation; synthesis is pure Claude |
| Lead Research Agent | ⚠️ + Web search | Claude enriches and writes; needs a search tool to pull live company/contact data |
| Multi-touch Outreach Sequence Agent | ⚠️ + Email/LinkedIn API | Claude generates the cadence and copy; needs a sending layer (e.g. SendGrid, LinkedIn API) |
| Competitive Intelligence Agent | ⚠️ + Web monitoring | Claude analyses and writes briefings; needs a web crawler or search API for live competitor data |

---

### Domain 3 · Enterprise

| Agent | Verdict | Notes |
|-------|---------|-------|
| Business Intelligence Agent | ✅ Claude only | If data is uploaded (CSV, reports), Claude analyses and generates insights natively |
| Process Audit Agent | ✅ Claude only | Reviews uploaded SOPs and documents; pure document reasoning |
| Executive Briefing Agent | ⚠️ + Web search | Claude structures and writes the briefing; research step needs a web search tool |
| Predictive Maintenance Agent | ⚠️ + Sensor/data feed | Claude identifies patterns and flags issues; needs a real-time equipment data feed piped in |

---

### Domain 4 · Education

| Agent | Verdict | Notes |
|-------|---------|-------|
| AI Tutor Agent | ✅ Claude only | Fully adaptive multi-turn tutoring; no external data needed |
| Adaptive Assessment Agent | ✅ Claude only | Dynamic question difficulty adjusted per response — handled entirely in Claude's logic |
| Personalised Learning Agent | ✅ Claude only | Tracks progress across a session and adapts path; persistent state via conversation or a simple DB |
| Research Assistant Agent | ⚠️ + Academic search API | Claude synthesises and summarises; needs access to academic sources (Semantic Scholar, arXiv API, or web search) |

---

### Domain 5 · Health

| Agent | Verdict | Notes |
|-------|---------|-------|
| Health Coaching Agent | ✅ Claude only | Ongoing wellness conversations; session memory via conversation history |
| Medication Management Agent | ⚠️ + Notification system | Claude handles queries and interaction checking; sending reminders needs a scheduler + push/SMS service |
| Appointment Prep Agent | ⚠️ + Web search | Claude generates the prep guide; "researches the condition" step needs a web or medical knowledge search tool |

---

### Domain 6 · Legal

| Agent | Verdict | Notes |
|-------|---------|-------|
| Contract Review Agent | ✅ Claude only | Multi-document upload, clause cross-referencing, and risk summary — all within Claude's 200K context |
| Due Diligence Agent | ✅ Claude only | Same as above; document sets uploaded and reviewed in one or chained calls |
| Legal Research Agent | ⚠️ + Legal database API | Claude reasons and summarises; needs access to case law and regulations (web search or a legal API like CourtListener) |
| RFP Automation Agent | ⚠️ + Web search | Claude drafts the response; research step needs a web search tool to pull live requirement context |

---

### Domain 7 · NGO / Social Impact

| Agent | Verdict | Notes |
|-------|---------|-------|
| Impact Measurement Agent | ✅ Claude only | Conducts structured data-collection conversations; compiles reports — pure Claude |
| Grant Research Agent | ⚠️ + Grant database / web search | Claude drafts applications; needs to search funding databases (Candid, GrantWatch, or web search) |
| Donor Outreach Agent | ⚠️ + Web search + Email API | Claude personalises messages; researching donors needs web search, sending needs an email API |

---

### Domain 8 · Mental Wellness

| Agent | Verdict | Notes |
|-------|---------|-------|
| Daily Wellness Check-in Agent | ✅ Claude only | Daily check-in conversations; mood tracking via session or lightweight storage |
| CBT Coach Agent | ✅ Claude only | Structured therapeutic conversation — fully within Claude's multi-turn capability |
| Journaling Companion Agent | ✅ Claude only | Reflective journaling with context-aware follow-ups — pure conversation |

---

## The 15 ⚠️ Agents — What They Actually Need

All 15 still use **Claude as the primary engine**. Each needs exactly one category of external service:

| External need | Agents affected | Example services |
|---|---|---|
| Web search / live data | Lead Research, Executive Briefing, Competitive Intelligence, Appointment Prep, Legal Research, RFP Automation, Research Assistant, Grant Research, Donor Outreach | Brave Search API, Serper, Tavily |
| Email / message sending | Bulk Email, Multi-touch Outreach, Donor Outreach | SendGrid, Mailgun, AWS SES |
| Voice stack (TTS + STT + telephony) | AI Bulk Voice Calling | Twilio + ElevenLabs / VAPI |
| Notification / scheduling | Medication Management | Firebase, Twilio SMS, any scheduler |
| Real-time sensor feed | Predictive Maintenance | Any IoT / SCADA data source |
| Salary / compensation data | Salary Negotiation Coach | Levels.fyi API, web search |

---

## Build Complexity Summary

| Tier | Description | Count |
|---|---|---|
| **Quick build** | Single Claude API call with a well-crafted prompt | ~80 tools |
| **Medium build** | Multi-turn conversation loop or document upload + Claude | ~20 tools + 15 agents |
| **Integration build** | Claude API + one external service via tool use | 15 agents |

---

## Bottom Line

**Yes — every tool and agent in this kit can be built on the Anthropic / Claude API.**
The 15 agents that need external services still use Claude as the core. The additional integrations (search APIs, email senders, voice stacks) are commodity services that connect to Claude via its tool use interface. No alternative AI platform is needed anywhere in the stack.

---

*Perfect Skills · pratikgade@perfectskills.in*
