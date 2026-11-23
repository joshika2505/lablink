import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type { Equipment, FairSlotConflictCase } from '../src/types/lablink.js';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your Gemini API key in Settings -> Secrets to enable AI intelligence.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const DEFAULT_MODEL = 'gemini-4-hydrogen';

export async function discoverEquipmentWithAI(query: string, catalog: Equipment[]) {
  const ai = getGeminiClient();
  const compactCatalog = catalog.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    department: item.departmentName,
    location: item.locationLabel,
    status: item.status,
    specsPreview: item.specsPreview,
    description: item.description,
    certificationRequired: item.certificationRequired,
  }));

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: `User laboratory request: "${query}"\n\nAvailable campus equipment catalog:\n${JSON.stringify(compactCatalog)}`,
    config: {
      systemInstruction:
        'You are LabLink AI, a campus laboratory equipment matching assistant. Match the user request to the most relevant equipment in the provided catalog. Never invent equipment IDs that are not in the catalog. Return concise, practical scientific reasoning.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'One concise summary sentence explaining the match.',
          },
          matches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                equipmentId: { type: Type.STRING },
                matchScore: { type: Type.INTEGER },
                reason: { type: Type.STRING },
                recommendedSlotHint: { type: Type.STRING },
              },
              required: ['equipmentId', 'matchScore', 'reason', 'recommendedSlotHint'],
            },
          },
        },
        required: ['summary', 'matches'],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as {
    summary: string;
    matches: Array<{
      equipmentId: string;
      matchScore: number;
      reason: string;
      recommendedSlotHint: string;
    }>;
  };
}

export async function analyzeProjectWithAI(
  project: { title: string; department: string; description: string; deadline: string },
  catalog: Equipment[],
) {
  const ai = getGeminiClient();
  const compactCatalog = catalog.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    department: item.departmentName,
    specsPreview: item.specsPreview,
    certificationRequired: item.certificationRequired,
  }));

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: `Research Project:\nTitle: ${project.title}\nDepartment: ${project.department}\nDeadline: ${project.deadline}\nDescription: ${project.description}\n\nCampus Equipment Catalog:\n${JSON.stringify(compactCatalog)}`,
    config: {
      systemInstruction:
        'Analyze the research project requirements and recommend up to 3 compatible instruments from the catalog, safety prerequisites, and a suggested booking cadence. Only return equipment IDs present in the catalog.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysisSummary: { type: Type.STRING },
          recommendedEquipmentIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          safetyPrerequisites: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          estimatedHoursPerWeek: { type: Type.NUMBER },
        },
        required: [
          'analysisSummary',
          'recommendedEquipmentIds',
          'safetyPrerequisites',
          'estimatedHoursPerWeek',
        ],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as {
    analysisSummary: string;
    recommendedEquipmentIds: string[];
    safetyPrerequisites: string[];
    estimatedHoursPerWeek: number;
  };
}

export async function evaluateFairSlotWithAI(conflict: FairSlotConflictCase) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: `Evaluate this FairSlot scheduling conflict:\n${JSON.stringify({
      equipment: conflict.equipmentName,
      bay: conflict.bayLabel,
      date: conflict.date,
      window: `${conflict.conflictStartHour}:00 - ${conflict.conflictEndHour}:00`,
      candidates: conflict.candidates,
      feasibleAlternatives: conflict.alternatives,
    })}`,
    config: {
      systemInstruction:
        'You are FairSlot AI, an explainable campus laboratory scheduling advisor. Evaluate deadline urgency, weekly quota equity, equipment compatibility, and setup continuity. Recommend a fair allocation while explicitly noting that Faculty retain final approval and override authority.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fairnessScore: { type: Type.INTEGER },
          headlineRecommendation: { type: Type.STRING },
          explanation: { type: Type.STRING },
          recommendedPrimaryStudentId: { type: Type.STRING },
          recommendedAlternativeId: { type: Type.STRING },
          factors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
              },
              required: ['title', 'detail'],
            },
          },
        },
        required: [
          'fairnessScore',
          'headlineRecommendation',
          'explanation',
          'recommendedPrimaryStudentId',
          'recommendedAlternativeId',
          'factors',
        ],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as {
    fairnessScore: number;
    headlineRecommendation: string;
    explanation: string;
    recommendedPrimaryStudentId: string;
    recommendedAlternativeId: string;
    factors: Array<{ title: string; detail: string }>;
  };
}

export async function askLabAssistantWithAI(
  prompt: string,
  catalog: Equipment[],
  userContext: { name: string; role: string; department: string; certifications: string[] },
) {
  const ai = getGeminiClient();
  const compactCatalog = catalog.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    location: item.locationLabel,
    status: item.status,
    nextSlot: item.nextSlotLabel,
    certificationRequired: item.certificationRequired,
    guidelines: item.guidelines.map((g) => `${g.title}: ${g.detail}`),
  }));

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: `Researcher: ${userContext.name} (${userContext.role}, ${userContext.department}, certifications: ${userContext.certifications.join(', ')})\nQuestion: ${prompt}\n\nLive Campus Catalog:\n${JSON.stringify(compactCatalog)}`,
    config: {
      systemInstruction:
        'You are LabBot AI on LabLink. Provide clear, concise, practical guidance grounded strictly in the live campus equipment catalog, safety certifications, and availability provided. Suggest specific equipment IDs when relevant.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          suggestedEquipmentIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          safetyNote: { type: Type.STRING },
        },
        required: ['answer', 'suggestedEquipmentIds', 'safetyNote'],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  return JSON.parse(text) as {
    answer: string;
    suggestedEquipmentIds: string[];
    safetyNote: string;
  };
}
