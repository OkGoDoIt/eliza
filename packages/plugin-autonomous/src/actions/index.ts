import { Action } from '@elizaos/core';
import { AUTONOMOUS_SERVICE_TYPE, AutonomousService } from '../services/AutonomousService';

/**
 * Starts the autonomous operation mode.
 * This action enables continuous planning and autonomous response to triggers.
 */
const startAutonomousMode: Action = {
  name: 'startAutonomousMode',
  description: 'Starts the autonomous operation mode for the agent',
  similes: ['begin autonomous operation', 'enable autonomous mode', 'activate autonomous planning'],
  examples: [
    [
      {
        user: 'User',
        content: {
          text: 'Please start operating autonomously',
          source: 'chat'
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    // Always valid to start autonomous mode
    return true;
  },
  handler: async (runtime, message) => {
    const autonomousService = runtime.getService(AUTONOMOUS_SERVICE_TYPE) as AutonomousService | null;
    if (!autonomousService) {
      throw new Error('Autonomous service not found');
    }
    
    // The service should already be running if properly initialized,
    // but we can return the current plan if it exists
    const currentPlan = autonomousService.getCurrentPlan();
    
    return {
      text: currentPlan 
        ? `Autonomous mode is active. Current plan: ${currentPlan.goal}`
        : 'Autonomous mode activated. Planning will begin shortly.'
    };
  }
};

/**
 * Gets the current autonomous plan.
 * This action returns information about the current planning state.
 */
const getAutonomousPlan: Action = {
  name: 'getAutonomousPlan',
  description: 'Returns the current autonomous operation plan',
  similes: ['show current plan', 'get plan details', 'view autonomous plan'],
  examples: [
    [
      {
        user: 'User',
        content: {
          text: 'What is your current plan?',
          source: 'chat'
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    // Always valid to get the current plan
    return true;
  },
  handler: async (runtime, message) => {
    const autonomousService = runtime.getService(AUTONOMOUS_SERVICE_TYPE) as AutonomousService | null;
    if (!autonomousService) {
      throw new Error('Autonomous service not found');
    }
    
    const currentPlan = autonomousService.getCurrentPlan();
    
    if (!currentPlan) {
      return {
        text: 'No active autonomous plan. You can start planning with the startAutonomousMode action.'
      };
    }
    
    // Format the plan for display
    const subtasksFormatted = currentPlan.subtasks
      .map(subtask => `- ${subtask.description} (${subtask.status})`)
      .join('\n');
    
    return {
      text: `Current plan: ${currentPlan.goal}\n\nSubtasks:\n${subtasksFormatted}`
    };
  }
};

/**
 * Registers a custom trigger for autonomous operation.
 * This action allows adding a new trigger callback that will be executed during the autonomous loop.
 */
const registerAutonomousTrigger: Action = {
  name: 'registerAutonomousTrigger',
  description: 'Registers a custom trigger for autonomous operation',
  similes: ['add autonomous trigger', 'create trigger condition', 'set up autonomous event'],
  examples: [
    [
      {
        user: 'User',
        content: {
          text: 'Register a daily check-in trigger',
          source: 'chat'
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    // Validation would depend on the trigger details
    return true;
  },
  handler: async (runtime, message, state) => {
    // This is a simplified example - in a real implementation, we would parse
    // trigger details from the message and create an appropriate callback
    const autonomousService = runtime.getService(AUTONOMOUS_SERVICE_TYPE) as AutonomousService | null;
    if (!autonomousService) {
      throw new Error('Autonomous service not found');
    }
    
    // Example trigger registration (this would need to be customized based on the message)
    const triggerName = 'exampleTrigger';
    
    // Register a simple trigger that logs a message
    autonomousService.registerTrigger(async () => {
      console.log(`Trigger "${triggerName}" executed at ${new Date().toISOString()}`);
    });
    
    return {
      text: `Registered new autonomous trigger: ${triggerName}`
    };
  }
};

export const autonomousActions = [
  startAutonomousMode,
  getAutonomousPlan,
  registerAutonomousTrigger
]; 