import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutonomousLoop } from '../src/services/AutonomousLoop';
import { PlanningModule, Plan } from '../src/services/PlanningModule';
import { State, UUID } from '@elizaos/core';

// Mock for setTimeout and setInterval
vi.useFakeTimers();

describe('AutonomousLoop and PlanningModule Integration Example', () => {
  // Declare variables for the test instances
  let autonomousLoop: AutonomousLoop;
  let planningModule: PlanningModule;
  let currentPlan: Plan | null = null;
  
  // Create a mock state for testing that satisfies the State interface
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
  
  beforeEach(() => {
    // Reset variables and mocks for each test
    vi.clearAllMocks();
    
    // Create new instances
    autonomousLoop = new AutonomousLoop(1000, 5000); // 1s trigger, 5s planning (faster for tests)
    planningModule = new PlanningModule();
    currentPlan = null;
    
    // Spy on important methods
    vi.spyOn(autonomousLoop, 'start');
    vi.spyOn(autonomousLoop, 'stop');
    vi.spyOn(planningModule, 'generatePlan');
    vi.spyOn(planningModule, 'monitorPlan');
    vi.spyOn(planningModule, 'replanIfNeeded');
    
    // Spy on console methods and silence them during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Clean up after each test
    autonomousLoop.stop();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });
  
  it('should demonstrate the full integration flow', async () => {
    // Set up the trigger
    const triggerSpy = vi.fn();
    autonomousLoop.registerTrigger(async () => {
      triggerSpy();
    });
    
    // Set up the replanning trigger
    autonomousLoop.registerTrigger(async () => {
      if (!currentPlan) return;
      
      const updatedPlan = await planningModule.replanIfNeeded(mockState, currentPlan);
      if (updatedPlan.id !== currentPlan.id) {
        currentPlan = updatedPlan;
      }
    });
    
    // Set up the planning callback
    autonomousLoop.setPlanningCallback(async () => {
      const plan = await planningModule.generatePlan(mockState);
      currentPlan = plan;
      await planningModule.monitorPlan(plan);
    });
    
    // Start the autonomous loop
    autonomousLoop.start();
    
    // Verify the loop was started
    expect(autonomousLoop.start).toHaveBeenCalled();
    
    // Advance time to trigger planning (5s)
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify that the planning function was called
    expect(planningModule.generatePlan).toHaveBeenCalledTimes(1);
    expect(planningModule.generatePlan).toHaveBeenCalledWith(mockState);
    expect(planningModule.monitorPlan).toHaveBeenCalledTimes(1);
    expect(currentPlan).not.toBeNull();
    
    // Advance time to trigger regular check (1s)
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify that the trigger was executed
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(planningModule.replanIfNeeded).toHaveBeenCalledTimes(1);
    
    // Force a discrepancy to trigger replanning
    // We'll do this by manipulating the plan to include a failed task
    if (currentPlan) {
      currentPlan.subtasks[0].status = 'failed';
    }
    
    // Advance time for another trigger
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify that replanIfNeeded was called again
    expect(planningModule.replanIfNeeded).toHaveBeenCalledTimes(2);
    
    // Verify that a new plan was generated
    expect(planningModule.generatePlan).toHaveBeenCalledTimes(2);
    
    // Stop the loop
    autonomousLoop.stop();
    
    // Verify the loop was stopped
    expect(autonomousLoop.stop).toHaveBeenCalled();
  });
  
  it('should handle errors gracefully in the integration flow', async () => {
    // Mock generatePlan to throw an error
    planningModule.generatePlan = vi.fn().mockImplementation(() => {
      throw new Error('Test error in planning');
    });
    
    // Register a trigger that will run successfully
    const triggerSpy = vi.fn();
    autonomousLoop.registerTrigger(async () => {
      triggerSpy();
    });
    
    // Set the planning callback
    autonomousLoop.setPlanningCallback(async () => {
      try {
        const plan = await planningModule.generatePlan(mockState);
        currentPlan = plan;
        await planningModule.monitorPlan(plan);
      } catch (error) {
        console.error('Caught error in planning callback:', error);
      }
    });
    
    // Start the autonomous loop
    autonomousLoop.start();
    
    // Advance time to trigger planning (5s)
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify that the planning function was called and error was caught
    expect(planningModule.generatePlan).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    
    // Advance time to trigger the regular trigger (1s)
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify that the trigger still executed despite planning error
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    
    // Stop the loop
    autonomousLoop.stop();
  });
}); 