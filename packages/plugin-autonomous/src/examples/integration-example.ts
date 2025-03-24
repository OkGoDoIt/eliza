import { AutonomousLoop } from '../services/AutonomousLoop';
import { PlanningModule, Plan } from '../services/PlanningModule';
import { State, UUID } from '@elizaos/core';
import { Subtask } from '../services/PlanningModule';

/**
 * This example demonstrates how to integrate the AutonomousLoop and PlanningModule
 * components directly, without using the plugin system. This can be useful for:
 * 
 * 1. Testing the components in isolation
 * 2. Using the components in a non-Eliza OS environment
 * 3. Understanding how the components interact
 * 
 * To run this example:
 * 1. Import this function
 * 2. Call it with: await runIntegrationExample();
 */
export async function runIntegrationExample() {
  console.log('Starting integration example...');
  
  // Create instances of the modules
  const autonomousLoop = new AutonomousLoop();
  const planningModule = new PlanningModule();
  
  // Variable to store the current plan
  let currentPlan: Plan | null = null;
  
  // Create a mock state for testing
  const mockState = {
    values: {
      character: { name: 'Test Agent' },
      user: { name: 'Test User' }
    },
    data: {},
    text: 'This is a test state',
    // Required state properties
    bio: 'Test bio',
    lore: 'Test lore',
    messageDirections: 'Test message directions',
    postDirections: 'Test post directions',
    roomId: '12345678-1234-1234-1234-123456789abc' as UUID,
    actors: 'Test actors',
    recentMessages: 'Test recent messages',
    recentMessagesData: []
  } as State;
  
  // Register a simple trigger that logs a message
  autonomousLoop.registerTrigger(async () => {
    console.log(`[Trigger] Executing trigger at ${new Date().toISOString()}`);
  });
  
  // Register another trigger that checks if we need to replan
  autonomousLoop.registerTrigger(async () => {
    if (!currentPlan) return;
    
    console.log(`[Trigger] Checking if we need to replan for plan ${currentPlan.id}`);
    
    try {
      // This would normally use updated state, but we're using the mock state here
      const updatedPlan = await planningModule.replanIfNeeded(mockState, currentPlan);
      
      // If we got a new plan, update our reference
      if (updatedPlan.id !== currentPlan.id) {
        console.log(`[Trigger] Updated plan from ${currentPlan.id} to ${updatedPlan.id}`);
        currentPlan = updatedPlan;
      }
    } catch (error) {
      console.error('[Trigger] Error checking for replan:', error);
    }
  });
  
  // Set the planning callback
  autonomousLoop.setPlanningCallback(async () => {
    console.log(`[Planning] Generating plan at ${new Date().toISOString()}`);
    
    try {
      // Generate a new plan
      const plan = await planningModule.generatePlan(mockState);
      currentPlan = plan;
      
      console.log(`[Planning] Generated plan ${plan.id} with ${plan.subtasks.length} subtasks`);
      
      // Monitor the plan
      await planningModule.monitorPlan(plan);
    } catch (error) {
      console.error('[Planning] Error during planning:', error);
    }
  });
  
  // Start the autonomous loop
  autonomousLoop.start();
  console.log('Autonomous loop started');
  
  // In a real app, we'd keep the process running
  // For this example, we'll run for 60 seconds then stop
  console.log('Running example for 60 seconds...');
  
  // Use setTimeout instead of sleep to allow the event loop to continue
  await new Promise(resolve => {
    setTimeout(() => {
      // Stop the loop
      autonomousLoop.stop();
      console.log('Autonomous loop stopped');
      resolve(null);
    }, 60000);
  });

  // Example for creating subtasks
  const subtasks: Subtask[] = [
    {
      id: `subtask-${Date.now()}-1`,
      description: 'Example subtask 1',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: `subtask-${Date.now()}-2`,
      description: 'Example subtask 2',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
} 