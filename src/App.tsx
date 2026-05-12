import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RefreshCw, BookOpen, Sparkles, Volume2, Loader2, ChevronDown, Check, Download, Trophy, AlertCircle, X, Archive, ChevronLeft, ChevronRight, Book, Calculator, Star, Sparkle, ArrowRight, Pencil, Brain, Languages, Lightbulb } from "lucide-react";
import { generateLesson, generateNarration, generateTopicImage, isNarrationQuotaExhausted } from "./lib/gemini";
import { getTopicsForGradeDomain, searchTopics, NipunLO } from "./lib/nipun_curriculum";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const GRADES = ["Balvatika", "Grade 1", "Grade 2", "Grade 3"];

const LANGUAGES = [
  { id: "Hindi", label: "हिन्दी (Hindi)", subLabel: "IN", icon: "🇮🇳" },
  { id: "English", label: "English (UK)", subLabel: "GB", icon: "🇬🇧" }
] as const;

type Language = typeof LANGUAGES[number]["id"];

const DOMAINS = [
  { id: "literacy", label: { Hindi: "साक्षरता", English: "Literacy" }, icon: "📖", color: "bg-blue-300" },
  { id: "numeracy", label: { Hindi: "संख्या ज्ञान", English: "Numeracy" }, icon: "⌨️", color: "bg-indigo" }
] as const;

const SUGGESTED_TOPICS: Record<Language, string[]> = {
  Hindi: ["मेरा परिवार", "हमारे त्योहार", "जानवरों के नाम", "रंग और आकार", "फल और सब्ज़ियाँ", "मेरा विद्यालय", "बारिश का दिन", "मेरी दादी की कहानी"],
  English: ["My Family", "Indian Festivals", "Animals Around Us", "Colours and Shapes", "Fruits and Vegetables", "My School", "A Rainy Day", "My Grandmother's Story"]
};

const SKILLS: Record<Language, { id: string; label: string; icon: string }[]> = {
  Hindi: [
    { id: "phonics", label: "ध्वनि-जागरूकता", icon: "phonics" },
    { id: "reading", label: "पठन", icon: "reading" },
    { id: "writing", label: "लेखन", icon: "writing" },
    { id: "vocab", label: "शब्द भंडार", icon: "vocab" },
    { id: "grammar", label: "व्याकरण", icon: "grammar" },
    { id: "comprehension", label: "समझ", icon: "comprehension" }
  ],
  English: [
    { id: "phonics", label: "Phonics", icon: "phonics" },
    { id: "reading", label: "Reading", icon: "reading" },
    { id: "writing", label: "Writing", icon: "writing" },
    { id: "vocab", label: "Vocabulary", icon: "vocab" },
    { id: "grammar", label: "Grammar", icon: "grammar" },
    { id: "comprehension", label: "Comprehension", icon: "comprehension" }
  ]
};

const LAKSHYAS: any = {
  "Grade 1": {
    literacy: {
      Hindi: [
        { 
          title: "मौखिक भाषा", 
          goals: ["अपनी बात 4-5 वाक्यों में स्पष्ट रूप से रख पाना", "सुनी हुई कहानी के बारे में सरल प्रश्नों के उत्तर देना", "नई कविताओं/गीतों को सस्वर सुनाना"] 
        },
        { 
          title: "पठन", 
          goals: ["स्वर + व्यंजन से बने 2-3 अक्षरों वाले सरल शब्द पढ़ना", "मात्राओं वाले शब्द पहचानना (आ, इ, ई की मात्रा)", "उम्र-अनुकूल पाठ को समझकर पढ़ना (45-60 शब्द प्रति मिनट)"] 
        }
      ],
      English: [
        { 
          title: "ORAL LANGUAGE", 
          goals: ["Speaks 4-5 sentences clearly about self & surroundings", "Answers simple questions about a story heard", "Recites new poems / rhymes with expression"] 
        },
        { 
          title: "READING", 
          goals: ["Decodes CVC and 2-3 letter words using phonics", "Recognises short and long vowel sounds", "Reads grade-level text with comprehension at 30+ WPM"] 
        }
      ]
    },
    numeracy: {
      Hindi: [
        { title: "संख्या ज्ञान", goals: ["1-99 तक की संख्याएँ पढ़ना और लिखना", "सरल जोड़ और घटाव (1-20 के बीच)"] }
      ],
      English: [
        { title: "NUMERACY", goals: ["Read and write numbers up to 99", "Simple addition and subtraction within 20"] }
      ]
    }
  },
  "Grade 2": {
    literacy: {
      Hindi: [
        { title: "पठन", goals: ["मात्राओं के साथ शब्द पढ़ना", "कहानियों को समझकर पढ़ना"] }
      ],
      English: [
        { title: "READING", goals: ["Read words with all vowel sounds", "Read and understand simple stories"] }
      ]
    }
  }
};

// Pedagogical strategies — content adapts to grade + domain.
// Source: NIPUN Bharat / NEP 2020 / NCF-FS 2022 pedagogy guidelines.
const PEDAGOGY: any = {
  literacy: {
    label: { English: "Foundational Literacy Approach", Hindi: "साक्षरता शिक्षण का दृष्टिकोण" },
    strategies: [
      { icon: "📖", title: { English: "Reading & Comprehension", Hindi: "पठन और समझ" }, desc: { English: "Decoding text, retelling stories, answering questions about what's read.", Hindi: "पाठ पढ़ना, कहानी फिर से सुनाना, और सरल प्रश्नों के उत्तर देना।" } },
        { icon: "✍️", title: { English: "Writing for Expression", Hindi: "अभिव्यक्ति के लिए लेखन" }, desc: { English: "Children write names, labels, sentences and short stories. Invented spelling is welcomed.", Hindi: "बच्चे नाम, चिन्ह, वाक्य और छोटी कहानियाँ लिखते हैं। अनुमानित वर्तनी स्वीकार्य है।" } },
        { icon: "🔤", title: { English: "Phonics & Vocabulary", Hindi: "ध्वनि-ज्ञान और शब्द भंडार" }, desc: { English: "Sound–letter links, rhymes, and word families build the decoding ladder.", Hindi: "ध्वनि-अक्षर संबंध, तुकबंदी और शब्द-परिवार पढ़ने की सीढ़ी बनाते हैं।" } },
        { icon: "🧠", title: { English: "Critical Thinking", Hindi: "तार्किक सोच" }, desc: { English: "Why-questions, predictions, and opinions — children link stories to their own lives.", Hindi: "क्यों-प्रश्न, अनुमान और राय — बच्चे कहानियों को अपने जीवन से जोड़ते हैं।" } }
    ]
  },
  numeracy: {
    label: { English: "Foundational Numeracy Approach", Hindi: "संख्या-ज्ञान शिक्षण का दृष्टिकोण" },
    strategies: [
      { icon: "🔢", title: { English: "Number Sense", Hindi: "संख्या बोध" }, desc: { English: "Counting, comparing, sequencing — building an intuitive feel for how numbers behave.", Hindi: "गिनना, तुलना और क्रम — संख्याओं के व्यवहार की अंतर्ज्ञानात्मक समझ।" } },
      { icon: "➕", title: { English: "Basic Operations", Hindi: "मूल संक्रियाएँ" }, desc: { English: "Addition, subtraction (and later × ÷) grounded in objects and daily-life stories.", Hindi: "जोड़, घटाव (और बाद में गुणा-भाग) — वस्तुओं और रोज़मर्रा की कहानियों पर आधारित।" } },
      { icon: "📐", title: { English: "Spatial & Shape Understanding", Hindi: "आकार और स्थान बोध" }, desc: { English: "2D/3D shapes, position words, measurement using hand-spans, cups and rulers.", Hindi: "2D/3D आकार, स्थान-शब्द, हाथ-नाप / कप / रूलर से मापन।" } },
      { icon: "🧩", title: { English: "Problem-Solving in Context", Hindi: "संदर्भ में समस्या-समाधान" }, desc: { English: "Word problems set in shops, kitchens, festivals — maths becomes useful, not abstract.", Hindi: "दुकान, रसोई और त्योहारों पर आधारित शब्द-प्रश्न — गणित अमूर्त नहीं, उपयोगी बनती है।" } }
    ]
  },
  // Strategies that apply to BOTH domains
  universal: [
    { icon: "🎲", title: { English: "Play-way & Experiential", Hindi: "खेल-खेल में सीखना" }, desc: { English: "Learning kits, songs, role-play and digital resources (DIKSHA, e-pathshala) make learning joyful.", Hindi: "लर्निंग किट, गीत, अभिनय और डिजिटल संसाधन (दीक्षा, ई-पाठशाला) सीखने को आनंदमय बनाते हैं।" } },
    { icon: "👥", title: { English: "Peer & Small-group", Hindi: "साथी और छोटे समूह" }, desc: { English: "One-to-one buddy work and 3–5 child groups — children explain to each other in their own words.", Hindi: "एक-से-एक और 3–5 बच्चों के समूह — बच्चे अपने शब्दों में एक-दूसरे को समझाते हैं।" } },
    { icon: "📊", title: { English: "Adaptive Assessment", Hindi: "अनुकूली मूल्यांकन" }, desc: { English: "Observation, oral checks, portfolio tasks — no exams. Teachers adjust to each child's pace.", Hindi: "अवलोकन, मौखिक जाँच और पोर्टफोलियो — परीक्षा नहीं। शिक्षक हर बच्चे की गति के अनुसार बदलते हैं।" } }
  ],
  // Grade-specific emphasis ribbon (one short line)
  gradeEmphasis: {
    "Balvatika": { English: "Play-heavy · oral language · senses & shapes · no formal writing", Hindi: "खेल-केंद्रित · मौखिक भाषा · इंद्रियाँ और आकार · औपचारिक लेखन नहीं" },
    "Grade 1":   { English: "Phonics + invented spelling · counting to 99 · concrete objects", Hindi: "ध्वनि-ज्ञान + अनुमानित वर्तनी · 99 तक गिनती · वस्तुओं द्वारा सीखना" },
    "Grade 2":   { English: "45–60 wpm fluency · place value · own-method addition / subtraction", Hindi: "45–60 शब्द प्रति मिनट · स्थानीय मान · स्वयं की विधि से जोड़-घटाव" },
    "Grade 3":   { English: "Comprehension > 60 wpm · 3-digit operations · adaptive checks", Hindi: "60+ शब्द प्रति मिनट समझ · 3-अंक संक्रियाएँ · अनुकूली जाँच" }
  }
};

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  audioBase64?: string;
}

interface LessonResult {
  title: string;
  titleAudioBase64?: string;
  storySlides: string[];
  quiz: QuizQuestion[];
  imagePrompts: string[];
  storyAudioBase64?: string[];
  storyImagesBase64?: string[];
  // Per-slide interactive widget specs (tap-count, drag-bucket, tap-find)
  slideInteractions?: any[];
  // NIPUN anchoring — surfaced as a badge on the lesson screens
  loCode?: string;
  loSubSkill?: string;
  loOutcome?: string;
  loActivity?: string;
  loGrade?: string;
  loDomain?: "literacy" | "numeracy";
  theme?: {
    fontFamily: string;
    textColor: string;
    fontSize: string;
  };
}

export default function App() {
  const [language, setLanguage] = useState<Language>("Hindi");
  const [grade, setGrade] = useState("Grade 1");
  const [domain, setDomain] = useState<"literacy" | "numeracy">("literacy");
  const [topic, setTopic] = useState("");
  const [nipunCode, setNipunCode] = useState<string>("");
  const [topicSearch, setTopicSearch] = useState<string>("");
  const [topicMode, setTopicMode] = useState<"nipun" | "custom">("nipun");
  const [topicListOpen, setTopicListOpen] = useState<boolean>(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["phonics", "reading"]);
  const [showLakshyas, setShowLakshyas] = useState(true);
  const [showPedagogy, setShowPedagogy] = useState(true);
  const [introAudioPlayed, setIntroAudioPlayed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSlideUpdating, setIsSlideUpdating] = useState<number | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [result, setResult] = useState<LessonResult | null>(null);
  // Keeps a live mirror of `result` so download handlers can read the freshest state
  // even when triggered immediately after an edit (before React commits).
  const resultRef = useRef<LessonResult | null>(null);
  resultRef.current = result;
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentScreen, setCurrentScreen] = useState(-1); // -1: Config, 0: Intro, 1: Story, 2: Quiz
  const [currentStorySlide, setCurrentStorySlide] = useState(0);
  
  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [narrationWarning, setNarrationWarning] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message);
      setTimeout(() => setError(null), 3000);
    } else {
      setQuizFeedback({ type, message });
      setTimeout(() => setQuizFeedback(null), 3000);
    }
  };

  const safeAtob = (base64: string): string => {
    try {
      if (!base64 || typeof base64 !== 'string' || !base64.trim()) {
        return "";
      }
      
      // Strip data URL prefix if present
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      
      // Remove all whitespace and non-base64 characters
      // First handle base64url
      let standardBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
      // Then remove anything that isn't a valid base64 character
      // We keep A-Z, a-z, 0-9, +, /
      standardBase64 = standardBase64.replace(/[^A-Za-z0-9+/]/g, '');
      
      if (!standardBase64) {
        console.warn("safeAtob: No valid base64 characters found in input");
        return "";
      }

      // Pad if necessary
      const padded = standardBase64.padEnd(standardBase64.length + (4 - standardBase64.length % 4) % 4, '=');
      
      try {
        return atob(padded);
      } catch (atobError) {
        console.error("atob failed for string:", padded.substring(0, 100) + "...", atobError);
        return "";
      }
    } catch (e) {
      console.error("safeAtob unexpected error:", e);
      return "";
    }
  };

  const pcmToWav = (base64: string): Blob => {
    const binaryString = safeAtob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + len, true); // chunk size
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // FMT sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // sub-chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, 1, true); // num channels (mono)
    view.setUint32(24, 24000, true); // sample rate
    view.setUint32(28, 24000 * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // Data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, len, true); // data size

    return new Blob([wavHeader, bytes], { type: 'audio/wav' });
  };

  const downloadAudio = () => {
    if (!audioBase64) {
      showFeedback('Please play the voice first to generate the audio file.', 'error');
      return;
    }
    const blob = pcmToWav(audioBase64);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result?.title.replace(/\s+/g, '_')}_Voiceover.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('Audio downloaded successfully!', 'success');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGenerationStep(language === "Hindi" ? "विषय की सामग्री तैयार की जा रही है..." : "Generating lesson content...");
    setError(null);
    setResult(null);
    setAudioBase64(null);
    setNarrationWarning(false);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizFeedback(null);
    setIsQuizComplete(false);
    setCurrentScreen(0);
    setCurrentStorySlide(0);

    try {
      // Resolve the NIPUN LO context (if user picked one) so Gemini can anchor the lesson to it
      let loContext: any = undefined;
      if (nipunCode && topicMode === "nipun") {
        const lo = getTopicsForGradeDomain(grade, domain).find(t => t.code === nipunCode);
        if (lo) loContext = { code: lo.code, subSkill: lo.subSkill, outcome: lo.outcome, activity: lo.activity };
      }
      // res usually contains { title, storySlides, quiz, imagePrompts }
      const res = await generateLesson(grade, topic, selectedSkills, language, domain, loContext);
      
      setGenerationStep(language === "Hindi" ? "सुंदर चित्र बनाए जा रहे हैं..." : "Creating beautiful illustrations...");
      // Generate images in parallel
      const storyImages = await Promise.all(res.imagePrompts.map((p: string) => generateTopicImage(p)));
      
      setGenerationStep(language === "Hindi" ? "आवाज तैयार की जा रही है..." : "Preparing narration voices...");
      // Generate title audio
      try {
        const titleAudio = await generateNarration(res.title);
        // We'll generate the first slide audio immediately.
        const firstSlideAudio = await generateNarration(res.storySlides[0]);

        const validStoryImages = storyImages.map(img => img || "");
        const storyAudios = new Array(res.storySlides.length).fill("");
        if (firstSlideAudio) storyAudios[0] = firstSlideAudio;

        const finalResult = {
          ...res,
          quiz: res.quiz.map((q: any) => ({ ...q, audioBase64: "" })),
          titleAudioBase64: titleAudio || "",
          storyAudioBase64: storyAudios,
          storyImagesBase64: validStoryImages,
          loCode: loContext?.code,
          loSubSkill: loContext?.subSkill,
          loOutcome: loContext?.outcome,
          loActivity: loContext?.activity,
          loGrade: grade,
          loDomain: domain,
          theme: {
            fontFamily: "'Poppins', sans-serif",
            textColor: "#386AF6",
            fontSize: "2rem"
          }
        };
        
        setGenerationStep(language === "Hindi" ? "पाठ पूरा हो गया है!" : "Lesson ready!");
        setIntroAudioPlayed(false);
        setResult(finalResult);
        setCurrentScreen(0); 
        
        // Background generate remaining audio
        backgroundGenerateAudio(finalResult);
      } catch (audioErr: any) {
        console.error("Audio generation error:", audioErr);
        const validStoryImages = storyImages.map(img => img || "");
        const finalResult = {
          ...res,
          quiz: res.quiz.map((q: any) => ({ ...q, audioBase64: "" })),
          titleAudioBase64: "",
          storyAudioBase64: new Array(res.storySlides.length).fill(""),
          storyImagesBase64: validStoryImages,
          loCode: loContext?.code,
          loSubSkill: loContext?.subSkill,
          loOutcome: loContext?.outcome,
          loActivity: loContext?.activity,
          loGrade: grade,
          loDomain: domain,
          theme: {
            fontFamily: "'Poppins', sans-serif",
            textColor: "#386AF6",
            fontSize: "2rem"
          }
        };
        setResult(finalResult);
        setCurrentScreen(0);
      }    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate lesson. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateResult = (field: keyof LessonResult, value: any) => {
    if (!result) return;
    setResult({ ...result, [field]: value });
  };

  const updateQuiz = (qIdx: number, field: keyof QuizQuestion, value: any) => {
    if (!result) return;
    const newQuiz = [...result.quiz];
    newQuiz[qIdx] = { ...newQuiz[qIdx], [field]: value };
    setResult({ ...result, quiz: newQuiz });
  };

  const regenerateTitleAudio = async (newTitle: string) => {
    if (!result || isNarrationQuotaExhausted()) return;
    setIsAudioGenerating(true);
    try {
      const audio = await generateNarration(newTitle);
      if (audio) {
        setResult({ ...result, title: newTitle, titleAudioBase64: audio });
      }
    } finally {
      setIsAudioGenerating(false);
    }
  };

  const regenerateSlideAudio = async (slideIdx: number, newText: string) => {
    if (!result) return;
    
    // Always update text first, even if audio generation fails or is skipped
    const newSlides = [...result.storySlides];
    newSlides[slideIdx] = newText;
    setResult(prev => prev ? { ...prev, storySlides: newSlides } : null);

    if (isNarrationQuotaExhausted()) return;

    setIsAudioGenerating(true);
    try {
      const audio = await generateNarration(newText);
      if (audio) {
        const newAudios = [...(result.storyAudioBase64 || [])];
        newAudios[slideIdx] = audio;
        setResult(prev => prev ? { ...prev, storyAudioBase64: newAudios } : null);
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        setNarrationWarning(true);
      }
    } finally {
      setIsAudioGenerating(false);
    }
  };

  const highlightSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    const span = document.createElement('span');
    span.className = "text-saffron font-bold";
    span.textContent = selectedText;
    
    range.deleteContents();
    range.insertNode(span);
    
    // Trigger update of the slide
    const contentEditable = range.commonAncestorContainer.parentElement?.closest('[contenteditable]');
    if (contentEditable) {
      const newText = contentEditable.innerHTML;
      const newSlides = [...(result?.storySlides || [])];
      newSlides[currentStorySlide] = newText;
      updateResult('storySlides', newSlides);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, slideIdx: number) => {
    const file = e.target.files?.[0];
    if (!file || !result) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newImages = [...(result.storyImagesBase64 || [])];
      newImages[slideIdx] = base64;
      setResult({ ...result, storyImagesBase64: newImages });
      showFeedback("Image replaced successfully!", "success");
    };
    reader.readAsDataURL(file);
  };

  const refineImageWithAI = async (slideIdx: number) => {
    if (!result) return;
    const currentPrompt = result.imagePrompts[slideIdx];
    const newPrompt = prompt("Describe the changes you want for this image:", currentPrompt);
    
    if (newPrompt && newPrompt !== currentPrompt) {
      setIsSlideUpdating(slideIdx);
      try {
        const newImage = await generateTopicImage(newPrompt);
        if (newImage) {
          const newImages = [...(result.storyImagesBase64 || [])];
          newImages[slideIdx] = newImage;
          const newPrompts = [...result.imagePrompts];
          newPrompts[slideIdx] = newPrompt;
          setResult({ ...result, storyImagesBase64: newImages, imagePrompts: newPrompts });
        }
      } finally {
        setIsSlideUpdating(null);
      }
    }
  };

  const regenerateQuizAudio = async (qIdx: number, newText: string) => {
    if (!result || isNarrationQuotaExhausted()) return;
    setIsAudioGenerating(true);
    try {
      const audio = await generateNarration(newText);
      if (audio) {
        const newQuiz = [...result.quiz];
        newQuiz[qIdx] = { ...newQuiz[qIdx], question: newText, audioBase64: audio };
        setResult({ ...result, quiz: newQuiz });
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        setNarrationWarning(true);
      }
    } finally {
      setIsAudioGenerating(false);
    }
  };

  const regenerateAllMissingAudio = async () => {
    if (!result || isNarrationQuotaExhausted()) return;
    setIsAudioGenerating(true);
    try {
      const newStoryAudios = [...(result.storyAudioBase64 || [])];
      for (let i = 0; i < result.storySlides.length; i++) {
        if (!newStoryAudios[i]) {
          if (isNarrationQuotaExhausted()) break;
          const audio = await generateNarration(result.storySlides[i]);
          if (audio) {
            newStoryAudios[i] = audio;
            setResult(prev => prev ? { ...prev, storyAudioBase64: [...newStoryAudios] } : null);
          }
          await new Promise(resolve => setTimeout(resolve, 6500));
        }
      }

      const newQuiz = [...result.quiz];
      for (let i = 0; i < newQuiz.length; i++) {
        if (!newQuiz[i].audioBase64) {
          if (isNarrationQuotaExhausted()) break;
          const audio = await generateNarration(newQuiz[i].question);
          if (audio) {
            newQuiz[i] = { ...newQuiz[i], audioBase64: audio };
            setResult(prev => prev ? { ...prev, quiz: [...newQuiz] } : null);
          }
          await new Promise(resolve => setTimeout(resolve, 6500));
        }
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        setNarrationWarning(true);
      }
    } finally {
      setIsAudioGenerating(false);
    }
  };

  const backgroundGenerateAudio = async (currentResult: LessonResult) => {
    if (isNarrationQuotaExhausted()) return;
    
    try {
      // Generate story audios
      const storyAudios = [...(currentResult.storyAudioBase64 || [])];
      for (let i = 1; i < currentResult.storySlides.length; i++) {
        if (!storyAudios[i]) {
          if (isNarrationQuotaExhausted()) break;
          await new Promise(resolve => setTimeout(resolve, 6500));
          const audio = await generateNarration(currentResult.storySlides[i]);
          if (audio) {
            storyAudios[i] = audio;
            setResult(prev => prev ? { ...prev, storyAudioBase64: [...storyAudios] } : null);
          }
        }
      }

      // Generate quiz audios
      const newQuiz = [...currentResult.quiz];
      for (let i = 0; i < newQuiz.length; i++) {
        if (!newQuiz[i].audioBase64) {
          if (isNarrationQuotaExhausted()) break;
          await new Promise(resolve => setTimeout(resolve, 6500));
          const audio = await generateNarration(newQuiz[i].question);
          if (audio) {
            newQuiz[i].audioBase64 = audio;
            setResult(prev => prev ? { ...prev, quiz: [...newQuiz] } : null);
          }
        }
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        setNarrationWarning(true);
      }
    }
  };

  const regenerateSlideImage = async (slideIdx: number) => {
    if (!result) return;
    setIsSlideUpdating(slideIdx);
    try {
      const prompt = result.imagePrompts[slideIdx];
      const newImage = await generateTopicImage(prompt);
      if (newImage) {
        const newImages = [...(result.storyImagesBase64 || [])];
        newImages[slideIdx] = newImage;
        setResult({ ...result, storyImagesBase64: newImages });
      }
    } finally {
      setIsSlideUpdating(null);
    }
  };

  const updateTheme = (updates: Partial<LessonResult['theme']>) => {
    if (!result || !result.theme) return;
    setResult({
      ...result,
      theme: { ...result.theme, ...updates }
    });
  };

  const handleQuizAnswer = (index: number) => {
    if (!result || selectedOption !== null) return;
    const currentQuestion = result.quiz[currentQuizIndex];
    setSelectedOption(index);
    
    if (index === currentQuestion.correctIndex) {
      setQuizScore(prev => prev + 1);
      setQuizAttempts(0);
      const successMsg = language === "Hindi" ? 'बहुत बढ़िया! सही उत्तर।' : 'Excellent! Correct answer.';
      setQuizFeedback({ type: 'success', message: successMsg });
      
      setTimeout(() => {
        setQuizFeedback(null);
        setSelectedOption(null);
        if (currentQuizIndex < result.quiz.length - 1) {
          setCurrentQuizIndex(prev => prev + 1);
        } else {
          setIsQuizComplete(true);
        }
      }, 1500);
    } else {
      const newAttempts = quizAttempts + 1;
      setQuizAttempts(newAttempts);
      
      if (newAttempts < 2) {
        const errorMsg = language === "Hindi" ? 'फिर से प्रयास करें।' : 'Try again.';
        setQuizFeedback({ type: 'error', message: errorMsg });
        setTimeout(() => {
          setQuizFeedback(null);
          setSelectedOption(null);
        }, 1500);
      } else {
        const errorMsg = language === "Hindi" ? 'गलत उत्तर। सही उत्तर चिह्नित है।' : 'Wrong answer. Correct one is marked.';
        setQuizFeedback({ type: 'error', message: errorMsg });
        
        setTimeout(() => {
          setQuizFeedback(null);
          setSelectedOption(null);
          setQuizAttempts(0);
          if (currentQuizIndex < result.quiz.length - 1) {
            setCurrentQuizIndex(prev => prev + 1);
          } else {
            setIsQuizComplete(true);
          }
        }, 2500);
      }
    }
  };

    const downloadHTML = () => {
    // Commit any in-flight edit (contentEditable elements) before snapshotting state
    (document.activeElement as HTMLElement | null)?.blur?.();
    // Wait one tick so React processes the onBlur-driven setResult calls, then snapshot fresh state
    setTimeout(() => {
    const result = resultRef.current;
    if (!result) return;

    const getStoryAudioDataUrls = async () => {
      const urls: string[] = [];
      if (!result.storyAudioBase64) return urls;
      for (let i = 0; i < result.storyAudioBase64.length; i++) {
        const blob = pcmToWav(result.storyAudioBase64[i]);
        const url = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result as string);
          r.readAsDataURL(blob);
        });
        urls.push(url);
      }
      return urls;
    };

    const getQuizAudioDataUrls = async () => {
      const urls: Record<number, string> = {};
      for (let i = 0; i < result.quiz.length; i++) {
        if (result.quiz[i].audioBase64) {
          const blob = pcmToWav(result.quiz[i].audioBase64!);
          urls[i] = await new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
        }
      }
      return urls;
    };

    const getStoryImagesDataUrls = async () => {
      const urls: string[] = [];
      if (result.storyImagesBase64) {
        for (let i = 0; i < result.storyImagesBase64.length; i++) {
          const url = result.storyImagesBase64[i];
          urls.push(url);
        }
      }
      return urls;
    };

    const getTitleAudioDataUrl = async () => {
      if (!result.titleAudioBase64) return "";
      const blob = pcmToWav(result.titleAudioBase64);
      return await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
    };

    const getMascotDataUrl = async () => {
      for (const path of ['/mascot.png', '/images/mascot.png']) {
        try {
          const resp = await fetch(path);
          if (!resp.ok) continue;
          const blob = await resp.blob();
          return await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
        } catch {}
      }
      return "";
    };

    Promise.all([getStoryAudioDataUrls(), getQuizAudioDataUrls(), getStoryImagesDataUrls(), getTitleAudioDataUrl(), getMascotDataUrl()]).then(([storyUrls, quizUrls, storyImageUrls, titleAudioUrl, mascotDataUrl]) => {
        const htmlContent = `
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              saffron: '#FCB717',
              indigo: '#386AF6',
              'indigo-light': '#EBF0FF',
            }
          }
        }
      }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root { --saffron: #FCB717; --indigo: #386AF6; }
        body { background: #F8F9FD; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; margin: 0; padding: 20px; box-sizing: border-box; user-select: none; cursor: default; }
        button { cursor: pointer; }
        .aspect-16-9 { width: 100%; max-width: 1200px; aspect-ratio: 16 / 9; background: white; border: 2px solid #E8E0D0; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .screen { display: none; flex: 1; animation: fadeIn 0.5s ease-out; overflow: hidden; }
        .screen.active { display: flex; flex-direction: column; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .story-text { 
           font-family: ${result.theme?.fontFamily || "'Poppins', sans-serif"}; 
           color: ${result.theme?.textColor || "#386AF6"};
           font-size: 2rem; line-height: 1.2; text-align: left; 
        }
        
        .quiz-option {
            width: 100%;
            padding: 24px;
            border-radius: 20px;
            background: white;
            border: 2px solid #E5E7EB;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            color: #1F2937;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 1.5rem;
            font-weight: 500;
            gap: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .quiz-option:hover { border-color: #386AF6; background: #F9FAFB; }
        .correct { border-color: #00B132 !important; background: #CCF8D8 !important; border-width: 2px !important; }
        .wrong { border-color: #C72A36 !important; background: #FED7DA !important; border-width: 2px !important; }
        
        .nav-btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: bold;
            transition: all 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
        }
        .nav-btn-primary { background: #FCB717; color: white; box-shadow: 0 4px 12px rgba(255,107,0,0.2); }
        .nav-btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="aspect-16-9">
        <div id="screen-intro" class="screen active">
            <div class="flex-1 flex flex-col items-center justify-center text-center px-12 pt-10 pb-12 space-y-6 bg-gradient-to-br from-[#386AF6] via-[#ED23F1] to-[#ED23F1] text-white">
                ${result.loCode ? `<div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-full px-3 py-1 mx-auto" style="backdrop-filter:blur(8px)"><span style="font-weight:900;font-size:11px;letter-spacing:.1em;color:#fff">${result.loCode}</span><span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6)"></span><span style="font-weight:700;font-size:11px;color:rgba(255,255,255,.9)">${result.loGrade || ''}</span>${result.loSubSkill ? `<span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6)"></span><span style="font-weight:700;font-size:11px;color:rgba(255,255,255,.9)">${result.loSubSkill}</span>` : ''}</div>` : ''}
                <h1 class="text-4xl md:text-5xl font-extrabold max-w-4xl drop-shadow-xl leading-tight break-words">${result.title}</h1>
                <p class="text-lg md:text-xl text-white/90 max-w-2xl font-medium">
                    ${language === "Hindi" ? "आज हम इस विषय के बारे में सीखेंगे।" : "Today we will learn about this topic."}
                </p>
                <button id="intro-start-btn" class="px-10 py-3 bg-saffron text-white rounded-[40px] font-black text-xl md:text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3" onclick="handleIntroClick()">
                   <span id="intro-btn-text">${language === "Hindi" ? "आगे बढ़ें" : "Continue"}</span>
                   <span id="intro-btn-icon">➡️</span>
                </button>
            </div>
        </div>

        <div id="screen-story" class="screen">
            <div class="flex-1 flex flex-col p-6 relative px-24 justify-center min-h-[80vh]">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 items-center max-w-6xl mx-auto w-full">
                    <div class="flex flex-col justify-center">
                        <div class="story-text" id="story-content">${result.storySlides[0]}</div>
                        <div id="activity-instruction" style="margin-top:18px;font-weight:800;color:#2E3192;font-size:1.5rem;line-height:1.3"></div>
                    </div>
                    <div class="flex flex-col justify-center h-full">
                        <div id="slide-activity" class="aspect-video relative rounded-[32px] border-4 border-[#E8E0D0] shadow-sm bg-white" style="display:none;overflow:hidden"></div>
                        <div id="slide-image-wrap" class="aspect-video relative overflow-hidden rounded-[32px] border-4 border-[#E8E0D0] shadow-sm">
                            <img id="slide-image" src="${storyImageUrls[0] || ''}" class="w-full h-full object-contain bg-white" />
                        </div>
                    </div>
                </div>
                
                <button id="prev-btn" class="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="prevSlide()" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button id="next-btn" class="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="nextSlide()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
        </div>

        <div id="screen-quiz" class="screen">
            <div class="flex-1 flex flex-col relative px-24 pt-20 pb-8 justify-start min-h-[80vh]">
                <div id="quiz-container" class="flex flex-col justify-start max-w-4xl mx-auto w-full">
                    ${result.quiz.map((q, qIdx) => `
                        <div class="quiz-question-block flex flex-col" style="${qIdx === 0 ? '' : 'display: none;'}">
                            <div class="mb-2">
                                <h2 class="text-2xl font-black text-black">${language === "Hindi" ? "देखें कि आप क्या जानते हैं!" : "Let's See What You Know !"}</h2>
                            </div>
                            <div class="min-h-[60px] flex items-start justify-start mb-4">
                                <h4 class="text-3xl font-bold text-black leading-tight text-left w-full">${q.question}</h4>
                            </div>
                            <div class="flex flex-col space-y-4">
                                ${q.options.map((opt, oIdx) => {
                                    return `
                                        <button class="quiz-option" onclick="checkAnswer(this, ${qIdx}, ${oIdx}, ${q.correctIndex})">
                                            <span>${opt}</span>
                                            <div class="status-icon w-8 h-8 rounded-full flex items-center justify-center shrink-0"></div>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div id="quiz-complete" style="display: none;" class="flex-1 flex-col items-center justify-center text-center p-8 space-y-6 bg-[#0D1B4D] text-white relative overflow-hidden rounded-[40px] border-[8px] border-[#386AF6]">
                    <div class="relative z-10 w-full max-w-lg px-4">
                        <h3 id="complete-title" class="text-4xl font-black mb-6 drop-shadow-lg tracking-tight"></h3>
                        
                        <div id="stars-container" class="flex justify-center gap-4 mb-8"></div>

                        <div class="bg-[#1E2E6E] rounded-[24px] px-10 py-6 mb-10 inline-block shadow-inner min-w-[240px]">
                            <div id="accuracy-value" class="text-5xl font-black mb-1">0%</div>
                            <div class="text-lg font-bold opacity-70 uppercase tracking-[0.2em]">${language === "Hindi" ? "सटीकता" : "ACCURACY"}</div>
                        </div>

                        <button class="px-12 py-4 bg-saffron text-white rounded-[40px] font-black text-2xl shadow-[0_10px_40px_rgba(252,183,23,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto" onclick="resetQuiz()">
                            ${language === "Hindi" ? "फिर से खेलें" : "Play Again"}
                        </button>
                    </div>
                </div>

                <button id="quiz-prev-btn" class="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="prevQuiz()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            </div>
        </div>
    </div>

    <div id="feedback-toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white font-bold shadow-2xl transition-all opacity-0 pointer-events-none z-[100]"></div>

    <script>
        let currentScreenId = 'intro';
        let currentSlideIdx = 0;
        let currentQuizIdx = 0;
        let quizAttempts = 0;
        let quizScore = 0;
        let currentAudio = null;
        let introAudioPlayed = false;
        
        const storySlides = ${JSON.stringify(result.storySlides)};
        const slideInteractions = ${JSON.stringify(result.slideInteractions || [])};
        const storyAudioUrls = ${JSON.stringify(storyUrls)};
        const storyImageUrls = ${JSON.stringify(storyImageUrls)};
        const quizAudioUrls = ${JSON.stringify(quizUrls)};
        const titleAudioUrl = "${titleAudioUrl}";

        function showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-' + id).classList.add('active');
            currentScreenId = id;
            stopAudio();
            if (id === 'intro') {
                if (introAudioPlayed) playAudio(titleAudioUrl);
            }
            else if (id === 'story') playStoryAudio(currentSlideIdx);
            else if (id === 'quiz') playQuizAudio(currentQuizIdx);
        }

        function handleIntroClick() {
            showScreen('story');
        }

        function nextSlide() {
            if (currentSlideIdx < storySlides.length - 1) {
                currentSlideIdx++;
                updateSlide();
            } else {
                showScreen('quiz');
            }
        }

        function prevSlide() {
            if (currentSlideIdx > 0) {
                currentSlideIdx--;
                updateSlide();
            } else {
                showScreen('intro');
            }
        }

        function updateSlide() {
            document.getElementById('story-content').innerHTML = storySlides[currentSlideIdx];
            document.getElementById('slide-image').src = storyImageUrls[currentSlideIdx] || '';
            document.getElementById('prev-btn').style.display = 'block';
            playStoryAudio(currentSlideIdx);
        }

        function prevQuiz() {
            if (currentQuizIdx > 0) {
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'none';
                currentQuizIdx--;
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'flex';
                playQuizAudio(currentQuizIdx);
            } else {
                showScreen('story');
            }
        }

        function nextQuiz() {
            quizAttempts = 0;
            if (currentQuizIdx < ${result.quiz.length} - 1) {
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'none';
                currentQuizIdx++;
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'flex';
                playQuizAudio(currentQuizIdx);
            } else {
                const totalQuestionsCount = ${result.quiz.length};
                const accuracyValue = Math.round((quizScore / totalQuestionsCount) * 100);
                const finalStarsCount = accuracyValue >= 80 ? 3 : accuracyValue >= 50 ? 2 : 1;
                
                document.getElementById('complete-title').innerText = "${result.title} ${language === "Hindi" ? "प्रो !" : "Pro !"}";
                document.getElementById('accuracy-value').innerText = accuracyValue + '%';
                
                let finalStarsHtml = '';
                for(let i=1; i<=3; i++) {
                    const isStarActive = i <= finalStarsCount;
                    finalStarsHtml += '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="' + (isStarActive ? '#FF9F0A' : 'none') + '" stroke="' + (isStarActive ? '#FF9F0A' : 'rgba(255,255,255,0.1)') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                }
                document.getElementById('stars-container').innerHTML = finalStarsHtml;

                document.getElementById('quiz-container').style.display = 'none';
                document.getElementById('quiz-complete').style.display = 'flex';
                document.getElementById('quiz-prev-btn').style.display = 'none';
            }
        }

        function playAudio(url) {
            stopAudio();
            if (url) {
                currentAudio = new Audio(url);
                currentAudio.play().catch(e => console.log(e));
            }
        }

        function playStoryAudio(idx) {
            playAudio(storyAudioUrls[idx]);
        }

        function playQuizAudio(idx) {
            playAudio(quizAudioUrls[idx]);
        }

        function stopAudio() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
        }

        function checkAnswer(btn, qIdx, oIdx, correctIdx) {
            const options = btn.parentElement.querySelectorAll('.quiz-option');
            options.forEach(opt => opt.style.pointerEvents = 'none');
            
            const icon = btn.querySelector('.status-icon');
            if (oIdx === correctIdx) {
                quizScore++;
                btn.classList.add('correct');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                icon.classList.add('bg-green-500');
                setTimeout(nextQuiz, 1500);
            } else {
                quizAttempts++;
                if (quizAttempts < 2) {
                    btn.classList.add('wrong');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                    icon.classList.add('bg-red-500');
                    
                    setTimeout(() => {
                        btn.classList.remove('wrong');
                        icon.innerHTML = '';
                        icon.classList.remove('bg-red-500');
                        options.forEach(opt => opt.style.pointerEvents = 'auto');
                    }, 1500);
                } else {
                    btn.classList.add('wrong');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                    icon.classList.add('bg-red-500');
                    
                    // Show correct answer too
                    options[correctIdx].classList.add('correct');
                    const correctIcon = options[correctIdx].querySelector('.status-icon');
                    if (correctIcon) {
                        correctIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        correctIcon.classList.add('bg-green-500');
                    }
                    
                    setTimeout(nextQuiz, 2000);
                }
            }
        }

        function resetQuiz() {
            currentQuizIdx = 0;
            currentSlideIdx = 0;
            quizAttempts = 0;
            quizScore = 0;
            document.getElementById('quiz-container').style.display = 'block';
            document.getElementById('quiz-complete').style.display = 'none';
            document.getElementById('quiz-prev-btn').style.display = 'block';
            document.querySelectorAll('.quiz-question-block').forEach((b, i) => {
                b.style.display = i === 0 ? 'flex' : 'none';
                b.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('correct', 'wrong');
                    opt.style.pointerEvents = 'auto';
                    const icon = opt.querySelector('.status-icon');
                    if (icon) {
                        icon.innerHTML = '';
                        icon.classList.remove('bg-green-500', 'bg-red-500');
                    }
                });
            });
            updateSlide();
            showScreen('intro');
        }

        // Inject mascot on intro screen (animated, tap to greet)
        (function injectMascot(){
            var mascotSrc = ${JSON.stringify(mascotDataUrl)};
            if (!mascotSrc) return;
            var styleEl = document.createElement('style');
            styleEl.textContent = '@keyframes mascot-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes mascot-tilt{0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}#intro-mascot{transition:transform .2s}#intro-mascot:active{transform:scale(.92) rotate(-8deg)!important}';
            document.head.appendChild(styleEl);
            var img = document.createElement('img');
            img.id = 'intro-mascot';
            img.src = mascotSrc;
            img.alt = 'Learning buddy';
            img.draggable = false;
            img.style.cssText = 'width:180px;height:180px;margin:0 auto;cursor:pointer;user-select:none;filter:drop-shadow(0 12px 30px rgba(0,0,0,0.35));animation:mascot-bob 2.4s ease-in-out infinite, mascot-tilt 4.2s ease-in-out infinite;display:block';
            img.onclick = function(){ if (typeof titleAudioUrl !== 'undefined' && titleAudioUrl) playAudio(titleAudioUrl); };
            var intro = document.querySelector('#screen-intro > div');
            if (intro) intro.insertBefore(img, intro.firstChild);
        })();

        // Inject progress strip (slide indicator across intro · story · quiz)
        (function injectProgress(){
            var slidesCount = (typeof storySlides !== 'undefined' && storySlides) ? storySlides.length : 0;
            var quizCount = ${result.quiz.length};
            var totalSteps = slidesCount + quizCount;
            if (totalSteps < 1) return;
            var s = document.createElement('style');
            s.textContent = '#fln-progress{position:absolute;top:16px;left:16px;z-index:100;display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;width:fit-content;max-width:calc(100% - 32px);background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border:1px solid #E8E0D0;padding:8px 14px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.08);font-family:system-ui,sans-serif}#fln-progress.hidden{display:none}#fln-progress .p{height:6px;width:6px;background:#D1D5DB;border-radius:999px;transition:all .3s ease;flex-shrink:0}#fln-progress .p.on{background:#FF9933;width:14px}#fln-progress .c{font-size:11px;font-weight:900;color:#6B7280;letter-spacing:.05em;margin-left:8px;flex-shrink:0}';
            document.head.appendChild(s);
            var strip = document.createElement('div');
            strip.id = 'fln-progress';
            for (var i = 0; i < totalSteps; i++) { var pl = document.createElement('span'); pl.className = 'p'; strip.appendChild(pl); }
            var cnt = document.createElement('span'); cnt.className = 'c'; strip.appendChild(cnt);
            var host = document.querySelector('.aspect-16-9') || document.body;
            host.appendChild(strip);
            function update(){
                if (currentScreenId === 'intro') {
                    strip.classList.add('hidden');
                    return;
                }
                strip.classList.remove('hidden');
                var cur = (currentScreenId === 'story') ? currentSlideIdx : slidesCount + currentQuizIdx;
                var pills = strip.querySelectorAll('.p');
                for (var i = 0; i < pills.length; i++) {
                    if (i <= cur) pills[i].classList.add('on'); else pills[i].classList.remove('on');
                }
                cnt.textContent = Math.min(cur+1, totalSteps) + ' / ' + totalSteps;
            }
            update();
            setInterval(update, 250);
        })();

        // ===== Inject interactive activity widgets (tap-count · drag-bucket · tap-find) =====
        (function injectActivities(){
            var st = document.createElement('style');
            st.textContent = ''
              + '@keyframes flnPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}'
              + '@keyframes flnSparkle{0%{transform:scale(0);opacity:1}50%{transform:scale(1.3);opacity:1}100%{transform:scale(.5);opacity:0;top:-20%}}'
              + '@keyframes flnWiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'
              + '@keyframes flnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
              + '.fln-tap-item{transition:transform .2s,opacity .2s;animation:flnBob 2s ease-in-out infinite}'
              + '.fln-tap-item:hover{transform:scale(1.15)!important;animation:none}'
              + '.fln-card{transition:all .15s ease}'
              + '.fln-card:hover{border-color:#FF9933!important;transform:translateY(-3px)}'
              + '.fln-drag-item{transition:transform .2s,box-shadow .2s}'
              + '.fln-drag-item:hover{transform:scale(1.1)}'
              + '#slide-activity{display:flex;align-items:center;justify-content:center}';
            document.head.appendChild(st);

            function pill(target){
                var p=document.createElement('div');
                p.style.cssText='position:absolute;top:12px;right:12px;background:#FFF3E0;border:2px solid #FF9933;color:#1c1f2e;font-weight:900;font-size:1.1rem;padding:5px 14px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.08);z-index:10';
                p.textContent='0 / '+target;
                p.upd=function(n){p.textContent=n+' / '+target};
                return p;
            }

            function celebrate(host, msg){
                var ov=document.createElement('div');
                ov.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(16,185,129,.15);backdrop-filter:blur(2px);font-size:1.5rem;font-weight:900;color:#065f46;text-align:center;padding:24px;z-index:50;animation:flnPop .4s ease-out forwards';
                ov.textContent='🎉 '+(msg||'Great!');
                host.appendChild(ov);
                for(var i=0;i<10;i++){
                    var s=document.createElement('div');
                    s.textContent=['⭐','✨','🌟','💫'][i%4];
                    s.style.cssText='position:absolute;font-size:2rem;pointer-events:none;left:'+(Math.random()*80+10)+'%;top:'+(Math.random()*80+10)+'%;animation:flnSparkle 1s ease-out forwards;z-index:51';
                    host.appendChild(s);
                }
                // Speak success line if we have audio infra
                if(typeof generateNarration==='undefined'){
                    // Try the page's playAudio with current title audio as a fallback — no-op if not available
                }
            }

            function renderTapCount(host, spec){
                host.innerHTML='';
                var p=pill(spec.targetCount);
                host.appendChild(p);
                var grid=document.createElement('div');
                grid.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;width:100%;height:100%;padding:48px 24px 24px;box-sizing:border-box';
                var tapped=0;
                var n=Math.max(1,Math.min(10,spec.targetCount||1));
                for(var i=0;i<n;i++){
                    (function(){
                        var b=document.createElement('button');
                        b.className='fln-tap-item';
                        b.textContent=spec.emoji||'🟠';
                        b.style.cssText='font-size:3.8rem;background:none;border:none;cursor:pointer;padding:6px;line-height:1;animation-delay:'+(i*0.15)+'s';
                        b.setAttribute('aria-label','Tap to count');
                        b.onclick=function(){
                            if(b.dataset.t==='1')return;
                            b.dataset.t='1';
                            b.style.opacity='.35';
                            b.style.transform='scale(1.4)';
                            b.style.animation='none';
                            setTimeout(function(){b.style.transform='scale(1)'},220);
                            tapped++;
                            p.upd(tapped);
                            if(tapped===n) setTimeout(function(){celebrate(host,spec.successSay)},320);
                        };
                        grid.appendChild(b);
                    })();
                }
                host.appendChild(grid);
            }

            function renderDragBucket(host, spec){
                host.innerHTML='';
                var p=pill(spec.targetCount);
                host.appendChild(p);
                var items=document.createElement('div');
                items.style.cssText='position:absolute;top:54px;left:0;right:0;height:42%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:8px;box-sizing:border-box';
                host.appendChild(items);
                var bkt=document.createElement('div');
                bkt.style.cssText='position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:#FFF3E0;border:4px dashed #FF9933;border-radius:24px;padding:14px 24px;min-width:160px;min-height:96px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;font-size:3.5rem;line-height:1;transition:all .2s';
                bkt.textContent=spec.bucketEmoji||'🧺';
                var bktLabel=document.createElement('div');
                bktLabel.style.cssText='position:absolute;left:50%;bottom:6px;transform:translateX(-50%);font-weight:800;color:#2E3192;font-size:.85rem;text-align:center;white-space:nowrap';
                bktLabel.textContent=spec.bucketLabel||'';
                host.appendChild(bkt);
                host.appendChild(bktLabel);
                var dropped=0, contents=0;
                var n=Math.max(1,Math.min(10,spec.targetCount||1));
                function placeInBkt(){
                    if(contents===0) bkt.textContent='';
                    contents++;
                    var s=document.createElement('span');
                    s.textContent=spec.emoji||'🥭';
                    s.style.cssText='font-size:2.2rem;animation:flnPop .35s ease-out';
                    bkt.appendChild(s);
                }
                for(var i=0;i<n;i++){
                    (function(){
                        var el=document.createElement('div');
                        el.className='fln-drag-item';
                        el.textContent=spec.emoji||'🥭';
                        el.style.cssText='font-size:3rem;cursor:grab;user-select:none;touch-action:none;line-height:1;padding:4px';
                        el.dataset.d='0';
                        var sx=0,sy=0,active=false;
                        el.addEventListener('pointerdown',function(e){
                            if(el.dataset.d==='1')return;
                            el.setPointerCapture(e.pointerId);
                            active=true;
                            sx=e.clientX;sy=e.clientY;
                            el.style.cursor='grabbing';
                            el.style.zIndex='100';
                        });
                        el.addEventListener('pointermove',function(e){
                            if(!active||el.dataset.d==='1')return;
                            el.style.transform='translate('+(e.clientX-sx)+'px,'+(e.clientY-sy)+'px) scale(1.15)';
                        });
                        function endDrag(e){
                            if(!active||el.dataset.d==='1')return;
                            active=false;
                            try{el.releasePointerCapture(e.pointerId)}catch(_){}
                            var b=bkt.getBoundingClientRect();
                            if(e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom){
                                el.dataset.d='1';
                                el.style.display='none';
                                dropped++;
                                p.upd(dropped);
                                placeInBkt();
                                if(dropped===n) setTimeout(function(){celebrate(host,spec.successSay)},380);
                            } else {
                                el.style.transform='';
                                el.style.cursor='grab';
                                el.style.zIndex='';
                            }
                        }
                        el.addEventListener('pointerup',endDrag);
                        el.addEventListener('pointercancel',endDrag);
                        items.appendChild(el);
                    })();
                }
            }

            function renderTapFind(host, spec){
                host.innerHTML='';
                var opts=spec.options||[];
                var n=opts.length;
                var cols=n<=2?2:n===3?3:2;
                var grid=document.createElement('div');
                grid.style.cssText='display:grid;grid-template-columns:repeat('+cols+',1fr);gap:14px;width:100%;height:100%;padding:18px;box-sizing:border-box';
                opts.forEach(function(opt,idx){
                    var c=document.createElement('button');
                    c.className='fln-card';
                    c.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#fff;border:3px solid #E8E0D0;border-radius:20px;padding:14px;cursor:pointer;font-family:inherit;min-height:100%';
                    var em=document.createElement('div');
                    em.textContent=opt.emoji||'';
                    em.style.cssText='font-size:2.6rem;line-height:1.1;font-weight:900';
                    var lb=document.createElement('div');
                    lb.textContent=opt.label||'';
                    lb.style.cssText='font-size:.9rem;font-weight:800;color:#1c1f2e;text-align:center';
                    c.appendChild(em);c.appendChild(lb);
                    c.onclick=function(){
                        if(c.dataset.l)return;
                        if(idx===spec.correctIndex){
                            c.dataset.l='1';
                            c.style.borderColor='#10b981';
                            c.style.background='#ecfdf5';
                            c.style.transform='scale(1.06)';
                            setTimeout(function(){celebrate(host,spec.successSay)},250);
                        } else {
                            c.style.animation='flnWiggle .35s ease-in-out';
                            setTimeout(function(){c.style.animation=''},370);
                        }
                    };
                    grid.appendChild(c);
                });
                host.appendChild(grid);
            }

            window.flnRenderActivity=function(idx){
                var spec=(typeof slideInteractions!=='undefined' && slideInteractions && slideInteractions[idx])||null;
                var host=document.getElementById('slide-activity');
                var imgWrap=document.getElementById('slide-image-wrap');
                var instr=document.getElementById('activity-instruction');
                if(!host)return;
                if(!spec||!spec.kind){
                    host.style.display='none';
                    if(imgWrap)imgWrap.style.display='';
                    if(instr)instr.textContent='';
                    return;
                }
                if(imgWrap)imgWrap.style.display='none';
                host.style.display='flex';
                if(instr)instr.textContent=spec.instruction||'';
                if(spec.kind==='tap-count')renderTapCount(host,spec);
                else if(spec.kind==='drag-bucket')renderDragBucket(host,spec);
                else if(spec.kind==='tap-find')renderTapFind(host,spec);
                else { host.style.display='none'; if(imgWrap)imgWrap.style.display=''; }
            };

            // Poll for slide changes (lighter than monkey-patching updateSlide)
            var lastIdx=-1, lastScreen='';
            setInterval(function(){
                if(typeof currentScreenId==='undefined')return;
                if(currentScreenId!=='story'){
                    if(lastScreen!==currentScreenId){
                        lastScreen=currentScreenId;
                        lastIdx=-1;
                    }
                    return;
                }
                if(typeof currentSlideIdx==='undefined')return;
                if(currentSlideIdx===lastIdx&&lastScreen===currentScreenId)return;
                lastIdx=currentSlideIdx;
                lastScreen=currentScreenId;
                window.flnRenderActivity(currentSlideIdx);
            },180);
        })();

        // Initialize the app accurately
        setTimeout(() => {
            showScreen('intro');
        }, 500);

        // Fallback to start audio on first interaction if blocked
        document.body.addEventListener('click', () => {
            if (!currentAudio && currentScreenId === 'intro') {
                playAudio(titleAudioUrl);
            }
        }, { once: true });
    </script>
</body>
</html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${result.title.replace(/\s+/g, '_')}_Lesson.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
    }, 150);
  };

  const downloadZip = async () => {
    // Commit any in-flight edit (contentEditable elements) before snapshotting state
    (document.activeElement as HTMLElement | null)?.blur?.();
    // Wait one tick so React processes the onBlur-driven setResult calls, then snapshot fresh state
    await new Promise<void>((r) => setTimeout(r, 150));
    const result = resultRef.current;
    if (!result) return;

    const zip = new JSZip();
    
    // 1. Create the HTML content (similar to downloadHTML but with relative paths)
    const htmlContent = `
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              saffron: '#FCB717',
              indigo: '#386AF6',
              'indigo-light': '#EBF0FF',
            }
          }
        }
      }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Inter:wght@400;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root { --saffron: #FCB717; --indigo: #386AF6; }
        body { background: #F8F9FD; font-family: 'Poppins', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; margin: 0; padding: 20px; box-sizing: border-box; user-select: none; cursor: default; }
        button { cursor: pointer; }
        .hindi-font { font-family: 'Noto Serif Devanagari', serif; }
        .aspect-16-9 { width: 100%; max-width: 1200px; aspect-ratio: 16 / 9; background: white; border: 2px solid #E8E0D0; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .screen { display: none; flex: 1; animation: fadeIn 0.5s ease-out; overflow: hidden; }
        .screen.active { display: flex; flex-direction: column; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .story-text { font-size: 2rem; line-height: 1.2; text-align: left; }
        
        .quiz-option {
            width: 100%;
            padding: 24px;
            border-radius: 20px;
            background: white;
            border: 2px solid #E5E7EB;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            color: #1F2937;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 1.5rem;
            font-weight: 500;
            gap: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .quiz-option:hover { border-color: #386AF6; background: #F9FAFB; }
        .correct { border-color: #00B132 !important; background: #CCF8D8 !important; border-width: 2px !important; }
        .wrong { border-color: #C72A36 !important; background: #FED7DA !important; border-width: 2px !important; }
        
        .nav-btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: bold;
            transition: all 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
        }
        .nav-btn-primary { background: var(--saffron); color: white; box-shadow: 0 4px 12px rgba(255,107,0,0.2); }
        .nav-btn-secondary { background: #F0F0F0; color: var(--indigo); border: 1px solid #E0E0E0; }
        .nav-btn:hover { transform: translateY(-2px); }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        @media (max-width: 1024px) {
            .aspect-16-9 { aspect-ratio: auto; min-height: 100vh; padding: 20px; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="aspect-16-9">
        <div id="screen-intro" class="screen active">
            <div class="flex-1 flex flex-col items-center justify-center text-center px-12 pt-10 pb-12 space-y-6 bg-gradient-to-br from-[#386AF6] via-[#ED23F1] to-[#ED23F1] text-white">
                ${result.loCode ? `<div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-full px-3 py-1 mx-auto" style="backdrop-filter:blur(8px)"><span style="font-weight:900;font-size:11px;letter-spacing:.1em;color:#fff">${result.loCode}</span><span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6)"></span><span style="font-weight:700;font-size:11px;color:rgba(255,255,255,.9)">${result.loGrade || ''}</span>${result.loSubSkill ? `<span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6)"></span><span style="font-weight:700;font-size:11px;color:rgba(255,255,255,.9)">${result.loSubSkill}</span>` : ''}</div>` : ''}
                <h1 class="text-4xl md:text-5xl font-extrabold max-w-4xl drop-shadow-xl leading-tight break-words">${result.title}</h1>
                <p class="text-lg md:text-xl text-white/90 max-w-2xl font-medium">
                    ${language === "Hindi" ? "आज हम इस विषय के बारे में सीखेंगे।" : "Today we will learn about this topic."}
                </p>
                <button id="intro-start-btn" class="px-10 py-3 bg-saffron text-white rounded-[40px] font-black text-xl md:text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3" onclick="handleIntroClick()">
                   <span id="intro-btn-text">${language === "Hindi" ? "आगे बढ़ें" : "Continue"}</span>
                   <span id="intro-btn-icon">➡️</span>
                </button>
            </div>
        </div>

        <div id="screen-story" class="screen">
            <div class="flex-1 flex flex-col p-6 relative px-24 justify-center min-h-[80vh]">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 items-center max-w-6xl mx-auto w-full">
                    <div class="flex flex-col justify-center">
                        <div class="story-text" id="story-content">${result.storySlides[0]}</div>
                        <div id="activity-instruction" style="margin-top:18px;font-weight:800;color:#2E3192;font-size:1.5rem;line-height:1.3"></div>
                    </div>
                    <div class="flex flex-col justify-center h-full">
                        <div id="slide-activity" class="rounded-[32px] border-4 border-[#E8E0D0] shadow-sm bg-white" style="display:none;aspect-ratio:16/9;overflow:hidden;position:relative;width:100%"></div>
                        <div id="slide-image-wrap" style="position:relative;width:100%">
                            <img id="slide-image" src="images/slide_image_0.png" class="w-full h-full max-h-[550px] rounded-[32px] border-4 border-[#E8E0D0] shadow-sm object-contain bg-white" />
                        </div>
                    </div>
                </div>
                
                <button id="prev-btn" class="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="prevSlide()" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button id="next-btn" class="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="nextSlide()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
        </div>

        <div id="screen-quiz" class="screen">
            <div class="flex-1 flex flex-col relative px-24 pt-20 pb-8 justify-start min-h-[80vh]">
                <div id="quiz-container" class="flex flex-col justify-start max-w-4xl mx-auto w-full">
                    ${result.quiz.map((q, qIdx) => `
                        <div class="quiz-question-block flex flex-col" style="${qIdx === 0 ? '' : 'display: none;'}">
                            <div class="mb-2">
                                <h2 class="text-2xl font-black text-black">${language === "Hindi" ? "देखें कि आप क्या जानते हैं!" : "Let's See What You Know !"}</h2>
                            </div>
                            <div class="min-h-[60px] flex items-start justify-start mb-4">
                                <h4 class="text-3xl font-bold text-black leading-tight text-left w-full">${q.question}</h4>
                            </div>
                            <div class="flex flex-col space-y-4">
                                ${q.options.map((opt, oIdx) => {
                                    return `
                                        <button class="quiz-option" onclick="checkAnswer(this, ${qIdx}, ${oIdx}, ${q.correctIndex})">
                                            <span>${opt}</span>
                                            <div class="status-icon w-8 h-8 rounded-full flex items-center justify-center shrink-0"></div>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div id="quiz-complete" style="display: none;" class="flex-1 flex-col items-center justify-center text-center p-8 space-y-6 bg-[#0D1B4D] text-white relative overflow-hidden rounded-[40px] border-[8px] border-[#386AF6]">
                    <div class="relative z-10 w-full max-w-lg px-4">
                        <h3 id="complete-title" class="text-4xl font-black mb-6 drop-shadow-lg tracking-tight"></h3>
                        
                        <div id="stars-container" class="flex justify-center gap-4 mb-8"></div>

                        <div class="bg-[#1E2E6E] rounded-[24px] px-10 py-6 mb-10 inline-block shadow-inner min-w-[240px]">
                            <div id="accuracy-value" class="text-5xl font-black mb-1">0%</div>
                            <div class="text-lg font-bold opacity-70 uppercase tracking-[0.2em]">${language === "Hindi" ? "सटीकता" : "ACCURACY"}</div>
                        </div>

                        <button class="px-12 py-4 bg-saffron text-white rounded-[40px] font-black text-2xl shadow-[0_10px_40px_rgba(252,183,23,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto" onclick="resetQuiz()">
                            ${language === "Hindi" ? "फिर से खेलें" : "Play Again"}
                        </button>
                    </div>
                </div>

                <button id="quiz-prev-btn" class="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print" onclick="prevQuiz()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            </div>
        </div>
    </div>

    <div id="feedback-toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white font-bold shadow-2xl transition-all opacity-0 pointer-events-none z-[100]"></div>

    <script>
        let currentScreenId = 'intro';
        let currentSlideIdx = 0;
        let currentQuizIdx = 0;
        let quizAttempts = 0;
        let quizScore = 0;
        let currentAudio = null;
        let introAudioPlayed = false;
        
        const storySlides = ${JSON.stringify(result.storySlides)};
        const slideInteractions = ${JSON.stringify(result.slideInteractions || [])};
        const totalQuestions = ${result.quiz.length};

        function showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-' + id).classList.add('active');
            currentScreenId = id;
            stopAudio();
            if (id === 'intro') {
                if (introAudioPlayed) playAudio('audio/title.mp3');
            }
            else if (id === 'story') playStoryAudio(currentSlideIdx);
            else if (id === 'quiz') playQuizAudio(currentQuizIdx);
        }

        function handleIntroClick() {
            showScreen('story');
        }

        function nextSlide() {
            if (currentSlideIdx < storySlides.length - 1) {
                currentSlideIdx++;
                updateSlide();
            } else {
                showScreen('quiz');
            }
        }

        function prevSlide() {
            if (currentSlideIdx > 0) {
                currentSlideIdx--;
                updateSlide();
            } else {
                showScreen('intro');
            }
        }

        function updateSlide() {
            document.getElementById('story-content').innerHTML = storySlides[currentSlideIdx];
            document.getElementById('slide-image').src = 'images/slide_image_' + currentSlideIdx + '.png';
            document.getElementById('prev-btn').style.display = 'block';
            playStoryAudio(currentSlideIdx);
        }

        function prevQuiz() {
            if (currentQuizIdx > 0) {
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'none';
                currentQuizIdx--;
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'flex';
                playQuizAudio(currentQuizIdx);
            } else {
                showScreen('story');
            }
        }

        function nextQuiz() {
            quizAttempts = 0;
            if (currentQuizIdx < totalQuestions - 1) {
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'none';
                currentQuizIdx++;
                document.querySelectorAll('.quiz-question-block')[currentQuizIdx].style.display = 'flex';
                playQuizAudio(currentQuizIdx);
            } else {
                const quizAccuracyValue = Math.round((quizScore / totalQuestions) * 100);
                const quizStarsCount = quizAccuracyValue >= 80 ? 3 : quizAccuracyValue >= 50 ? 2 : 1;
                
                document.getElementById('complete-title').innerText = "${result.title} ${language === "Hindi" ? "प्रो !" : "Pro !"}";
                document.getElementById('accuracy-value').innerText = quizAccuracyValue + '%';
                
                let quizStarsHtml = '';
                for(let i=1; i<=3; i++) {
                    const isStarActive = i <= quizStarsCount;
                    quizStarsHtml += '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="' + (isStarActive ? '#FF9F0A' : 'none') + '" stroke="' + (isStarActive ? '#FF9F0A' : 'rgba(255,255,255,0.1)') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                }
                document.getElementById('stars-container').innerHTML = quizStarsHtml;

                document.getElementById('quiz-container').style.display = 'none';
                document.getElementById('quiz-complete').style.display = 'flex';
                document.getElementById('quiz-prev-btn').style.display = 'none';
            }
        }

        function playAudio(url) {
            stopAudio();
            if (url) {
                currentAudio = new Audio(url);
                currentAudio.play().catch(e => console.log(e));
            }
        }

        function playStoryAudio(idx) {
            playAudio('audio/story_slide_' + idx + '.mp3');
        }

        function playQuizAudio(idx) {
            playAudio('audio/question_' + idx + '.mp3');
        }

        function stopAudio() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
        }

        function checkAnswer(btn, qIdx, oIdx, correctIdx) {
            const options = btn.parentElement.querySelectorAll('.quiz-option');
            options.forEach(opt => opt.style.pointerEvents = 'none');
            
            const icon = btn.querySelector('.status-icon');
            if (oIdx === correctIdx) {
                quizScore++;
                btn.classList.add('correct');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                icon.classList.add('bg-green-500');
                setTimeout(nextQuiz, 1500);
            } else {
                quizAttempts++;
                if (quizAttempts < 2) {
                    btn.classList.add('wrong');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                    icon.classList.add('bg-red-500');
                    
                    setTimeout(() => {
                        btn.classList.remove('wrong');
                        icon.innerHTML = '';
                        icon.classList.remove('bg-red-500');
                        options.forEach(opt => opt.style.pointerEvents = 'auto');
                    }, 1500);
                } else {
                    btn.classList.add('wrong');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                    icon.classList.add('bg-red-500');
                    
                    // Show correct answer too
                    options[correctIdx].classList.add('correct');
                    const correctIcon = options[correctIdx].querySelector('.status-icon');
                    if (correctIcon) {
                        correctIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        correctIcon.classList.add('bg-green-500');
                    }
                    
                    setTimeout(nextQuiz, 2000);
                }
            }
        }

        function resetQuiz() {
            currentQuizIdx = 0;
            currentSlideIdx = 0;
            quizAttempts = 0;
            quizScore = 0;
            document.getElementById('quiz-container').style.display = 'block';
            document.getElementById('quiz-complete').style.display = 'none';
            document.getElementById('quiz-prev-btn').style.display = 'block';
            document.querySelectorAll('.quiz-question-block').forEach((b, i) => {
                b.style.display = i === 0 ? 'flex' : 'none';
                b.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('correct', 'wrong');
                    opt.style.pointerEvents = 'auto';
                    const icon = opt.querySelector('.status-icon');
                    if (icon) {
                        icon.innerHTML = '';
                        icon.classList.remove('bg-green-500', 'bg-red-500');
                    }
                });
            });
            updateSlide();
            showScreen('intro');
        }
        
        // Inject mascot on intro screen (animated, tap to greet)
        (function injectMascot(){
            var styleEl = document.createElement('style');
            styleEl.textContent = '@keyframes mascot-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes mascot-tilt{0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}#intro-mascot{transition:transform .2s}#intro-mascot:active{transform:scale(.92) rotate(-8deg)!important}';
            document.head.appendChild(styleEl);
            var img = document.createElement('img');
            img.id = 'intro-mascot';
            img.src = 'images/mascot.png';
            img.alt = 'Learning buddy';
            img.draggable = false;
            img.style.cssText = 'width:180px;height:180px;margin:0 auto;cursor:pointer;user-select:none;filter:drop-shadow(0 12px 30px rgba(0,0,0,0.35));animation:mascot-bob 2.4s ease-in-out infinite, mascot-tilt 4.2s ease-in-out infinite;display:block';
            img.onerror = function(){ img.style.display='none'; };
            img.onclick = function(){ playAudio('audio/title.mp3'); };
            var intro = document.querySelector('#screen-intro > div');
            if (intro) intro.insertBefore(img, intro.firstChild);
        })();

        // Inject progress strip (slide indicator across intro · story · quiz)
        (function injectProgress(){
            var slidesCount = (typeof storySlides !== 'undefined' && storySlides) ? storySlides.length : 0;
            var quizCount = (typeof totalQuestions !== 'undefined') ? totalQuestions : ${result.quiz.length};
            var totalSteps = slidesCount + quizCount;
            if (totalSteps < 1) return;
            var s = document.createElement('style');
            s.textContent = '#fln-progress{position:absolute;top:16px;left:16px;z-index:100;display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;width:fit-content;max-width:calc(100% - 32px);background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border:1px solid #E8E0D0;padding:8px 14px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.08);font-family:system-ui,sans-serif}#fln-progress.hidden{display:none}#fln-progress .p{height:6px;width:6px;background:#D1D5DB;border-radius:999px;transition:all .3s ease;flex-shrink:0}#fln-progress .p.on{background:#FF9933;width:14px}#fln-progress .c{font-size:11px;font-weight:900;color:#6B7280;letter-spacing:.05em;margin-left:8px;flex-shrink:0}';
            document.head.appendChild(s);
            var strip = document.createElement('div');
            strip.id = 'fln-progress';
            for (var i = 0; i < totalSteps; i++) { var pl = document.createElement('span'); pl.className = 'p'; strip.appendChild(pl); }
            var cnt = document.createElement('span'); cnt.className = 'c'; strip.appendChild(cnt);
            var host = document.querySelector('.aspect-16-9') || document.body;
            host.appendChild(strip);
            function update(){
                if (currentScreenId === 'intro') {
                    strip.classList.add('hidden');
                    return;
                }
                strip.classList.remove('hidden');
                var cur = (currentScreenId === 'story') ? currentSlideIdx : slidesCount + currentQuizIdx;
                var pills = strip.querySelectorAll('.p');
                for (var i = 0; i < pills.length; i++) {
                    if (i <= cur) pills[i].classList.add('on'); else pills[i].classList.remove('on');
                }
                cnt.textContent = Math.min(cur+1, totalSteps) + ' / ' + totalSteps;
            }
            update();
            setInterval(update, 250);
        })();

        // ===== Inject interactive activity widgets (tap-count · drag-bucket · tap-find) =====
        (function injectActivities(){
            var st = document.createElement('style');
            st.textContent = ''
              + '@keyframes flnPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}'
              + '@keyframes flnSparkle{0%{transform:scale(0);opacity:1}50%{transform:scale(1.3);opacity:1}100%{transform:scale(.5);opacity:0;top:-20%}}'
              + '@keyframes flnWiggle{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'
              + '@keyframes flnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'
              + '.fln-tap-item{transition:transform .2s,opacity .2s;animation:flnBob 2s ease-in-out infinite}'
              + '.fln-tap-item:hover{transform:scale(1.15)!important;animation:none}'
              + '.fln-card{transition:all .15s ease}'
              + '.fln-card:hover{border-color:#FF9933!important;transform:translateY(-3px)}'
              + '.fln-drag-item{transition:transform .2s,box-shadow .2s}'
              + '.fln-drag-item:hover{transform:scale(1.1)}'
              + '#slide-activity{display:flex;align-items:center;justify-content:center}';
            document.head.appendChild(st);

            function pill(target){
                var p=document.createElement('div');
                p.style.cssText='position:absolute;top:12px;right:12px;background:#FFF3E0;border:2px solid #FF9933;color:#1c1f2e;font-weight:900;font-size:1.1rem;padding:5px 14px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.08);z-index:10';
                p.textContent='0 / '+target;
                p.upd=function(n){p.textContent=n+' / '+target};
                return p;
            }

            function celebrate(host, msg){
                var ov=document.createElement('div');
                ov.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(16,185,129,.15);backdrop-filter:blur(2px);font-size:1.5rem;font-weight:900;color:#065f46;text-align:center;padding:24px;z-index:50;animation:flnPop .4s ease-out forwards';
                ov.textContent='🎉 '+(msg||'Great!');
                host.appendChild(ov);
                for(var i=0;i<10;i++){
                    var s=document.createElement('div');
                    s.textContent=['⭐','✨','🌟','💫'][i%4];
                    s.style.cssText='position:absolute;font-size:2rem;pointer-events:none;left:'+(Math.random()*80+10)+'%;top:'+(Math.random()*80+10)+'%;animation:flnSparkle 1s ease-out forwards;z-index:51';
                    host.appendChild(s);
                }
                // Speak success line if we have audio infra
                if(typeof generateNarration==='undefined'){
                    // Try the page's playAudio with current title audio as a fallback — no-op if not available
                }
            }

            function renderTapCount(host, spec){
                host.innerHTML='';
                var p=pill(spec.targetCount);
                host.appendChild(p);
                var grid=document.createElement('div');
                grid.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;width:100%;height:100%;padding:48px 24px 24px;box-sizing:border-box';
                var tapped=0;
                var n=Math.max(1,Math.min(10,spec.targetCount||1));
                for(var i=0;i<n;i++){
                    (function(){
                        var b=document.createElement('button');
                        b.className='fln-tap-item';
                        b.textContent=spec.emoji||'🟠';
                        b.style.cssText='font-size:3.8rem;background:none;border:none;cursor:pointer;padding:6px;line-height:1;animation-delay:'+(i*0.15)+'s';
                        b.setAttribute('aria-label','Tap to count');
                        b.onclick=function(){
                            if(b.dataset.t==='1')return;
                            b.dataset.t='1';
                            b.style.opacity='.35';
                            b.style.transform='scale(1.4)';
                            b.style.animation='none';
                            setTimeout(function(){b.style.transform='scale(1)'},220);
                            tapped++;
                            p.upd(tapped);
                            if(tapped===n) setTimeout(function(){celebrate(host,spec.successSay)},320);
                        };
                        grid.appendChild(b);
                    })();
                }
                host.appendChild(grid);
            }

            function renderDragBucket(host, spec){
                host.innerHTML='';
                var p=pill(spec.targetCount);
                host.appendChild(p);
                var items=document.createElement('div');
                items.style.cssText='position:absolute;top:54px;left:0;right:0;height:42%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:8px;box-sizing:border-box';
                host.appendChild(items);
                var bkt=document.createElement('div');
                bkt.style.cssText='position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:#FFF3E0;border:4px dashed #FF9933;border-radius:24px;padding:14px 24px;min-width:160px;min-height:96px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;font-size:3.5rem;line-height:1;transition:all .2s';
                bkt.textContent=spec.bucketEmoji||'🧺';
                var bktLabel=document.createElement('div');
                bktLabel.style.cssText='position:absolute;left:50%;bottom:6px;transform:translateX(-50%);font-weight:800;color:#2E3192;font-size:.85rem;text-align:center;white-space:nowrap';
                bktLabel.textContent=spec.bucketLabel||'';
                host.appendChild(bkt);
                host.appendChild(bktLabel);
                var dropped=0, contents=0;
                var n=Math.max(1,Math.min(10,spec.targetCount||1));
                function placeInBkt(){
                    if(contents===0) bkt.textContent='';
                    contents++;
                    var s=document.createElement('span');
                    s.textContent=spec.emoji||'🥭';
                    s.style.cssText='font-size:2.2rem;animation:flnPop .35s ease-out';
                    bkt.appendChild(s);
                }
                for(var i=0;i<n;i++){
                    (function(){
                        var el=document.createElement('div');
                        el.className='fln-drag-item';
                        el.textContent=spec.emoji||'🥭';
                        el.style.cssText='font-size:3rem;cursor:grab;user-select:none;touch-action:none;line-height:1;padding:4px';
                        el.dataset.d='0';
                        var sx=0,sy=0,active=false;
                        el.addEventListener('pointerdown',function(e){
                            if(el.dataset.d==='1')return;
                            el.setPointerCapture(e.pointerId);
                            active=true;
                            sx=e.clientX;sy=e.clientY;
                            el.style.cursor='grabbing';
                            el.style.zIndex='100';
                        });
                        el.addEventListener('pointermove',function(e){
                            if(!active||el.dataset.d==='1')return;
                            el.style.transform='translate('+(e.clientX-sx)+'px,'+(e.clientY-sy)+'px) scale(1.15)';
                        });
                        function endDrag(e){
                            if(!active||el.dataset.d==='1')return;
                            active=false;
                            try{el.releasePointerCapture(e.pointerId)}catch(_){}
                            var b=bkt.getBoundingClientRect();
                            if(e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom){
                                el.dataset.d='1';
                                el.style.display='none';
                                dropped++;
                                p.upd(dropped);
                                placeInBkt();
                                if(dropped===n) setTimeout(function(){celebrate(host,spec.successSay)},380);
                            } else {
                                el.style.transform='';
                                el.style.cursor='grab';
                                el.style.zIndex='';
                            }
                        }
                        el.addEventListener('pointerup',endDrag);
                        el.addEventListener('pointercancel',endDrag);
                        items.appendChild(el);
                    })();
                }
            }

            function renderTapFind(host, spec){
                host.innerHTML='';
                var opts=spec.options||[];
                var n=opts.length;
                var cols=n<=2?2:n===3?3:2;
                var grid=document.createElement('div');
                grid.style.cssText='display:grid;grid-template-columns:repeat('+cols+',1fr);gap:14px;width:100%;height:100%;padding:18px;box-sizing:border-box';
                opts.forEach(function(opt,idx){
                    var c=document.createElement('button');
                    c.className='fln-card';
                    c.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#fff;border:3px solid #E8E0D0;border-radius:20px;padding:14px;cursor:pointer;font-family:inherit;min-height:100%';
                    var em=document.createElement('div');
                    em.textContent=opt.emoji||'';
                    em.style.cssText='font-size:2.6rem;line-height:1.1;font-weight:900';
                    var lb=document.createElement('div');
                    lb.textContent=opt.label||'';
                    lb.style.cssText='font-size:.9rem;font-weight:800;color:#1c1f2e;text-align:center';
                    c.appendChild(em);c.appendChild(lb);
                    c.onclick=function(){
                        if(c.dataset.l)return;
                        if(idx===spec.correctIndex){
                            c.dataset.l='1';
                            c.style.borderColor='#10b981';
                            c.style.background='#ecfdf5';
                            c.style.transform='scale(1.06)';
                            setTimeout(function(){celebrate(host,spec.successSay)},250);
                        } else {
                            c.style.animation='flnWiggle .35s ease-in-out';
                            setTimeout(function(){c.style.animation=''},370);
                        }
                    };
                    grid.appendChild(c);
                });
                host.appendChild(grid);
            }

            window.flnRenderActivity=function(idx){
                var spec=(typeof slideInteractions!=='undefined' && slideInteractions && slideInteractions[idx])||null;
                var host=document.getElementById('slide-activity');
                var imgWrap=document.getElementById('slide-image-wrap');
                var instr=document.getElementById('activity-instruction');
                if(!host)return;
                if(!spec||!spec.kind){
                    host.style.display='none';
                    if(imgWrap)imgWrap.style.display='';
                    if(instr)instr.textContent='';
                    return;
                }
                if(imgWrap)imgWrap.style.display='none';
                host.style.display='flex';
                if(instr)instr.textContent=spec.instruction||'';
                if(spec.kind==='tap-count')renderTapCount(host,spec);
                else if(spec.kind==='drag-bucket')renderDragBucket(host,spec);
                else if(spec.kind==='tap-find')renderTapFind(host,spec);
                else { host.style.display='none'; if(imgWrap)imgWrap.style.display=''; }
            };

            // Poll for slide changes (lighter than monkey-patching updateSlide)
            var lastIdx=-1, lastScreen='';
            setInterval(function(){
                if(typeof currentScreenId==='undefined')return;
                if(currentScreenId!=='story'){
                    if(lastScreen!==currentScreenId){
                        lastScreen=currentScreenId;
                        lastIdx=-1;
                    }
                    return;
                }
                if(typeof currentSlideIdx==='undefined')return;
                if(currentSlideIdx===lastIdx&&lastScreen===currentScreenId)return;
                lastIdx=currentSlideIdx;
                lastScreen=currentScreenId;
                window.flnRenderActivity(currentSlideIdx);
            },180);
        })();

        // Initialize the app accurately
        setTimeout(() => {
            showScreen('intro');
        }, 500);

        // Fallback to start audio on first interaction if blocked
        document.body.addEventListener('click', () => {
            if (!currentAudio && currentScreenId === 'intro') {
                playAudio('audio/title.mp3');
            }
        }, { once: true });
    </script>
</body>
</html>
    `;
    
    zip.file("index.html", htmlContent);
    
    // 2. Add Audio
    const audioFolder = zip.folder("audio");
    let audioManifest = "Filename,Audio Text\n";
    
    if (audioFolder) {
      // Add the manifest entries
      audioManifest += `title,"${result.title.replace(/"/g, '""')}"\n`;
      for (let i = 0; i < result.storySlides.length; i++) {
        const slideText = result.storySlides[i].replace(/<[^>]*>?/gm, '').replace(/"/g, '""');
        audioManifest += `story_slide_${i},"${slideText}"\n`;
      }
      
      for (let i = 0; i < result.quiz.length; i++) {
        const qText = result.quiz[i].question.replace(/"/g, '""');
        audioManifest += `question_${i},"${qText}"\n`;
      }
      
      audioFolder.file("audio_manifest.csv", audioManifest);
    }
    
    // 3. Add Images
    const imagesFolder = zip.folder("images");
    if (imagesFolder) {
      if (result.storyImagesBase64) {
        for (let i = 0; i < result.storyImagesBase64.length; i++) {
          const imageData = result.storyImagesBase64[i].split(',')[1];
          imagesFolder.file(`slide_image_${i}.png`, imageData, { base64: true });
        }
      }
      
      // Attempt to add mascot to zip — try the path the user saved it to first
      for (const path of ['/mascot.png', '/images/mascot.png']) {
        try {
          const mascotResp = await fetch(path);
          if (mascotResp.ok) {
            imagesFolder.file("mascot.png", await mascotResp.blob());
            break;
          }
        } catch (e) {
          // try next path
        }
      }
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${result.title.replace(/\s+/g, '_')}_Offline.zip`);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(s => s !== skillId) 
        : [...prev, skillId]
    );
  };

  const handleReadAloud = async (text?: string) => {
    if (isNarrationQuotaExhausted()) {
      setNarrationWarning(true);
      return;
    }
    const contentToNarrate = text || result?.storySlides[currentStorySlide];
    if (!contentToNarrate) return;
    
    // If it's the same content and we have audio, just toggle
    const currentAudio = text ? null : result?.storyAudioBase64?.[currentStorySlide];
    if (!text && currentAudio) {
      togglePlayback(currentAudio);
      return;
    }

    setIsNarrating(true);
    setIsAudioGenerating(true);
    try {
      const base64 = await generateNarration(contentToNarrate);
      if (base64) {
        playAudio(base64);
      } else {
        showFeedback('Failed to generate audio. Please try again.', 'error');
      }
    } catch (error) {
      console.error("Narration failed:", error);
      showFeedback('Audio generation failed.', 'error');
    } finally {
      setIsNarrating(false);
      setIsAudioGenerating(false);
    }
  };

  const playAudio = async (base64: string, onEnded?: () => void) => {
    try {
      if (!base64 || typeof base64 !== 'string' || !base64.trim()) {
        console.warn("No audio data to play (empty or invalid)");
        return;
      }

      // Stop current audio if any
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio.load(); // Release resources
      }

      const blob = pcmToWav(base64);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      audio.onpause = () => {
        setIsPlaying(false);
        setIsPaused(true);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        URL.revokeObjectURL(url);
        if (onEnded) onEnded();
      };

      setCurrentAudio(audio);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'AbortError') {
            // Expected when audio is paused or replaced
          } else {
            console.error("Audio playback error:", error);
          }
        });
      }
    } catch (error) {
      console.error("Audio playback crashed:", error);
    }
  };

  const togglePlayback = (audioData?: string) => {
    if (isAudioGenerating) return;
    
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        return;
      } else if (isPaused) {
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') console.error(e);
          });
        }
        return;
      }
    }

    const dataToPlay = audioData || (
      currentScreen === 0 ? result?.titleAudioBase64 :
      currentScreen === 1 ? result?.storyAudioBase64?.[currentStorySlide] :
      currentScreen === 2 ? result?.quiz[currentQuizIndex]?.audioBase64 :
      null
    );
    
    if (!dataToPlay) return;
    playAudio(dataToPlay);
  };

  useEffect(() => {
    // Auto-play audio for the current context
    let timer: NodeJS.Timeout;
    if (result && !isQuizComplete) {
      let audioToPlay: string | undefined;
      
      if (currentScreen === 0) { // Intro
        audioToPlay = result.titleAudioBase64;
      } else if (currentScreen === 1) { // Story
        audioToPlay = result.storyAudioBase64?.[currentStorySlide];
      } else if (currentScreen === 2) { // Quiz
        audioToPlay = result.quiz[currentQuizIndex]?.audioBase64;
      }
      
      if (audioToPlay) {
        // Small delay to ensure UI transition is smooth
        timer = setTimeout(() => {
          playAudio(audioToPlay!).catch(e => console.warn("Auto-play blocked:", e));
        }, 800); 
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio.load();
      }
    };
  }, [currentScreen, currentQuizIndex, currentStorySlide, result, isQuizComplete]);

  return (
    <div className="min-h-screen bg-app-bg text-[#1A1A2E] font-sans selection:bg-saffron selection:text-white pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E8E0D0] px-8 py-4 mb-8 no-print">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                FLN Tool — <span className="text-saffron">NIPUN Edition</span>
              </h1>
              <p className="text-[11px] font-bold text-[#555577] uppercase tracking-wider">
                Balvatika → Grade 3 • Literacy & Numeracy • Hindi + English
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
               NIPUN BHARAT
             </div>
             <div className="px-4 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full border border-orange-100 uppercase tracking-widest">
               NCF-FS 2022
             </div>
             <div className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase tracking-widest">
               NEP 2020
             </div>
          </div>
        </div>
      </header>

      {/* Quota Warning Message */}
      {(narrationWarning || isNarrationQuotaExhausted()) && (
        <div className="bg-amber-600 text-white p-3 text-center text-sm font-bold animate-in fade-in slide-in-from-top duration-500 relative z-[110] no-print">
          <div className="container mx-auto flex items-center justify-center gap-4">
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            <p>
              {language === "Hindi" 
                ? "दैनिक आवाज़ सीमा समाप्त हो गई है। पाठ अभी भी पढ़ा जा सकता है लेकिन आवाज़ उपलब्ध नहीं होगी।" 
                : "Daily narration limit reached. You can still read the lesson, but voiceovers will be unavailable."}
            </p>
            <button 
              onClick={() => setNarrationWarning(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 pt-8 pb-20 max-w-7xl">
        <div className="space-y-8">
          
          {/* Loading Section */}
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-8"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-saffron/20 border-t-saffron animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  ✨
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <h2 className="text-3xl font-black text-indigo">
                  {language === "Hindi" ? "आपका पाठ तैयार हो रहा है" : "Creating Your Lesson"}
                </h2>
                <p className="text-xl text-indigo/60 font-medium animate-pulse">
                  {generationStep}
                </p>
              </div>
              <div className="w-64 h-2 bg-indigo-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="h-full bg-saffron"
                />
              </div>
            </motion.div>
          )}

          {/* Lesson Configuration Section */}
          {currentScreen === -1 && !isGenerating && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] border-2 border-[#E8E0D0] p-6 hindi-shadow no-print relative overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-saffron/10 rounded-lg flex items-center justify-center text-saffron">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-navy-300">
                      {language === "Hindi" ? "नया पाठ बनाएँ" : "Create a New Lesson"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-light text-green border border-green/20 rounded-full">
                    <span className="w-2 h-2 bg-green rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">FLN Target Grade</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-grey-500 ml-1 uppercase tracking-wider">
                      {language === "Hindi" ? "भाषा / Language" : "Language"}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => setLanguage(lang.id)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black border-2 transition-all group ${
                            language === lang.id
                            ? 'bg-saffron border-saffron text-white shadow-sm scale-[1.02]'
                            : 'bg-white border-[#F0F2F5] text-[#555577] hover:border-saffron/30'
                          }`}
                        >
                          <span className="text-[8px] font-black tracking-widest opacity-50 group-hover:opacity-100">{lang.subLabel}</span>
                          <span className="text-base">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-grey-500 ml-1 uppercase tracking-wider">
                      {language === "Hindi" ? "विषय-क्षेत्र / Domain" : "Domain"}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {DOMAINS.map(dm => (
                        <button
                          key={dm.id}
                          onClick={() => { setDomain(dm.id as any); setNipunCode(""); setTopicSearch(""); setTopic(""); setTopicListOpen(false); }}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black border-2 transition-all ${
                            domain === dm.id
                            ? `${dm.color} border-current text-white shadow-sm scale-[1.02]`
                            : 'bg-white border-[#F0F2F5] text-[#555577] hover:border-indigo/30'
                          }`}
                        >
                          {dm.id === 'literacy' ? <BookOpen className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                          <span className="text-base">{dm.label[language]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-grey-500 ml-1 uppercase tracking-wider">
                      {language === "Hindi" ? "कक्षा / Grade" : "Grade"}
                    </label>
                    <div className="relative">
                      <select 
                        value={grade}
                        onChange={(e) => { setGrade(e.target.value); setNipunCode(""); setTopicSearch(""); setTopic(""); setTopicListOpen(false); }}
                        className="w-full appearance-none bg-grey-200 border-2 border-grey-300 rounded-2xl px-6 py-3 font-black text-lg text-navy-300 focus:border-saffron focus:outline-none transition-all cursor-pointer"
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g} {g !== "Balvatika" ? "⭐ FLN" : ""}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Topic Picker — NIPUN-aware + search + manual fallback */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-black text-grey-500 uppercase tracking-wider">
                        {language === "Hindi" ? "विषय / Topic" : "Topic"}
                        {nipunCode && topicMode === "nipun" && (
                          <span className="ml-2 inline-block bg-blue-100 text-blue-300 px-2 py-0.5 rounded text-[10px] tracking-normal font-black">
                            {nipunCode}
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = topicMode === "nipun" ? "custom" : "nipun";
                          setTopicMode(next);
                          setNipunCode("");
                          setTopicSearch("");
                          setTopicListOpen(false);
                          if (next === "custom") setTopic("");
                        }}
                        className="text-[11px] font-black text-saffron hover:underline tracking-wide"
                      >
                        {topicMode === "nipun"
                          ? (language === "Hindi" ? "+ अपना विषय" : "+ Custom topic")
                          : (language === "Hindi" ? "← निपुण से चुनें" : "← Pick from NIPUN")}
                      </button>
                    </div>

                    {topicMode === "custom" ? (
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={language === "Hindi" ? "जैसे: मेरा परिवार" : "e.g. My Family"}
                        className="w-full bg-grey-200 border-2 border-grey-300 rounded-2xl px-6 py-3 font-black text-lg text-navy-300 placeholder:text-grey-400/50 placeholder:font-medium focus:border-saffron focus:outline-none transition-all"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={nipunCode ? topic : topicSearch}
                          onChange={(e) => {
                            setTopicSearch(e.target.value);
                            setTopic(e.target.value);
                            setNipunCode("");
                            setTopicListOpen(true);
                          }}
                          onFocus={() => setTopicListOpen(true)}
                          onBlur={() => setTimeout(() => setTopicListOpen(false), 180)}
                          placeholder={
                            language === "Hindi"
                              ? "खोजें: कविता, जोड़, ECL1 4.4..."
                              : "Search: rhyme, addition, ECL1 4.4..."
                          }
                          className="w-full bg-grey-200 border-2 border-grey-300 rounded-2xl px-6 py-3 pr-12 font-black text-lg text-navy-300 placeholder:text-grey-400/50 placeholder:font-medium focus:border-saffron focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setTopicListOpen(!topicListOpen); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <ChevronDown className={`w-5 h-5 text-grey-400 transition-transform ${topicListOpen ? "rotate-180" : ""}`} />
                        </button>

                        {topicListOpen && (() => {
                          const all = getTopicsForGradeDomain(grade, domain);
                          const filtered = searchTopics(all, topicSearch);
                          return (
                            <div className="absolute z-50 left-0 right-0 top-full mt-2 max-h-80 overflow-auto bg-white border-2 border-grey-300 rounded-2xl shadow-xl">
                              {filtered.length === 0 ? (
                                <div className="p-4 text-center text-grey-500 text-sm font-bold">
                                  {language === "Hindi"
                                    ? `कोई निपुण विषय नहीं मिला। "+ अपना विषय" दबाएँ।`
                                    : `No NIPUN topic matches. Use "+ Custom topic" to write your own.`}
                                </div>
                              ) : (
                                filtered.map((lo: NipunLO) => (
                                  <button
                                    key={lo.code}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setTopic(lo.topic);
                                      setNipunCode(lo.code);
                                      setTopicSearch("");
                                      setTopicListOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-grey-100 border-b border-grey-100 last:border-b-0 transition"
                                  >
                                    <div className="text-[10px] font-black text-blue-300 tracking-wider">
                                      {lo.code} · {lo.subSkill}
                                    </div>
                                    <div className="text-sm font-bold text-navy-300 mt-0.5">{lo.topic}</div>
                                    <div className="text-[11px] text-grey-500 mt-0.5 truncate">{lo.keywords}</div>
                                  </button>
                                ))
                              )}
                            </div>
                          );
                        })()}

                        <div className="mt-1 ml-1 text-[10px] text-grey-500 font-bold">
                          {getTopicsForGradeDomain(grade, domain).length}{" "}
                          {language === "Hindi" ? "निपुण विषय" : "NIPUN topics"} · {domain}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* NIPUN Bharat Lakshyas */}
                {LAKSHYAS[grade]?.[domain]?.[language] && (
                  <div className="pt-4 border-t-2 border-[#F0F2F5]">
                    <button 
                      onClick={() => setShowLakshyas(!showLakshyas)}
                      className="w-full flex items-center justify-between p-4 bg-blue-100/50 rounded-2xl border-2 border-blue-200 hover:bg-blue-100 transition-all text-blue-300"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 fill-current" />
                        <h3 className="text-lg font-black">
                          {language === "Hindi" 
                            ? `इस कक्षा के निपुण लक्ष्य` 
                            : `NIPUN Bharat Lakshyas for this grade`}
                        </h3>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showLakshyas ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showLakshyas && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white">
                            {LAKSHYAS[grade][domain][language].map((item: any, idx: number) => (
                              <div key={idx} className="space-y-3">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300/60 pb-1.5 border-b border-blue-100">
                                  {item.title}
                                </h4>
                                <ul className="space-y-2">
                                  {item.goals.map((goal: string, gIdx: number) => (
                                    <li key={gIdx} className="flex items-start gap-3 text-navy-300 font-bold leading-relaxed text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0" />
                                      {goal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pedagogical Approach — content adapts to grade + domain */}
                <div className="pt-4 border-t-2 border-[#F0F2F5]">
                  <button
                    onClick={() => setShowPedagogy(!showPedagogy)}
                    className="w-full flex items-center justify-between p-4 bg-saffron-light/40 rounded-2xl border-2 border-saffron/30 hover:bg-saffron-light/60 transition-all text-saffron"
                  >
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 fill-current" />
                      <div className="text-left">
                        <h3 className="text-lg font-black leading-tight">
                          {PEDAGOGY[domain].label[language]}
                        </h3>
                        <p className="text-[11px] font-bold text-saffron/80 mt-0.5">
                          {grade} · {PEDAGOGY.gradeEmphasis[grade]?.[language]}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform shrink-0 ${showPedagogy ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showPedagogy && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 space-y-5 bg-white">
                          {/* Domain-specific (4 strategies) */}
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-saffron/70 pb-1.5 border-b border-saffron/20 mb-3">
                              {domain === "literacy"
                                ? (language === "Hindi" ? "साक्षरता रणनीतियाँ" : "Literacy strategies")
                                : (language === "Hindi" ? "संख्या-ज्ञान रणनीतियाँ" : "Numeracy strategies")}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {PEDAGOGY[domain].strategies.map((s: any, i: number) => (
                                <div key={i} className="flex gap-3 p-3 bg-saffron-light/20 rounded-xl border border-saffron/15">
                                  <div className="text-2xl shrink-0">{s.icon}</div>
                                  <div>
                                    <div className="font-black text-navy-300 text-sm leading-tight">{s.title[language]}</div>
                                    <div className="text-[11px] text-navy-300/75 font-medium leading-snug mt-0.5">{s.desc[language]}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Universal strategies (3) */}
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo/70 pb-1.5 border-b border-indigo/20 mb-3">
                              {language === "Hindi" ? "सामान्य FLN दृष्टिकोण" : "Cross-cutting FLN approach"}
                            </h4>
                            <div className="space-y-2">
                              {PEDAGOGY.universal.map((s: any, i: number) => (
                                <div key={i} className="flex gap-3 p-3 bg-indigo-light/30 rounded-xl border border-indigo/15">
                                  <div className="text-xl shrink-0">{s.icon}</div>
                                  <div>
                                    <div className="font-black text-navy-300 text-sm leading-tight">{s.title[language]}</div>
                                    <div className="text-[11px] text-navy-300/75 font-medium leading-snug mt-0.5">{s.desc[language]}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* If a NIPUN topic is selected, surface its example activity */}
                          {nipunCode && topicMode === "nipun" && (() => {
                            const all = getTopicsForGradeDomain(grade, domain);
                            const lo = all.find(t => t.code === nipunCode);
                            if (!lo) return null;
                            return (
                              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black bg-green-200 text-green-900 px-2 py-0.5 rounded">{lo.code}</span>
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-green-800">
                                    {language === "Hindi" ? "इस LO के लिए सुझाव" : "Suggested activity for this LO"}
                                  </h4>
                                </div>
                                <div className="text-[12px] text-green-900 font-medium leading-snug">{lo.activity}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Generate Button Area */}
                <div className="pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo via-[#4F46E5] to-[#7C3AED] text-white font-black text-xl flex items-center justify-center gap-4 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:hover:scale-100 group relative overflow-hidden"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="animate-pulse">
                          {language === "Hindi" ? "पाठ तैयार हो रहा है..." : "Creating Lesson..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        {language === "Hindi" ? "पाठ बनाओ" : "Generate Lesson"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                    
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-red-100 border-2 border-red-200 rounded-3xl flex items-start gap-4 text-red-400"
                  >
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-black text-lg">त्रुटि (Error)</p>
                      <p className="text-sm font-bold opacity-80">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-2 hover:bg-red-200 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}

          {/* Result Section */}
          <AnimatePresence>
            {result && currentScreen >= 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* 16:9 Aspect Ratio Container for Desktop */}
                <div className="w-full flex-1 bg-white overflow-hidden flex flex-col min-h-[80vh] rounded-[28px] border-2 border-[#E8E0D0] hindi-shadow relative">
                  
                  {/* Customization Toolbar (Floating) */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-[60] no-print px-6">
                    <div className="flex items-center gap-3">
                       <button
                        onClick={() => setCurrentScreen(-1)}
                        className="p-3 bg-white/90 backdrop-blur border border-[#E8E0D0] rounded-2xl text-indigo hover:text-saffron transition-all"
                        title="Back to Config"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Progress pills — only on story/quiz, not intro. Excludes intro from total. */}
                      {currentScreen !== 0 && (() => {
                        const totalSteps = (result.storySlides?.length || 0) + (result.quiz?.length || 0);
                        const current =
                          currentScreen === 1
                            ? currentStorySlide
                            : (result.storySlides?.length || 0) + currentQuizIndex;
                        return (
                          <div className="inline-flex w-fit items-center gap-1 bg-white/90 backdrop-blur border border-[#E8E0D0] px-3 py-1.5 rounded-full shadow-sm flex-wrap max-w-full">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                              <span
                                key={i}
                                className={`transition-all duration-300 rounded-full shrink-0 ${
                                  i <= current
                                    ? 'bg-saffron h-1.5 w-3'
                                    : 'bg-grey-300 h-1.5 w-1.5'
                                }`}
                                aria-label={`Step ${i + 1} of ${totalSteps}`}
                              />
                            ))}
                            <span className="ml-2 text-[11px] font-black text-grey-500 tracking-wide shrink-0">
                              {Math.min(current + 1, totalSteps)} / {totalSteps}
                            </span>
                          </div>
                        );
                      })()}

                      <h3 className="font-bold text-base text-indigo ml-2 hidden xl:block max-w-[260px] truncate">{result.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {(currentScreen === 1 || currentScreen === 2) && (
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-[#E8E0D0] p-1.5 rounded-full shadow-sm">
                          <button
                            onClick={() => togglePlayback()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                              isPlaying
                              ? 'bg-indigo text-white'
                              : 'bg-indigo-light text-indigo hover:bg-indigo hover:text-white'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            <span className="text-sm font-bold">{isPlaying ? (language === "Hindi" ? 'रुकें' : 'Stop') : (language === "Hindi" ? 'सुनें' : 'Listen')}</span>
                          </button>

                          {currentScreen === 1 && (
                            <>
                              <div className="w-px h-6 bg-[#E8E0D0] mx-1" />
                              <button
                                onClick={highlightSelection}
                                className="flex items-center gap-1.5 px-4 py-2 bg-saffron-light text-saffron rounded-full font-bold text-sm hover:bg-saffron hover:text-white transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {language === "Hindi" ? "महत्वपूर्ण शब्द" : "Highlight Word"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-hidden p-6 relative flex flex-col pt-24">
                    <AnimatePresence mode="wait">
                      {currentScreen === 0 && (
                        <motion.div 
                          key="intro"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-6 py-10 bg-gradient-to-br from-blue-300 via-secondary to-pink-300 text-white -m-6 relative overflow-hidden"
                        >
                          {/* Animated background bubbles */}
                          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-20 right-20 w-64 h-64 bg-white/50 rounded-full blur-[100px]" />
                          </div>

                          <div className="relative z-10 space-y-4 max-w-5xl">
                            <motion.img
                              src="/mascot.png"
                              alt={language === "Hindi" ? "तुम्हारा सीखने वाला साथी" : "Your learning buddy"}
                              initial={{ opacity: 0, y: -40, rotate: -10 }}
                              animate={{
                                opacity: 1,
                                y: [0, -10, 0],
                                rotate: [0, 3, -3, 0]
                              }}
                              transition={{
                                opacity: { duration: 0.6 },
                                y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                                rotate: { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
                              }}
                              whileHover={{ scale: 1.08, rotate: 6 }}
                              whileTap={{ scale: 0.92, rotate: -8 }}
                              onClick={() => {
                                if (result.titleAudioBase64) {
                                  playAudio(result.titleAudioBase64);
                                  setIntroAudioPlayed(true);
                                }
                              }}
                              draggable={false}
                              title={language === "Hindi" ? "मुझे छुओ — मैं बात करूँगा!" : "Tap me — I'll greet you!"}
                              className="w-24 h-24 md:w-32 md:h-32 mx-auto cursor-pointer select-none drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />

                            {/* NIPUN anchor badge — what this lesson is teaching */}
                            {result.loCode && (
                              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 rounded-full px-3 py-1 mx-auto">
                                <span className="font-black text-[11px] tracking-wider text-white">{result.loCode}</span>
                                <span className="w-1 h-1 rounded-full bg-white/60" />
                                <span className="font-bold text-[11px] text-white/90">{result.loGrade}</span>
                                {result.loSubSkill && <><span className="w-1 h-1 rounded-full bg-white/60" /><span className="font-bold text-[11px] text-white/90">{result.loSubSkill}</span></>}
                              </div>
                            )}

                            <h1
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newTitle = e.currentTarget.textContent || "";
                                if (newTitle !== result.title) {
                                  regenerateTitleAudio(newTitle);
                                }
                              }}
                              className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-xl outline-none focus:ring-4 focus:ring-white/30 rounded-3xl px-4 py-1 transition-all break-words"
                            >
                              {result.title}
                            </h1>
                            
                            <p 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                // Subtitle isn't usually narrated separately but we keep it editable
                              }}
                              className="text-xl font-medium text-white/90 max-w-3xl mx-auto opacity-90 drop-shadow-md outline-none focus:ring-4 focus:ring-white/20 rounded-2xl px-3 py-1 transition-all"
                            >
                              {language === "Hindi" 
                                ? "आज हम इस विषय के बारे में मज़ेदार तरीके से सीखेंगे!" 
                                : "Today we will learn about this topic in a fun way!"}
                            </p>

                            <div className="flex flex-col items-center gap-2 pt-2">
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  // After the first listen (or if no audio), Continue advances immediately.
                                  if (introAudioPlayed || !result.titleAudioBase64) {
                                    // Stop any playing narration so it doesn't bleed onto the next screen
                                    if (currentAudio) { currentAudio.pause(); }
                                    setCurrentScreen(1);
                                    setCurrentStorySlide(0);
                                    return;
                                  }
                                  // First click — play the title narration, then advance when it ends.
                                  // Safety fallback: if audio fails to play or doesn't end within 8s, advance anyway.
                                  let advanced = false;
                                  const advance = () => {
                                    if (advanced) return;
                                    advanced = true;
                                    setCurrentScreen(1);
                                    setCurrentStorySlide(0);
                                  };
                                  playAudio(result.titleAudioBase64, advance);
                                  setIntroAudioPlayed(true);
                                  setTimeout(advance, 8000);
                                }}
                                className="px-12 py-4 bg-saffron text-white rounded-[40px] font-black text-2xl shadow-[0_10px_40px_rgba(252,183,23,0.5)] hover:shadow-[0_15px_50px_rgba(252,183,23,0.6)] transition-all flex items-center justify-center gap-4 group"
                              >
                                {!introAudioPlayed ? (
                                  <>
                                    <Volume2 className="w-8 h-8 animate-pulse text-white fill-current" />
                                    {language === "Hindi" ? "चलो शुरू करते हैं" : "Let's Start"}
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className="w-8 h-8" />
                                    {language === "Hindi" ? "आगे बढ़ें" : "Continue"}
                                  </>
                                )}
                              </motion.button>

                              {introAudioPlayed && (
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  onClick={() => playAudio(result.titleAudioBase64)}
                                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold"
                                >
                                  <Volume2 className="w-5 h-5" />
                                  {language === "Hindi" ? "शीर्षक फिर से सुनें" : "Listen to Title Again"}
                                </motion.button>
                              )}
                            </div>

                            <button 
                              onClick={() => togglePlayback(result.titleAudioBase64)}
                              className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all mx-auto text-sm font-bold"
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              {language === "Hindi" ? 'शीर्षक सुनें' : 'Listen Title'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {currentScreen === 1 && (
                        <motion.div 
                          key={`story-${currentStorySlide}`}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          className="flex-1 flex flex-col px-12 relative"
                        >
                          {/* Story Section */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 items-center min-h-[60vh]">
                            <div className="flex flex-col justify-center">

                                    <div className="relative group">
                                    <p 
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newText = e.currentTarget.innerHTML || "";
                                        if (newText !== result.storySlides[currentStorySlide]) {
                                          regenerateSlideAudio(currentStorySlide, newText);
                                        }
                                      }}
                                      style={{ 
                                        fontFamily: result.theme?.fontFamily || 'inherit',
                                        color: result.theme?.textColor || 'inherit',
                                        fontSize: result.theme?.fontSize || '2rem'
                                      }}
                                      className="leading-tight text-left outline-none focus:ring-2 focus:ring-saffron/20 rounded-lg p-4"
                                      dangerouslySetInnerHTML={{ __html: result.storySlides[currentStorySlide] }}
                                    />
                                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all no-print">
                                      <button 
                                        onClick={() => regenerateSlideAudio(currentStorySlide, result.storySlides[currentStorySlide])}
                                        disabled={isAudioGenerating}
                                        className="p-2 bg-white shadow border border-[#E8E0D0] text-saffron rounded-full hover:bg-saffron hover:text-white disabled:opacity-30"
                                        title="Update Text & Voice"
                                      >
                                        <Volume2 className={`w-4 h-4 ${isAudioGenerating ? 'animate-spin' : ''}`} />
                                      </button>
                                    </div>
                                  </div>
                            </div>

                              <div className="flex flex-col justify-center h-full">
                                {/* Topic Image */}
                                {result.storyImagesBase64?.[currentStorySlide] ? (
                                  <div className="relative group/img w-full max-w-2xl mx-auto shadow-2xl rounded-[32px] overflow-hidden">
                                    <div className="aspect-video relative overflow-hidden bg-white/5 border-4 border-[#E8E0D0] rounded-[32px]">
                                      {/* Image Loading Overlay */}
                                      {(isSlideUpdating === currentStorySlide) && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                          <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-indigo animate-spin" />
                                            <p className="text-xs font-bold text-indigo/60">Updating Image...</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <img
                                        src={result.storyImagesBase64[currentStorySlide]}
                                        alt={result.title}
                                        className="w-full h-full object-contain bg-white"
                                        referrerPolicy="no-referrer"
                                      />
                                      
                                      {/* Image Controls Overlay */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex flex-col items-center justify-center gap-4 no-print">
                                        <div className="flex items-center gap-3">
                                          <button 
                                            onClick={() => regenerateSlideImage(currentStorySlide)}
                                            disabled={isSlideUpdating !== null}
                                            className="px-4 py-2 bg-white text-indigo font-bold rounded-xl hover:bg-indigo hover:text-white flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                          >
                                            <RefreshCw className={`w-4 h-4 ${isSlideUpdating === currentStorySlide ? 'animate-spin' : ''}`} />
                                            {language === "Hindi" ? "फिर से बनाएं" : "Regenerate AI"}
                                          </button>
                                          <button 
                                            onClick={() => refineImageWithAI(currentStorySlide)}
                                            disabled={isSlideUpdating !== null}
                                            className="px-4 py-2 bg-white text-purple font-bold rounded-xl hover:bg-purple hover:text-white flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                          >
                                            <Sparkles className="w-4 h-4" />
                                            {language === "Hindi" ? "AI से सुधारें" : "Refine with AI"}
                                          </button>
                                        </div>
                                        
                                        <div className="w-full max-w-[200px] h-px bg-white/20" />
                                        
                                        <label className={`px-4 py-2 bg-indigo text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer flex items-center gap-2 transition-all shadow-lg ${isSlideUpdating !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                          <Archive className="w-4 h-4" />
                                          {language === "Hindi" ? "फोटो बदलें" : "Replace Image"}
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            disabled={isSlideUpdating !== null}
                                            accept="image/*" 
                                            onChange={(e) => handleImageUpload(e, currentStorySlide)} 
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                <div className="aspect-video w-full max-w-2xl mx-auto bg-[#F8F9FD] rounded-[32px] flex items-center justify-center border-2 border-dashed border-[#E8E0D0]">
                                  <Loader2 className="w-8 h-8 text-indigo/20 animate-spin" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              if (currentStorySlide > 0) {
                                setCurrentStorySlide(prev => prev - 1);
                              } else {
                                setCurrentScreen(0);
                              }
                            }}
                            className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white text-saffron border-2 border-saffron rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-50 no-print"
                          >
                            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                          </button>

                          <button 
                            onClick={() => {
                              if (currentStorySlide < result.storySlides.length - 1) {
                                setCurrentStorySlide(prev => prev + 1);
                              } else {
                                setCurrentScreen(2);
                              }
                            }}
                            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-50 no-print"
                          >
                            <ChevronRight className="w-6 h-6" strokeWidth={3} />
                          </button>
                        </motion.div>
                      )}

                      {currentScreen === 2 && (
                        <motion.div 
                          key="quiz"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex-1 flex flex-col px-24 pt-4 pb-8 relative"
                        >
                          <div className="flex-1 flex flex-col justify-start min-h-[60vh]">

                            <AnimatePresence mode="wait">
                              {!isQuizComplete ? (
                                <motion.div
                                  key={currentQuizIndex}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className="flex-1 flex flex-col justify-start space-y-4 relative"
                                >
                                  {currentQuizIndex !== 0 ? (
                                    <button 
                                      onClick={() => setCurrentQuizIndex(prev => prev - 1)}
                                      className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white text-saffron border-2 border-saffron rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-50 no-print"
                                      title="Previous"
                                    >
                                      <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setCurrentScreen(1);
                                        setCurrentStorySlide(result.storySlides.length - 1);
                                      }}
                                      className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white text-saffron border-2 border-saffron rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-50 no-print"
                                      title="Back to Story"
                                    >
                                      <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                                    </button>
                                  )}

                                  <button 
                                    onClick={() => {
                                      if (currentQuizIndex < result.quiz.length - 1) {
                                        setCurrentQuizIndex(prev => prev + 1);
                                      } else {
                                        setIsQuizComplete(true);
                                      }
                                    }}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print"
                                    title="Next"
                                  >
                                    <ChevronRight className="w-6 h-6" strokeWidth={3} />
                                  </button>

                                  <div className="text-left mb-2 mt-2">
                                    <h2 className="text-3xl font-black text-black">
                                      {language === "Hindi" ? "देखें कि आप क्या जानते हैं!" : "Let's See What You Know !"}
                                    </h2>
                                  </div>

                                  <div className="min-h-[80px] flex items-start justify-start mb-4 relative group">
                                    <h4 
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newText = e.currentTarget.textContent || "";
                                        if (newText !== result.quiz[currentQuizIndex].question) {
                                          regenerateQuizAudio(currentQuizIndex, newText);
                                        }
                                      }}
                                      className="text-5xl font-bold leading-[1.2] outline-none focus:ring-2 focus:ring-saffron/20 rounded-lg p-0 text-black text-left w-full"
                                    >
                                      {result.quiz[currentQuizIndex].question}
                                    </h4>
                                    {!result.quiz[currentQuizIndex].audioBase64 && !isAudioGenerating && (
                                      <div className="absolute top-0 right-0 p-2 text-amber-500 animate-pulse" title="Audio missing for this question">
                                        <AlertCircle className="w-6 h-6" />
                                      </div>
                                    )}
                                    <button 
                                      onClick={() => regenerateQuizAudio(currentQuizIndex, result.quiz[currentQuizIndex].question)}
                                      disabled={isAudioGenerating}
                                      className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-saffron/10 text-saffron rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-saffron hover:text-white disabled:opacity-30 z-10"
                                      title="Regenerate Question Audio"
                                    >
                                      <RefreshCw className={`w-4 h-4 ${isAudioGenerating ? 'animate-spin' : ''}`} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4">
                                    {result.quiz[currentQuizIndex].options.map((option, idx) => {
                                      const isSelected = selectedOption === idx;
                                      const isCorrectIdx = idx === result.quiz[currentQuizIndex].correctIndex;
                                      
                                      let borderClass = "border-gray-200";
                                      let bgClass = "bg-white";
                                      let textClass = "text-gray-800";
                                      
                                      if (selectedOption !== null) {
                                          if (idx === result.quiz[currentQuizIndex].correctIndex) {
                                            if (selectedOption === result.quiz[currentQuizIndex].correctIndex || quizAttempts >= 2) {
                                              borderClass = "border-green-400 ring-2 ring-green-100";
                                              bgClass = "bg-green-50";
                                            }
                                          } else if (isSelected) {
                                            borderClass = "border-red-400 ring-2 ring-red-100";
                                            bgClass = "bg-red-50";
                                          }
                                      }

                                      return (
                                        <div key={idx} className="relative group">
                                          <button
                                            onClick={() => handleQuizAnswer(idx)}
                                            className={`w-full p-6 pr-16 rounded-2xl border-2 text-left font-medium transition-all active:scale-[0.99] flex items-center justify-between gap-6 ${bgClass} ${borderClass} ${textClass} hover:border-indigo/30 shadow-sm`}
                                          >
                                            <span
                                              contentEditable
                                              suppressContentEditableWarning
                                              onClick={(e) => e.stopPropagation()}
                                              onBlur={(e) => {
                                                const newOptions = [...result.quiz[currentQuizIndex].options];
                                                newOptions[idx] = e.currentTarget.textContent || "";
                                                updateQuiz(currentQuizIndex, 'options', newOptions);
                                              }}
                                              className="outline-none focus:ring-1 focus:ring-indigo/30 rounded px-1 text-2xl flex-1"
                                            >
                                              {option}
                                            </span>
                                            
                                            {selectedOption !== null && idx === result.quiz[currentQuizIndex].correctIndex && (selectedOption === result.quiz[currentQuizIndex].correctIndex || quizAttempts >= 2) && (
                                              <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                                                <Check className="w-5 h-5 text-white" />
                                              </div>
                                            )}
                                            {selectedOption !== null && isSelected && idx !== result.quiz[currentQuizIndex].correctIndex && (
                                              <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                                                <X className="w-5 h-5 text-white" />
                                              </div>
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>

                                    {quizFeedback && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl flex items-center gap-3 shrink-0 ${
                                          quizFeedback.type === 'success' ? 'bg-green-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'
                                        }`}
                                      >
                                        {quizFeedback.type === 'success' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                        <span className="font-bold text-lg">{quizFeedback.message}</span>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8 bg-[#0D1B4D] text-white relative overflow-hidden h-full rounded-[40px] border-[8px] border-[#386AF6]"
                                  >
                                    <div className="relative z-10 w-full max-w-lg px-4">
                                      <h3 className="text-4xl font-black mb-6 drop-shadow-lg tracking-tight">
                                        {result?.title} {language === "Hindi" ? "प्रो !" : "Pro !"}
                                      </h3>
                                      
                                      <div className="flex justify-center gap-4 mb-8">
                                        {[1, 2, 3].map((star) => {
                                          const accuracy = Math.round((quizScore / (result?.quiz.length || 1)) * 100);
                                          const starsCount = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
                                          return (
                                            <Star 
                                              key={star} 
                                              className={`w-16 h-16 ${star <= starsCount ? 'text-[#FF9F0A] fill-[#FF9F0A]' : 'text-white/10'}`} 
                                              strokeWidth={1.5}
                                            />
                                          );
                                        })}
                                      </div>

                                      <div className="bg-[#1E2E6E] rounded-[24px] px-10 py-6 mb-6 inline-block shadow-inner min-w-[240px]">
                                        <div className="text-5xl font-black mb-1">{Math.round((quizScore / (result?.quiz.length || 1)) * 100)}%</div>
                                        <div className="text-lg font-bold opacity-70 uppercase tracking-[0.2em]">{language === "Hindi" ? "सटीकता" : "ACCURACY"}</div>
                                      </div>

                                      {/* NIPUN mastery ribbon — only when LO is known and ≥75% accuracy */}
                                      {result?.loCode && (() => {
                                        const acc = Math.round((quizScore / (result?.quiz.length || 1)) * 100);
                                        const mastered = acc >= 75;
                                        return (
                                          <div className={`mx-auto mb-8 max-w-md rounded-2xl px-5 py-3 text-left ${mastered ? 'bg-green-500/20 border-2 border-green-400/60' : 'bg-amber-500/15 border-2 border-amber-400/50'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`font-black text-[11px] tracking-wider px-2 py-0.5 rounded ${mastered ? 'bg-green-400 text-green-950' : 'bg-amber-300 text-amber-950'}`}>{result.loCode}</span>
                                              <span className="font-black text-sm">
                                                {mastered
                                                  ? (language === "Hindi" ? "महारत हासिल!" : "Mastered!")
                                                  : (language === "Hindi" ? "लगभग!" : "Almost!")}
                                              </span>
                                            </div>
                                            <div className="text-[12px] font-medium opacity-90 leading-snug">
                                              {result.loOutcome}
                                            </div>
                                            <div className="text-[11px] opacity-70 mt-1">
                                              {result.loGrade} · {result.loSubSkill}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <button 
                                        onClick={() => {
                                          setCurrentQuizIndex(0);
                                          setQuizScore(0);
                                          setQuizAttempts(0);
                                          setIsQuizComplete(false);
                                          setCurrentScreen(0);
                                          setCurrentStorySlide(0);
                                        }}
                                        className="px-12 py-4 bg-saffron text-white rounded-[40px] font-black text-2xl shadow-[0_10px_40px_rgba(252,183,23,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto"
                                      >
                                        {language === "Hindi" ? "फिर से खेलें" : "Play Again"}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <button 
                              onClick={() => setCurrentScreen(1)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-saffron text-white rounded-full shadow-lg hover:scale-110 transition-all z-50 no-print"
                            title="Back to Story"
                          >
                            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 pt-8 no-print">
                  <button 
                    onClick={downloadHTML}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo text-white font-bold hover:scale-105 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download HTML
                  </button>
                  <button 
                    onClick={downloadZip}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-[#E91E8C] text-white font-bold hover:scale-105 transition-all shadow-md"
                  >
                    <Archive className="w-4 h-4" />
                    Download ZIP
                  </button>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setAudioBase64(null);
                      setTopic("");
                    }}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white border-2 border-[#E8E0D0] text-[#555577] font-bold hover:text-saffron hover:border-saffron transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Create New Lesson
                  </button>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block text-center border-t border-[#E8E0D0] pt-8 mt-12">
                  <p className="text-xs text-[#555577]">Interactive Learning Lesson • {new Date().toLocaleDateString()}</p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {!result && !isGenerating && (
            <div className="bg-indigo-light border-2 border-indigo rounded-2xl p-6 flex items-start gap-4 no-print">
              <div className="text-2xl">📘</div>
              <div>
                <h4 className="font-bold text-indigo">How it works</h4>
                <p className="text-sm text-indigo/80 leading-relaxed mt-1">
                  Enter a topic and select the skills you want to focus on. Our AI will generate a grade-appropriate lesson with a story, key takeaways, an educational illustration, and a fun quiz!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Mascot */}
      <div className="fixed bottom-6 right-6 pointer-events-none opacity-40">
        <div className="text-6xl animate-bounce">✨</div>
      </div>
    </div>
  );
}
