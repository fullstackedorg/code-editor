export const mistralId = "mistral" as const;

export type MistralConfiguration = {
    type: typeof mistralId;
    apiKey: string;
};
