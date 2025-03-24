/**
 * Unit tests for PlanningModule.ts
 * 
 * Tests the functionality of the Planning Module:
 * - Plan generation
 * - Progress monitoring
 * - Discrepancy handling and re-planning
 * - Subtask status updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlanningModule, type Plan, type Subtask } from './PlanningModule';

// Mock implementation of IAgentRuntime
const mockRuntime = {
  agentId: 'test-agent',
  // Add other required properties/methods as needed
} as any;

describe('PlanningModule', () => {
  let planningModule: PlanningModule;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    planningModule = new PlanningModule(mockRuntime);
    
    // Mock console methods to prevent test logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore mocks
    vi.restoreAllMocks();
  });
  
  it('should generate a plan when none exists', async () => {
    // Verify no plan exists initially
    expect(planningModule.getCurrentPlan()).toBeNull();
    
    // Call the plan method
    await planningModule.plan(mockRuntime);
    
    // Verify a plan was generated
    const currentPlan = planningModule.getCurrentPlan();
    expect(currentPlan).not.toBeNull();
    expect(currentPlan?.status).toBe('active');
    expect(currentPlan?.subtasks.length).toBeGreaterThan(0);
  });
  
  it('should update subtask status correctly', async () => {
    // First generate a plan
    await planningModule.plan(mockRuntime);
    
    const plan = planningModule.getCurrentPlan();
    expect(plan).not.toBeNull();
    
    // Get the first subtask ID
    const subtaskId = plan!.subtasks[0].id;
    
    // Update the subtask status
    const updateResult = planningModule.updateSubtaskStatus(subtaskId, 'in_progress');
    expect(updateResult).toBe(true);
    
    // Verify the status was updated
    const updatedPlan = planningModule.getCurrentPlan();
    expect(updatedPlan!.subtasks[0].status).toBe('in_progress');
  });
  
  it('should handle non-existent subtask update gracefully', async () => {
    // First generate a plan
    await planningModule.plan(mockRuntime);
    
    // Try to update a non-existent subtask
    const updateResult = planningModule.updateSubtaskStatus('non-existent-id', 'completed');
    
    // Should return false indicating failure
    expect(updateResult).toBe(false);
  });
  
  it('should complete the plan when all subtasks are completed', async () => {
    // First generate a plan
    await planningModule.plan(mockRuntime);
    
    const plan = planningModule.getCurrentPlan();
    expect(plan).not.toBeNull();
    
    // Complete all subtasks
    for (const subtask of plan!.subtasks) {
      planningModule.updateSubtaskStatus(subtask.id, 'completed');
    }
    
    // Call plan again to check for plan completion
    await planningModule.plan(mockRuntime);
    
    // Verify the plan was marked as completed and a new one generated
    expect(planningModule.getCurrentPlan()).toBeNull();
  });
  
  it('should handle planning errors gracefully', async () => {
    // Mock the private generatePlan method to throw an error
    // Note: We're using any type to access private method for testing
    const generatePlanSpy = vi.spyOn(planningModule as any, 'generatePlan')
      .mockImplementation(() => {
        throw new Error('Test error in plan generation');
      });
    
    // Call the plan method
    await planningModule.plan(mockRuntime);
    
    // Verify generatePlan was called
    expect(generatePlanSpy).toHaveBeenCalled();
    
    // Verify isPlanningInProgress was reset even after error
    expect((planningModule as any).isPlanningInProgress).toBe(false);
    
    // Restore the original implementation
    generatePlanSpy.mockRestore();
  });
  
  it('should handle discrepancies and trigger re-planning when needed', async () => {
    // Setup: First generate a plan
    await planningModule.plan(mockRuntime);
    
    // Store the original plan ID
    const originalPlanId = planningModule.getCurrentPlan()!.id;
    
    // Mock checkPlanProgress to return critical discrepancies
    const checkProgressSpy = vi.spyOn(planningModule as any, 'checkPlanProgress')
      .mockResolvedValue(['CRITICAL: Major state deviation detected']);
    
    // Call plan to trigger re-planning
    await planningModule.plan(mockRuntime);
    
    // Verify a new plan was generated
    const newPlan = planningModule.getCurrentPlan();
    expect(newPlan!.id).not.toBe(originalPlanId);
    
    // Restore the original implementation
    checkProgressSpy.mockRestore();
  });
  
  it('should not re-plan for non-critical discrepancies', async () => {
    // Setup: First generate a plan
    await planningModule.plan(mockRuntime);
    
    // Store the original plan ID
    const originalPlanId = planningModule.getCurrentPlan()!.id;
    
    // Mock checkPlanProgress to return non-critical discrepancies
    const checkProgressSpy = vi.spyOn(planningModule as any, 'checkPlanProgress')
      .mockResolvedValue(['MINOR: Small state deviation detected']);
    
    // Call plan
    await planningModule.plan(mockRuntime);
    
    // Verify the plan was not changed
    const currentPlan = planningModule.getCurrentPlan();
    expect(currentPlan!.id).toBe(originalPlanId);
    
    // Restore the original implementation
    checkProgressSpy.mockRestore();
  });
}); 