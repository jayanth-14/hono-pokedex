const getGeminiApi = () => {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not set in environment.");
    Deno.exit(1);
  }

  return GEMINI_API_KEY;
};

// removes lines starting with #, as they are comments
const cleanMessage = (message) =>
  message.split("\n").filter((text) => !text.startsWith("#")).join("\n").trim();

const getCommitMessage = async (args) => {
  const filePath = args[0];
  const fileContents = await Deno.readTextFile(filePath);
  return cleanMessage(fileContents);
};

const getGitDiff = async () => {
  const cmd = new Deno.Command("git", {
    args: ["diff", "--cached"],
    stderr: "piped",
    stdout: "piped",
  });

  const { stdout, stderr } = await cmd.output();
  const decoder = new TextDecoder();

  if (stderr) {
    console.error("Error in getting `git diff` : " + decoder.decode(stderr));
    Deno.exit(1);
  }

  return decoder.decode(stdout);
};

const buildPrompt = (commitMessage, diff) =>
  `You are a strict commit message reviewer.

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
- At the very end of the response, output exactly one line in this format:
- The verdict must be uppercase.
- The verdict must be the final line.
- The verdict with no backticks.
- The verdict with no extra text after it.

example : "VERDICT: GREEN"


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

Verdict: 'GREEN' | 'YELLOW' | 'RED'

Commit Message:
"""
${commitMessage}
"""

Git Diff:
"""
${diff}
"""
`;

const generateRequestBody = (prompt) =>
  JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

const generateRequestHeaders = (GEMINI_API_KEY) => {
  const headers = new Headers();
  headers.append("x-goog-api-key", GEMINI_API_KEY);
  headers.append("content-type", "application/json");
  return headers;
};

const callGemini = async (prompt, GEMINI_API_KEY) => {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

  const headers = generateRequestHeaders(GEMINI_API_KEY);

  const body = generateRequestBody(prompt);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    console.error("❌ Gemini Api Error : ", await res.text());
    Deno.exit(1);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No Response";
};

const evaluateCommitMessage = async (args) => {
  const GEMINI_API_KEY = getGeminiApi();
  const commitMessage = await getCommitMessage(args);

  const diff = await getGitDiff();
  const prompt = buildPrompt(commitMessage, diff);

  const evaluation = await callGemini(prompt, GEMINI_API_KEY);

  console.log(evaluation);

  const verdict =
    evaluation.match(new RegExp(/Verdict:\s*(GREEN|RED|YELLOW)/))[1];

  if (verdict !== "GREEN") {
    console.log("\nCommit blocked.\n");
    Deno.exit(1);
  }
  Deno.exit(0);
};

const main = async (args) => {
  await evaluateCommitMessage(args);
};

await main(Deno.args);
