// src/chat.ts
import axios, { AxiosResponse } from "axios";
import { config } from "./config.js";

const MAX_RETRIES = 5;
const DELAY = 3000;

async function chatWithBot(
  input: string,
  model: string
): Promise<string | undefined> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response: AxiosResponse = await axios.post(
        `${config.openai.apiUrl}/v1/chat/completions`,
        {
          model: model,
          messages: [{ role: "user", content: input }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.openai.apiKey}`,
          },
          timeout: 60000,
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed. Retrying in ${DELAY}ms...`);
      await delay(DELAY);
    }
  }

  return undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { chatWithBot };
