import { PrismaClient, GoalType, GoalStatus, ItemStatusBadge } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
      githubId: 'github-12345',
      name: 'Alex Chen',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      githubLogin: 'alexchen',
      githubBio: 'Building cool stuff',
      githubLocation: 'San Francisco, CA',
      githubBlog: 'https://alexchen.dev',
    },
  });

  console.log(`Created user: ${user.name}`);

  // Create settings for user
  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'miami-vice',
      chatModel: 'gpt-4',
      displayName: 'Alex',
    },
  });

  console.log(`Created settings for user`);

  // Create Item Goals
  const itemGoal1 = await prisma.goal.create({
    data: {
      type: GoalType.item,
      title: 'Sony WH-1000XM5 Headphones',
      description: 'Premium noise-canceling wireless headphones for work and travel',
      status: GoalStatus.active,
      userId: user.id,
      itemData: {
        create: {
          productImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop',
          bestPrice: 328.0,
          currency: 'USD',
          retailerUrl: 'https://amazon.com',
          retailerName: 'Amazon',
          statusBadge: ItemStatusBadge.price_drop,
        },
      },
    },
  });

  const itemGoal2 = await prisma.goal.create({
    data: {
      type: GoalType.item,
      title: 'MacBook Pro 14" M3',
      description: 'New laptop for development work',
      status: GoalStatus.active,
      userId: user.id,
      itemData: {
        create: {
          productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
          bestPrice: 1999.0,
          currency: 'USD',
          retailerUrl: 'https://apple.com',
          retailerName: 'Apple',
          statusBadge: ItemStatusBadge.in_stock,
        },
      },
    },
  });

  const itemGoal3 = await prisma.goal.create({
    data: {
      type: GoalType.item,
      title: 'Herman Miller Aeron Chair',
      description: 'Ergonomic office chair for home setup',
      status: GoalStatus.active,
      userId: user.id,
      itemData: {
        create: {
          productImage: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop',
          bestPrice: 1395.0,
          currency: 'USD',
          retailerUrl: 'https://hermanmiller.com',
          retailerName: 'Herman Miller',
          statusBadge: ItemStatusBadge.pending_search,
        },
      },
    },
  });

  console.log(`Created ${3} item goals`);

  // Create Finance Goals
  const financeGoal1 = await prisma.goal.create({
    data: {
      type: GoalType.finance,
      title: 'Emergency Fund',
      description: '6 months of expenses saved for emergencies',
      status: GoalStatus.active,
      userId: user.id,
      financeData: {
        create: {
          institutionIcon: '🏦',
          accountName: 'High-Yield Savings',
          currentBalance: 12500.0,
          targetBalance: 25000.0,
          currency: 'USD',
          progressHistory: [8000, 9200, 10100, 10800, 11200, 11800, 12100, 12500],
          lastSync: new Date('2024-01-25'),
        },
      },
    },
  });

  const financeGoal2 = await prisma.goal.create({
    data: {
      type: GoalType.finance,
      title: 'Vacation Fund',
      description: 'Japan trip summer 2024',
      status: GoalStatus.active,
      userId: user.id,
      financeData: {
        create: {
          institutionIcon: '✈️',
          accountName: 'Travel Savings',
          currentBalance: 3200.0,
          targetBalance: 5000.0,
          currency: 'USD',
          progressHistory: [1500, 1800, 2100, 2400, 2700, 2900, 3100, 3200],
          lastSync: new Date('2024-01-24'),
        },
      },
    },
  });

  const financeGoal3 = await prisma.goal.create({
    data: {
      type: GoalType.finance,
      title: 'Investment Portfolio',
      description: 'Long-term wealth building',
      status: GoalStatus.active,
      userId: user.id,
      financeData: {
        create: {
          institutionIcon: '📈',
          accountName: 'Brokerage Account',
          currentBalance: 45200.0,
          targetBalance: 100000.0,
          currency: 'USD',
          progressHistory: [38000, 39500, 41000, 42200, 43800, 44100, 44800, 45200],
          lastSync: new Date('2024-01-25'),
        },
      },
    },
  });

  console.log(`Created ${3} finance goals`);

  // Create Action Goals
  const actionGoal1 = await prisma.goal.create({
    data: {
      type: GoalType.action,
      title: 'Learn TypeScript',
      description: 'Master TypeScript for better React development',
      status: GoalStatus.active,
      userId: user.id,
      actionData: {
        create: {
          completionPercentage: 60,
          tasks: {
            create: [
              { title: 'Complete TypeScript fundamentals course', completed: true },
              { title: 'Practice with 5 coding challenges', completed: true },
              { title: 'Build a small project with TypeScript', completed: true },
              { title: 'Learn advanced types and generics', completed: false },
              { title: 'Contribute to an open source TS project', completed: false },
            ],
          },
        },
      },
    },
  });

  const actionGoal2 = await prisma.goal.create({
    data: {
      type: GoalType.action,
      title: 'Morning Routine',
      description: 'Build a consistent morning routine for productivity',
      status: GoalStatus.active,
      userId: user.id,
      actionData: {
        create: {
          completionPercentage: 75,
          tasks: {
            create: [
              { title: 'Wake up at 6:30 AM consistently', completed: true },
              { title: '10 min meditation', completed: true },
              { title: '20 min exercise', completed: true },
              { title: 'No phone for first hour', completed: false },
            ],
          },
        },
      },
    },
  });

  const actionGoal3 = await prisma.goal.create({
    data: {
      type: GoalType.action,
      title: 'Read 12 Books This Year',
      description: 'Expand knowledge through consistent reading',
      status: GoalStatus.active,
      userId: user.id,
      actionData: {
        create: {
          completionPercentage: 17,
          tasks: {
            create: [
              { title: 'Atomic Habits - James Clear', completed: true },
              { title: 'Deep Work - Cal Newport', completed: true },
              { title: 'The Psychology of Money', completed: false },
              { title: 'Thinking, Fast and Slow', completed: false },
              { title: 'The Lean Startup', completed: false },
              { title: 'Sapiens', completed: false },
            ],
          },
        },
      },
    },
  });

  console.log(`Created ${3} action goals`);

  // Create initial chat message for creation chat
  const creationChat = await prisma.chatState.create({
    data: {
      type: 'creation',
      isLoading: false,
      userId: user.id,
      messages: {
        create: {
          role: 'assistant',
          content: "Hey there! 🌴 I'm your Goals-AF assistant. Ready to help you crush some goals?\n\nWhat would you like to work on today? I can help you with:\n\n• **Items** - Products you want to purchase\n• **Finances** - Money goals and tracking\n• **Actions** - Skills to learn or habits to build",
          userId: user.id,
        },
      },
    },
  });

  console.log(`Created initial creation chat`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
