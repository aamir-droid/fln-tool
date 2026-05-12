import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export type LOContext = {
  code: string;        // e.g. "ILM 4.9"
  subSkill: string;    // e.g. "Number Sense"
  outcome: string;     // full LO statement from NIPUN
  activity: string;    // example activity from NIPUN
};

// Grade-tuned complexity knobs — slides, quiz length, sentence budget
function lessonShape(grade: string) {
  switch (grade) {
    case "Balvatika": return { slides: 3, quiz: 3, sentenceWords: "4–6", style: "picture-driven with single-clause sentences" };
    case "Grade 1":   return { slides: 4, quiz: 4, sentenceWords: "5–8", style: "subject-verb-object, one idea per sentence" };
    case "Grade 2":   return { slides: 4, quiz: 4, sentenceWords: "7–12", style: "two-clause sentences allowed, conversational" };
    case "Grade 3":   return { slides: 5, quiz: 5, sentenceWords: "10–15", style: "multi-clause sentences, richer vocabulary" };
    default:          return { slides: 4, quiz: 4, sentenceWords: "7–12", style: "conversational" };
  }
}

function pedagogyBlock(domain: "literacy" | "numeracy"): string {
  if (domain === "numeracy") {
    return `NUMERACY PEDAGOGY (mandatory — every slide must follow this arc):
- Slide 1 — CONCRETE: introduce the maths idea using a real Indian daily-life scene (a shopkeeper, a kitchen, a festival). NO numerals yet — words and objects only ("three laddoos on a plate").
- Slide 2 — PICTORIAL: represent the same idea with a clean visual (dots, blocks, ten-frames, beads) and ONE numeral. Bridge concrete → abstract.
- Slide 3 (and later, if more slides) — ABSTRACT + APPLY: use the numeral / symbol / equation form. Final slide is a "Now you try!" prompt mirroring the NIPUN suggested activity below.
- Always anchor in Indian context: ₹ for money, roti / laddoo / mango / marbles for counting, festival lamps for sets, hand-spans for length.
- Problem-solving frame: "Riya / Kabir / Meera has X, now Y happens, what next?"`;
  }
  return `LITERACY PEDAGOGY (mandatory — every slide builds the phonics + comprehension ladder):
- Slide 1 — HOOK: a tiny scene a child can picture (a market, a grandmother's story, a rainy day). Introduce ONE key word.
- Slide 2 — SOUND / LETTER LINK: the key word's first sound, its letter, and 2 rhyming or matra-family neighbours. Wrap the key word in <span class="text-saffron font-bold">…</span>.
- Slide 3 — SENTENCE / STORY: the key word used in a full short sentence + a why-question for the child.
- Slide 4 (if used) — RETELL / WRITE: invite the child to retell or write something using the key word. Mirror the NIPUN suggested activity below.
- Daily-life anchoring: family, school, weather, food, festivals.`;
}

export async function generateLesson(
  grade: string,
  topic: string,
  skills: string[],
  language: "Hindi" | "English" = "Hindi",
  domain: "literacy" | "numeracy" = "literacy",
  lo?: LOContext
) {
  const model = "gemini-3.1-pro-preview";
  const shape = lessonShape(grade);

  const loBlock = lo ? `
NIPUN BHARAT LEARNING OUTCOME (the lesson MUST anchor to this — do NOT drift off-topic):
- LO Code: ${lo.code}
- Sub-skill: ${lo.subSkill}
- What the child should be able to do: "${lo.outcome}"
- NIPUN's suggested activity (use this as direct inspiration for the FINAL story slide and at least one quiz question):
    ${lo.activity}
- Success criterion: the quiz questions, taken together, should let a teacher tell whether the child has met the outcome above. Map each quiz question back to one part of the outcome.
` : `
NO SPECIFIC NIPUN LO PROVIDED — treat "${topic}" as the anchor and align it with the closest plausible NIPUN target for ${grade} ${domain}.
`;

  const prompt = `You are a senior FLN curriculum designer for India with 20+ years of classroom experience.
You strictly follow NIPUN Bharat (2021), NEP 2020, NCF-FS 2022, and NCERT standards for ages 5–9.

LESSON SPECS
- Grade: ${grade}
- Domain: ${domain}
- Topic: ${topic}
- Output language: ${language}
- Spelling: ${language === "English" ? "British English (UK) — colour, centre, organise — per Indian school standards." : "Standard Devanagari script. Avoid English transliteration unless absolutely needed."}
- Slides to produce: ${shape.slides}
- Quiz questions to produce: ${shape.quiz}
- Sentence budget per slide: ${shape.sentenceWords} words. ${shape.style}.
${skills?.length ? `- Skills emphasis (light touch — do not let it override the LO): ${skills.join(", ")}` : ""}

${loBlock}
${pedagogyBlock(domain)}

CROSS-CUTTING FLN APPROACH (mandatory):
- Play-way / experiential — the lesson must feel like a game or a small adventure, not a textbook.
- Daily-life anchoring — Indian names (Kabir, Meera, Riya, Anu, Arjun, Sita, Lakshmi, Ravi), Indian objects (roti, laddoo, mango, marigold, kite, brass bell, festival diyas), ₹ for money, festivals (Diwali, Holi, Pongal, Onam, Eid).
- Mother-tongue first — write naturally in ${language}, not translated-English.
- Invisible assessment — quiz questions should feel like a friendly chat, not an exam.
- No fear-based language — never "wrong", "bad", "fail". Use "let's try again", "almost", "great try".

HIGHLIGHTING
- Wrap the SINGLE most important vocabulary word per slide in <span class="text-saffron font-bold">word</span>.
- Use this sparingly — at most ONE highlighted word per slide.

QUIZ DESIGN
- 4 options per question, ONE correct.
- Distractors must be plausible (same category — if asking about a number, distractors are nearby numbers; if asking about a story character, distractors are other named characters from the story).
- Vary the question stems: not every question is "How many…?" or "Who…?".
- For ${grade}, the question itself should be ${shape.sentenceWords} words.

IMAGE PROMPTS (one per slide, in the same order)
- For Numeracy slides: PURE WHITE BACKGROUND, no decorations, no text, no shadows, no patterns. Objects arranged in a 16:9 frame with 10% safe margin on every side. If many objects, wrap into 2–3 neat rows.
- For Literacy slides: warm, contextual background that matches the scene (kitchen, classroom, market, garden). Indian children, Indian clothing where people are shown.
- ABSOLUTELY NO TEXT, NO LETTERS, NO NUMERALS IN THE IMAGE. Numerals belong in the slide text, never the picture.
- The image must reinforce the slide's pedagogical role (concrete → pictorial → abstract for maths; hook → sound → sentence for literacy).

SLIDE INTERACTIONS (MANDATORY — every slide must have ONE interactive widget so the child DOES, not just reads)

Choose the widget type per slide based on its pedagogy role. Use only these three types:

1. "tap-count" — N emoji objects on screen, child taps each one to count.
   Pedagogy: builds 1:1 correspondence + numeral recognition.
   Best for: counting, number-recognition, "how many" LOs.
   Fields: kind="tap-count", instruction (in ${language}, 4–8 words),
           emoji (single emoji like "🥭"), targetCount (integer 1–10),
           successSay (in ${language}, 3–6 words, joyful).

2. "drag-bucket" — N emoji items at top, one labeled bucket at bottom.
   Child drags each item into the bucket.
   Pedagogy: builds combine/group/share concept.
   Best for: addition (drag N more into existing pile), grouping, sharing, sorting LOs.
   Fields: kind="drag-bucket", instruction (in ${language}),
           emoji, bucketEmoji (e.g. "🧺", "🍱", "📦"),
           bucketLabel (in ${language}, e.g. "Kabir's basket"),
           targetCount (integer 1–10), successSay.

3. "tap-find" — 2–4 emoji options shown, child taps the correct one.
   Pedagogy: replaces dry MCQ — used for rhyming, more/less, finding, picking.
   Best for: comparison, recognition, rhyme/phonics match.
   Fields: kind="tap-find", instruction (in ${language}),
           options (array of 2–4 { emoji, label } — emoji can be a SEQUENCE like "🍪🍪🍪", label in ${language}),
           correctIndex (which option is correct, 0-based),
           successSay.

EMOJI GUIDANCE (preferred Indian context):
- Sweets: 🟠 (laddoo), 🟡 (jalebi), 🟤 (gulab jamun)
- Fruits: 🥭 mango, 🍌 banana, 🍎 apple, 🍇 grapes, 🥥 coconut
- Food: 🌶️ chili, 🍚 rice, 🫓 roti
- Festivals/culture: 🪔 diya, 🪅 piñata-flower, 🌸 marigold, 🌺 hibiscus
- Animals: 🐄 cow, 🐘 elephant, 🦚 peacock, 🐦 bird, 🐟 fish
- People: 👦 boy, 👧 girl, 👵 grandmother, 👴 grandfather, 👩‍🌾 farmer
- Objects: 📚 book, ✏️ pencil, 🪁 kite, 🎒 schoolbag, ⏰ clock, 🧺 basket
- Money: 💰, ₹ (use ₹ as text not emoji where possible)
- Letters/numbers: do NOT use letter/number emoji. Numerals appear only in slide text.

RULES for interactions:
- NEVER more than 10 visible items in a tap-count or drag-bucket.
- The interaction's purpose must match the slide's pedagogy role (e.g., the CONCRETE slide in a numeracy CPA arc → tap-count; the ABSTRACT slide → tap-find with numeral choices).
- successSay must celebrate the action, not the child ("5 mangoes in the basket!" not "Good job!").
- Instructions never use the words "wrong", "fail", "incorrect".
- The interaction together with the slide narration should make the child master one part of the LO outcome.

Return ONLY a JSON object with these fields:
- "title": short catchy ${language} title (4–7 words). NIPUN-aligned.
- "storySlides": exactly ${shape.slides} ${language} strings, one per slide, in lesson order, following the pedagogy arc above. The text NARRATES — the interaction is what the child DOES. Keep slide text short, the interaction carries the learning.
- "slideInteractions": exactly ${shape.slides} interaction objects, one per slide, in the same order as storySlides. Each follows the schema above.
- "quiz": exactly ${shape.quiz} MCQs, each { "question", "options" (4), "correctIndex" }. The quiz is also presented as friendly tap-find activities, not as a test.
- "imagePrompts": exactly ${shape.slides} English image-generation prompts, one per slide, in the same order.`;

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
          },
          slideInteractions: {
            type: Type.ARRAY,
            description: "One interactive widget per slide, in the same order as storySlides.",
            items: {
              type: Type.OBJECT,
              properties: {
                kind: { type: Type.STRING, description: "tap-count | drag-bucket | tap-find" },
                instruction: { type: Type.STRING },
                emoji: { type: Type.STRING, description: "single emoji for tap-count / drag-bucket items" },
                targetCount: { type: Type.INTEGER, description: "1-10 for tap-count or drag-bucket" },
                bucketEmoji: { type: Type.STRING, description: "bucket emoji for drag-bucket" },
                bucketLabel: { type: Type.STRING, description: "bucket name for drag-bucket" },
                options: {
                  type: Type.ARRAY,
                  description: "for tap-find: 2-4 choice options",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      emoji: { type: Type.STRING },
                      label: { type: Type.STRING }
                    },
                    required: ["emoji", "label"]
                  }
                },
                correctIndex: { type: Type.INTEGER, description: "for tap-find: 0-based index of correct option" },
                successSay: { type: Type.STRING }
              },
              required: ["kind", "instruction", "successSay"]
            }
          }
        },
        required: ["title", "storySlides", "quiz", "imagePrompts", "slideInteractions"]
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
