# Project E (Selective Math) Project Plan

## Quick Start

### Requirements

- Node.js `20+`
- npm `10+`

### Commands

```powershell
cd ..\mark5826\Mark5826
npm install
```

Development

```powershell
# terminal 1
npm run dev:server

# terminal 2
npm run dev:client
```

Production build

```powershell
npm run build
npm start
```

## Deploy Publicly

The simplest full-stack deployment path is Render Web Service because this app needs both the Vite frontend and the Node API.

1. Push this repository to GitHub.
2. Open https://dashboard.render.com/blueprints and create a new Blueprint from the GitHub repo.
3. Render will read `render.yaml` automatically.
4. Add the secret environment variable `OPENROUTER_API_KEY` in Render.
5. Deploy. The public URL will look like `https://mark5826.onrender.com`.

The demo login is:

```text
username: admin
password: 123456
```

---

## 1. Project Name

**Project E: Selective Math AI-Backed Concept-Mastery and Cloned Parallel Question Engine**

This project is designed for students in Years 4–6 preparing for the Selective High School Entrance Test, with a focus on mathematics.

---

## 2. Project Background

The Selective High School Entrance Test requires students to demonstrate strong mathematical foundations, logical reasoning, speed, and accuracy. Traditional practice methods often have several limitations:

- Students know which questions they got wrong, but not which concepts they have not mastered;
- Teachers find it difficult to quickly generate personalised practice for each student;
- Parents do not have a clear view of their child’s weaknesses and progress;
- Repeated use of the same question bank reduces training effectiveness.

Therefore, this project aims to develop an AI-supported mathematics learning system that can identify weak concepts and automatically generate similar but non-repetitive parallel practice questions.

---

## 3. Project Objectives

The core objective of this project is to build a mathematics preparation tool for Years 4–6 students with the following capabilities:

1. **Concept Diagnosis**: Identify weak knowledge areas based on student performance;
2. **AI Explanation**: Provide step-by-step explanations suitable for primary school students;
3. **Parallel Question Generation**: Generate cloned or parallel questions based on the structure of an original question;
4. **Mastery Tracking**: Track each student’s mastery level across different concepts;
5. **Teacher and Parent Feedback**: Generate simple and clear learning reports.

---

## 4. Project Scope

### 4.1 Included Scope

- Organising the Years 4–6 mathematics knowledge framework;
- Classifying common Selective Math question types;
- Recording student answers and analysing mistakes;
- Providing AI-generated step-by-step explanations;
- Automatically generating parallel questions;
- Building a basic administration system;
- Producing student learning progress reports.

### 4.2 Excluded Scope

- English, writing, reading, or other non-mathematics subjects;
- Large-scale commercial marketing;
- Native mobile app development;
- Complex gamification features;
- Offline class management systems.

---

## 5. Target Users

| User Type | Main Needs |
|---|---|
| Students | Practise maths questions, understand mistakes, improve speed and accuracy |
| Teachers | Quickly identify weak areas and assign targeted practice |
| Parents | Understand their child’s learning progress and preparation status |
| Administrators | Manage question banks, student accounts, and learning data |

---

## 6. Core Functional Modules

### 6.1 Knowledge Framework Module

Build a structured knowledge framework for Years 4–6 Selective Math, including areas such as:

- Number and Arithmetic
- Fractions, Decimals and Percentages
- Basic Algebra
- Geometry
- Measurement
- Data and Probability
- Word Problems
- Logical Reasoning

### 6.2 Question Bank and Question-Type Module

Each question should be tagged with:

- Year-level difficulty;
- Knowledge concept;
- Question type;
- Solving method;
- Common mistakes;
- Suitability for parallel question generation.

### 6.3 AI Concept Diagnosis Module

The system analyses student answers and identifies possible learning issues, such as:

- Lack of conceptual understanding;
- Calculation errors;
- Misreading the question;
- Using an unsuitable method;
- Time management issues.

### 6.4 AI Step-by-Step Explanation Module

The AI provides students with:

- Simple explanations;
- Step-by-step solutions;
- Key formula or method reminders;
- Common mistake alerts;
- Similar example questions.

### 6.5 Cloned Parallel Question Generation Module

The system generates new questions that are structurally similar to the original question but use different numbers, contexts, or conditions. The generated questions should:

- Have a similar difficulty level;
- Test the same knowledge concept;
- Have verifiable answers;
- Avoid directly copying the original question;
- Support batch generation.

### 6.6 Mastery Tracking Module

The system records each student’s performance across different knowledge concepts, including:

- Accuracy rate;
- Completion time;
- Recent practice history;
- Number of repeated mistakes;
- Mastery level.

Suggested mastery levels:

- Not Mastered;
- Partially Mastered;
- Mostly Mastered;
- Fully Mastered.

### 6.7 Learning Report Module

Generate concise reports for teachers and parents, including:

- Number of questions completed this week;
- Changes in accuracy rate;
- Main weak knowledge areas;
- Recommended practice focus;
- Learning suggestions.

---

## 7. Project Phase Plan

### Phase 1: Requirements and Knowledge Framework Design

**Objective:** Define the product positioning and mathematics knowledge structure.

Main tasks:

- Organise Years 4–6 mathematics knowledge points;
- Analyse common Selective Math question types;
- Design the question bank tagging system;
- Confirm the MVP feature scope.

Deliverables:

- Knowledge framework outline;
- Question-type classification table;
- MVP feature list.

---

### Phase 2: MVP Prototype Development

**Objective:** Build a testable minimum viable product.

Main tasks:

- Build the basic web platform;
- Set up student accounts and question bank management;
- Implement online question practice;
- Implement basic mistake tracking;
- Integrate AI explanation functionality.

Deliverables:

- MVP test version;
- Basic question bank;
- Student answer record function.

---

### Phase 3: AI Parallel Question Engine Development

**Objective:** Enable automatic generation of similar practice questions.

Main tasks:

- Design question generation templates;
- Establish question quality-checking rules;
- Implement AI-generated parallel questions;
- Add answer verification mechanisms;
- Conduct manual review and optimisation.

Deliverables:

- Parallel question generation module;
- Question review process;
- Sample library of parallel questions.

---

### Phase 4: Mastery Model and Reporting System

**Objective:** Enable continuous tracking of student learning progress.

Main tasks:

- Build concept mastery scoring rules;
- Develop the student learning dashboard;
- Develop teacher and parent reports;
- Optimise recommended practice logic.

Deliverables:

- Mastery tracking function;
- Learning report templates;
- Recommended practice system.

---

### Phase 5: Testing and Optimisation

**Objective:** Improve system stability and teaching effectiveness.

Main tasks:

- Invite a small group of students for trial use;
- Collect feedback from teachers and parents;
- Fix system issues;
- Improve AI explanation quality;
- Improve accuracy of generated questions.

Deliverables:

- Testing feedback report;
- Optimised product version;
- Recommendations for the next development stage.

---

## 8. Initial Timeline

| Phase | Duration | Main Outcome |
|---|---:|---|
| Phase 1 | 2 weeks | Knowledge framework and MVP scope |
| Phase 2 | 4 weeks | MVP prototype |
| Phase 3 | 4 weeks | AI parallel question generation module |
| Phase 4 | 3 weeks | Mastery tracking and reports |
| Phase 5 | 3 weeks | Testing and optimisation |

Estimated total duration: **approximately 16 weeks**

---

## 9. Suggested Team Roles

| Role | Responsibilities |
|---|---|
| Project Lead | Project planning, progress management, requirement confirmation |
| Mathematics Curriculum Lead | Knowledge framework, question review, explanation standards |
| AI Engineer | AI explanation, question generation, answer verification |
| Front-End Engineer | Student portal, teacher portal, report pages |
| Back-End Engineer | Database, account system, question bank system |
| QA / Tester | Functional testing, question quality testing, user feedback collection |

---

## 10. Key Risks and Mitigation Strategies

| Risk | Impact | Mitigation |
|---|---|---|
| AI-generated questions are inaccurate | Reduces learning effectiveness | Add answer verification and manual review |
| Question difficulty is inconsistent | Affects student practice experience | Build difficulty tags and test samples |
| Insufficient student data | Mastery judgement may be inaccurate | Use rule-based models initially, then optimise later |
| Explanations are too complex | Students may not understand them | Use simple language and step-by-step guidance |
| Development scope is too large | Project may be delayed | Complete the MVP first, then expand gradually |

---

## 11. Success Metrics

Initial success can be measured using the following indicators:

- Number of questions completed by students each week;
- Improvement in concept-level accuracy;
- Reduction in repeated mistakes;
- Reduction in time required for teachers to assign targeted practice;
- Parent satisfaction with report clarity;
- Approval rate of AI-generated questions after review.

---

## 12. Recommended MVP Version

The MVP may include the following features:

1. Student login;
2. Online question practice;
3. Automatic marking;
4. Mistake tracking;
5. AI step-by-step explanations;
6. Basic knowledge concept tags;
7. Simple learning reports;
8. Generation of 3–5 parallel questions for each original question.

---

## 13. Summary

Project E is not intended to be a simple question-practice system. Its goal is to build an AI-backed mathematics preparation platform centred on concept mastery. Through mistake diagnosis, AI explanations, and parallel question generation, the system can help Years 4–6 students prepare more effectively for the Selective High School Entrance Test, while also helping teachers and parents better understand each student’s learning progress.
