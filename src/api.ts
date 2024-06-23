// src/api.ts
import { config } from "./config";

export async function callOpenAI(input: string) {
  const response = await fetch(
    `${config.openai.apiUrl}/v1/engines/davinci-codex/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        prompt: input,
        max_tokens: 100,
      }),
    }
  );
  const data = await response.json();
  return data;
}

export async function callMJ(input: string) {
  const response = await fetch(`${config.mj.url}/some-endpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.mj.apiKey}`,
    },
    body: JSON.stringify({
      query: input,
    }),
  });
  const data = await response.json();
  return data;
}
