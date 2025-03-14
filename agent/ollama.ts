import { core_fetch2 } from "fetch";
import OpenAI from "openai";

let openai: OpenAI = null;

export async function initOllama(host: string) {
    openai = new OpenAI({
        baseURL: `${host}/v1`,
        apiKey: "ollama",
        dangerouslyAllowBrowser: true,
        fetch: core_fetch2,
    });
    return true;
}

export async function chat(prompt: string) {
    return openai.chat.completions.create({
        model: "llama3.1:8b",
        messages: [{ role: "user", content: prompt }],
        stream: true,
    });
}

export async function complete(prefix: string, suffix: string) {
    return openai.completions.create({
        model: "qwen2.5-coder:1.5b",
        prompt: prefix,
        suffix,
        stream: false,
    });
}
