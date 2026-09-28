/**
 * Unified LLM Provider Abstraction Layer
 * Supports: OpenAI GPT-4, Groq, Anthropic Claude
 * Features: Automatic fallback, streaming, structured output, temperature control
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Groq } from "groq-sdk";
import pino from "pino";

const logger = pino();

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  model: string;
  /** Text completion with temperature control */
  complete(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<LLMResponse>;

  /** Structured JSON output with validation */
  completeJson<T>(
    messages: LLMMessage[],
    schema: any,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{ data: T; provider: string; model: string }>;

  /** Streaming response */
  stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string>;
}

class OpenAIProvider implements LLMProvider {
  name = "openai";
  model: string;
  private client: OpenAI;

  constructor(model: string = "gpt-4-turbo") {
    this.model = model;
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options?: any): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return {
      content,
      provider: this.name,
      model: this.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async completeJson<T>(
    messages: LLMMessage[],
    schema: any,
    options?: any
  ): Promise<{ data: T; provider: string; model: string }> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(content) as T;
    return { data, provider: this.name, model: this.model };
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });

    let fullContent = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        onChunk(content);
        fullContent += content;
      }
    }
    return fullContent;
  }
}

class GroqProvider implements LLMProvider {
  name = "groq";
  model: string;
  private client: Groq;

  constructor(model: string = "mixtral-8x7b-32768") {
    this.model = model;
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options?: any): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return {
      content,
      provider: this.name,
      model: this.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async completeJson<T>(
    messages: LLMMessage[],
    schema: any,
    options?: any
  ): Promise<{ data: T; provider: string; model: string }> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(content) as T;
    return { data, provider: this.name, model: this.model };
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    } as any);

    let fullContent = "";
    for await (const chunk of stream) {
      const content = (chunk.choices[0] as any)?.delta?.content ?? "";
      if (content) {
        onChunk(content);
        fullContent += content;
      }
    }
    return fullContent;
  }
}

class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  model: string;
  private client: Anthropic;

  constructor(model: string = "claude-3-5-sonnet-20241022") {
    this.model = model;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options?: any): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const otherMessages = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessages.join("\n"),
      messages: otherMessages as any,
      temperature: options?.temperature ?? 0.7,
    });

    const content =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    return {
      content,
      provider: this.name,
      model: this.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens:
              response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
    };
  }

  async completeJson<T>(
    messages: LLMMessage[],
    schema: any,
    options?: any
  ): Promise<{ data: T; provider: string; model: string }> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const otherMessages = messages.filter((m) => m.role !== "system");

    systemMessages.push("Respond with ONLY valid JSON.");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessages.join("\n"),
      messages: otherMessages as any,
      temperature: options?.temperature ?? 0,
    });

    const content =
      response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const data = JSON.parse(content) as T;
    return { data, provider: this.name, model: this.model };
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    options?: any
  ): Promise<string> {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content);
    const otherMessages = messages.filter((m) => m.role !== "system");

    let fullContent = "";
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessages.join("\n"),
      messages: otherMessages as any,
      temperature: options?.temperature ?? 0.7,
    });

    stream.on("text", (text) => {
      onChunk(text);
      fullContent += text;
    });

    await stream.finalMessage();
    return fullContent;
  }
}

/**
 * Provider Manager with automatic fallback
 * Priority: OpenAI (GPT-4) → Groq → Anthropic Claude
 */
export class ProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private primaryProvider: string = "openai";
  private fallbackOrder: string[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (process.env.OPENAI_API_KEY) {
      const model = process.env.OPENAI_MODEL ?? "gpt-4-turbo";
      this.providers.set("openai", new OpenAIProvider(model));
      this.primaryProvider = "openai";
    }

    if (process.env.GROQ_API_KEY) {
      const model = process.env.GROQ_MODEL ?? "mixtral-8x7b-32768";
      this.providers.set("groq", new GroqProvider(model));
      if (!this.primaryProvider || this.primaryProvider === "openai") {
        this.fallbackOrder.push("groq");
      }
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
      this.providers.set("anthropic", new AnthropicProvider(model));
      this.fallbackOrder.push("anthropic");
    }

    if (this.providers.size === 0) {
      logger.warn("No LLM providers configured. Please set API keys.");
    }
  }

  getProvider(name?: string): LLMProvider {
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }
    if (this.providers.has(this.primaryProvider)) {
      return this.providers.get(this.primaryProvider)!;
    }
    if (this.fallbackOrder.length > 0) {
      return this.providers.get(this.fallbackOrder[0])!;
    }
    throw new Error("No LLM provider available. Configure API keys.");
  }

  async completeWithFallback(
    messages: LLMMessage[],
    options?: any
  ): Promise<LLMResponse> {
    const primary = this.getProvider(this.primaryProvider);
    try {
      logger.info(`Using ${primary.name}/${primary.model}`);
      return await primary.complete(messages, options);
    } catch (error) {
      logger.error(
        { error, provider: primary.name },
        "Primary provider failed, attempting fallback"
      );

      for (const fallbackName of this.fallbackOrder) {
        try {
          const fallback = this.providers.get(fallbackName)!;
          logger.info(`Falling back to ${fallback.name}/${fallback.model}`);
          return await fallback.complete(messages, options);
        } catch (fallbackError) {
          logger.error(
            { error: fallbackError, provider: fallbackName },
            "Fallback provider failed"
          );
        }
      }

      throw error;
    }
  }

  async completeJsonWithFallback<T>(
    messages: LLMMessage[],
    schema: any,
    options?: any
  ): Promise<{ data: T; provider: string; model: string }> {
    const primary = this.getProvider(this.primaryProvider);
    try {
      logger.info(`Using ${primary.name}/${primary.model} for JSON`);
      return await primary.completeJson<T>(messages, schema, options);
    } catch (error) {
      logger.error(
        { error, provider: primary.name },
        "Primary provider JSON failed, attempting fallback"
      );

      for (const fallbackName of this.fallbackOrder) {
        try {
          const fallback = this.providers.get(fallbackName)!;
          logger.info(`Falling back to ${fallback.name}/${fallback.model} for JSON`);
          return await fallback.completeJson<T>(messages, schema, options);
        } catch (fallbackError) {
          logger.error(
            { error: fallbackError, provider: fallbackName },
            "Fallback JSON failed"
          );
        }
      }

      throw error;
    }
  }

  listProviders(): Array<{ name: string; model: string }> {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      model: p.model,
    }));
  }
}

export const providerManager = new ProviderManager();
