import { core_fetch2 } from "fetch";
import { Ollama } from "ollama";
//@ts-ignore
import * as o from "ollama/browser";

let ollama: Ollama = null;
export async function initOllama(host: string) {
    const opts: ConstructorParameters<typeof Ollama>[0] = {
        host,
        fetch: core_fetch2,
    };
    ollama = new o.Ollama(opts);
    try {
        await ollama.ps();
        return true;
    } catch (e) {
        return false;
    }
}

export async function chat(prompt: string) {
    return ollama.chat({
        model: "llama3.1:8b",
        messages: [{ role: "user", content: prompt }],
        stream: true,
    });
}

export async function complete(prefix: string, suffix: string) {
    return ollama.generate({
        model: "qwen2.5-coder:1.5b",
        prompt: prefix,
        stream: false,
        suffix
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
