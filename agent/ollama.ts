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
