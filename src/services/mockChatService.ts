import { mockGoals } from '@/data/mockGoals';
import type { Goal, ActionGoal } from '@/types/goals';

// Delay helper for simulating network/typing
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Types for mock responses
export interface MockChatCommand {
  type: 'CREATE_GOAL' | 'CREATE_SUBGOAL' | 'UPDATE_PROGRESS';
  data: any;
}

export interface MockChatResponse {
  content: string;
  commands: MockChatCommand[];
}

export interface MockStreamChunk {
  content: string;
  done: boolean;
  commands?: MockChatCommand[];
  goalPreview?: string;
  awaitingConfirmation?: boolean;
}

// Get a mock subgoal from existing mockGoals data
const getMockSubgoal = (index: number): Record<string, any> => {
  const baseGoal = mockGoals[index % mockGoals.length];

  // Return appropriate fields based on goal type
  if (baseGoal.type === 'action') {
    return {
      type: 'action',
      title: baseGoal.title,
      description: baseGoal.description,
      tasks: (baseGoal as ActionGoal).tasks?.slice(0, 3) || [
        { id: '1', title: 'First step', completed: false, createdAt: new Date() },
        { id: '2', title: 'Second step', completed: false, createdAt: new Date() },
      ],
      motivation: baseGoal.description,
      completionPercentage: 0,
    };
  } else if (baseGoal.type === 'finance') {
    return {
      type: 'finance',
      title: baseGoal.title,
      description: baseGoal.description,
      targetBalance: 1000,
      currentBalance: 0,
      currency: 'USD',
      institutionIcon: '🏦',
      accountName: 'Savings Account',
      progressHistory: [0],
      lastSync: new Date(),
    };
  } else {
    return {
      type: 'item',
      title: baseGoal.title,
      description: baseGoal.description,
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      bestPrice: 299,
      currency: 'USD',
      retailerUrl: 'https://example.com',
      retailerName: 'Demo Store',
      statusBadge: 'in-stock' as const,
    };
  }
};

// Response scenarios for overview chat
const overviewScenarios: Array<{
  keywords: string[];
  response: string;
  commands: MockChatCommand[];
  requireConfirmation?: boolean;
}> = [
  {
    keywords: ['create', 'action goal', 'learn', 'skill', 'habit', 'practice', 'build', 'develop'],
    response: `Great! I'll help you create an action goal with those steps.

Here's what I'll create for you:`,
    commands: [
      { type: 'CREATE_GOAL', data: { type: 'action', title: 'Learn React', description: 'Master React.js library for frontend development' } },
      { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(0), type: 'action', parentGoalId: 'Learn React', title: 'Learn React basics', description: 'Understand components, hooks, and state management' } },
      { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(1), type: 'action', parentGoalId: 'Learn React', title: 'Build a React project', description: 'Create a complete application from scratch' } },
      { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(2), type: 'action', parentGoalId: 'Learn React', title: 'Deploy to production', description: 'Deploy your React app to a hosting platform' } },
    ],
    requireConfirmation: true,
  },
  {
    keywords: ['item goal', 'buy', 'purchase', 'product', 'truck', 'car'],
    response: `I can help you track that purchase! Here's what I'll create:`,
    commands: [
      { type: 'CREATE_GOAL', data: { ...getMockSubgoal(2), type: 'item', title: '2020 Denali Dually Truck', description: 'Purchase 2020 Ford F-450 Super Duty with Dually package' } },
    ],
    requireConfirmation: true,
  },
  {
    keywords: ['break down', 'subgoal', 'smaller', 'steps', 'milestone'],
    response: `Perfect! Let me break this down into manageable steps:

**1. Foundation Building**
Start with the basics and build a solid foundation.

**2. Skill Development**
Practice regularly to develop your skills.

**3. Practical Application**
Apply what you've learned in real situations.

**4. Mastery & Refinement**
Fine-tune your abilities and achieve mastery.

I've created these as subgoals for you! Each one is tracked separately so you can monitor your progress.`,
    commands: [
      { type: 'CREATE_SUBGOAL', data: getMockSubgoal(0) },
      { type: 'CREATE_SUBGOAL', data: getMockSubgoal(1) },
      { type: 'CREATE_SUBGOAL', data: getMockSubgoal(2) },
      { type: 'CREATE_SUBGOAL', data: getMockSubgoal(3) },
    ],
    requireConfirmation: true,
  },
  {
    keywords: ['create', 'add', 'subgoal', 'new goal'],
    response: `I'll create that subgoal for you right away! 🎯

It's been added to your goals list. You can track its progress separately from your main goal.`,
    commands: [
      { type: 'CREATE_SUBGOAL', data: getMockSubgoal(0) },
    ],
  },
  {
    keywords: ['update', 'progress', 'complete', 'finished', 'done'],
    response: `Great progress! I've updated your goal to reflect your latest achievement.

Keep up the momentum! 🚀`,
    commands: [
      { type: 'UPDATE_PROGRESS', data: { progress: 25 } },
    ],
  },
  {
    keywords: ['compare', 'where to buy', 'best price', 'cheapest', 'amazon', 'ebay', 'buy'],
    response: `I found some great options for you:

🏆 **Best Deal**: Refurbished option - Save up to 40%
✅ Certified quality with warranty

📍 **Fastest Shipping**: Major retailers
✅ 2-3 day delivery available

🛒 **Most Popular**: Customer favorite
✅ Thousands of positive reviews

Would you like me to help you decide based on your priorities?`,
    commands: [],
  },
  {
    keywords: ['item', 'product', 'purchase', 'buy something'],
    response: `For item goals, I can help you:
- Track prices across retailers
- Set up price alerts
- Compare product features
- Find the best deals

What product are you looking to purchase?`,
    commands: [],
  },
  {
    keywords: ['finance', 'money', 'save', 'budget', 'invest'],
    response: `For finance goals, I can help you:
- Set savings targets
- Track your progress
- Project when you'll reach your goal
- Find ways to optimize your savings

What financial goal are you working toward?`,
    commands: [],
  },
  {
    keywords: ['learn', 'skill', 'habit', 'action', 'practice'],
    response: `For action goals, I can help you:
- Break down skills into steps
- Create daily practice routines
- Track your consistency
- Celebrate milestones

What skill or habit are you building?`,
    commands: [],
  },
  {
    keywords: ['help', 'how', 'what can you do', 'explain'],
    response: `I'm your Goals Assistant! Here's what I can help you with:

🎯 **Create Goals** - Set up item, finance, or action goals
📊 **Break Down Goals** - Turn big goals into manageable subgoals
💰 **Track Progress** - Monitor your advancement
🔍 **Compare Prices** - Find the best deals on products
💡 **Get Advice** - Tips and strategies for success

Just tell me what you'd like to work on!`,
    commands: [],
  },
];

// Default greeting response
const greetingResponse: MockChatResponse = {
  content: `What would you like to work on today? I can help you with:

• **Items** - Products you want to purchase
• **Finances** - Money goals and tracking
• **Actions** - Skills to learn or habits to build

Just let me know what's on your mind!`,
  commands: [],
};

// Match user input to scenario
const matchResponse = (message: string): MockChatResponse => {
  const lowerMessage = message.toLowerCase().trim();

  // Empty or very short input -> greeting
  if (lowerMessage.length < 3) {
    return greetingResponse;
  }

  // Check each scenario for keyword matches
  for (const scenario of overviewScenarios) {
    if (scenario.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        content: scenario.response,
        commands: scenario.commands,
      };
    }
  }

  // Default fallback response
  return {
    content: `That sounds interesting! I'd love to help you with that.

Would you like me to help you create a new goal, or do you have an existing goal you'd like to break down into smaller steps?

Just let me know what you're thinking about!`,
    commands: [],
  };
};

// Mock Overview Chat Service
export const mockOverviewChatService = {
  /**
   * Get response for overview chat (non-streaming)
   */
  async chat(message: string): Promise<MockChatResponse> {
    // Simulate network delay
    await delay(500 + Math.random() * 1000);

    return matchResponse(message);
  },

  /**
   * Stream response for overview chat (typing effect)
   */
  async *chatStream(request: { message: string }): AsyncGenerator<MockStreamChunk, MockChatResponse, unknown> {
    // Simulate initial "thinking" delay
    await delay(500 + Math.random() * 1000);

    const response = matchResponse(request.message);
    const words = response.content.split(/(?=\s)/); // Split keeping spaces

    // Generate goal preview markdown if commands are present
    let goalPreview = '';
    if (response.commands.length > 0) {
      const mainGoal = response.commands.find(c => c.type === 'CREATE_GOAL');
      const subgoals = response.commands.filter(c => c.type === 'CREATE_SUBGOAL');

      if (mainGoal) {
        goalPreview = `## ${mainGoal.data.title}\n\n`;
        if (mainGoal.data.description) {
          goalPreview += `**Description:** ${mainGoal.data.description}\n\n`;
        }
        if (mainGoal.data.type) {
          goalPreview += `**Type:** ${mainGoal.data.type}\n\n`;
        }
      }

      if (subgoals.length > 0) {
        goalPreview += `### Subgoals:\n\n`;
        subgoals.forEach((subgoal, i) => {
          goalPreview += `${i + 1}. **${subgoal.data.title}**\n`;
          if (subgoal.data.description) {
            goalPreview += `   ${subgoal.data.description}\n`;
          }
        });
      }
    }

    // Check if this scenario requires confirmation
    const scenario = overviewScenarios.find(s =>
      s.keywords.some(k => request.message.toLowerCase().includes(k))
    );
    const requireConfirmation = scenario?.requireConfirmation && response.commands.length > 0;

    // Stream word by word with typing delay
    for (const word of words) {
      await delay(50 + Math.random() * 100);
      yield { content: word, done: false };
    }

    // Final done signal with confirmation UI data if needed
    yield {
      content: '',
      done: true,
      commands: requireConfirmation ? response.commands : [],
      ...(requireConfirmation && {
        goalPreview: goalPreview || `## Goal Preview\n\nCreating ${response.commands.length} goal(s)`,
        awaitingConfirmation: true,
      }),
    };

    // Return full response for command execution (kept for compatibility)
    return response;
  },
};

// Mock Goal Chat Service
export const mockGoalChatService = {
  /**
   * Get response for goal-specific chat
   */
  async chat(goalId: string, message: string): Promise<MockChatResponse> {
    // Simulate network delay
    await delay(500 + Math.random() * 1000);

    const lowerMessage = message.toLowerCase().trim();

    // Break down request
    if (lowerMessage.includes('break down') || lowerMessage.includes('subgoal') || lowerMessage.includes('smaller')) {
      return {
        content: `I can help break this goal down! Here are some suggestions:

**1. First milestone** - Build your foundation
**2. Second milestone** - Develop your skills
**3. Third milestone** - Apply what you've learned

Should I create these as subgoals for this goal?`,
        commands: [
          { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(1), parentGoalId: goalId } },
          { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(2), parentGoalId: goalId } },
          { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(3), parentGoalId: goalId } },
        ],
      };
    }

    // Add subgoal request
    if (lowerMessage.includes('add') || lowerMessage.includes('create') || lowerMessage.includes('subgoal')) {
      return {
        content: `I've added that as a subgoal! You can now track it separately.

Each subgoal has its own progress tracking, so you can see how each piece contributes to your overall goal.`,
        commands: [
          { type: 'CREATE_SUBGOAL', data: { ...getMockSubgoal(0), parentGoalId: goalId } },
        ],
      };
    }

    // Progress update
    if (lowerMessage.includes('progress') || lowerMessage.includes('update') || lowerMessage.includes('complete')) {
      return {
        content: `Progress updated! 🎉

Keep tracking your progress. Every step counts toward achieving your goal!`,
        commands: [
          { type: 'UPDATE_PROGRESS', data: { progress: 10 } },
        ],
      };
    }

    // Help request
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return {
        content: `I'm here to help with this goal! I can:

📊 **Break it down** - Create subgoals for easier tracking
➕ **Add milestones** - Set up progress checkpoints
💡 **Get advice** - Tips specific to this goal
📈 **Update progress** - Log your achievements

What would you like to do?`,
        commands: [],
      };
    }

    // Default response
    return {
      content: `I understand. Would you like me to help you break this goal down into smaller, more manageable steps? That often makes it easier to track progress and stay motivated!`,
      commands: [],
    };
  },

  /**
   * Stream response for goal chat
   */
  async *chatStream(goalId: string, message: string): AsyncGenerator<MockStreamChunk, MockChatResponse, unknown> {
    // Simulate initial "thinking" delay
    await delay(500 + Math.random() * 1000);

    const response = await this.chat(goalId, message);
    const words = response.content.split(/(?=\s)/);

    // Stream word by word with typing delay
    for (const word of words) {
      await delay(50 + Math.random() * 100);
      yield { content: word, done: false };
    }

    yield { content: '', done: true };
    return response;
  },
};
