import { State } from '@elizaos/core';

/**
 * Represents a subtask that is part of a larger plan
 */
export interface Subtask {
  /** Unique identifier for the subtask */
  id: string;
  
  /** Description of what the subtask should do */
  description: string;
  
  /** Current status of the subtask */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  /** When the subtask was created */
  createdAt: number;
  
  /** When the subtask was last updated */
  updatedAt: number;
  
  /** Additional data related to the subtask */
  data?: Record<string, unknown>;
}

/**
 * Represents a complete plan consisting of multiple subtasks
 */
export interface Plan {
  /** Unique identifier for the plan */
  id: string;
  
  /** Array of subtasks that make up the plan */
  subtasks: Subtask[];
  
  /** Current status of the overall plan */
  status: 'created' | 'in_progress' | 'completed' | 'failed';
  
  /** When the plan was created */
  createdAt: number;
  
  /** When the plan was last updated */
  updatedAt: number;
  
  /** Additional metadata about the plan */
  metadata?: {
    /** ID of the previous plan if this is a replan */
    previousPlanId?: string;
    
    /** Reason for replanning */
    replanReason?: string;
    
    /** When the original plan was created if this is a replan */
    originalPlanCreatedAt?: number;
    
    /** Any additional metadata */
    [key: string]: unknown;
  };
}

/**
 * Module for handling planning and executing tasks in an autonomous loop
 */
export class PlanningModule {
  /**
   * Generate a new plan based on the current state
   * @param state - Current state of the agent
   * @returns A new plan with subtasks
   */
  async generatePlan(state: State): Promise<Plan> {
    // Create a unique ID for the plan
    const planId = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // For demonstration purposes, we'll create a simple plan with mock subtasks
    const subtasks: Subtask[] = [
      {
        id: `subtask-${Date.now()}-1`,
        description: `Analyze recent messages from ${state.agentName || 'user'}`,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: `subtask-${Date.now()}-2`,
        description: 'Check for any required actions',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: `subtask-${Date.now()}-3`,
        description: 'Prepare appropriate response',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    // In a real implementation, this would analyze the state and create appropriate subtasks
    // For now, this is just a demonstration
    
    return {
      id: planId,
      subtasks,
      status: 'created',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  
  /**
   * Monitor a plan's execution and log discrepancies
   * @param plan - The plan to monitor
   */
  async monitorPlan(plan: Plan): Promise<void> {
    if (!plan) {
      throw new Error('Invalid plan provided');
    }
    
    console.log(`Monitoring plan ${plan.id} with ${plan.subtasks.length} subtasks`);
    
    // For demonstration purposes, we simply log the current state of the plan
    // In a real implementation, this would check the progress of each subtask
    
    const pendingTasks = plan.subtasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = plan.subtasks.filter(task => task.status === 'in_progress').length;
    const completedTasks = plan.subtasks.filter(task => task.status === 'completed').length;
    const failedTasks = plan.subtasks.filter(task => task.status === 'failed').length;
    
    console.log(`Plan status: ${pendingTasks} pending, ${inProgressTasks} in progress, ${completedTasks} completed, ${failedTasks} failed`);
  }
  
  /**
   * Check if a plan needs to be updated based on new state information
   * @param state - Current state of the agent
   * @param currentPlan - The currently active plan
   * @returns Either the original plan or a new plan if changes were needed
   */
  async replanIfNeeded(state: State, currentPlan: Plan): Promise<Plan> {
    if (!currentPlan) {
      throw new Error('Invalid plan provided');
    }
    
    console.log(`Checking if plan ${currentPlan.id} needs updating`);
    
    // Check for discrepancies that would require replanning
    // For demonstration purposes, we'll check if any tasks have failed
    
    const hasFailedTasks = currentPlan.subtasks.some(task => task.status === 'failed');
    
    if (hasFailedTasks) {
      console.log('Detected failed tasks, generating new plan');
      
      // Generate a new plan to replace the current one
      const newPlan = await this.generatePlan(state);
      
      // Add metadata about the previous plan
      newPlan.metadata = {
        previousPlanId: currentPlan.id,
        replanReason: 'Failed tasks detected',
        originalPlanCreatedAt: currentPlan.metadata?.originalPlanCreatedAt || currentPlan.createdAt
      };
      
      return newPlan;
    }
    
    // If no discrepancies found, return the original plan
    console.log('No replanning needed, continuing with current plan');
    return currentPlan;
  }
} 