import { Claude } from "./claude";
import { Ollama } from "./ollama";
import { OpenAI } from "./openai";
import { Mistral } from "./mistral";

export const providers = [
    new Ollama(), 
    new OpenAI(), 
    new Claude(),
    new Mistral()
];


