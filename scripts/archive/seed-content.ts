import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db";
import { topics, patternTypes, resources, questions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedPercentageTopic() {
  console.log("🌱 Starting Percentage topic seed...\n");

  // Check if percentage topic already exists
  const existingTopic = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, "percentage"))
    .limit(1);

  if (existingTopic.length > 0) {
    console.log("✓ Percentage topic already exists. Skipping seed.");
    return;
  }

  // Insert topic
  console.log("📚 Inserting Percentage topic...");
  const [topic] = await db
    .insert(topics)
    .values({
      name: "Percentage",
      slug: "percentage",
      section: "math",
      displayOrder: 1,
      status: "published",
      cheatsheet: `## Key Formulas

**Percentage to Fraction:**
$$\\frac{x}{100}$$

**Percentage Change:**
$$\\text{Change \\%} = \\frac{\\text{New} - \\text{Old}}{\\text{Old}} \\times 100$$

**Successive Change:**
If A% increase followed by B% increase:
$$\\text{Net Change} = A + B + \\frac{AB}{100}$$

**Price-Quantity Relation:**
If price increases by x%, then to keep expenditure same, reduce quantity by:
$$\\frac{x}{100+x} \\times 100\\%$$`,
    })
    .returning();

  console.log(`✓ Topic created with ID: ${topic.id}\n`);

  // Insert pattern types
  console.log("🔖 Inserting pattern types...");
  const patternTypeValues = [
    {
      topicId: topic.id,
      name: "Basic Percentage",
      description: "Direct percentage calculations",
      displayOrder: 0,
    },
    {
      topicId: topic.id,
      name: "Successive Change",
      description: "Multiple percentage changes applied sequentially",
      displayOrder: 1,
    },
    {
      topicId: topic.id,
      name: "Price and Discount",
      description: "Price hike, discount, and profit/loss problems",
      displayOrder: 2,
    },
  ];

  const insertedPatternTypes = await db
    .insert(patternTypes)
    .values(patternTypeValues)
    .returning();

  const [basicPattern, successivePattern, pricePattern] = insertedPatternTypes;
  console.log(`✓ Created ${insertedPatternTypes.length} pattern types\n`);

  // Insert resources
  console.log("📺 Inserting resources...");
  await db.insert(resources).values([
    {
      topicId: topic.id,
      type: "video",
      title: "Percentage Basics - Complete Concept",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      language: "en",
      displayOrder: 0,
    },
    {
      topicId: topic.id,
      type: "video",
      title: "Percentage Tricks for CSAT",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      language: "hi",
      displayOrder: 1,
    },
  ]);
  console.log("✓ Created 2 resources\n");

  // Insert questions
  console.log("❓ Inserting questions...");

  const questionData = [
    // L1 Questions (Basic Percentage pattern)
    {
      topicId: topic.id,
      patternTypeId: basicPattern.id,
      difficulty: "l1",
      questionText: "What is 25% of 480?",
      optionA: "100",
      optionB: "110",
      optionC: "120",
      optionD: "125",
      correctOption: "c",
      smartSolution: "25% = 1/4. So 480/4 = 120",
      detailedSolution: "To find 25% of 480, multiply: 480 × 0.25 = 120. Alternatively, since 25% is one-fourth, divide 480 by 4 to get 120.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: basicPattern.id,
      difficulty: "l1",
      questionText: "A number is increased by 20%. What is the resulting number if the original is 350?",
      optionA: "400",
      optionB: "410",
      optionC: "420",
      optionD: "430",
      correctOption: "c",
      smartSolution: "120% of 350 = 350 × 1.2 = 420",
      detailedSolution: "Increasing by 20% means the result is 120% of the original. Calculate: 350 × 1.2 = 420.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: basicPattern.id,
      difficulty: "l1",
      questionText: "60 is what percent of 240?",
      optionA: "20%",
      optionB: "25%",
      optionC: "30%",
      optionD: "40%",
      correctOption: "b",
      smartSolution: "60/240 = 1/4 = 25%",
      detailedSolution: "Divide 60 by 240 to get the fraction: 60/240 = 0.25. Convert to percentage: 0.25 × 100 = 25%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: basicPattern.id,
      difficulty: "l1",
      questionText: "What is 15% of 600?",
      optionA: "80",
      optionB: "85",
      optionC: "90",
      optionD: "95",
      correctOption: "c",
      smartSolution: "10% of 600 = 60, 5% = 30, total = 90",
      detailedSolution: "Break down 15% into 10% + 5%. 10% of 600 = 60, and 5% of 600 = 30. Adding them gives 60 + 30 = 90.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: basicPattern.id,
      difficulty: "l1",
      questionText: "A student scored 72 marks out of 90. What is the percentage?",
      optionA: "78%",
      optionB: "80%",
      optionC: "82%",
      optionD: "84%",
      correctOption: "b",
      smartSolution: "72/90 = 8/10 = 80%",
      detailedSolution: "Calculate the fraction: 72/90. Simplify by dividing both numerator and denominator by 9: 8/10 = 0.8 = 80%.",
      sourceType: "custom",
      language: "en",
    },

    // L2 Questions (Successive Change pattern)
    {
      topicId: topic.id,
      patternTypeId: successivePattern.id,
      difficulty: "l2",
      questionText: "A price increases by 10% then decreases by 10%. Net change?",
      optionA: "-1%",
      optionB: "0%",
      optionC: "+1%",
      optionD: "-2%",
      correctOption: "a",
      smartSolution: "Successive formula: 10 + (-10) + (10×-10)/100 = -1%",
      detailedSolution: "Using the successive percentage change formula: Net = A + B + (A×B)/100. Here A = 10, B = -10. Net = 10 + (-10) + (10×-10)/100 = 0 - 1 = -1%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: successivePattern.id,
      difficulty: "l2",
      questionText: "Population grows 20% first year and 25% second year. Net growth?",
      optionA: "45%",
      optionB: "50%",
      optionC: "48%",
      optionD: "47%",
      correctOption: "b",
      smartSolution: "Successive: 20 + 25 + (20×25)/100 = 45 + 5 = 50%",
      detailedSolution: "Apply successive percentage formula: Net = 20 + 25 + (20×25)/100 = 45 + 500/100 = 45 + 5 = 50%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: successivePattern.id,
      difficulty: "l2",
      questionText: "Price first increases 30% then decreases 30%. Net change?",
      optionA: "-9%",
      optionB: "+9%",
      optionC: "-6%",
      optionD: "0%",
      correctOption: "a",
      smartSolution: "30 + (-30) + (30×-30)/100 = 0 - 9 = -9%",
      detailedSolution: "Net = 30 + (-30) + (30×-30)/100 = 0 + (-900/100) = 0 - 9 = -9%. The net result is a 9% decrease.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: successivePattern.id,
      difficulty: "l2",
      questionText: "A salary increases by 15% each year for 2 years. Total % increase?",
      optionA: "30%",
      optionB: "32.25%",
      optionC: "31%",
      optionD: "33%",
      correctOption: "b",
      smartSolution: "15 + 15 + (15×15)/100 = 30 + 2.25 = 32.25%",
      detailedSolution: "Using successive formula with A = B = 15: Net = 15 + 15 + (15×15)/100 = 30 + 225/100 = 30 + 2.25 = 32.25%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: successivePattern.id,
      difficulty: "l2",
      questionText: "Income increases 40% and expenses increase 60%. If income = expenses initially, what can be determined about savings?",
      optionA: "Cannot determine change in savings",
      optionB: "Savings remain 0%",
      optionC: "Savings decrease by 20%",
      optionD: "Savings increase by 20%",
      correctOption: "a",
      smartSolution: "Initially savings = 0 (income = expenses). After changes, new savings depends on absolute values, which are not given. Cannot determine percentage change.",
      detailedSolution: "If initially income = expenses, then savings = 0. After percentage changes, we need actual values to compute new savings. Without knowing the original amounts, we cannot determine the percentage change in savings.",
      sourceType: "custom",
      language: "en",
    },

    // L3 Questions (Price and Discount pattern)
    {
      topicId: topic.id,
      patternTypeId: pricePattern.id,
      difficulty: "l3",
      questionText: "A shopkeeper marks up by 40% and gives 20% discount. Profit %?",
      optionA: "8%",
      optionB: "10%",
      optionC: "12%",
      optionD: "14%",
      correctOption: "c",
      smartSolution: "MP = 1.4 CP. SP = 0.8 × 1.4 CP = 1.12 CP. Profit = 12%",
      detailedSolution: "Let CP = 100. Marked Price = 100 + 40% = 140. After 20% discount, SP = 140 × 0.8 = 112. Profit = 112 - 100 = 12. Profit% = 12%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: pricePattern.id,
      difficulty: "l3",
      questionText: "Price rises 25%. To maintain same expenditure, quantity must reduce by?",
      optionA: "20%",
      optionB: "25%",
      optionC: "15%",
      optionD: "10%",
      correctOption: "a",
      smartSolution: "x/(100+x) × 100 = 25/125 × 100 = 20%",
      detailedSolution: "Use the formula: reduction% = x/(100+x) × 100, where x is the price increase. Here x = 25. Reduction% = 25/125 × 100 = 0.2 × 100 = 20%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: pricePattern.id,
      difficulty: "l3",
      questionText: "An article is sold at 20% profit. If cost were 20% less and SP same, profit would be?",
      optionA: "40%",
      optionB: "45%",
      optionC: "50%",
      optionD: "55%",
      correctOption: "c",
      smartSolution: "New CP = 0.8 old CP. Old SP = 1.2 old CP. Profit% = (1.2-0.8)/0.8 × 100 = 50%",
      detailedSolution: "Let original CP = 100. SP = 120 (20% profit). New CP = 80 (20% less). Profit = 120 - 80 = 40. Profit% = 40/80 × 100 = 50%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: pricePattern.id,
      difficulty: "l3",
      questionText: "If A's income is 20% more than B's, then B's income is what % less than A's?",
      optionA: "16.67%",
      optionB: "20%",
      optionC: "25%",
      optionD: "14.28%",
      correctOption: "a",
      smartSolution: "If A = 120, B = 100. Difference = 20. % less than A = 20/120 × 100 = 16.67%",
      detailedSolution: "Let B's income = 100. Then A's income = 120 (20% more). Difference = 20. Percentage less than A = (20/120) × 100 = 16.67%.",
      sourceType: "custom",
      language: "en",
    },
    {
      topicId: topic.id,
      patternTypeId: pricePattern.id,
      difficulty: "l3",
      questionText: "A trader allows 10% and 5% successive discounts. The equivalent single discount is?",
      optionA: "14.5%",
      optionB: "15%",
      optionC: "14%",
      optionD: "13.5%",
      correctOption: "a",
      smartSolution: "Single equiv = 10+5-(10×5)/100 = 15 - 0.5 = 14.5%",
      detailedSolution: "For successive discounts, equivalent single discount = A + B - (A×B)/100. Here A = 10, B = 5. Equivalent = 10 + 5 - (10×5)/100 = 15 - 0.5 = 14.5%.",
      sourceType: "custom",
      language: "en",
    },
  ];

  await db.insert(questions).values(questionData);
  console.log(`✓ Created ${questionData.length} questions\n`);

  console.log("✅ Percentage topic seed completed successfully!");
}

seedPercentageTopic()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
