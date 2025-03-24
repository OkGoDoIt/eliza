/**
 * PlanningModule.ts
 * 
 * Implements the Planning Module for Eliza OS.
 * This module generates plans based on the current state,
 * monitors progress, and re-plans if discrepancies arise.
 */

import type { IAgentRuntime } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

/**
 * Type definition for a subtask in a plan.
 */
export interface Subtask {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  dependencies?: string[];
}

/**
 * Type definition for a plan.
 */
export interface Plan {
  id: string;
  goal: string;
  subtasks: Subtask[];
  createdAt: number;
  updatedAt: number;
  status: "active" | "completed" | "abandoned";
}

/**
 * PlanningModule class that handles plan generation, monitoring,
 * and re-planning for autonomous agent operation.
 */
export class PlanningModule {
  /** Reference to the agent runtime */
  private runtime: IAgentRuntime;
  
  /** Current active plan */
  private currentPlan: Plan | null = null;
  
  /** Flag indicating whether a planning cycle is in progress */
  private isPlanningInProgress: boolean = false;

  /**
   * Constructs a new PlanningModule instance.
   * 
   * @param runtime - The agent runtime instance this planning module is attached to
   */
  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Main planning function to be called periodically by the AutonomousLoop.
   * 
   * This method:
   * 1. Gets the current agent state
   * 2. Generates a plan if none exists
   * 3. Monitors progress of existing plans
   * 4. Re-plans if discrepancies are detected
   * 
   * @param runtime - The agent runtime instance
   */
  public async plan(runtime: IAgentRuntime): Promise<void> {
    if (this.isPlanningInProgress) {
      elizaLogger.warn({
        agentId: this.runtime.agentId,
        action: 'planning_skipped'
      }, 'Planning cycle already in progress, skipping');
      return;
    }
    
    this.isPlanningInProgress = true;
    
    try {
      // If no current plan exists, generate one
      if (!this.currentPlan) {
        await this.generatePlan();
        return;
      }
      
      // Check progress of current plan
      const discrepancies = await this.checkPlanProgress();
      
      // If discrepancies found, consider re-planning
      if (discrepancies && discrepancies.length > 0) {
        await this.handleDiscrepancies(discrepancies);
      }
      
      // Mark plan as completed if all subtasks are done
      if (this.currentPlan && this.isAllSubtasksCompleted()) {
        this.completePlan();
      }
    } catch (error) {
      elizaLogger.error({
        agentId: this.runtime.agentId,
        action: 'planning_error',
        error: error instanceof Error ? error.message : String(error)
      }, 'Error during planning cycle');
    } finally {
      this.isPlanningInProgress = false;
    }
  }

  /**
   * Generates a new plan based on the current state.
   * 
   * @private
   */
  private async generatePlan(): Promise<void> {
    elizaLogger.info({
      agentId: this.runtime.agentId,
      action: 'generate_plan'
    }, 'Generating new plan');
    
    try {
      // In a real implementation, this would use inference to generate a plan
      // For now, we're creating a simple placeholder plan
      const newPlan: Plan = {
        id: `plan-${Date.now()}`,
        goal: "Default goal",
        subtasks: [
          {
            id: `task-${Date.now()}-1`,
            description: "Example subtask 1",
            status: "pending"
          },
          {
            id: `task-${Date.now()}-2`,
            description: "Example subtask 2",
            status: "pending",
            dependencies: [`task-${Date.now()}-1`]
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active"
      };
      
      this.currentPlan = newPlan;
      
      elizaLogger.info({
        agentId: this.runtime.agentId,
        action: 'plan_generated',
        planId: newPlan.id
      }, 'New plan generated');
    } catch (error) {
      elizaLogger.error({
        agentId: this.runtime.agentId,
        action: 'generate_plan_error',
        error: error instanceof Error ? error.message : String(error)
      }, 'Error generating plan');
      throw error;
    }
  }

  /**
   * Checks the progress of the current plan and identifies discrepancies.
   * 
   * @private
   * @returns Array of discrepancy descriptions
   */
  private async checkPlanProgress(): Promise<string[]> {
    if (!this.currentPlan) {
      return [];
    }
    
    elizaLogger.info({
      agentId: this.runtime.agentId,
      action: 'check_plan_progress',
      planId: this.currentPlan.id
    }, 'Checking plan progress');
    
    // In a real implementation, this would compare expected vs. actual state
    // For now, returning empty array (no discrepancies)
    return [];
  }

  /**
   * Handles discrepancies by potentially triggering re-planning.
   * 
   * @private
   * @param discrepancies - Array of discrepancy descriptions
   */
  private async handleDiscrepancies(discrepancies: string[]): Promise<void> {
    elizaLogger.info({
      agentId: this.runtime.agentId,
      action: 'handle_discrepancies',
      planId: this.currentPlan?.id,
      discrepancyCount: discrepancies.length
    }, 'Handling plan discrepancies');
    
    // Determine if re-planning is needed based on severity of discrepancies
    const needReplanning = this.shouldReplan(discrepancies);
    
    if (needReplanning) {
      // Abandon current plan
      if (this.currentPlan) {
        this.currentPlan.status = "abandoned";
        this.currentPlan.updatedAt = Date.now();
      }
      
      // Generate new plan
      await this.generatePlan();
    }
  }

  /**
   * Determines if re-planning is needed based on discrepancies.
   * 
   * @private
   * @param discrepancies - Array of discrepancy descriptions
   * @returns Boolean indicating if re-planning is needed
   */
  private shouldReplan(discrepancies: string[]): boolean {
    // Simple heuristic: if there are any critical discrepancies, replan
    return discrepancies.some(d => d.startsWith("CRITICAL:"));
  }

  /**
   * Checks if all subtasks in the current plan are completed.
   * 
   * @private
   * @returns Boolean indicating if all subtasks are completed
   */
  private isAllSubtasksCompleted(): boolean {
    if (!this.currentPlan) {
      return false;
    }
    
    return this.currentPlan.subtasks.every(task => task.status === "completed");
  }

  /**
   * Marks the current plan as completed.
   * 
   * @private
   */
  private completePlan(): void {
    if (!this.currentPlan) {
      return;
    }
    
    this.currentPlan.status = "completed";
    this.currentPlan.updatedAt = Date.now();
    
    elizaLogger.info({
      agentId: this.runtime.agentId,
      action: 'plan_completed',
      planId: this.currentPlan.id
    }, 'Plan completed successfully');
    
    // Clear the current plan to generate a new one in the next cycle
    this.currentPlan = null;
  }

  /**
   * Gets the current plan.
   * 
   * @returns The current plan or null if no plan exists
   */
  public getCurrentPlan(): Plan | null {
    return this.currentPlan;
  }

  /**
   * Manually updates the status of a subtask.
   * 
   * @param subtaskId - The ID of the subtask to update
   * @param status - The new status of the subtask
   * @returns Boolean indicating if the update was successful
   */
  public updateSubtaskStatus(subtaskId: string, status: Subtask['status']): boolean {
    if (!this.currentPlan) {
      return false;
    }
    
    const subtask = this.currentPlan.subtasks.find(task => task.id === subtaskId);
    if (!subtask) {
      return false;
    }
    
    subtask.status = status;
    this.currentPlan.updatedAt = Date.now();
    
    elizaLogger.info({
      agentId: this.runtime.agentId,
      action: 'update_subtask_status',
      planId: this.currentPlan.id,
      subtaskId,
      status
    }, 'Subtask status updated');
    
    return true;
  }
} 