#!/usr/bin/env -S deno run -A

// commit-evaluator.js

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set in environment.");
  Deno.exit(1);
}

async function renderWithGlow(markdown) {
  const process = new Deno.Command("glow", {
    args: ["-"],
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  });

  const child = process.spawn();

  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(markdown));
  await writer.close();

  await child.status;
}

async function openEditor(initialContent = "") {
  const editor = Deno.env.get("EDITOR") || "vi";
  const tmpFile = await Deno.makeTempFile({ suffix: ".commitmsg" });

  await Deno.writeTextFile(tmpFile, initialContent);

  const process = new Deno.Command(editor, {
    args: [tmpFile],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  await process.output();

  const content = await Deno.readTextFile(tmpFile);
  await Deno.remove(tmpFile);

  return content.trim();
}

async function getGitDiff() {
  const cmd = new Deno.Command("git", {
    args: ["diff", "--cached"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await cmd.output();
  return new TextDecoder().decode(stdout);
}

function buildPrompt(commitMessage, diff) {
  return `
You are a strict commit message reviewer.

Evaluate the commit message based on:

1. Structure:
   - First line: very high level overview.
   - Empty line.
   - Bullet points explaining changes.
2. Must use simple present tense.
3. Must include all important changes visible in the diff.
4. Be honest, concise, direct.

Rules:
- Do NOT say just "do this" or "don't do this".
- Instead say: "Don't do this because...", "It is better to do this because..."
- Keep output terse and structured.

Return output strictly in clean Markdown.

Return output strictly in clean Markdown.

Formatting rules:
- Use '#' and '##' headings.
- Use '---' to separate major sections.
- Wrap critical violations in inline code backticks.
- Wrap structural patterns in inline code.
- Use bold for section labels only.
- Keep paragraphs short (1-2 lines max).
- Use bullet points for all issue lists.
- Avoid emojis.
- Avoid long prose.
- Make the output feel like a CLI diagnostic report.


Output format:

# Commit Review

## Score
**<number>/100**

---

## High-Level Issues
- ...

---

## Detailed Analysis

### Structure
- ...

### Tense
- ...

### Completeness
- ...

---

## Verdict
'GREEN' | 'YELLOW' | 'RED'

State clearly whether the commit should be made.


Commit Message:
"""
${commitMessage}
"""

Git Diff:
"""
${diff}
"""
`;
}

async function callGemini(prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("❌ Gemini API error:", await response.text());
    Deno.exit(1);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

function colorizeVerdict(text) {
  if (text.includes("GREEN")) return `\x1b[32m${text}\x1b[0m`;
  if (text.includes("YELLOW")) return `\x1b[33m${text}\x1b[0m`;
  if (text.includes("RED")) return `\x1b[31m${text}\x1b[0m`;
  return text;
}

async function main() {
  console.log("Opening editor for commit message...\n");

  const commitMessage = await openEditor(
    "# Write your commit message below.\n# Lines starting with # are ignored.\n",
  );

  const cleanedMessage = commitMessage
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .join("\n")
    .trim();

  if (!cleanedMessage) {
    console.error("❌ Commit message is empty.");
    Deno.exit(1);
  }

  console.log("\nReading staged git diff...\n");
  const diff = await getGitDiff();

  const prompt = buildPrompt(cleanedMessage, diff);

  console.log("Evaluating with Gemini...\n");

  const evaluation = await callGemini(prompt);

  console.log("\n========== REVIEW ==========\n");
  await renderWithGlow(evaluation);
}

main();
