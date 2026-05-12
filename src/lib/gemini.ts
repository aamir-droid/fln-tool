import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export async function generateLesson(grade: string, topic: string, skills: string[], language: "Hindi" | "English" = "Hindi", domain: "literacy" | "numeracy" = "literacy") {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `You are an expert educator for children in India, strictly following NCERT, NEP (National Education Policy) 2020, and FLN (Foundational Literacy and Numeracy) guidelines.
  Create a fun, engaging, and age-appropriate ${language} lesson.
  
  DOMAIN OVERVIEW: 
  You are creating a ${domain} lesson. 
  - If domain is literacy: Focus on phonics, reading, vocabulary, and relevant short stories.
  - If domain is numeracy: Focus on number sense, patterns, basic math operations, and logical reasoning using clear instructional steps.
  
  CORE PEDAGOGY:
  - FLN Focus: Focus on basic decoding, vocabulary building, and reading comprehension.
  - NEP 2020: Use experiential learning, relational teaching, and relatable daily-life examples.
  - NCERT: Align with the curriculum standards for the specified grade.
  - Indian Context: Use Indian names (e.g., Kabir, Meera), local festivals (Diwali, Holi, Pongal), Indian food, and familiar landmarks.
  - Spelling: ${language === "English" ? "Use British English (UK) spelling (e.g., 'colour', 'centre') as per Indian school standards." : "Use clear, standard Devanagari script."}
  
  Grade: ${grade}
  Topic: ${topic}
  Skills Focus: ${skills.join(", ")}
  
  CONTENT/LESSON STRUCTURE:
  - Format: Align the content structure with the topic. It does NOT have to be a story.
  - For Numeracy: Use objects for counting, step-by-step problem solving, and clear mathematical concepts. Use simple, direct instructional language.
  - For Literacy: Use sentences that build vocabulary or short narratives if a story fits the topic.
  - For Grades 1-2: Keep sentences extremely short (max 7-10 words). Use simple subject-verb-object structures.
  - For Grades 3-5: Introduce slightly more complex vocabulary but keep it conversational.
  - Comprehensiveness: Ensure the topic is introduced, explained with examples, and summarized.
  
  Return the response in JSON format with the following fields:
  "title": A catchy, simple ${language} title (FLN-aligned).
  "storySlides": An array of simple ${language} sentences (representing the lesson content slides). 
    - HIGHLIGHTING: Wrap important key vocabulary words in <span class="text-saffron font-bold">word</span> tags.
  "quiz": An array of 3-5 multiple-choice questions testing foundational understanding.
    "question": Simple question in ${language}.
    "options": 4 clear choices.
    "correctIndex": The correct index.
  "imagePrompts": descriptive prompts for vivid illustrations. 
    - SPECIAL INSTRUCTION FOR MATH/NUMERACY: Describe the mathematical items (like 5 apples, shapes, etc.) on a **CLEAR WHITE BACKGROUND** with **NO EXTRA ELEMENTS, NO DECORATIONS, AND NO COMPLEX BACKGROUNDS**. This is to avoid confusing the child.
    - LITERACY: Use descriptive, contextual backgrounds.
    - NO TEXT, NO LETTERS.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          storySlides: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.INTEGER }
              },
              required: ["question", "options", "correctIndex"]
            }
          },
          imagePrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Descriptive prompts for vivid illustrations. Each prompt MUST strictly correspond to the matching sentence in storySlides at the same index."
          }
        },
        required: ["title", "storySlides", "quiz", "imagePrompts"]
      }
    },
  });

  const text = response.text || "{}";
  const cleanText = text.replace(/```json\n?|```/g, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw Text:", text);
    throw new Error(`Failed to parse lesson JSON: ${e.message}`);
  }
}

// Primary: Gemini 3 Pro Image (high-quality, Nano Banana Pro).
// Fallback: gemini-2.5-flash-image (older, faster, lower cost) if the new model
// is unavailable (quota / region / preview gate). Image generation should not block a lesson.
const IMAGE_MODELS = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"];

export async function generateTopicImage(prompt: string) {
  const fullPrompt = `Educational illustration for children in a 16:9 frame. Strictly NO TEXT, NO LETTERS, NO WORDS. Compose ALL subjects inside the frame with a comfortable 8-10% safe margin on every side — no subject may touch or extend past the edges. If many objects are requested, arrange them in 2-3 neat rows (wrap into a grid) rather than a single wide row, so every object is fully visible. Use a PURE WHITE BACKGROUND with ZERO extra elements, decorations, shadows, or background objects — especially for math, counting, or numeracy: ${prompt}`;

  let lastErr: any = null;
  for (const model of IMAGE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: { aspectRatio: "16:9" },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      // Model returned no inlineData — try the next one
    } catch (err: any) {
      lastErr = err;
      console.warn(`Image model "${model}" failed, trying next. Reason:`, err?.message || err);
    }
  }

  if (lastErr) console.error("All image models failed:", lastErr);
  return null;
}

let narrationQuotaExhausted = false;

export function isNarrationQuotaExhausted() {
  return narrationQuotaExhausted;
}

export async function generateNarration(text: string, retries = 5, delay = 3000): Promise<string | null> {
  if (narrationQuotaExhausted) {
    return null;
  }

  if (!text || text.trim() === "") {
    console.warn("Empty text provided for narration");
    return null;
  }

  // Strip HTML tags before narration and trim
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  if (!cleanText) {
    console.warn("Text is empty after stripping HTML tags:", text);
    return null;
  }

  const model = "gemini-3.1-flash-tts-preview";
  
  try {
    console.log(`Generating narration for: "${cleanText.substring(0, 40)}..." (Retries left: ${retries})`);
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Say clearly and engagingly in a friendly Indian accent (Indian English): ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates in Gemini response");
    }

    let base64Audio = "";
    const parts = response.candidates[0].content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Audio += part.inlineData.data;
      }
    }
    
    if (!base64Audio) {
      console.error("Gemini response parts:", JSON.stringify(parts));
      throw new Error("No audio data in Gemini response");
    }

    console.log(`Successfully generated audio (${base64Audio.length} bytes)`);
    return base64Audio;
  } catch (error: any) {
    const err = error.error || error;
    const errorString = (err.message || (typeof error === 'string' ? error : JSON.stringify(error))).toLowerCase();
    
    const isRateLimit = err.code === 429 || 
                       err.status === "RESOURCE_EXHAUSTED" || 
                       errorString.includes("429") || 
                       errorString.includes("resource_exhausted") ||
                       errorString.includes("rate limit") ||
                       errorString.includes("quota exceeded");
                       
    const isDailyQuota = (errorString.includes("per_day") || 
                         errorString.includes("perday") || 
                         errorString.includes("daily limit")) && 
                         (errorString.includes("quota") || errorString.includes("limit"));
    
    // If it's technically a 429/quota error but NOT daily, we should retry
    if (isRateLimit && !isDailyQuota && retries > 0) {
      const nextDelay = delay * 2; 
      console.warn(`Rate limit hit for narration. Retrying in ${delay}ms... (${retries} retries left). Error: ${errorString}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateNarration(text, retries - 1, nextDelay);
    }

    if (isDailyQuota) {
      narrationQuotaExhausted = true;
      console.error("Gemini Narration Daily Quota Exceeded:", errorString);
      throw new Error("QUOTA_EXHAUSTED");
    }

    if (retries > 0 && !isDailyQuota) {
      console.warn(`Unexpected error in narration. Retrying in ${delay}ms... (${retries} retries left). Error:`, errorString);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateNarration(text, retries - 1, delay * 1.5);
    }

    console.error("Gemini Narration Final Failure:", errorString, error);
    return null;
  }
}
