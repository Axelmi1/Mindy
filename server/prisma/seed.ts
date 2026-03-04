import { PrismaClient, Domain, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Achievement Seed Data
// ============================================================================

const achievements = [
  // LEARNING - Lessons Completed
  { key: 'first_lesson', name: 'First Step', description: 'Complete your first lesson', category: 'LEARNING', requirementType: 'LESSONS_COMPLETED', requirementValue: 1, xpReward: 25, rarity: 'COMMON', orderIndex: 1 },
  { key: 'lessons_5', name: 'Getting Started', description: 'Complete 5 lessons', category: 'LEARNING', requirementType: 'LESSONS_COMPLETED', requirementValue: 5, xpReward: 50, rarity: 'COMMON', orderIndex: 2 },
  { key: 'lessons_10', name: 'Knowledge Seeker', description: 'Complete 10 lessons', category: 'LEARNING', requirementType: 'LESSONS_COMPLETED', requirementValue: 10, xpReward: 100, rarity: 'UNCOMMON', orderIndex: 3 },
  { key: 'lessons_25', name: 'Dedicated Learner', description: 'Complete 25 lessons', category: 'LEARNING', requirementType: 'LESSONS_COMPLETED', requirementValue: 25, xpReward: 200, rarity: 'RARE', orderIndex: 4 },
  { key: 'lessons_50', name: 'Scholar', description: 'Complete 50 lessons', category: 'LEARNING', requirementType: 'LESSONS_COMPLETED', requirementValue: 50, xpReward: 500, rarity: 'EPIC', orderIndex: 5 },

  // LEARNING - Domains Completed
  { key: 'crypto_master', name: 'Crypto Master', description: 'Complete all 10 Crypto lessons', category: 'LEARNING', requirementType: 'CRYPTO_LESSONS_COMPLETED', requirementValue: 10, xpReward: 200, rarity: 'RARE', orderIndex: 10 },
  { key: 'finance_guru', name: 'Finance Guru', description: 'Complete all 9 Finance lessons', category: 'LEARNING', requirementType: 'FINANCE_LESSONS_COMPLETED', requirementValue: 9, xpReward: 200, rarity: 'RARE', orderIndex: 11 },

  // LEARNING - Daily Challenges
  { key: 'first_challenge', name: 'Challenge Accepted', description: 'Complete your first daily challenge', category: 'LEARNING', requirementType: 'DAILY_CHALLENGES', requirementValue: 1, xpReward: 25, rarity: 'COMMON', orderIndex: 20 },
  { key: 'challenges_7', name: 'Weekly Warrior', description: 'Complete 7 daily challenges', category: 'LEARNING', requirementType: 'DAILY_CHALLENGES', requirementValue: 7, xpReward: 75, rarity: 'UNCOMMON', orderIndex: 21 },
  { key: 'challenges_30', name: 'Challenge Champion', description: 'Complete 30 daily challenges', category: 'LEARNING', requirementType: 'DAILY_CHALLENGES', requirementValue: 30, xpReward: 200, rarity: 'RARE', orderIndex: 22 },

  // STREAK
  { key: 'streak_3', name: 'On Fire', description: 'Reach a 3-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 3, xpReward: 25, rarity: 'COMMON', orderIndex: 30 },
  { key: 'streak_7', name: 'Week Warrior', description: 'Reach a 7-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 7, xpReward: 75, rarity: 'UNCOMMON', orderIndex: 31 },
  { key: 'streak_14', name: 'Two Week Champion', description: 'Reach a 14-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 14, xpReward: 125, rarity: 'UNCOMMON', orderIndex: 32 },
  { key: 'streak_30', name: 'Monthly Master', description: 'Reach a 30-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 30, xpReward: 200, rarity: 'RARE', orderIndex: 33 },
  { key: 'streak_60', name: 'Diamond Hands', description: 'Reach a 60-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 60, xpReward: 350, rarity: 'EPIC', orderIndex: 34 },
  { key: 'streak_100', name: 'Centurion', description: 'Reach a 100-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 100, xpReward: 500, rarity: 'EPIC', orderIndex: 35 },
  { key: 'streak_365', name: 'Legend', description: 'Reach a 365-day streak', category: 'STREAK', requirementType: 'STREAK_DAYS', requirementValue: 365, xpReward: 1000, rarity: 'LEGENDARY', orderIndex: 36 },

  // XP - XP Earned
  { key: 'xp_100', name: 'XP Collector', description: 'Earn 100 XP', category: 'XP', requirementType: 'XP_EARNED', requirementValue: 100, xpReward: 25, rarity: 'COMMON', orderIndex: 40 },
  { key: 'xp_500', name: 'XP Hoarder', description: 'Earn 500 XP', category: 'XP', requirementType: 'XP_EARNED', requirementValue: 500, xpReward: 50, rarity: 'UNCOMMON', orderIndex: 41 },
  { key: 'xp_1000', name: 'XP Master', description: 'Earn 1,000 XP', category: 'XP', requirementType: 'XP_EARNED', requirementValue: 1000, xpReward: 100, rarity: 'RARE', orderIndex: 42 },
  { key: 'xp_5000', name: 'XP Millionaire', description: 'Earn 5,000 XP', category: 'XP', requirementType: 'XP_EARNED', requirementValue: 5000, xpReward: 250, rarity: 'EPIC', orderIndex: 43 },
  { key: 'xp_10000', name: 'XP Billionaire', description: 'Earn 10,000 XP', category: 'XP', requirementType: 'XP_EARNED', requirementValue: 10000, xpReward: 500, rarity: 'LEGENDARY', orderIndex: 44 },

  // XP - Level Reached
  { key: 'level_5', name: 'Rising Star', description: 'Reach level 5', category: 'XP', requirementType: 'LEVEL_REACHED', requirementValue: 5, xpReward: 75, rarity: 'UNCOMMON', orderIndex: 50 },
  { key: 'level_10', name: 'Veteran', description: 'Reach level 10', category: 'XP', requirementType: 'LEVEL_REACHED', requirementValue: 10, xpReward: 150, rarity: 'RARE', orderIndex: 51 },
  { key: 'level_20', name: 'Elite', description: 'Reach level 20', category: 'XP', requirementType: 'LEVEL_REACHED', requirementValue: 20, xpReward: 300, rarity: 'EPIC', orderIndex: 52 },
  { key: 'level_50', name: 'Grandmaster', description: 'Reach level 50', category: 'XP', requirementType: 'LEVEL_REACHED', requirementValue: 50, xpReward: 750, rarity: 'LEGENDARY', orderIndex: 53 },

  // SOCIAL - Referrals
  { key: 'referral_1', name: 'Recruiter', description: 'Refer 1 friend', category: 'SOCIAL', requirementType: 'REFERRALS_MADE', requirementValue: 1, xpReward: 50, rarity: 'COMMON', orderIndex: 60 },
  { key: 'referral_3', name: 'Ambassador', description: 'Refer 3 friends', category: 'SOCIAL', requirementType: 'REFERRALS_MADE', requirementValue: 3, xpReward: 100, rarity: 'UNCOMMON', orderIndex: 61 },
  { key: 'referral_5', name: 'Influencer', description: 'Refer 5 friends', category: 'SOCIAL', requirementType: 'REFERRALS_MADE', requirementValue: 5, xpReward: 150, rarity: 'RARE', orderIndex: 62 },
  { key: 'referral_10', name: 'Community Builder', description: 'Refer 10 friends', category: 'SOCIAL', requirementType: 'REFERRALS_MADE', requirementValue: 10, xpReward: 300, rarity: 'EPIC', orderIndex: 63 },
  { key: 'referral_25', name: 'Network Legend', description: 'Refer 25 friends', category: 'SOCIAL', requirementType: 'REFERRALS_MADE', requirementValue: 25, xpReward: 750, rarity: 'LEGENDARY', orderIndex: 64 },
] as const;

// ============================================================================
// Seed Data
// ============================================================================

/**
 * Introduction to Bitcoin lesson content
 * Demonstrates all step types: info, quiz, swipe
 */
const bitcoinLessonContent = {
  steps: [
    // Step 1: Info
    {
      type: 'info' as const,
      title: 'Welcome to the Crypto Rabbit Hole',
      content: `Bitcoin is a decentralized digital currency created in 2009 by an unknown person (or group) using the pseudonym Satoshi Nakamoto.

Unlike traditional currencies, Bitcoin operates without a central bank or single administrator. Transactions are verified by network nodes through cryptography and recorded on a public ledger called a blockchain.

Key facts:
• First cryptocurrency ever created
• Limited supply: only 21 million will ever exist
• Transactions are irreversible
• You can send any amount, anywhere, anytime`,
      mindyMessage: "Welcome to the rabbit hole, anon. Let's see if you're ready to get orange-pilled. 🐰",
    },

    // Step 2: Quiz
    {
      type: 'quiz' as const,
      question: 'Who created Bitcoin?',
      options: [
        'Elon Musk',
        'Satoshi Nakamoto',
        'Vitalik Buterin',
        'Mark Zuckerberg',
      ],
      correctIndex: 1,
      mindyHint: "Think pseudonymous... and no, it's not the Tesla guy.",
    },

    // Step 3: Swipe
    {
      type: 'swipe' as const,
      statement: 'Bitcoin has a maximum supply of 21 million coins.',
      isCorrect: true,
      explanation: 'Correct! This scarcity is hardcoded into the Bitcoin protocol and cannot be changed. This is why Bitcoin is often called "digital gold" - its supply is limited and predictable.',
    },

    // Step 4: Info
    {
      type: 'info' as const,
      title: 'The Blockchain',
      content: `The blockchain is a distributed ledger that records all Bitcoin transactions. Think of it as a public spreadsheet that everyone can read but no one can alter.

How it works:
1. Transactions are grouped into "blocks"
2. Each block is cryptographically linked to the previous one
3. This creates an immutable chain of transaction history
4. The network validates new blocks through "mining"

This is what makes Bitcoin trustless - you don't need to trust a bank, you trust math.`,
      mindyMessage: "Don't trust, verify. That's the Bitcoin way. 🔐",
    },

    // Step 5: Quiz
    {
      type: 'quiz' as const,
      question: 'What is the blockchain?',
      options: [
        'A type of cryptocurrency',
        'A distributed ledger of all transactions',
        'A Bitcoin wallet',
        'A mining machine',
      ],
      correctIndex: 1,
      mindyHint: 'Think about what records all the transactions...',
    },

    // Step 6: Swipe
    {
      type: 'swipe' as const,
      statement: 'Bitcoin transactions can be reversed by contacting customer support.',
      isCorrect: false,
      explanation: "False! Bitcoin transactions are irreversible. There's no central authority to contact. Once a transaction is confirmed on the blockchain, it's permanent. This is why you should always double-check addresses before sending!",
    },

    // Step 7: Info
    {
      type: 'info' as const,
      title: 'Congratulations! 🎉',
      content: `You've completed your first lesson on Bitcoin!

Key takeaways:
✓ Bitcoin is decentralized digital money
✓ Created by Satoshi Nakamoto in 2009
✓ Limited supply of 21 million coins
✓ Uses blockchain technology
✓ Transactions are irreversible

Next up: We'll dive into how to actually buy and store Bitcoin safely. The journey has just begun...`,
      mindyMessage: "Not bad for a normie. You might just make it. See you in the next lesson! 💚",
    },
  ],
};

/**
 * Intro to Personal Finance lesson content
 */
const financeLessonContent = {
  steps: [
    {
      type: 'info' as const,
      title: 'Why Personal Finance Matters',
      content: `Welcome to Personal Finance 101. This might be the most important skill you'll ever learn.

Here's the hard truth: Schools don't teach you about money. But your financial decisions will impact every aspect of your life.

In this course, you'll learn:
• How to budget effectively
• The power of compound interest
• Smart saving strategies
• Building wealth over time

Let's start with the basics.`,
      mindyMessage: "Time to get your financial act together. No judgment... okay, maybe a little. 💰",
    },

    {
      type: 'quiz' as const,
      question: 'What is the recommended emergency fund size?',
      options: [
        '1 month of expenses',
        '3-6 months of expenses',
        '1 year of expenses',
        "You don't need one",
      ],
      correctIndex: 1,
      mindyHint: "Think about how long it might take to find a new job...",
    },

    {
      type: 'swipe' as const,
      statement: 'You should always pay yourself first before paying bills.',
      isCorrect: true,
      explanation: "True! 'Pay yourself first' means automatically saving/investing a portion of your income before spending on anything else. Even 10-20% can make a huge difference over time.",
    },

    {
      type: 'info' as const,
      title: 'The 50/30/20 Rule',
      content: `One of the simplest budgeting frameworks is the 50/30/20 rule:

50% - Needs
• Rent/mortgage
• Utilities
• Groceries
• Insurance

30% - Wants
• Entertainment
• Dining out
• Hobbies
• Subscriptions

20% - Savings & Debt
• Emergency fund
• Investments
• Extra debt payments

This isn't perfect for everyone, but it's a great starting point.`,
      mindyMessage: "Math is your friend. Especially when it keeps you from being broke. 📊",
    },

    {
      type: 'swipe' as const,
      statement: 'Credit cards are always bad and should be avoided.',
      isCorrect: false,
      explanation: "False! Credit cards can be powerful tools when used responsibly. They help build credit history, offer rewards, and provide consumer protections. The key is paying your balance in full each month.",
    },
  ],
};

/**
 * Crypto Trading Basics - Demonstrates new interactive game types
 */
const tradingGamesContent = {
  steps: [
    // Step 1: Info intro
    {
      type: 'info' as const,
      title: 'Welcome to Trading Games',
      content: `Ready to test your trading instincts? This lesson uses interactive mini-games to sharpen your crypto knowledge.

You'll experience:
• Trading Swipe - Rapid-fire decisions
• Word Builder - Construct key concepts

Let's see if you have what it takes to survive the crypto markets.`,
      mindyMessage: "Time to separate the diamond hands from the paper hands. Let's go!",
    },

    // Step 2: Swipe Sequence - Scam or Legit (randomized answers)
    {
      type: 'swipe_sequence' as const,
      title: 'Scam or Legit?',
      instruction: 'Swipe quickly! Is this crypto project a SCAM or LEGIT?',
      leftLabel: 'SCAM',
      rightLabel: 'LEGIT',
      timeLimit: 45,
      cards: [
        {
          id: '1',
          content: 'Anonymous team promises 1000x returns in 1 week',
          correctDirection: 'left' as const,
        },
        {
          id: '2',
          content: '"Send 1 ETH, get 2 ETH back!" from verified account',
          correctDirection: 'left' as const,
        },
        {
          id: '3',
          content: 'Open-source code with security audits on GitHub',
          correctDirection: 'right' as const,
        },
        {
          id: '4',
          content: 'Project launched 5 years ago, listed on Coinbase',
          correctDirection: 'right' as const,
        },
        {
          id: '5',
          content: 'Urgency: "Only 2 hours left to invest!"',
          correctDirection: 'left' as const,
        },
        {
          id: '6',
          content: 'Team has public LinkedIn profiles and past projects',
          correctDirection: 'right' as const,
        },
      ],
      mindyMessage: "Trust your gut, but verify everything!",
    },

    // Step 3: Reorder - Simple trading phrase
    {
      type: 'reorder' as const,
      title: 'Build the Trading Rule',
      instruction: 'Arrange these words to form a famous trading principle:',
      words: ['Buy', 'low,', 'sell', 'high'],
      correctOrder: [0, 1, 2, 3], // "Buy low, sell high"
      hint: 'The oldest rule in trading...',
      mindyMessage: "Simple but powerful. Get this right!",
    },

    // Step 4: Quiz step (simpler than code)
    {
      type: 'quiz' as const,
      question: 'What does "HODL" mean in crypto?',
      options: [
        'High Order Digital Ledger',
        'Hold On for Dear Life',
        'Holding Official Digital Loans',
        'Hot Online Deals Listed',
      ],
      correctIndex: 1,
      mindyHint: 'It started as a typo for "hold"...',
    },

    // Step 5: Swipe Sequence - Bull or Bear (mixed order)
    {
      type: 'swipe_sequence' as const,
      title: 'Bull or Bear Signal?',
      instruction: 'Is this news BEARISH or BULLISH for crypto?',
      leftLabel: 'BEARISH',
      rightLabel: 'BULLISH',
      cards: [
        {
          id: 'b1',
          content: 'Bitcoin ETF approved by SEC',
          correctDirection: 'right' as const,
        },
        {
          id: 'b2',
          content: 'Tesla announces they now accept Bitcoin',
          correctDirection: 'right' as const,
        },
        {
          id: 'b3',
          content: 'Major exchange hacked, $500M stolen',
          correctDirection: 'left' as const,
        },
        {
          id: 'b4',
          content: 'Bitcoin halving event is approaching',
          correctDirection: 'right' as const,
        },
        {
          id: 'b5',
          content: 'China announces crypto trading ban',
          correctDirection: 'left' as const,
        },
        {
          id: 'b6',
          content: 'FED raises interest rates sharply',
          correctDirection: 'left' as const,
        },
        {
          id: 'b7',
          content: 'BlackRock starts buying Bitcoin',
          correctDirection: 'right' as const,
        },
      ],
      mindyMessage: "Read the market signals like a pro!",
    },

    // Step 6: Another Reorder - Crypto vocabulary
    {
      type: 'reorder' as const,
      title: 'Crypto Wisdom',
      instruction: 'Arrange to form the DYOR principle:',
      words: ['Do', 'Your', 'Own', 'Research'],
      correctOrder: [0, 1, 2, 3], // "Do Your Own Research"
      hint: 'What you should always do before investing...',
      mindyMessage: "The most important rule in crypto!",
    },

    // Step 7: Final Info
    {
      type: 'info' as const,
      title: 'Trading Games Complete!',
      content: `You've mastered the interactive challenges!

Skills unlocked:
- Scam detection radar
- Market signal reading
- Crypto vocabulary

Remember: In crypto, knowledge is your best defense. DYOR and never invest more than you can afford to lose.`,
      mindyMessage: "You've got skills! Now go practice on a paper trading account before risking real money.",
    },
  ],
};

/**
 * Test user for development
 */
const testUser = {
  email: 'test@mindy.app',
  username: 'test_user',
  xp: 0,
  level: 1,
  streak: 0,
  referralCode: 'TEST01',
};

// ============================================================================
// Seed Function
// ============================================================================

async function main() {
  console.log('\n[SEED] 🌱 Starting database seed...\n');

  // Clear existing data
  console.log('[SEED] Clearing existing data...');
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  console.log('[SEED] Creating test user...');
  const user = await prisma.user.create({
    data: testUser,
  });
  console.log(`[SEED] ✓ Created user: ${user.username} (${user.id})`);

  // Create Bitcoin lesson
  console.log('[SEED] Creating Bitcoin lesson...');
  const bitcoinLesson = await prisma.lesson.create({
    data: {
      title: 'Introduction to Bitcoin',
      domain: Domain.CRYPTO,
      difficulty: Difficulty.BEGINNER,
      content: bitcoinLessonContent,
      xpReward: 100,
      orderIndex: 1,
    },
  });
  console.log(`[SEED] ✓ Created lesson: ${bitcoinLesson.title} (${bitcoinLesson.id})`);

  // Create Trading Games lesson (NEW!)
  console.log('[SEED] Creating Trading Games lesson...');
  const tradingLesson = await prisma.lesson.create({
    data: {
      title: 'Crypto Trading Games',
      domain: Domain.CRYPTO,
      difficulty: Difficulty.INTERMEDIATE,
      content: tradingGamesContent,
      xpReward: 150,
      orderIndex: 2,
    },
  });
  console.log(`[SEED] ✓ Created lesson: ${tradingLesson.title} (${tradingLesson.id})`);

  // Create Finance lesson
  console.log('[SEED] Creating Finance lesson...');
  const financeLesson = await prisma.lesson.create({
    data: {
      title: 'Personal Finance 101',
      domain: Domain.FINANCE,
      difficulty: Difficulty.BEGINNER,
      content: financeLessonContent,
      xpReward: 75,
      orderIndex: 1,
    },
  });
  console.log(`[SEED] ✓ Created lesson: ${financeLesson.title} (${financeLesson.id})`);

  // Create some progress for the test user
  console.log('[SEED] Creating initial progress...');
  await prisma.userProgress.create({
    data: {
      userId: user.id,
      lessonId: bitcoinLesson.id,
      completedSteps: [0, 1], // Completed first two steps
      isCompleted: false,
    },
  });
  console.log('[SEED] ✓ Created progress for Bitcoin lesson (2/7 steps)');

  // Seed achievements
  console.log('[SEED] Seeding achievements...');
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category as any,
        requirementType: achievement.requirementType as any,
        requirementValue: achievement.requirementValue,
        xpReward: achievement.xpReward,
        rarity: achievement.rarity as any,
        orderIndex: achievement.orderIndex,
      },
      create: {
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category as any,
        requirementType: achievement.requirementType as any,
        requirementValue: achievement.requirementValue,
        xpReward: achievement.xpReward,
        rarity: achievement.rarity as any,
        orderIndex: achievement.orderIndex,
      },
    });
  }
  console.log(`[SEED] ✓ Seeded ${achievements.length} achievements`);

  console.log('\n[SEED] ✅ Seed completed successfully!\n');
  console.log('[SEED] Summary:');
  console.log('  - 1 test user created');
  console.log('  - 3 lessons created:');
  console.log('    • Introduction to Bitcoin (CRYPTO, BEGINNER)');
  console.log('    • Crypto Trading Games (CRYPTO, INTERMEDIATE) ⭐ NEW GAME TYPES');
  console.log('    • Personal Finance 101 (FINANCE, BEGINNER)');
  console.log('  - 1 progress record created');
  console.log(`  - ${achievements.length} achievements created`);
  console.log('\n[SEED] Test credentials:');
  console.log(`  - Email: ${testUser.email}`);
  console.log(`  - User ID: ${user.id}\n`);
}

// ============================================================================
// Execute
// ============================================================================

main()
  .catch((e) => {
    console.error('[SEED] ❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
