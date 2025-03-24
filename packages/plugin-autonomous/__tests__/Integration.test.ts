import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { autonomousPlugin, initAutonomousPlugin } from '../src';
import { AutonomousLoop } from '../src/services/AutonomousLoop';
import { PlanningModule } from '../src/services/PlanningModule';
import { State, UUID } from '@elizaos/core';

// Create a mock runtime for testing
const mockRuntime = {
  agentId: 'test-agent-uuid',
  getSetting: vi.fn(),
  setCache: vi.fn(),
  getCache: vi.fn(),
  getMemories: vi.fn(),
  composeState: vi.fn(),
  registerEvent: vi.fn()
};

// Mock for setTimeout and setInterval
vi.useFakeTimers();

describe('Autonomous Plugin Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Configure default mock behaviors
    mockRuntime.getSetting.mockImplementation((key: string) => {
      if (key === 'autonomous.enabled') return true;
      if (key === 'autonomous.triggerInterval') return 1000;
      if (key === 'autonomous.planningInterval') return 5000;
      return null;
    });
    
    mockRuntime.setCache.mockResolvedValue(true);
    
    mockRuntime.getMemories.mockResolvedValue([
      { id: 'message-1', content: { text: 'Test message' } }
    ]);
    
    mockRuntime.composeState.mockResolvedValue({
      values: { character: { name: 'Test Agent' } },
      data: {},
      text: 'Test state'
    });
    
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });
  
  it('should initialize and start the autonomous loop', async () => {
    // The loop and planning instances that will be stored in cache
    const loopInstance = new AutonomousLoop(1000, 5000);
    const planningInstance = new PlanningModule();
    
    // Mock the cached loop when requested
    mockRuntime.getCache.mockImplementation((key: string) => {
      if (key === 'autonomousLoop') return Promise.resolve(loopInstance);
      if (key === 'planningModule') return Promise.resolve(planningInstance);
      if (key === 'currentPlan') return Promise.resolve({
        id: 'test-plan',
        subtasks: [],
        status: 'created',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return Promise.resolve(null);
    });
    
    // Spy on the loop's start method
    const startSpy = vi.spyOn(loopInstance, 'start');
    
    // Setup spies for other important methods
    const genPlanSpy = vi.spyOn(planningInstance, 'generatePlan');
    const monitorPlanSpy = vi.spyOn(planningInstance, 'monitorPlan');
    const replanSpy = vi.spyOn(planningInstance, 'replanIfNeeded');
    
    // Initialize the plugin
    await initAutonomousPlugin(mockRuntime as any);
    
    // Verify that settings were checked
    expect(mockRuntime.getSetting).toHaveBeenCalledWith('autonomous.enabled');
    expect(mockRuntime.getSetting).toHaveBeenCalledWith('autonomous.triggerInterval');
    expect(mockRuntime.getSetting).toHaveBeenCalledWith('autonomous.planningInterval');
    
    // Verify that loop and planning module were cached
    expect(mockRuntime.setCache).toHaveBeenCalledTimes(2);
    
    // Verify the loop was started
    expect(startSpy).toHaveBeenCalled();
    
    // Verify the event handler was registered
    expect(mockRuntime.registerEvent).toHaveBeenCalledWith('RUN_ENDED', expect.any(Function));
    
    // Simulate the passage of time to trigger planning loop
    await vi.advanceTimersByTimeAsync(5000);
    
    // Verify the planning function was executed
    expect(mockRuntime.getMemories).toHaveBeenCalled();
    expect(mockRuntime.composeState).toHaveBeenCalled();
    
    // Verify plan generation and monitoring were called
    expect(genPlanSpy).toHaveBeenCalled();
    expect(monitorPlanSpy).toHaveBeenCalled();
    
    // Advance time again to trigger regular loop
    await vi.advanceTimersByTimeAsync(1000);
    
    // Verify replanning check was executed
    expect(replanSpy).toHaveBeenCalled();
  });
  
  it('should not initialize when disabled', async () => {
    // Override the getSetting mock for this test
    mockRuntime.getSetting.mockImplementation((key: string) => {
      if (key === 'autonomous.enabled') return false;
      return null;
    });
    
    // Initialize the plugin
    await initAutonomousPlugin(mockRuntime as any);
    
    // Verify that settings were checked
    expect(mockRuntime.getSetting).toHaveBeenCalledWith('autonomous.enabled');
    
    // Cache should not be used when disabled
    expect(mockRuntime.setCache).not.toHaveBeenCalled();
    
    // Verify console message about being disabled
    expect(console.log).toHaveBeenCalledWith('Autonomous plugin is disabled');
  });
  
  it('should handle shutdown properly', async () => {
    // The loop instance that will be stored in cache
    const loopInstance = new AutonomousLoop(1000, 5000);
    
    // Mock the cached loop when requested
    mockRuntime.getCache.mockImplementation((key: string) => {
      if (key === 'autonomousLoop') return Promise.resolve(loopInstance);
      return Promise.resolve(null);
    });
    
    // Spy on the loop's stop method
    const stopSpy = vi.spyOn(loopInstance, 'stop');
    
    // Initialize the plugin
    await initAutonomousPlugin(mockRuntime as any);
    
    // Capture the registered shutdown handler
    const shutdownHandler = mockRuntime.registerEvent.mock.calls.find(
      call => call[0] === 'RUN_ENDED'
    )?.[1];
    
    // Ensure the handler was registered
    expect(shutdownHandler).toBeDefined();
    
    // Call the handler
    await shutdownHandler();
    
    // Verify the loop was stopped
    expect(stopSpy).toHaveBeenCalled();
  });
}); 