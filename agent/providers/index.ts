import { AgentConversationMessages } from "../conversation";
import { Claude, ClaudeConfiguration } from "./claude";
import { Ollama, OllamaConfiguration } from "./ollama";
import { OpenAI, OpenAIConfiguration } from "./openai";

export type AgentConfiguration =
    | OllamaConfiguration
    | OpenAIConfiguration
    | ClaudeConfiguration;

export const providers = [Ollama, OpenAI, Claude];

export interface AgentProvider {
    name: string;
    getConfig: () => AgentConfiguration;
    configure(config: Partial<AgentConfiguration>): void;
    test(config?: Partial<AgentConfiguration>): Promise<boolean>;
    form(): HTMLFormElement;
    chat(messages: AgentConversationMessages): Promise<AsyncIterable<string>>;
    completion(prompt: string, suffix: string): void;
}
