/**
 * Unit tests for AutonomousLoop.ts
 * 
 * Tests the functionality of the Autonomous Core Loop:
 * - Trigger registration and execution
 * - Error handling during trigger execution
 * - Starting and stopping the loop
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutonomousLoop } from './AutonomousLoop';

// Mock implementation of IAgentRuntime
const mockRuntime = {
  agentId: 'test-agent',
  // Add other required properties/methods as needed
} as any;

// Helper to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('AutonomousLoop', () => {
  let autonomousLoop: AutonomousLoop;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    autonomousLoop = new AutonomousLoop(mockRuntime);
    
    // Mock console methods to prevent test logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Ensure loop is stopped after each test
    await autonomousLoop.stop();
    
    // Restore console methods
    vi.restoreAllMocks();
  });
  
  it('should register and execute a trigger', async () => {
    // Create a mock trigger function
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    
    // Register the trigger
    autonomousLoop.registerTrigger(mockTrigger);
    
    // Start the loop with a short interval
    await autonomousLoop.start({ loopIntervalMs: 100 });
    
    // Wait for the trigger to be executed
    await delay(150);
    
    // Verify the trigger was called
    expect(mockTrigger).toHaveBeenCalled();
    
    // Stop the loop
    await autonomousLoop.stop();
  });
  
  it('should catch errors in triggers and continue execution', async () => {
    // Create a failing trigger and a successful trigger
    const failingTrigger = vi.fn().mockRejectedValue(new Error('Trigger failure'));
    const successfulTrigger = vi.fn().mockResolvedValue(undefined);
    
    // Register both triggers
    autonomousLoop.registerTrigger(failingTrigger);
    autonomousLoop.registerTrigger(successfulTrigger);
    
    // Start the loop with a short interval
    await autonomousLoop.start({ loopIntervalMs: 100 });
    
    // Wait for the triggers to be executed
    await delay(150);
    
    // Verify both triggers were called, despite one failing
    expect(failingTrigger).toHaveBeenCalled();
    expect(successfulTrigger).toHaveBeenCalled();
    
    // Stop the loop
    await autonomousLoop.stop();
  });
  
  it('should stop executing triggers when stop() is called', async () => {
    // Create a mock trigger
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    
    // Register the trigger
    autonomousLoop.registerTrigger(mockTrigger);
    
    // Start the loop with a short interval
    await autonomousLoop.start({ loopIntervalMs: 100 });
    
    // Wait for the first trigger execution
    await delay(150);
    
    // Verify trigger was called at least once
    const callCountBefore = mockTrigger.mock.calls.length;
    expect(callCountBefore).toBeGreaterThan(0);
    
    // Stop the loop
    await autonomousLoop.stop();
    
    // Reset the mock to clearly see new calls
    mockTrigger.mockClear();
    
    // Wait a bit to ensure no more executions happen
    await delay(200);
    
    // Verify the trigger wasn't called again after stopping
    expect(mockTrigger).not.toHaveBeenCalled();
  });
  
  it('should execute planning function at specified interval', async () => {
    // Create a mock planning function
    const mockPlanningFunction = vi.fn().mockResolvedValue(undefined);
    
    // Set the planning function
    autonomousLoop.setPlanningFunction(mockPlanningFunction);
    
    // Start the loop with a short planning interval
    await autonomousLoop.start({ loopIntervalMs: 100, planIntervalMs: 200 });
    
    // Wait for the planning function to be executed
    await delay(250);
    
    // Verify the planning function was called
    expect(mockPlanningFunction).toHaveBeenCalledWith(mockRuntime);
    
    // Stop the loop
    await autonomousLoop.stop();
  });
  
  it('should handle planning function errors and continue execution', async () => {
    // Create a failing planning function
    const failingPlanningFunction = vi.fn().mockRejectedValue(new Error('Planning failure'));
    
    // Set the planning function
    autonomousLoop.setPlanningFunction(failingPlanningFunction);
    
    // Create a trigger to verify the loop continues running
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    autonomousLoop.registerTrigger(mockTrigger);
    
    // Start the loop with short intervals
    await autonomousLoop.start({ loopIntervalMs: 100, planIntervalMs: 200 });
    
    // Wait for the planning function and trigger to be executed
    await delay(250);
    
    // Verify the planning function was called and failed
    expect(failingPlanningFunction).toHaveBeenCalled();
    
    // Verify the trigger was still executed, proving the loop continues despite planning errors
    expect(mockTrigger).toHaveBeenCalled();
    
    // Stop the loop
    await autonomousLoop.stop();
  });
}); 