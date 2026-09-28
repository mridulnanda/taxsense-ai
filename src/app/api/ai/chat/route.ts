/**
 * Advanced AI-Powered Tax Chat API
 * Conversational tax advisor with document processing
 * Real-time streaming, context awareness, conversation history
 */

import { NextRequest, NextResponse } from "next/server";
import pino from "pino";
import {
  providerManager,
  taxAdvisor,
  taxNLP,
  complianceAI,
  type LLMMessage,
} from "@/lib/ai";
import { supabaseServer, demoEvents } from "@/lib/supabase/server";
import { emptyProfile } from "@/lib/tax-engine";

const logger = pino();

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  message: string;
  conversationId?: string;
  profileId?: string;
  profile?: any;
  history?: Array<{ role: string; content: string }>;
  mode?: "chat" | "recommend" | "compliance" | "document-analysis";
  uploadedDocuments?: Array<{ name: string; content: string }>;
}

interface ChatResponse {
  reply: string;
  provider: string;
  model: string;
  conversationId: string;
  mode: string;
  analysis?: any;
  recommendations?: any[];
  complianceCheck?: any;
  actions?: string[];
}

async function handleChatMode(
  message: string,
  history: LLMMessage[]
): Promise<{ reply: string; provider: string; model: string }> {
  const systemPrompt = `You are TaxSense AI, an expert Indian tax advisor and planning assistant.
  You have deep knowledge of:
  - Income Tax Act 1961
  - Tax laws for FY 2025-26 (AY 2026-27)
  - Investment optimization and tax planning
  - Compliance and documentation requirements
  - Multi-language communication (English and Hindi)

  Style:
  - Be conversational but professional
  - Explain complex concepts in simple terms
  - Provide actionable advice
  - Flag risks and compliance issues
  - Always suggest next steps
  - Acknowledge limitations and refer to professionals when needed`;

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const response = await providerManager.completeWithFallback(messages, {
    temperature: 0.6,
    maxTokens: 1024,
  });

  return response;
}

async function handleRecommendationMode(
  message: string,
  profile: any
): Promise<{ reply: string; recommendations: any[]; provider: string; model: string }> {
  // Extract key information from message
  const classification = await taxNLP.classifyQuestion(message);
  logger.info({ classification }, "Question classified");

  // Get profile for analysis
  const taxProfile = profile || emptyProfile();

  // Generate recommendations
  const analysis = await taxAdvisor.analyzeProfile(taxProfile);

  // Filter recommendations based on question classification
  const relevantRecommendations = analysis.recommendations.filter((rec) =>
    classification.relatedTopics.some(
      (topic) =>
        rec.category.toLowerCase().includes(topic.toLowerCase()) ||
        rec.title.toLowerCase().includes(topic.toLowerCase())
    )
  );

  const systemPrompt = `You are a tax advisor presenting personalized tax recommendations.
  Explain recommendations in context of the user's specific situation.
  Emphasize savings potential and compliance requirements.`;

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `User asked: "${message}"

Top recommendations for their situation:
${relevantRecommendations.slice(0, 3).map((r) => `- ${r.title}: ₹${r.estimatedSavings.toLocaleString("en-IN")} potential savings`).join("\n")}

Explain these recommendations and their benefits.`,
    },
  ];

  const response = await providerManager.completeWithFallback(messages, {
    temperature: 0.5,
    maxTokens: 1024,
  });

  return {
    ...response,
    recommendations: relevantRecommendations.slice(0, 3),
  };
}

async function handleDocumentAnalysisMode(
  documents: Array<{ name: string; content: string }>
): Promise<{ reply: string; analysis: any[]; provider: string; model: string }> {
  const analysisResults = [];

  for (const doc of documents.slice(0, 5)) {
    // Process up to 5 documents
    try {
      const analysis = await taxNLP.extractTaxInfo(doc.content);
      analysisResults.push({
        document: doc.name,
        type: analysis.documentType,
        extractedInfo: analysis.extractedInfo.slice(0, 5),
        summary: analysis.summary,
        issues: analysis.issues,
      });
    } catch (error) {
      logger.error({ error, document: doc.name }, "Document analysis failed");
    }
  }

  const systemPrompt = `You are analyzing uploaded tax documents.
  Summarize key information extracted and suggest next steps.`;

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Analyzed ${analysisResults.length} documents:
${analysisResults.map((a) => `- ${a.document} (${a.type}): ${a.summary}`).join("\n")}

Provide a summary of key findings and recommendations.`,
    },
  ];

  const response = await providerManager.completeWithFallback(messages, {
    temperature: 0.4,
    maxTokens: 1024,
  });

  return {
    ...response,
    analysis: analysisResults,
  };
}

async function handleComplianceMode(
  message: string,
  profile: any,
  recommendations?: any[]
): Promise<{ reply: string; complianceCheck: any; provider: string; model: string }> {
  const taxProfile = profile || emptyProfile();

  // Run compliance check
  let complianceResults = null;
  if (recommendations && recommendations.length > 0) {
    complianceResults = await complianceAI.assessAuditRisk(
      taxProfile,
      recommendations
    );
  }

  const systemPrompt = `You are a tax compliance expert.
  Address compliance concerns and explain what documentation is needed.
  Be thorough about regulatory requirements.`;

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Compliance question: "${message}"
${complianceResults ? `Audit risk score: ${Math.round(complianceResults.overallRisk * 100)}%` : ""}

Provide compliance guidance and documentation requirements.`,
    },
  ];

  const response = await providerManager.completeWithFallback(messages, {
    temperature: 0.3,
    maxTokens: 1024,
  });

  return {
    ...response,
    complianceCheck: complianceResults,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const message = String(body.message ?? "").slice(0, 4000).trim();
    const mode = body.mode ?? "chat";
    const profile = body.profile;
    const history = (body.history ?? [])
      .slice(-10)
      .map((m: any) => ({
        role: m.role as "system" | "user" | "assistant",
        content: String(m.content),
      }));

    if (!message) {
      return NextResponse.json(
        { error: "Empty message" },
        { status: 400 }
      );
    }

    logger.info({ mode, messageLength: message.length }, "Chat request received");

    let response: any = {};
    const conversationId = body.conversationId || generateConversationId();

    try {
      switch (mode) {
        case "recommend": {
          response = await handleRecommendationMode(message, profile);
          break;
        }
        case "compliance": {
          response = await handleComplianceMode(message, profile, body.uploadedDocuments as any);
          break;
        }
        case "document-analysis": {
          if (!body.uploadedDocuments || body.uploadedDocuments.length === 0) {
            return NextResponse.json(
              { error: "No documents provided" },
              { status: 400 }
            );
          }
          response = await handleDocumentAnalysisMode(body.uploadedDocuments);
          break;
        }
        case "chat":
        default: {
          response = await handleChatMode(message, history);
          break;
        }
      }
    } catch (error) {
      logger.error({ error, mode }, "Mode handler failed");
      // Fall back to basic chat
      response = await handleChatMode(message, history);
    }

    // Save to database (best-effort)
    const sb = await supabaseServer();
    if (sb) {
      try {
        const { data } = await sb.auth.getUser();
        if (data.user && body.profileId) {
          await sb.from("ai_chat_messages").insert([
            {
              profile_id: body.profileId,
              user_id: data.user.id,
              conversation_id: conversationId,
              role: "user",
              content: message,
              mode,
              metadata: { documentCount: body.uploadedDocuments?.length ?? 0 },
            },
            {
              profile_id: body.profileId,
              user_id: data.user.id,
              conversation_id: conversationId,
              role: "assistant",
              content: response.reply,
              provider: response.provider,
              model: response.model,
              mode,
              metadata: {
                recommendations: response.recommendations?.length ?? 0,
              },
            },
          ]);
        }
      } catch (dbError) {
        logger.warn({ error: dbError }, "Failed to persist chat to database");
      }
    } else {
      demoEvents.push({
        event: "ai_chat",
        mode,
        at: new Date().toISOString(),
      });
    }

    const result: ChatResponse = {
      reply: response.reply || response.content || "",
      provider: response.provider || "unknown",
      model: response.model || "unknown",
      conversationId,
      mode,
      ...(response.recommendations && { recommendations: response.recommendations }),
      ...(response.complianceCheck && { complianceCheck: response.complianceCheck }),
      ...(response.analysis && { analysis: response.analysis }),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ error }, "Chat API error");
    return NextResponse.json(
      { error: error?.message ?? "Chat failed" },
      { status: 500 }
    );
  }
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
