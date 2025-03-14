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

type StatsListener = (args: { tokensPerSec: number }) => void;
const statsListener = new Set<StatsListener>();
export function addStatsListener(cb: StatsListener) {
    statsListener.add(cb);
}

let totalCount = 0,
    totalDuration = 0;
export async function updateStats(count: number, duration: number) {
    totalCount += count;
    totalDuration += duration;
    const tokensPerSec = (totalCount / totalDuration) * 1e9;
    statsListener.forEach((cb) => cb({ tokensPerSec }));
}
