export type AiMessageRole = "system" | "user";

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiCompletionRequest {
  messages: readonly AiMessage[];
}

export interface AiCompletionResponse {
  text: string;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
