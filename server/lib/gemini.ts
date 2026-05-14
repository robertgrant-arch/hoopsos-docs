import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    keyObservations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    teachableClips: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          startSec: { type: SchemaType.NUMBER },
          endSec: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING },
          playerName: { type: SchemaType.STRING },
          note: { type: SchemaType.STRING },
          sentiment: { type: SchemaType.STRING },
          teachable: { type: SchemaType.BOOLEAN },
        },
        required: ["startSec", "endSec", "category", "note", "sentiment", "teachable"],
      },
    },
    suggestedFocusAreas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          playerName: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING },
        },
        required: ["category", "reasoning"],
      },
    },
  },
  required: ["summary", "keyObservations", "teachableClips"],
};

export interface FilmAnalysisResult {
  summary: string;
  keyObservations: string[];
  teachableClips: Array<{
    startSec: number;
    endSec: number;
    category: string;
    playerName?: string;
    note: string;
    sentiment: "positive" | "corrective" | "neutral";
    teachable: boolean;
  }>;
  suggestedFocusAreas?: Array<{
    playerName?: string;
    category: string;
    reasoning: string;
  }>;
}

export async function analyzeFilmSession(params: {
  sessionTitle: string;
  sessionType: string;
  opponent?: string;
  date?: string;
  playerNames: string[];
  durationSecs: number;
  videoUrl?: string;  // Mux MP4 URL or transcript if available
}): Promise<FilmAnalysisResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any,
    },
  });

  const prompt = buildAnalysisPrompt(params);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text) as FilmAnalysisResult;
}

function buildAnalysisPrompt(params: {
  sessionTitle: string;
  sessionType: string;
  opponent?: string;
  date?: string;
  playerNames: string[];
  durationSecs: number;
}) {
  return `You are an expert basketball coaching assistant analyzing game film.

SESSION CONTEXT:
- Title: ${params.sessionTitle}
- Type: ${params.sessionType}
- ${params.opponent ? `Opponent: ${params.opponent}` : ""}
- ${params.date ? `Date: ${params.date}` : ""}
- Players: ${params.playerNames.join(", ") || "Unknown"}
- Duration: ${Math.round(params.durationSecs / 60)} minutes

TASK:
Analyze this basketball film session and return structured coaching intelligence.

For teachableClips, identify moments that coaches should review:
- Mistakes that need correction (sentiment: "corrective")
- Positive examples to reinforce (sentiment: "positive")
- Tactical breakdowns (sentiment: "corrective")
- Great execution worth highlighting (sentiment: "positive")

Categories for clips: offense, defense, finishing, footwork, transition, IQ, conditioning

For keyObservations, provide 4-6 specific, actionable coaching observations.

Return structured JSON following the schema exactly.`;
}
