import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db";
import { topics, patternTypes, resources, questions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedAdditionalTopics() {
  console.log("🌱 Starting additional topics seed...\n");

  // Get Percentage topic ID for dependency
  const percentageTopic = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "percentage"))
    .limit(1);

  const percentageTopicId = percentageTopic.length > 0 ? percentageTopic[0].id : null;

  // ========================================
  // TOPIC 1: Profit & Loss
  // ========================================
  console.log("📚 Processing Profit & Loss topic...");
  const existingProfitLoss = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "profit-and-loss"))
    .limit(1);

  if (existingProfitLoss.length > 0) {
    console.log("✓ Profit & Loss topic already exists. Skipping.\n");
  } else {
    console.log("📚 Inserting Profit & Loss topic...");
    const [profitLossTopic] = await db
      .insert(topics)
      .values({
        name: "Profit & Loss",
        slug: "profit-and-loss",
        section: "math",
        displayOrder: 2,
        status: "published",
        dependencyIds: percentageTopicId ? [percentageTopicId] : [],
        cheatsheet: `## Key Formulas

**Profit %:**
$$\\text{Profit \\%} = \\frac{\\text{SP} - \\text{CP}}{\\text{CP}} \\times 100$$

**Loss %:**
$$\\text{Loss \\%} = \\frac{\\text{CP} - \\text{SP}}{\\text{CP}} \\times 100$$

**SP from profit%:**
$$\\text{SP} = \\text{CP} \\times \\frac{100 + \\text{Profit\\%}}{100}$$

**Marked Price & Discount:**
$$\\text{SP} = \\text{MP} \\times \\frac{100 - \\text{Discount\\%}}{100}$$

**Successive profit/loss:**
$$\\text{Net\\%} = a + b + \\frac{ab}{100}$$`,
      })
      .returning();

    console.log(`✓ Topic created with ID: ${profitLossTopic.id}\n`);

    // Insert pattern types
    console.log("🔖 Inserting pattern types for Profit & Loss...");
    const profitLossPatterns = await db
      .insert(patternTypes)
      .values([
        {
          topicId: profitLossTopic.id,
          name: "Basic Profit/Loss",
          description: "Direct profit and loss calculations",
          displayOrder: 0,
        },
        {
          topicId: profitLossTopic.id,
          name: "Successive Transactions",
          description: "Multiple buy-sell transactions",
          displayOrder: 1,
        },
      ])
      .returning();

    const [basicPL] = profitLossPatterns;
    console.log(`✓ Created ${profitLossPatterns.length} pattern types\n`);

    // Insert resources
    console.log("📺 Inserting resources for Profit & Loss...");
    await db.insert(resources).values([
      {
        topicId: profitLossTopic.id,
        type: "video",
        title: "Profit and Loss Basics",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language: "en",
        displayOrder: 0,
      },
      {
        topicId: profitLossTopic.id,
        type: "video",
        title: "Profit and Loss Shortcuts",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language: "hi",
        displayOrder: 1,
      },
    ]);
    console.log("✓ Created 2 resources\n");

    // Insert questions
    console.log("❓ Inserting questions for Profit & Loss...");
    await db.insert(questions).values([
      {
        topicId: profitLossTopic.id,
        patternTypeId: basicPL.id,
        difficulty: "l1",
        questionText: "A trader buys at ₹100 and sells at ₹120. Profit%?",
        optionA: "15%",
        optionB: "20%",
        optionC: "25%",
        optionD: "10%",
        correctOption: "b",
        smartSolution: "Profit = 20, CP = 100. Profit% = 20/100 × 100 = 20%",
        detailedSolution: "Profit = SP - CP = 120 - 100 = 20. Profit% = (Profit/CP) × 100 = (20/100) × 100 = 20%.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: profitLossTopic.id,
        patternTypeId: basicPL.id,
        difficulty: "l1",
        questionText: "CP = ₹200, loss = 10%. SP = ?",
        optionA: "₹170",
        optionB: "₹175",
        optionC: "₹180",
        optionD: "₹185",
        correctOption: "c",
        smartSolution: "SP = 90% of 200 = 180",
        detailedSolution: "Loss of 10% means SP is 90% of CP. SP = 200 × 0.9 = 180.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: profitLossTopic.id,
        patternTypeId: basicPL.id,
        difficulty: "l1",
        questionText: "SP = ₹130, profit = 30%. CP = ?",
        optionA: "₹90",
        optionB: "₹95",
        optionC: "₹100",
        optionD: "₹105",
        correctOption: "c",
        smartSolution: "CP = SP/1.3 = 130/1.3 = 100",
        detailedSolution: "If profit is 30%, then SP = 1.3 × CP. Therefore, CP = SP/1.3 = 130/1.3 = 100.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: profitLossTopic.id,
        patternTypeId: basicPL.id,
        difficulty: "l1",
        questionText: "Discount of 20% on MP ₹500. SP = ?",
        optionA: "₹380",
        optionB: "₹390",
        optionC: "₹400",
        optionD: "₹410",
        correctOption: "c",
        smartSolution: "SP = 80% of 500 = 400",
        detailedSolution: "After 20% discount, SP is 80% of marked price. SP = 500 × 0.8 = 400.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: profitLossTopic.id,
        patternTypeId: basicPL.id,
        difficulty: "l1",
        questionText: "Profit = ₹60 on SP = ₹360. Profit% = ?",
        optionA: "15%",
        optionB: "20%",
        optionC: "25%",
        optionD: "18%",
        correctOption: "b",
        smartSolution: "CP = 360-60=300. Profit% = 60/300×100 = 20%",
        detailedSolution: "CP = SP - Profit = 360 - 60 = 300. Profit% = (60/300) × 100 = 20%.",
        sourceType: "custom",
        language: "en",
      },
    ]);
    console.log("✓ Created 5 questions\n");
  }

  // ========================================
  // TOPIC 2: Reading Comprehension Basics
  // ========================================
  console.log("📚 Processing Reading Comprehension Basics topic...");
  const existingRC = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "rc-basics"))
    .limit(1);

  if (existingRC.length > 0) {
    console.log("✓ Reading Comprehension Basics topic already exists. Skipping.\n");
  } else {
    console.log("📚 Inserting Reading Comprehension Basics topic...");
    const [rcTopic] = await db
      .insert(topics)
      .values({
        name: "Reading Comprehension Basics",
        slug: "rc-basics",
        section: "rc",
        displayOrder: 1,
        status: "published",
        dependencyIds: [],
        cheatsheet: `## RC Strategy for CSAT

### Step 1: Skim First
Read the passage quickly (45-60 seconds) to get the **main idea** and **tone**.

### Step 2: Read Questions First (Optional)
For short passages (< 200 words), read questions first so you know what to look for.

### Step 3: Locate, Don't Memorize
For factual questions, go back to the passage. Never answer from memory alone.

### Common Question Types
- **Main idea** — What is the central argument?
- **Inference** — What can be logically concluded?
- **Tone** — Is the author critical, supportive, neutral?
- **Vocabulary in context** — What does the word mean HERE?
- **True/False** — Which statement is supported by the passage?

### Time Management
- CSAT RC: ~2-3 passages, 5 questions each
- Target: 90 seconds per question`,
      })
      .returning();

    console.log(`✓ Topic created with ID: ${rcTopic.id}\n`);

    // Insert pattern types
    console.log("🔖 Inserting pattern types for RC Basics...");
    const rcPatterns = await db
      .insert(patternTypes)
      .values([
        {
          topicId: rcTopic.id,
          name: "Main Idea Questions",
          description: "Identifying the central theme or argument",
          displayOrder: 0,
        },
        {
          topicId: rcTopic.id,
          name: "Inference Questions",
          description: "Drawing logical conclusions from the text",
          displayOrder: 1,
        },
      ])
      .returning();

    const [mainIdea, inference] = rcPatterns;
    console.log(`✓ Created ${rcPatterns.length} pattern types\n`);

    // Insert resources
    console.log("📺 Inserting resources for RC Basics...");
    await db.insert(resources).values([
      {
        topicId: rcTopic.id,
        type: "video",
        title: "RC Strategy for CSAT",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language: "en",
        displayOrder: 0,
      },
    ]);
    console.log("✓ Created 1 resource\n");

    // Insert questions
    console.log("❓ Inserting questions for RC Basics...");
    await db.insert(questions).values([
      {
        topicId: rcTopic.id,
        patternTypeId: inference.id,
        difficulty: "l1",
        questionText: "A passage states: 'The company increased revenue by 30% but profits fell by 10%.' What can be inferred?",
        optionA: "Sales volume decreased",
        optionB: "Costs increased significantly",
        optionC: "The company is bankrupt",
        optionD: "Revenue and profit always move together",
        correctOption: "b",
        smartSolution: "If revenue up 30% but profit down 10%, costs must have risen more than revenue.",
        detailedSolution: "Revenue increased but profit decreased, which means expenses increased by more than the revenue increase. The only logical inference is that costs increased significantly.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: rcTopic.id,
        patternTypeId: mainIdea.id,
        difficulty: "l1",
        questionText: "The author describes deforestation as 'the silent killer of biodiversity.' The tone is:",
        optionA: "Objective",
        optionB: "Celebratory",
        optionC: "Alarmed",
        optionD: "Indifferent",
        correctOption: "c",
        smartSolution: "'Silent killer' is dramatic language — the author is alarmed, not neutral.",
        detailedSolution: "The phrase 'silent killer' is emotionally charged and indicates concern. The author is not being objective or indifferent but expressing alarm about deforestation's impact.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: rcTopic.id,
        patternTypeId: inference.id,
        difficulty: "l1",
        questionText: "'Despite the setbacks, the team persevered.' This implies the team:",
        optionA: "Gave up eventually",
        optionB: "Never faced problems",
        optionC: "Continued despite difficulties",
        optionD: "Succeeded easily",
        correctOption: "c",
        smartSolution: "'Despite... persevered' = continued in spite of difficulties.",
        detailedSolution: "The word 'despite' indicates contrast, and 'persevered' means continued with determination. Together they show the team continued despite facing difficulties.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: rcTopic.id,
        patternTypeId: mainIdea.id,
        difficulty: "l1",
        questionText: "A passage ends: 'Only time will tell if this policy succeeds.' The author's view is:",
        optionA: "Strongly positive",
        optionB: "Strongly negative",
        optionC: "Uncertain",
        optionD: "Sarcastic",
        correctOption: "c",
        smartSolution: "'Only time will tell' = the author is uncertain about the outcome.",
        detailedSolution: "The phrase 'only time will tell' is a common expression indicating uncertainty about future outcomes. The author is neither optimistic nor pessimistic, just uncertain.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: rcTopic.id,
        patternTypeId: mainIdea.id,
        difficulty: "l1",
        questionText: "Which of these is closest to the meaning of 'ephemeral' in the sentence: 'Social media fame is ephemeral'?",
        optionA: "Permanent",
        optionB: "Brief",
        optionC: "Harmful",
        optionD: "Widespread",
        correctOption: "b",
        smartSolution: "Ephemeral = lasting for a very short time. Fame here is said to be fleeting.",
        detailedSolution: "Ephemeral means lasting for a very short time or transient. In the context of social media fame, it refers to how quickly fame can come and go, making 'brief' the closest meaning.",
        sourceType: "custom",
        language: "en",
      },
    ]);
    console.log("✓ Created 5 questions\n");
  }

  // ========================================
  // TOPIC 3: Logical Reasoning: Syllogisms
  // ========================================
  console.log("📚 Processing Syllogisms topic...");
  const existingSyllogisms = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "syllogisms"))
    .limit(1);

  if (existingSyllogisms.length > 0) {
    console.log("✓ Syllogisms topic already exists. Skipping.\n");
  } else {
    console.log("📚 Inserting Syllogisms topic...");
    const [syllogismsTopic] = await db
      .insert(topics)
      .values({
        name: "Logical Reasoning: Syllogisms",
        slug: "syllogisms",
        section: "lr",
        displayOrder: 1,
        status: "published",
        dependencyIds: [],
        cheatsheet: `## Syllogism Rules

A syllogism has two premises and a conclusion. Test if the conclusion is valid.

### Key Rules
1. **All A are B + All B are C → All A are C** ✓
2. **All A are B + Some B are C → Some A are C** ✗ (NOT guaranteed)
3. **No A are B + All C are A → No C are B** ✓
4. **Some A are B + Some B are C → Some A are C** ✗ (NOT guaranteed)

### Venn Diagram Approach
Draw circles for each category. Check if the conclusion MUST be true for ALL possible diagrams.

### Common Traps
- "Some A are B" does NOT mean "Some A are not B"
- Complementary pairs: if "All A are B" is false, then "Some A are not B" must be true`,
      })
      .returning();

    console.log(`✓ Topic created with ID: ${syllogismsTopic.id}\n`);

    // Insert pattern types
    console.log("🔖 Inserting pattern types for Syllogisms...");
    const syllogismPatterns = await db
      .insert(patternTypes)
      .values([
        {
          topicId: syllogismsTopic.id,
          name: "Universal Statements",
          description: "All/No type statements",
          displayOrder: 0,
        },
        {
          topicId: syllogismsTopic.id,
          name: "Particular Statements",
          description: "Some type statements",
          displayOrder: 1,
        },
      ])
      .returning();

    const [universal] = syllogismPatterns;
    console.log(`✓ Created ${syllogismPatterns.length} pattern types\n`);

    // Insert resources
    console.log("📺 Inserting resources for Syllogisms...");
    await db.insert(resources).values([
      {
        topicId: syllogismsTopic.id,
        type: "video",
        title: "Syllogisms for CSAT",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language: "en",
        displayOrder: 0,
      },
    ]);
    console.log("✓ Created 1 resource\n");

    // Insert questions
    console.log("❓ Inserting questions for Syllogisms...");
    await db.insert(questions).values([
      {
        topicId: syllogismsTopic.id,
        patternTypeId: universal.id,
        difficulty: "l1",
        questionText: "All dogs are animals. All animals are living beings. Conclusion: All dogs are living beings.",
        optionA: "True",
        optionB: "False",
        optionC: "Uncertain",
        optionD: "Partially true",
        correctOption: "a",
        smartSolution: "All A→B, All B→C, therefore All A→C. Classic syllogism.",
        detailedSolution: "This is a valid syllogism following the transitive property: If all dogs are animals, and all animals are living beings, then all dogs must be living beings.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: syllogismsTopic.id,
        patternTypeId: universal.id,
        difficulty: "l1",
        questionText: "No cats are dogs. Whiskers is a cat. Conclusion: Whiskers is not a dog.",
        optionA: "True",
        optionB: "False",
        optionC: "Uncertain",
        optionD: "Cannot say",
        correctOption: "a",
        smartSolution: "No cats are dogs + Whiskers is a cat → Whiskers is not a dog. Direct.",
        detailedSolution: "If no cats are dogs, and Whiskers is a cat, then Whiskers cannot be a dog. This is a valid conclusion.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: syllogismsTopic.id,
        patternTypeId: universal.id,
        difficulty: "l1",
        questionText: "Some students are athletes. All athletes are disciplined. Conclusion: Some students are disciplined.",
        optionA: "True",
        optionB: "False",
        optionC: "Uncertain",
        optionD: "Cannot determine",
        correctOption: "a",
        smartSolution: "Some S→A, All A→D. The 'some students' who are athletes are also disciplined.",
        detailedSolution: "If some students are athletes, and all athletes are disciplined, then those students who are athletes must be disciplined. Therefore, some students are disciplined.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: syllogismsTopic.id,
        patternTypeId: universal.id,
        difficulty: "l1",
        questionText: "Some birds can fly. Penguins are birds. Conclusion: Penguins can fly.",
        optionA: "True",
        optionB: "False",
        optionC: "Uncertain",
        optionD: "Partially true",
        correctOption: "c",
        smartSolution: "Some birds fly — not all. Penguins might or might not be in that 'some'. Uncertain.",
        detailedSolution: "'Some birds can fly' does not mean all birds can fly. We cannot determine if penguins are in the subset of birds that can fly, so the conclusion is uncertain.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: syllogismsTopic.id,
        patternTypeId: universal.id,
        difficulty: "l1",
        questionText: "All politicians are leaders. Some leaders are corrupt. Conclusion: Some politicians are corrupt.",
        optionA: "True",
        optionB: "False",
        optionC: "Uncertain",
        optionD: "Definitely true",
        correctOption: "c",
        smartSolution: "All P→L, Some L→C. The corrupt leaders might not include any politicians. Uncertain.",
        detailedSolution: "While all politicians are leaders, and some leaders are corrupt, we cannot determine if any of the corrupt leaders are politicians. The conclusion is uncertain.",
        sourceType: "custom",
        language: "en",
      },
    ]);
    console.log("✓ Created 5 questions\n");
  }

  // ========================================
  // TOPIC 4: Ratio & Proportion
  // ========================================
  console.log("📚 Processing Ratio & Proportion topic...");
  const existingRatio = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "ratio-and-proportion"))
    .limit(1);

  if (existingRatio.length > 0) {
    console.log("✓ Ratio & Proportion topic already exists. Skipping.\n");
  } else {
    console.log("📚 Inserting Ratio & Proportion topic...");
    const [ratioTopic] = await db
      .insert(topics)
      .values({
        name: "Ratio & Proportion",
        slug: "ratio-and-proportion",
        section: "math",
        displayOrder: 3,
        status: "published",
        dependencyIds: [],
        cheatsheet: `## Key Concepts

**Ratio** a:b means for every 'a' parts of A, there are 'b' parts of B.

**Proportion**: a:b = c:d → a×d = b×c (cross multiply)

**Dividing in ratio a:b:**
$$\\text{Part 1} = \\frac{a}{a+b} \\times \\text{Total}$$

**Compound ratio:** (a:b) × (c:d) = ac:bd

**Variation:**
- Direct: y = kx (both increase/decrease together)
- Inverse: y = k/x (one increases, other decreases)`,
      })
      .returning();

    console.log(`✓ Topic created with ID: ${ratioTopic.id}\n`);

    // Insert pattern types
    console.log("🔖 Inserting pattern types for Ratio & Proportion...");
    const ratioPatterns = await db
      .insert(patternTypes)
      .values([
        {
          topicId: ratioTopic.id,
          name: "Basic Ratio",
          description: "Simple ratio calculations and division",
          displayOrder: 0,
        },
        {
          topicId: ratioTopic.id,
          name: "Proportion Problems",
          description: "Direct and inverse proportion",
          displayOrder: 1,
        },
      ])
      .returning();

    const [basicRatio] = ratioPatterns;
    console.log(`✓ Created ${ratioPatterns.length} pattern types\n`);

    // Insert resources
    console.log("📺 Inserting resources for Ratio & Proportion...");
    await db.insert(resources).values([
      {
        topicId: ratioTopic.id,
        type: "video",
        title: "Ratio and Proportion Basics",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language: "en",
        displayOrder: 0,
      },
    ]);
    console.log("✓ Created 1 resource\n");

    // Insert questions
    console.log("❓ Inserting questions for Ratio & Proportion...");
    await db.insert(questions).values([
      {
        topicId: ratioTopic.id,
        patternTypeId: basicRatio.id,
        difficulty: "l1",
        questionText: "A:B = 3:4. If A = 150, B = ?",
        optionA: "175",
        optionB: "180",
        optionC: "200",
        optionD: "190",
        correctOption: "c",
        smartSolution: "3/4 = 150/B → B = 200",
        detailedSolution: "If A:B = 3:4, then A/B = 3/4. Substituting A = 150: 150/B = 3/4. Cross multiply: 3B = 600, so B = 200.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: ratioTopic.id,
        patternTypeId: basicRatio.id,
        difficulty: "l1",
        questionText: "Divide ₹700 in ratio 3:4",
        optionA: "₹280 and ₹420",
        optionB: "₹300 and ₹400",
        optionC: "₹350 and ₹350",
        optionD: "₹320 and ₹380",
        correctOption: "b",
        smartSolution: "3/7 × 700 = 300, 4/7 × 700 = 400",
        detailedSolution: "Total parts = 3 + 4 = 7. First part = (3/7) × 700 = 300. Second part = (4/7) × 700 = 400.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: ratioTopic.id,
        patternTypeId: basicRatio.id,
        difficulty: "l1",
        questionText: "If 5 workers finish a job in 8 days, 10 workers finish in how many days?",
        optionA: "4 days",
        optionB: "5 days",
        optionC: "6 days",
        optionD: "16 days",
        correctOption: "a",
        smartSolution: "Inverse proportion: 5×8 = 10×d → d = 4",
        detailedSolution: "This is inverse proportion: more workers means fewer days. Workers × Days = constant. So 5 × 8 = 10 × d. Therefore d = 40/10 = 4 days.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: ratioTopic.id,
        patternTypeId: basicRatio.id,
        difficulty: "l1",
        questionText: "A:B = 2:3, B:C = 4:5. A:B:C = ?",
        optionA: "8:12:15",
        optionB: "2:4:5",
        optionC: "4:6:5",
        optionD: "8:10:15",
        correctOption: "a",
        smartSolution: "A:B = 8:12, B:C = 12:15. So A:B:C = 8:12:15",
        detailedSolution: "To combine ratios, make B equal in both. A:B = 2:3 = 8:12 (multiply by 4). B:C = 4:5 = 12:15 (multiply by 3). So A:B:C = 8:12:15.",
        sourceType: "custom",
        language: "en",
      },
      {
        topicId: ratioTopic.id,
        patternTypeId: basicRatio.id,
        difficulty: "l1",
        questionText: "A bag has red and blue marbles in 5:3. If blue = 24, total = ?",
        optionA: "56",
        optionB: "60",
        optionC: "64",
        optionD: "72",
        correctOption: "c",
        smartSolution: "3 parts = 24 → 1 part = 8. Total = 8 parts = 64",
        detailedSolution: "Blue marbles represent 3 parts = 24. So 1 part = 24/3 = 8. Total parts = 5 + 3 = 8 parts. Total marbles = 8 × 8 = 64.",
        sourceType: "custom",
        language: "en",
      },
    ]);
    console.log("✓ Created 5 questions\n");
  }

  console.log("✅ Additional topics seed completed successfully!");
}

seedAdditionalTopics()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
