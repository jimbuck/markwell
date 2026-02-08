Please generate tasks from the PRD using the guide below.
If not explicitly told which `feature-name` to use, generate a list of PRDs and ask the user to select one under `/[feature-name]` or create a new one using `create-prd.md`:

- assume it's stored under `.docs/[feature-name]` and has a filename called `prd.md`
- it should not already have a corresponding `tasks.md` file in `.docs/[feature-name]`
- **if `.docs/[user-provided-feature-name]/prd.md` exists**, use that PRD for task generation without user confirmation
- **otherwise** ask the user to confirm the PRD file name before proceeding
Make sure to provide options in number lists so I can respond easily (if multiple options).

# Rule: Generating Tasks File from a PRD

## Goal

To guide an AI assistant in creating a detailed, comprehensive tasks file in Markdown format based on an existing Product Requirements Document (PRD). The tasks file contains all implementation tasks organized in a single document to guide a developer through feature implementation.

## Process

1. **Receive PRD Reference:** The user points the AI to a specific PRD file
2. **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3. **Assess Current State:** Review the existing codebase to understand existing infrastructure, architectural patterns and conventions. Also, identify any existing components or features that already exist and could be relevant to the PRD requirements. Then, identify existing related files, components, and utilities that can be leveraged or need modification.
4. **Phase 1: Generate High-Level Tasks:** Based on the PRD analysis and current state assessment, generate the main, high-level tasks required to implement the feature. Use your judgement on how many high-level tasks to use. It's likely to be about 3-12. Create a `tasks.md` file in the `.docs/[feature-name]/` directory containing these high-level tasks with brief descriptions. Think critically about the logical flow and dependencies between tasks. Inform the user: "I have analyzed the PRD and created a tasks.md file with the following high-level tasks. Please review and respond with 'Go' to proceed with generating detailed task files, or suggest changes."
5. **Wait for Confirmation:** Pause and wait for the user to respond with "Go" or provide feedback on the high-level tasks in the tasks.md file.
6. **Phase 2: Generate Individual Task Files:** Once the user confirms, create the subtasks under each high-level task in the tasks.md.
7. **Final Review:** After creating all subtasks, ask the user to review the generated tasks and confirm they are satisfactory.

## Output

- **Format:** Single Markdown (`.md`) file
- **Location:** `.docs/[feature-name]/tasks.md`

The tasks file _must_ follow this structure:

```markdown
# [Feature Name] - Implementation Tasks

## Overview
Brief description of the feature and its goals based on the PRD.

## Tasks

### [ ] [Task ID] - [Task Title]

**Overview:** Brief description of what this task accomplishes and how it fits into the overall feature.

**Relevant Files:**
- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/file1.test.ts` - Unit tests for `file1.ts`.
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `path/to/another/file.test.tsx` - Unit tests for `another/file.tsx`.

**Sub-Tasks:**
- [ ] 0101 [1st Sub-task description]
- [ ] 0102 [2nd Sub-task description]
- [ ] 0103 [3rd Sub-task description]

**Notes:**
- Any specific considerations or dependencies for this task.

---

### [Next Task ID] - [Next Task Title]

[Repeat structure for each high-level task]

## Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx vitest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Vitest configuration.
- General implementation considerations and dependencies.
```

Where `[Task ID]` is a 4 digit number starting at `0100` and incrementing by 100 each time. For example, the first task would be `0100`, the second `0200`, and so on. Subtasks would be numbered based on `Task ID` but incrementing by 1 (e.g., `0101`, `0102`, `0201`, `0202`, etc.).

## Target Audience

Assume the primary reader of each task file is a **junior developer** who will implement the feature with awareness of the existing codebase context.
