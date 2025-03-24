import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutonomousLoop } from '../src/services/AutonomousLoop';

// Mock for setTimeout and setInterval
vi.useFakeTimers();

describe('AutonomousLoop', () => {
  let autonomousLoop: AutonomousLoop;
  
  beforeEach(() => {
    // Create a new instance before each test
    autonomousLoop = new AutonomousLoop(1000, 5000);
    
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Stop the loop after each test
    autonomousLoop.stop();
    
    // Restore console mocks
    vi.restoreAllMocks();
    
    // Reset timers
    vi.clearAllTimers();
  });
  
  it('should initialize with the provided intervals', () => {
    const customLoop = new AutonomousLoop(2000, 10000);
    expect(customLoop).toBeDefined();
  });
  
  it('should start and stop the loop', () => {
    // Start the loop
    autonomousLoop.start();
    expect(console.log).toHaveBeenCalledWith('Starting autonomous loop');
    
    // Try to start again (should log that it's already running)
    autonomousLoop.start();
    expect(console.log).toHaveBeenCalledWith('AutonomousLoop is already running');
    
    // Stop the loop
    autonomousLoop.stop();
    expect(console.log).toHaveBeenCalledWith('Stopping autonomous loop');
    
    // Try to stop again (should log that it's not running)
    autonomousLoop.stop();
    expect(console.log).toHaveBeenCalledWith('AutonomousLoop is not running');
  });
  
  it('should execute registered triggers', async () => {
    // Create mock triggers
    const trigger1 = vi.fn().mockResolvedValue(undefined);
    const trigger2 = vi.fn().mockResolvedValue(undefined);
    
    // Register both triggers
    autonomousLoop.registerTrigger(trigger1);
    autonomousLoop.registerTrigger(trigger2);
    
    // Start the loop
    autonomousLoop.start();
    
    // Advance timers to trigger execution
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify triggers were called
    expect(trigger1).toHaveBeenCalledTimes(1);
    expect(trigger2).toHaveBeenCalledTimes(1);
    
    // Advance again to verify multiple executions
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify triggers were called again
    expect(trigger1).toHaveBeenCalledTimes(2);
    expect(trigger2).toHaveBeenCalledTimes(2);
  });
  
  it('should handle trigger errors without stopping', async () => {
    // Create mock triggers - one that works, one that fails
    const workingTrigger = vi.fn().mockResolvedValue(undefined);
    const failingTrigger = vi.fn().mockRejectedValue(new Error('Test error'));
    
    // Register both triggers
    autonomousLoop.registerTrigger(failingTrigger);
    autonomousLoop.registerTrigger(workingTrigger);
    
    // Start the loop
    autonomousLoop.start();
    
    // Advance timers to trigger execution
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify error was logged but the loop continued
    expect(console.error).toHaveBeenCalledWith('Error executing trigger:', expect.any(Error));
    
    // Verify working trigger was still called despite the failing one
    expect(workingTrigger).toHaveBeenCalledTimes(1);
  });
  
  it('should execute the planning callback', async () => {
    // Create mock planning function
    const planningFn = vi.fn().mockResolvedValue(undefined);
    
    // Set the planning callback
    autonomousLoop.setPlanningCallback(planningFn);
    
    // Start the loop
    autonomousLoop.start();
    
    // Advance timers past planning interval
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify planning function was called
    expect(planningFn).toHaveBeenCalledTimes(1);
  });
  
  it('should handle planning callback errors', async () => {
    // Create mock planning function that fails
    const planningFn = vi.fn().mockRejectedValue(new Error('Planning error'));
    
    // Set the planning callback
    autonomousLoop.setPlanningCallback(planningFn);
    
    // Start the loop
    autonomousLoop.start();
    
    // Advance timers past planning interval
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error executing planning callback:', expect.any(Error));
    
    // Verify planning function was still called
    expect(planningFn).toHaveBeenCalledTimes(1);
  });
  
  it('should add planning timer when callback is set after starting', async () => {
    // Start the loop without planning callback
    autonomousLoop.start();
    
    // Add planning callback after loop has started
    const planningFn = vi.fn().mockResolvedValue(undefined);
    autonomousLoop.setPlanningCallback(planningFn);
    
    // Advance timers past planning interval
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify planning function was called
    expect(planningFn).toHaveBeenCalledTimes(1);
  });
}); 