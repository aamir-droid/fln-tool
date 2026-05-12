// NIPUN Bharat Curriculum — extracted from the official framework document
// Stages: 3 = Balvatika · 4 = Grade 1 · 5 = Grade 2 · 6 = Grade 3
// Codes: ECL1 = First Language Literacy · IL = Balvatika Numeracy · ILM = Grade 1+ Numeracy

export type NipunLO = {
  code: string;
  topic: string;
  keywords: string;
  outcome: string;
  activity: string;
  subSkill: string;
};

export type Domain = "literacy" | "numeracy";

type Tuple = [code: string, topic: string, keywords: string, outcome: string, activity: string];

type RawGradeDomain = { [subSkill: string]: Tuple[] };
type RawGrade = {
  stage: number;
  ageBand: string;
  literacy: RawGradeDomain;
  numeracy: RawGradeDomain;
};

const RAW: { [grade: string]: RawGrade } = {
  "Balvatika": {
    stage: 3, ageBand: "5–6",
    literacy: {
      "Oral Language": [
        ["ECL1 3.1", "Talking to teachers, friends & adults", "talk speak oral self-expression conversation", "Talks with familiar and new teachers, friends and adults at school and home in her own language.", "Tap on a friendly avatar 'Didi'. The child sees prompts like 'My favourite food is…' and records a 10-second voice reply."],
        ["ECL1 3.4 a", "Reciting poems with right voice & tone", "rhyme poem song recite tone voice", "Recites poems and songs using right voice and tone in her own language.", "App plays a rhyme line by line. Child taps mic and copies the line with matching tone. Stars given for confidence, not pronunciation."],
        ["ECL1 3.4 b", "Reciting parts of poems with fluency", "fluency poem rhyme rising falling intonation", "Recites parts of familiar poems with fluency and proper rising-falling voice.", "Karaoke-style — the rhyme highlights word by word. Child reads aloud; the app records and lets her listen back."],
        ["ECL1 3.7", "Noticing repeated sounds in poems", "rhyme repeated sound phonological awareness", "Notices repeated sounds in familiar stories and poems.", "Listen to a poem with rhyme 'bag, lag, tag'. Child taps each picture every time she hears the matching sound."],
        ["ECL1 3.8 a", "Noticing repeated words in stories", "repetition word story listening", "Notices repeated sounds, words, etc. in stories, poems and songs.", "After hearing a story, app asks 'Which word came again and again?' with three picture options."]
      ],
      "Reading": [
        ["ECL1 3.2", "Reading a picture-book using pictures", "picture book story reading guess", "Picks a book from the reading corner and tries to understand the story using pictures — can guess what the words say.", "Show a 4-picture story (no text). Child swipes through and records herself telling the story. Saved as 'My First Story'."],
        ["ECL1 3.3", "Sharing experience of stories & poems", "story poem share experience", "Talks about and shares her experience of poems and stories with friends in her own language.", "After a story, the app asks: 'Did you like the rabbit?' with thumbs up/down. Then a voice-note prompt: 'Tell me why.'"],
        ["ECL1 3.5 a", "Telling favourite story to teacher", "favourite story retell teacher", "Tells her favourite story to the teacher.", "'Story Time' tab — child picks a story image and tells it in her voice. Recording can be sent to the teacher inside the app."],
        ["ECL1 3.5 b", "Talking about pictures & writing own name", "picture talk write name invented spelling", "Looks carefully at pictures in a book, talks about them and writes her name using invented spelling.", "Show a busy market picture. Child taps any object to hear its name. At the end, she writes her name in a finger-tracing box."],
        ["ECL1 3.6 a", "Print awareness — direction of reading", "print awareness direction left right finger", "Reads with understanding of print (knows where reading begins, direction of reading).", "A finger-cursor moves left to right under each word as the app reads. Child drags her finger the same way to unlock the next page."],
        ["ECL1 3.6 b", "Sequencing a story from pictures", "sequence story picture order", "Reads a story by arranging the pictures in the right order of events.", "A 4-panel story is shuffled. Child drags pictures into 1-2-3-4 order; the app reads the story aloud once correct."],
        ["ECL1 3.8 b", "Predicting words from pictures & sounds", "predict letter sound link decoding", "Predicts what the text says using pictures, prior experience and letter–sound links.", "Show a picture of a kite + letter क. Ask 'What word is this?' Three audio options play — child taps the right one."]
      ],
      "Writing": [
        ["ECL1 3.9", "Writing own name (invented spelling)", "write name invented spelling tracing", "Shows interest in writing – uses invented spelling to write her name, friends' names and objects.", "A blank pencil-tracing pad. Child writes her name with her finger. App accepts any close attempt and stamps a star — no red marks."]
      ]
    },
    numeracy: {
      "Senses & Observation": [
        ["IL 3.1", "Using five senses to explore", "senses see hear touch smell taste", "Uses all senses to explore and notice things around her.", "Mystery Box — child taps a box and the app plays a sound (cow, bell, water). She picks the matching picture."],
        ["IL 3.2", "Spotting small details", "observation details spot difference", "Notices small details in common things — sounds, people, animals, birds, pictures around her.", "Show two almost-same pictures of a classroom. Child taps the 5 differences."],
        ["IL 3.3 a", "Remembering 4–5 objects", "memory recall objects fruits", "Remembers and tells about 4–5 objects she has seen.", "Show 5 fruits for 5 seconds. Hide them. Child taps the same 5 fruits from a tray of 10."],
        ["IL 3.3 b", "Spotting missing parts", "missing parts complete picture", "Spots 3–5 missing parts in a picture of a familiar object.", "A drawing of a face is missing eyes, nose, ear. Child drags the missing parts into the right place."]
      ],
      "Sorting & Matching": [
        ["IL 3.4", "One-to-one matching", "one to one matching cup saucer", "Places 5–6 objects of two groups in one-to-one matching.", "5 cups and 5 saucers on screen. Child drags each cup onto a saucer. App: 'Same! 5 cups, 5 saucers.'"],
        ["IL 3.5", "Sorting by shape, colour, size", "sort group shape colour size position", "Sorts and groups objects by 3 things together — shape, colour and size. Uses position words.", "A toy box on screen. Child sorts 'all red AND round AND big'. Then drags one toy 'inside' the box and one 'under' it."]
      ],
      "Sequencing": [
        ["IL 3.6", "Arranging by sequence", "sequence size order growing", "Arranges 4–5 cards or objects in a sequence by shape, size, or order of events.", "Cards: seed → small plant → big plant → flower. Child drags them in growing order."],
        ["IL 3.7", "Time-events from a story", "time first night sequence story", "Understands time-related events when a story is told.", "After a short audio story, ask 4 questions in order: 'What happened first?'"]
      ],
      "Reasoning": [
        ["IL 3.8 a", "Solving daily-life problems with reasons", "reason daily problem equal share", "Solves simple daily-life problems with reasons.", "Picture: 3 children, 2 toffees. Question: 'Is it equal?' Child taps Yes/No and records why."],
        ["IL 3.8 b", "Investigating, predicting, constructing", "predict investigate sink float", "Investigates objects around her, asks questions, predicts and constructs ideas.", "'Will it sink or float?' — child taps coin, leaf, ball. Each time she predicts before the animation."],
        ["IL 3.8 c", "Caring for the environment", "environment save water electricity awareness", "Cares for the environment — shows awareness like turning off lights, not wasting water.", "A virtual house: child taps to switch off a tap, switch off a light, water a plant. Earns 'Earth Hero' points."]
      ],
      "Number Sense": [
        ["IL 3.9", "Counting up to 10 objects", "count number 10 ducks objects", "Counts up to 10 objects.", "Show 7 ducks. Each tap on a duck makes it quack and a number appears (1, 2, 3…). Child counts till the last duck."],
        ["IL 3.10", "Counting forward & backward up to 9", "count forward backward rocket countdown", "Counts forward AND backward up to 9 from any given number.", "A rocket launch. Child taps numbers 9-8-7-6… in order to make it lift off."],
        ["IL 3.11", "Recognising & writing numerals 1–9", "numeral write trace 1 to 9", "Recognises numerals 1–9 and writes them.", "Trace a hollow numeral with the finger. The app speaks the number once correctly traced."],
        ["IL 3.12", "Idea of zero (reducing to nothing)", "zero empty nothing birds tree", "Knows the idea of 'reducing to nothing' — beginning of zero.", "Story: 3 birds on a branch — one flies, two flies, third flies — tree empty. Child taps and counts 3→2→1→0."],
        ["IL 3.13", "Comparing — more / less than (≤10)", "compare more less than laddoo", "Compares two numbers up to 10 and uses words 'more than' and 'less than'.", "Two plates: 6 laddoos vs 3. Child taps the plate that has 'more than'. Audio: 'Yes, 6 is more than 3.'"]
      ],
      "Operations": [
        ["IL 3.14", "Early addition — combine groups (up to 9)", "addition combine apples basket", "Combines two groups up to 9 objects and counts them again.", "2 red apples and 3 green apples are dragged into a basket. App: '2 and 3 makes 5.' Child taps 5 from a number row."],
        ["IL 3.15", "Early subtraction — take away (up to 9)", "subtraction take away cookies", "Takes objects out of a group up to 9 and counts again.", "9 cookies on a plate. Child eats (drags) 4 cookies away. App: 'How many left?' She taps 5."]
      ],
      "Money": [
        ["IL 3.20", "Identifying Indian currency notes", "money currency notes rupee 10 20 50 100 200", "Identifies Indian currency notes.", "Show 5 notes — ₹10, ₹20, ₹50, ₹100, ₹200. App speaks the value; child taps the matching note."]
      ],
      "Measurement": [
        ["IL 3.21", "Comparing 3 objects by length", "length tallest shortest pencil", "Compares 3 objects by length — longest/shortest, tallest/shortest.", "3 pencils on screen. Child drags them shortest → tallest. App labels each one."],
        ["IL 3.22", "Comparing weight — heavier / lighter", "weight heavier lighter see-saw", "Compares two objects by weight — heavier than/lighter than.", "See-saw with a watermelon and an orange. Child predicts which side goes down, then taps to check."],
        ["IL 3.23", "Comparing capacity of two vessels", "capacity glass mug volume", "Compares the capacity of two vessels — bottles, glasses, buckets.", "Animated water filling: which holds more, a glass or a mug? Child taps the bigger one and watches the answer pour out."]
      ],
      "Shapes": [
        ["IL 3.25", "2D shapes from 3D objects (tracing)", "shape 2d 3d trace face square", "Identifies 2D shapes by tracing the faces of 3D shapes on a flat surface.", "Box, ball, cone on screen. Child taps the box — its bottom face stamps a square on paper. App says 'square'."],
        ["IL 3.26", "Using 'half' in daily life", "half fraction roti glass daily", "Uses words like 'half roti', 'half glass of water' in daily life.", "Show a roti picture. Tap once to cut it in half. App says 'half roti'. Same with a glass filled to the middle."]
      ],
      "Patterns & Data": [
        ["IL 3.27", "Creating leaf/thumb patterns", "pattern stamp leaf flower create", "Creates new patterns using leaf-printing or thumb-printing.", "A blank strip. Child taps to stamp — leaf, leaf, flower, leaf, leaf, flower — making a pattern. App reads it back."],
        ["IL 3.28", "Drawing simple conclusions", "data conclusion more red blue pencils", "Draws conclusions from things around her — 'I have more red pencils than blue.'", "Show 5 red pencils and 3 blue. Ask: 'Which colour is more?' Child taps red. App reinforces: '5 is more than 3.'"]
      ],
      "Calendar & Tech": [
        ["IL 3.29", "Days of week & months of year", "days week month calendar", "Says the names of the days of the week and months of the year.", "A weekly calendar wheel. Child spins it; the app speaks each day. Then she taps 'Today is __' and picks the right day."],
        ["IL 3.30", "Everyday technology around me", "technology tv mobile remote mixer", "Talks about the everyday tech tools she sees — TV, mobile, remote.", "Tap a TV, mobile, mixer. The app plays its sound and asks 'What is this used for?'"]
      ]
    }
  },

  "Grade 1": {
    stage: 4, ageBand: "6–7",
    literacy: {
      "Oral Language": [
        ["ECL1 4.1", "Asking & expressing needs", "ask need question shop bhaiya", "Uses her own / school language to express needs and asks questions to find out things.", "'Daily Helper Game' — avatar shop. Child has to buy 2 items. She must tap the mic and say 'Bhaiya, I need…' to move forward."],
        ["ECL1 4.4", "Rhyming words — spot & create", "rhyme cat bat mat wordbank", "Spots rhyming words in familiar poems and songs and makes new rhyming words.", "Hear 'cat – bat – mat'. App shows 'rat'. Child taps 'Yes, it rhymes!' Then selects new rhymes from a wordbank."],
        ["ECL1 4.7", "Talking & writing about animals", "animal bird crow garden write", "Talks about birds and animals in her surroundings and writes a few words about them with invented/real spelling.", "Tap any animal in a 'My Garden' scene. Child records 'The crow says kaw kaw.' Then types 'crow' with onscreen letters."]
      ],
      "Reading": [
        ["ECL1 4.2", "Narrating story from pictures", "narrate picture story tell", "Picks a book from the reading corner and narrates the story using the pictures.", "Picture-only story. Each page asks 'What's happening here?' Child records her version. At the end, she hears the real story."],
        ["ECL1 4.3 a", "Connecting story to own experiences", "experience connect lost ball", "Connects her own experiences with familiar stories and talks about them.", "After a story about a lost ball, app asks: 'Have you ever lost something?' Child records; app links her story to the book."],
        ["ECL1 4.3 b", "Making rules in play", "rule play game reason board", "Makes some rules during games and play with friends.", "Mini board game inside the app. Child adds 1 'rule card' before play (e.g. 'No skipping turns'). Reinforces voice + reasoning."],
        ["ECL1 4.5", "Predicting text by turning pages", "predict page flip missing word", "Predicts and tries to make meaning of textbook and story-book text by turning pages back and forth.", "Story page with one missing word. Child taps to flip to a previous page for clues, then picks the missing word from 3 options."],
        ["ECL1 4.6", "Linking pictures & text", "picture text match sentence", "Connects pictures and text to predict and understand a story.", "Pictures appear above sentences. Child drags the right sentence under each picture: 'The boy is eating' under boy-eating image."]
      ],
      "Writing": [
        ["ECL1 4.8", "Letter–sound links while writing", "letter sound phonics cat word builder", "Notices letter shapes and their sounds while reading stories and poems — uses them while writing.", "Word-builder: see picture of a cat. Letters c, a, t are jumbled. Child drags into the right order. Letters say their sound on tap."],
        ["ECL1 4.9", "Labelling own pictures", "label picture sun tree write", "Writes labels for her own pictures.", "Drawing canvas. Child draws (or picks) a sun and a tree. She labels them by tapping or typing 'sun' and 'tree'."]
      ]
    },
    numeracy: {
      "Number Sense": [
        ["ILM 4.9", "Counting objects up to 20", "count 20 balls bouncing voice", "Counts objects up to 20 — with real things and pictures.", "Bouncing balls (up to 20) appear one at a time. Child taps 'Next' and counts aloud. App tracks finger-count + voice count."],
        ["ILM 4.10", "Counting forward & backward up to 20", "count forward backward staircase 20", "Counts forward AND backward from any number up to 20.", "A staircase from 1 to 20. Child types the next/previous step to climb up or down."],
        ["ILM 4.11", "Recognising & writing numerals up to 99", "numeral 99 tens ones place value", "Recognises and writes numerals up to 99.", "Number-builder: tens-block + ones-block. Child drags 4 tens and 7 ones, then writes '47' on the slate."],
        ["ILM 4.12", "Idea of zero", "zero candle blow none", "Develops the idea of zero — knows that nothing is also a number.", "5 candles on a cake. Child blows (taps) one by one. Counter 5-4-3-2-1-0. App: 'Zero — no candles left.'"],
        ["ILM 4.13", "Comparing numbers up to 20", "compare bigger smaller than 20 gift", "Compares two numbers up to 20 using bigger than/smaller than.", "Two gift boxes show 12 and 17. Child drags 'bigger than' or 'smaller than' between them."]
      ],
      "Operations": [
        ["ILM 4.14", "Addition facts up to 18", "addition marbles riya story problem", "Builds addition facts up to 18 using objects and uses them in daily life.", "Story: 'Riya has 8 marbles, brother gives 6 more.' Child drags 8+6 = 14 onto the answer slate."],
        ["ILM 4.15", "Subtraction facts up to 9", "subtraction birds fly away take", "Builds subtraction facts up to 9 using objects and uses them in daily life.", "Story: '9 birds, 4 fly away.' Child taps 4 birds to fly off. App: 'How many left?' She taps 5."],
        ["ILM 4.16", "Link between + and −", "addition subtraction link inverse", "Knows that addition and subtraction are linked (5+3=8 and 8−3=5).", "Show 5+3=8 with blocks. Then ask child to make a subtraction sentence using same blocks: 8−3=__. She drags 5."],
        ["ILM 4.17", "Repeated addition (multiplication idea)", "repeated addition plates ladoos multiplication", "Adds the same number again and again up to 10.", "Picture: 3 plates with 2 ladoos each. App: 'How many in all?' Child counts 2+2+2=6."]
      ],
      "Money": [
        ["ILM 4.20", "Making ₹20 with notes & coins", "money rupees notes coins pencil shop", "Shows an amount up to ₹20 using notes and coins.", "Toy shop. A pencil costs ₹15. Child drags notes (₹10 + ₹5) to pay. App accepts any correct combination."]
      ],
      "Measurement": [
        ["ILM 4.21", "Length using non-uniform units", "length finger handspan footstep estimate", "Estimates and measures short lengths using non-uniform units like finger, hand-span, footstep.", "A pencil on screen. Child predicts: 'How many fingers long?' Then drags her 'finger' across to check."],
        ["ILM 4.22", "Weight — heaviest / lightest of 3", "weight heaviest lightest seesaw fruit", "Compares 3 objects by weight — heaviest/lightest.", "See-saw. Child puts watermelon, apple, grape one by one. Sees them ranked heaviest to lightest."],
        ["ILM 4.23", "Capacity in cups & spoons", "capacity cup spoon mug jug fill", "Estimates and measures capacity using non-standard units like cup, spoon, mug.", "A jug. Child fills it using a 'cup'. App: 'How many cups did you need?'"],
        ["ILM 4.24", "Hot / cold for objects & weather", "temperature hot cold weather", "Uses words like hot/cold for objects and weather.", "Weather screen. Child drags ice-cream, hot tea, sunny day, snowman into 'Hot' or 'Cold' boxes."]
      ],
      "Shapes": [
        ["ILM 4.25", "3D shapes — cube, sphere, cylinder", "3d shape cube sphere cylinder corners faces", "Identifies and describes 3D shapes (cube, sphere, cylinder) by what she sees and feels.", "Tap a shoe-box (cube), ball (sphere), pen-cap (cylinder). App asks how many corners and faces; child counts and taps."],
        ["ILM 4.26", "Idea of half (fraction)", "half fraction pizza fold share", "Knows the idea of 'half' — learns by paper folding and daily examples like roti/sandwich.", "Drag a pizza, fold it once. App: 'You made 2 halves.' Then asks her to share fairly with a friend on screen."]
      ],
      "Patterns & Data": [
        ["ILM 4.27", "Extending patterns of shapes/sound", "pattern star circle clap tap extend", "Notices, extends and creates patterns of shapes, numbers and sounds.", "Pattern: star, circle, star, circle, star, __. Child taps the next shape. Then a sound pattern: clap-clap-tap-clap-clap-__. She records the next."],
        ["ILM 4.28", "Reading simple picture charts", "data picture chart boys girls", "Collects, records and reads simple information from pictures.", "Picture: a class with 3 boys, 4 girls. Child taps and counts each group, then fills a 2-row picture chart."]
      ],
      "Calendar & Tech": [
        ["ILM 4.29", "Days, months & events", "days months calendar birthday may", "Says the names of days and months and uses them for events.", "Calendar wheel. Child taps 'My birthday'. She picks the month and day. App marks it and reminds her near the date."],
        ["ILM 4.30", "Using basic tech tools", "tech remote tv channel volume", "Uses some technology tools around her.", "A pretend remote screen: child taps to switch on the TV, change channel, lower volume."]
      ]
    }
  },

  "Grade 2": {
    stage: 5, ageBand: "7–8",
    literacy: {
      "Oral Language": [
        ["ECL1 5.1", "Giving opinions & asking questions", "opinion ask question debate rainy", "Uses school language to give her opinion and ask questions for different reasons.", "Class debate: 'Do you like rainy days?' App offers sentence-starters ('I think… because…'). Child records her opinion."],
        ["ECL1 5.4", "Creating rhyming words (oral & written)", "rhyme word ladder sun run fun", "Creates rhyming words and similar-sounding words orally and in writing from familiar poems and songs.", "Word ladder: 'sun – run – fun – __'. Child types or speaks the next rhyme. Wrong rhymes are gently bounced back."],
        ["ECL1 5.7", "Talking about characters & events", "character event story feeling retell", "Talks about characters and events from stories, poems and other texts.", "After a story, app shows the 3 characters. Child taps one and answers 'How did this character feel?' with a recording."]
      ],
      "Reading": [
        ["ECL1 5.2", "Naming & drawing favourite character", "character draw favourite label", "Talks about the characters in a familiar story — draws and writes the name of her favourite character.", "Story library. Child picks a story, then chooses her favourite character. She draws on the canvas and labels with the name."],
        ["ECL1 5.3 a", "Storytelling in own style", "story style retell lion mouse", "Tells stories and recites poems in her own language with her own style.", "'My Style Storytelling' — child re-tells a known story (Lion and Mouse) in her words. App records and shares with teacher."],
        ["ECL1 5.3 b", "Conversation & asking questions", "conversation ask avatar pair", "Joins in conversations and asks questions while talking with friends and adults.", "Pair-up activity: two avatars talk. Child fills in 'her' question turn each time. Three-turn conversation."],
        ["ECL1 5.5 a", "Predicting text from title & pictures", "predict title picture textbook", "Predicts and reads the textbook and children's books in known contexts.", "Textbook page on screen. App highlights the title and pictures. Child predicts what the text is about, then reads to check."],
        ["ECL1 5.5 b", "Sharing likes / dislikes & asking", "like dislike question after story", "Says her likes and dislikes about a story and asks questions.", "After a story, three buttons: 'I liked', 'I didn't like', 'I want to ask…'. Each opens a recording or typing space."],
        ["ECL1 5.5 c", "Reading 45–60 wpm with comprehension", "fluency wpm comprehension unknown text", "Tries to read familiar AND unfamiliar text and talks about it — uses pictures, sound–symbol links and prior knowledge.", "Reader timer: child reads a 6-line story (45–60 wpm target). After reading, she answers 2 simple comprehension questions."],
        ["ECL1 5.6", "Writing sentences about a storyboard", "storyboard sentence write scene", "Understands events and characters in a picture-story / storyboard and writes about them in proper sentences.", "Storyboard with 4 scenes. Child writes one full sentence under each. Spell-friendly keyboard suggests but doesn't auto-fill."]
      ],
      "Writing": [
        ["ECL1 5.8", "Using correct words & sentences", "sentence builder subject verb object", "Uses correct words and sentences (proper writing) in different forms of expression.", "'Sentence builder' — pick subject + verb + object cards (The cat / runs / fast). Child can also write her own from scratch."],
        ["ECL1 5.9", "Adding own ending to a story", "creative ending story imagination", "Adds her own ending to a story using imagination and creativity.", "An open-ended story stops 2 lines before the end. Child types or speaks her own ending. App reads it back to her."]
      ]
    },
    numeracy: {
      "Number Sense": [
        ["ILM 5.9", "Counting up to 100 in tens", "count 100 tens bundle marbles", "Counts objects up to 100 in groups of tens.", "100 marbles drop onto a tray. App asks her to bundle them into groups of 10. She drags 10 at a time into bag-icons."],
        ["ILM 5.10", "Counting forward/backward up to 99", "count forward backward 99 race", "Counts forward and backward from any number up to 99.", "Number race: from 67 forward to 73. Or from 50 back to 43. Child fills the missing numbers as she walks the avatar."],
        ["ILM 5.11", "Reading & writing numbers up to 999", "number name 999 place value board", "Reads and writes number names and numerals up to 999.", "App speaks 'three hundred forty-five'. Child writes 345 using a place-value board (3 hundreds, 4 tens, 5 ones)."],
        ["ILM 5.12", "Place value of zero (305 vs 35)", "zero place value 305 35", "Uses zero correctly in place value.", "Place value game. Show 3, 0, 5 cards. Child must place them into hundreds-tens-ones to make 305 (not 35)."],
        ["ILM 5.13", "Biggest & smallest 2-digit numbers", "biggest smallest 2 digit digit cards", "Compares and forms the biggest and smallest 2-digit numbers using given digits.", "Three digit-cards: 4, 8, 1. Child arranges them to make biggest 2-digit (84) and smallest (14)."]
      ],
      "Operations": [
        ["ILM 5.14", "Addition up to 99 — own method", "addition 99 sticker anu method", "Makes her own way to add two numbers (sum up to 99) and uses it in daily problems.", "Story: 'Anu has 36 stickers, gets 28 more.' Child can use blocks, number line, or column-add to find 64."],
        ["ILM 5.15", "Subtraction up to 99 — own method", "subtraction bus 45 28 empty", "Makes her own way to subtract two numbers up to 99.", "Story: 'A bus has 45 seats. 28 are full.' Child finds 17 empty seats using any method. App accepts multiple paths."],
        ["ILM 5.16", "Link between + and − (triangle facts)", "fact family triangle inverse 8 5 13", "Sees and uses the link between addition and subtraction.", "Triangle facts: 8, 5, 13. Child writes 8+5=13, 5+8=13, 13−5=8, 13−8=5 — all four facts from the same triangle."],
        ["ILM 5.17", "Tables of 2, 3, 4 — multiplication", "multiplication table 2 3 4 wheels", "Builds the idea of multiplication and uses tables of 2, 3 and 4 in daily life.", "'How many wheels on 4 cars?' App shows 4×4 array. Child taps 4×4=16."],
        ["ILM 5.18", "Division as equal sharing", "division equal sharing chocolate friends", "Builds the idea of division as equal sharing.", "12 chocolates and 3 friends. Child drags chocolates one by one to each friend till plates are equal. App: 12÷3=4."],
        ["ILM 5.19", "Picking the right operation", "operation choice add subtract problem", "Picks the right operation (add or subtract) to solve a problem in a familiar situation.", "Word problem: 'Mira had ₹50, spent ₹18.' App shows two buttons: + or −. Child picks − and solves."]
      ],
      "Money": [
        ["ILM 5.20", "Making ₹100 with notes & coins", "money 100 rupees notes combinations", "Shows an amount up to ₹100 using notes and coins.", "Toy shop. Bill is ₹78. Child must make ₹78 using ₹50 + ₹20 + ₹5 + ₹2 + ₹1. Multiple answers accepted."]
      ],
      "Measurement": [
        ["ILM 5.21", "Length with uniform non-standard units", "length pencil rod estimate measure", "Estimates and measures length using non-standard but uniform units like a rod, pencil, thread.", "Measure your bag: child predicts '6 pencils' first, then drags pencil after pencil to measure. Compares predicted vs actual."],
        ["ILM 5.22", "Heavier/lighter using a balance", "balance heavier lighter stone feather", "Compares objects as heavier than/lighter than using a simple balance.", "Drag a stone and a feather onto a balance. Then put 5 stones on one side, 5 feathers on the other. Child explains the result."],
        ["ILM 5.23", "Capacity in cups & buckets", "capacity cup bucket water more", "Compares container capacities using non-standard units like cup, spoon, bucket.", "Two jugs. Child fills both using a cup. Counts cups for each. App: 'Which jug holds more cups of water?'"],
        ["ILM 5.24", "Hotter/colder using signs", "temperature hotter colder tea ice steam", "Compares objects as hotter than/colder than using observable signs (steam, cold drops).", "Picture pairs: tea + ice-cream, fire + snow. Child drags 'hotter' arrow toward the hotter side."]
      ],
      "Shapes": [
        ["ILM 5.25", "2D shapes around me", "2d shape rectangle triangle circle kitchen", "Identifies 2D shapes — rectangle, triangle, circle — around her.", "Photo-search: a kitchen scene. Child taps every rectangle (door, chopping board), every triangle, every circle she finds."],
        ["ILM 5.26", "Half, quarter, whole", "fraction half quarter whole paper fold", "Knows half, quarter and whole using paper folding and daily things.", "Drag a square paper, fold once → halves; fold again → quarters. App labels them 1/2 and 1/4."]
      ],
      "Patterns & Data": [
        ["ILM 5.27", "Patterns in 100-grid (multiples)", "pattern multiples 5 100 grid rule", "Notices and explains patterns in numbers — tables, 1–100 grid, things around.", "100-grid on screen. Child taps the multiples of 5. Pattern lights up. App: 'What do you notice about the last digit?'"],
        ["ILM 5.28", "Reading picture charts & concluding", "data chart conclusion vehicles house", "Reads simple data (picture chart) and draws conclusions like 'X has more than Y'.", "Picture chart: vehicles in 3 houses. Child reads and answers: 'Whose house has the most cars?'"]
      ],
      "Calendar": [
        ["ILM 5.29", "Reading dates & days from calendar", "calendar date day 15 august", "Reads days and months from the calendar and uses them in daily life.", "Real calendar view. App: 'On what day is 15th August?' Child finds the date and taps the day below it."]
      ]
    }
  },

  "Grade 3": {
    stage: 6, ageBand: "8–9 · FLN Final Year",
    literacy: {
      "Oral Language": [
        ["ECL1 6.1", "Reacting to events from media", "react news opinion radio tv felt because", "Uses school/her own language to talk about her likes-dislikes and to react to events from radio, TV, surroundings.", "Daily 'News in 30 seconds' — a short clip plays. Child records her opinion using prompts: 'I felt… because…'."],
        ["ECL1 6.4 a", "Storytelling with right tone & speed", "storytelling fluency mood funny scary", "Tells interesting and funny stories or poems with the right voice, speed, fluency and style.", "'Story Stage' — child picks a story and a mood (funny, scary, soft). She records herself; app gives a fluency feedback bar."],
        ["ECL1 6.4 b", "Riddles & language games", "riddle language game rhythm jumble", "Solves riddles, enjoys language games and songs while understanding rhythm.", "Riddle of the day: text + audio. Child types her guess. Bonus round: word-jumble of the answer."]
      ],
      "Reading": [
        ["ECL1 6.2", "Adding to a story orally", "add to story creative oral continue", "Adds to a story or poem while telling it orally.", "App reads 4 lines of a story and stops. Child records her own next 2 lines. Some endings get added to a class wall."],
        ["ECL1 6.3 a", "Connecting posters/ads to own life", "ad poster connect life fruit eat", "Connects familiar things — poems, posters, ads, stories — with her own life while talking.", "Show a real ad poster ('Eat Fruits!'). Child records: 'In my home we eat… because…' linking it to her experience."],
        ["ECL1 6.3 b", "Asking questions in different ways", "interview role play question reporter farmer", "Has conversations and asks questions on different topics in different ways.", "Role-play screen: child as reporter interviewing a farmer avatar. She asks 4 questions; the avatar answers based on script."],
        ["ECL1 6.5 a", "Unfamiliar words — context & meaning", "vocabulary unfamiliar word context picture meaning", "Connects unfamiliar words from different texts while reading and understands the story.", "Reader with hard words highlighted. Tap any word to see a picture-meaning. Then a quick comprehension check."],
        ["ECL1 6.5 b", "Reading page numbers in a book", "page number find swipe book", "Reads and tells page numbers in a book — e.g., page 45, 76, 21.", "App: 'Open page 76.' Child swipes pages until 76 (visible numerals). Builds quick number-finding."],
        ["ECL1 6.5 c", "Reading newspaper/magazine briefly", "newspaper magazine news read write summary", "Reads different texts (newspaper, children's magazine) with understanding and writes briefly about them.", "Mini news for kids — child reads 4 lines and types 1–2 lines: 'This news is about…'."],
        ["ECL1 6.6 a", "Spotting nouns, verbs, punctuation", "noun verb punctuation highlight grammar", "Spots features of language — naming words, action words, repetition, punctuation — in stories and poems.", "Highlighter game: a passage. Child taps to colour all naming words green, action words red, full-stops yellow."],
        ["ECL1 6.6 b", "Using grammar features in writing", "grammar capital fullstop repetition", "Uses naming words, action words, repetition and punctuation while writing.", "Sentence-fix screen: 'the cat ran ran ran' — child adds capital letter, full-stop, and decides if repetition fits."],
        ["ECL1 6.6 c", "Reading aloud with intonation", "read aloud intonation classroom chart", "Reads familiar texts (mid-day meal chart, class name, book title) with proper flow, voice and intonation.", "Read-aloud test on real classroom items. App rates flow on a 3-star scale (smooth/okay/rocky)."],
        ["ECL1 6.7 a", "Joining morning message activity", "morning message daily feel because", "Joins activities like 'morning message' and similar class-time talks.", "Daily morning message bubble. Child writes 1 sentence to the class: 'Today I feel ___ because ___.'"],
        ["ECL1 6.7 b", "Drawing & captioning on display board", "display draw caption favourite weekly", "Draws on the display board / notebook and talks about her favourite activity.", "'My Wall' — a digital display board. Child posts a drawing + 1-line caption every week."]
      ],
      "Writing": [
        ["ECL1 6.8", "Writing in different forms", "writing forms description list festival story", "Writes about familiar texts in different forms (descriptions, stories, lists) about themes, events, characters.", "Writing prompt: 'My favourite festival.' Child picks a form — list of 5 things, OR 4-line story, OR 1 description."],
        ["ECL1 6.9", "Writing short messages (notice)", "notice message lost cycle template", "Writes short messages (e.g., a notice for a lost cycle).", "Template: 'I have lost my ___. Please call ___ if you find it.' Child fills it for 'lost water bottle'/'lost umbrella'."]
      ]
    },
    numeracy: {
      "Number Sense": [
        ["ILM 6.9", "Counting up to 1000 in tens & hundreds", "count 1000 bundle tens hundreds", "Counts objects up to 1000 in groups of tens and hundreds.", "Bundle-builder: child drags 10 sticks → bundle, 10 bundles → big bundle of 100. Counts 100, 200, 300… up to 1000."],
        ["ILM 6.10", "Counting forward/backward up to 999", "count 999 number line jump", "Counts forward and backward from any number up to 999.", "Number-line jumper: from 658 to 665, or back from 200 to 191. Child fills missing numbers as she jumps."],
        ["ILM 6.11", "Numbers up to 9999 with place value", "place value 9999 thousand", "Reads and writes number names and numerals up to 9999 using place value.", "App says 'four thousand two hundred eighteen'. Child fills 4-2-1-8 in thousands/hundreds/tens/ones boxes."],
        ["ILM 6.12", "Properties of zero (+, −, ×)", "zero property addition subtraction multiplication", "Uses properties of zero in addition, subtraction and multiplication (5+0=5, 7×0=0).", "Quick-fire: 0+8=?, 23−0=?, 6×0=? Child answers each in 5 seconds. App explains 'why' on errors."],
        ["ILM 6.13", "Biggest & smallest 3-digit numbers", "biggest smallest 3 digit zero rule", "Compares and makes the biggest and smallest 3-digit numbers from given digits.", "Cards: 5, 0, 7. Child must form biggest (750) and smallest (without leading zero, 507). App explains the zero rule."]
      ],
      "Operations": [
        ["ILM 6.14", "Standard 3-digit addition (sum ≤ 999)", "addition column 3 digit library carry", "Uses the standard way to add 3-digit numbers (sum up to 999) for daily life problems.", "Story: 'A library has 256 storybooks and 312 textbooks.' Child does column addition; app shows carry-over animation."],
        ["ILM 6.15", "Standard 3-digit subtraction", "subtraction column 3 digit borrow factory", "Uses the standard way to subtract 3-digit numbers (up to 999) for daily life problems.", "Story: 'A factory had 800 toys, sold 245.' Child does column subtraction; app shows borrowing animation step-by-step."],
        ["ILM 6.16", "+/− link in 3-digit numbers", "fact family 3 digit inverse", "Uses the link between addition and subtraction in 3-digit numbers.", "Show 245+318=563. Child writes the matching subtraction: 563−318=245 and 563−245=318."],
        ["ILM 6.17", "Tables of 5 to 10", "tables 5 6 7 8 9 10 arena", "Builds and uses tables of 5 to 10 in daily life situations.", "Times-table arena: '7×8=?'. Child drags 7 rows of 8 dots, then taps the answer. Speed mode unlocks at level 3."],
        ["ILM 6.18", "Division as grouping & repeated subtraction", "division grouping repeated subtraction 12 3", "Explains division as equal grouping and as repeated subtraction.", "12÷3: child sees 12 candies. She makes groups of 3 (4 groups) OR subtracts 3 again and again. App labels both ways."],
        ["ILM 6.19", "Two-step word problems", "two step word problem mom milk bread", "Picks the right operation (add or subtract) for a problem and solves it.", "Two-step: 'Mom had ₹500, spent ₹120 on milk and ₹85 on bread.' Child picks operation, types final answer."]
      ],
      "Money": [
        ["ILM 6.20", "Adding/subtracting amounts up to ₹500", "money 500 regroup carry borrow bill", "Adds and subtracts amounts up to ₹500 with or without regrouping (carrying/borrowing).", "Bill simulator: pencil ₹125, book ₹178, eraser ₹15. Child adds, then subtracts from ₹500 to find balance."]
      ],
      "Measurement": [
        ["ILM 6.21", "Length in cm, m (relationships)", "length cm m centimetre metre ruler", "Estimates and measures length and distance using cm, m and finds the relationships.", "Ruler tool: child measures a pencil in cm. Then she sees 100 cm = 1 m on a stretching strip."],
        ["ILM 6.22", "Weight in g, kg with balance", "weight grams kilograms balance dal atta", "Weighs objects using grams and kilograms with a simple balance.", "Virtual kitchen scale. Child places dal (250g), atta (1kg). App: 'Total weight?' She converts (1250g or 1.25kg)."],
        ["ILM 6.23", "Capacity in litres", "capacity litres bucket bottle", "Estimates and measures capacity in litres.", "A bucket. Child fills using 1L bottles. Counts till bucket is full. App: '1 bucket = 15 litres.'"],
        ["ILM 6.24", "Reading a thermometer", "temperature thermometer fever 100 fahrenheit", "Measures temperature using a thermometer.", "A thermometer image. App: 'fever is above 100°F'. Child reads given temperatures and marks 'normal' or 'fever'."]
      ],
      "Geometry": [
        ["ILM 6.25", "Drawing horizontal, vertical, slant lines", "lines horizontal vertical slant ruler draw", "Draws straight lines in different directions (vertical, slant, horizontal) using a ruler or freehand.", "Drawing pad. Task: draw a horizontal line, a vertical line, a slant line. App checks the angle and gives stars."],
        ["ILM 6.26", "Half, one-fourth, three-fourths", "fraction half quarter three fourths pizza", "Identifies half, one-fourth, three-fourths in a whole and in a group of objects.", "A pizza divided in 4. Child colours 1/4, 1/2, 3/4. Then does same with 8 candies."]
      ],
      "Patterns & Data": [
        ["ILM 6.27", "Patterns up to 3 digits (skip-count)", "pattern skip count 25 grid rule", "Notices, extends and explains patterns in numbers up to 3 digits.", "Pattern hunt in 1–1000 grid: skip-count by 25. Child taps each. App: 'What rule did you use?' She types her rule."],
        ["ILM 6.28", "Tally marks & picture charts", "tally marks data survey fruit chart", "Records data using tally marks, draws a picture chart and reads conclusions.", "Survey: 'Favourite fruit?' Child taps to add tally marks. A picture chart auto-builds. She reads it."]
      ],
      "Calendar & Tech": [
        ["ILM 6.29", "Date & matching day on calendar", "calendar date day republic 26 january", "Identifies a date and the matching day on a calendar.", "Today's calendar. App: 'What day is 26 January?' Child taps the date; app reveals 'Republic Day – Sunday'."],
        ["ILM 6.30", "Using tech tools in daily life", "tech photo note alarm youtube", "Uses different tech tools well in daily life.", "Mini tasks: take a photo, save a note, set an alarm, find a YouTube clip. App walks her through each safely."]
      ]
    }
  }
};

export function getGradeStage(grade: string): number {
  return RAW[grade]?.stage ?? 0;
}

export function getGradeAgeBand(grade: string): string {
  return RAW[grade]?.ageBand ?? "";
}

export function getTopicsForGradeDomain(grade: string, domain: Domain): NipunLO[] {
  const node = RAW[grade]?.[domain];
  if (!node) return [];
  const out: NipunLO[] = [];
  Object.entries(node).forEach(([subSkill, list]) => {
    list.forEach(tuple => {
      out.push({
        code: tuple[0],
        topic: tuple[1],
        keywords: tuple[2],
        outcome: tuple[3],
        activity: tuple[4],
        subSkill
      });
    });
  });
  return out;
}

export function searchTopics(items: NipunLO[], query: string): NipunLO[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return items;
  return items.filter(t =>
    (t.code + " " + t.topic + " " + t.keywords + " " + t.subSkill + " " + t.outcome)
      .toLowerCase()
      .includes(q)
  );
}
