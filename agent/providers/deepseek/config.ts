export const deepseekId = "deepseek" as const;

export type DeepSeekConfiguration = {
    type: typeof deepseekId;
    apiKey: string;
};

