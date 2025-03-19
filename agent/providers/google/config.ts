export const googleId = "google" as const;

export type GoogleConfiguration = {
    type: typeof googleId;
    apiKey: string;
};
