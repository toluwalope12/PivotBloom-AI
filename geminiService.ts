
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Phase, Message, ForgeArtifact, InterviewReport, Milestone, ProfessionalContext } from "./types";
import { COACH_SYSTEM_INSTRUCTION, SIMULATOR_SYSTEM_INSTRUCTION, FORGE_INSTRUCTION, PERFORMANCE_REVIEW_PROMPT } from "./constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const traceModel = (model: string, task: string) => {
  console.info(`%c[GEMINI 3 NATIVE] %cModel: ${model} %cTask: ${task}`, 
    "color: #7c3aed; font-weight: bold", 
    "color: #f472b6; font-weight: bold", 
    "color: #94a3b8");
};

async function withExecutiveRetry<T>(
  fn: () => Promise<T>, 
  onRetry?: (count: number) => void,
  maxRetries = 3
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || "";
      const isTransient = errorMessage.includes("429") || 
                          errorMessage.includes("RESOURCE_EXHAUSTED") || 
                          errorMessage.includes("500");
      
      if (isTransient && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + (Math.random() * 500 - 250);
        if (onRetry) onRetry(i + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const getGeminiStream = async (
  prompt: string,
  history: Message[],
  phase: Phase,
  files: Array<{ name: string; type: string; data: string }> = [],
  onRetry?: (count: number) => void
) => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-pro-preview';
    traceModel(model, "Strategic Architecture Stream");
    
    const ai = getAI();
    const historyForApi = history.filter(h => !h.isStreaming).map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const currentParts: any[] = [{ text: prompt }];
    files.forEach(file => {
      currentParts.push({
        inlineData: {
          data: file.data.split(',')[1] || file.data,
          mimeType: file.type
        }
      });
    });

    const baseInstruction = phase === Phase.SIMULATION ? SIMULATOR_SYSTEM_INSTRUCTION : COACH_SYSTEM_INSTRUCTION;
    
    return await ai.models.generateContentStream({
      model,
      contents: [...historyForApi, { role: 'user', parts: currentParts }],
      config: {
        systemInstruction: baseInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });
  }, onRetry);
};

export const extractRoadmap = async (history: Message[]): Promise<Milestone[]> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-flash-preview';
    traceModel(model, "Grounded Trajectory Extraction");
    const ai = getAI();
    const transcript = history.map(m => `${m.role}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a 5-step career pivot roadmap in JSON inside <milestones> tags. 
      IMPORTANT: You MUST use Google Search to find 2 REAL, ACTIVE YouTube video URLs and 1 REAL free course URL (e.g. from Coursera, Microsoft Learn, or edX) for each milestone.
      Do not use stubs or example.com links.
      Return exactly this JSON structure: Array of { id, title, whyItMatters, timeline, status: 'Strategic Goal', resources: Array of { label, url, type: 'video'|'course', isGrounded: true } }.
      
      SESSION TRANSCRIPT:
      ${transcript}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "";
    const match = text.match(/<milestones>([\s\S]*?)<\/milestones>/) || text.match(/\[[\s\S]*\]/);
    if (match) {
      const cleaned = (match[1] || match[0]).replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    }
    return [];
  });
};

export const synthesizeProfessionalContext = async (history: Message[]): Promise<Partial<ProfessionalContext>> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-pro-preview';
    const ai = getAI();
    const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model,
      contents: `Extract career profile JSON.\n\nTRANSCRIPT:\n${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            goals: { type: Type.STRING },
            moatInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengthScore: { type: Type.NUMBER }
          },
          required: ["skills", "gaps", "goals", "moatInsights", "strengthScore"]
        },
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const getVoiceResponse = async (text: string): Promise<string | undefined> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-2.5-flash-preview-tts';
    const ai = getAI();
    
    const sanitizedText = text
      .replace(/<milestones>[\s\S]*?<\/milestones>/g, '')
      .replace(/!TIP:|<[^>]*>?/gm, '')
      .trim()
      .substring(0, 1000); 
    
    if (!sanitizedText || sanitizedText.length < 2) return undefined;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'aoede' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const runAuditorEngine = async (transcript: string): Promise<string> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-flash-preview';
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: `Audit presence (composure, confidence) in 10 words: "${transcript}"`,
      config: {
        systemInstruction: "Return only one sharp tip starting with \"!TIP:\".",
        temperature: 0.2,
      },
    });
    return response.text?.trim() || "";
  });
};

export const generateArtifact = async (
  type: 'RESUME' | 'EMAIL' | 'ROADMAP',
  history: Message[]
): Promise<ForgeArtifact> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-pro-preview';
    const ai = getAI();
    const context = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model,
      contents: `Build strategic ${type}:\n${context}`,
      config: {
        systemInstruction: FORGE_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: crypto.randomUUID(),
      type,
      draft: data.draft,
      critique: data.critique,
      polished: data.polished,
      timestamp: Date.now()
    };
  });
};

export const generatePerformanceReview = async (
  transcript: string,
  behavioralContext: string,
  onRetry?: (count: number) => void
): Promise<Partial<InterviewReport>> => {
  return await withExecutiveRetry(async () => {
    const model = 'gemini-3-pro-preview';
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze simulation data.\nTRANSCRIPT:\n${transcript}\n\nBEHAVIORAL SIGNALS:\n${behavioralContext}`,
      config: {
        systemInstruction: PERFORMANCE_REVIEW_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            executivePresenceAudit: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "summary", "executivePresenceAudit", "strengths", "growthAreas"]
        },
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return JSON.parse(response.text || "{}");
  }, onRetry);
};

export const printArtifactAsPDF = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const opt = {
    margin: 1,
    filename: 'PivotBloom_Strategic_Asset.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#020617' },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  // @ts-ignore
  window.html2pdf().set(opt).from(element).save();
};
