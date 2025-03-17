import { OllamaConfiguration } from "./ollama";
import { OpenAIConfiguration } from "./openai";

export type AgentConfiguration = OllamaConfiguration | OpenAIConfiguration;

export interface AgentProvider {
    configure(config: AgentConfiguration): void;
    form(): HTMLFormElement;
    test(): Promise<boolean>;
    chat(messages: { role: string; content: string }[]): void;
    completion(prompt: string, suffix: string): void;
}
