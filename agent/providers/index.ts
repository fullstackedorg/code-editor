import { Ollama, OllamaConfiguration } from "./ollama";
import { OpenAI, OpenAIConfiguration } from "./openai";

export type AgentConfiguration = OllamaConfiguration | OpenAIConfiguration;

export const providers = [
    Ollama,
    OpenAI
]

export interface AgentProvider {
    name: string;
    configure(config: AgentConfiguration): void;
    test(config?: Partial<AgentConfiguration>): Promise<boolean>;
    form(): HTMLFormElement;
    chat(messages: { role: string; content: string }[]): void;
    completion(prompt: string, suffix: string): void;
}
