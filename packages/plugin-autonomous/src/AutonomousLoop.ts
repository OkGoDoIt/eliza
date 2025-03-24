/**
 * AutonomousLoop.ts
 * 
 * Implements the Autonomous Core Loop for Eliza OS.
 * This module provides a continuously running loop that polls for triggers,
 * executes registered callbacks, and periodically calls a planning function.
 */

import type { IAgentRuntime } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

/**
 * Type definition for trigger callback functions.
 * These functions are executed during the loop and return a Promise.
 */
export type TriggerCallback = () => Promise<void>;

/**
 * Type definition for the planning function.
 * This function is called periodically to generate and update plans.
 */
export type PlanningFunction = (runtime: IAgentRuntime) => Promise<void>;

/**
 * AutonomousLoop class that manages a continuous event loop
 * for autonomous agent operation.
 */
export class AutonomousLoop {
  /** List of registered trigger callbacks to be executed during the loop */
  private triggers: TriggerCallback[] = [];
  
  /** Reference to the timer or interval that drives the loop */
  private loopTimer: NodeJS.Timeout | null = null;
  
  /** Flag indicating whether the loop is currently running */
  private isRunning: boolean = false;
  
  /** Reference to the agent runtime */
  private runtime: IAgentRuntime;
  
  /** Planning function to be called periodically */
  private planningFunction: PlanningFunction | null = null;
  
  /** Timestamp of the last planning execution */
  private lastPlanTime: number = 0;
  
  /** Interval between planning executions in milliseconds */
  private planIntervalMs: number = 60000; // Default: plan every minute

  /**
   * Constructs a new AutonomousLoop instance.
   * 
   * @param runtime - The agent runtime instance this loop is attached to
   */
  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Starts the autonomous loop.
   * 
   * This method initiates a continuous event loop that:
   * 1. Polls for registered triggers
   * 2. Executes trigger callbacks
   * 3. Periodically calls the planning function
   * 
   * @param options - Configuration options for the loop
   * @param options.loopIntervalMs - The interval in milliseconds between loop iterations (default: 5000ms)
   * @param options.planIntervalMs - The interval in milliseconds between planning calls (default: 60000ms)
   * @returns A Promise that resolves when the loop has started
   */
  public async start(options?: { loopIntervalMs?: number; planIntervalMs?: number }): Promise<void> {
    const loopIntervalMs = options?.loopIntervalMs ?? 5000;
    
    if (options?.planIntervalMs) {
      this.planIntervalMs = options.planIntervalMs;
    }
    
    if (this.isRunning) {
      elizaLogger.warn({ 
        agentId: this.runtime.agentId, 
        action: 'start_ignored' 
      }, 'Autonomous loop already running');
      return; // Already running
    }
    
    this.isRunning = true;
    this.lastPlanTime = Date.now();
    
    // Log that we've started
    elizaLogger.info({ 
      agentId: this.runtime.agentId, 
      action: 'start', 
      loopIntervalMs,
      planIntervalMs: this.planIntervalMs
    }, 'Autonomous loop started');
    
    // Implement the continuous loop
    this.loopTimer = setInterval(async () => {
      try {
        // Execute all registered triggers
        await this.executeTriggers();
        
        // Call planning function if interval has elapsed
        const currentTime = Date.now();
        if (this.planningFunction && currentTime - this.lastPlanTime >= this.planIntervalMs) {
          try {
            await this.planningFunction(this.runtime);
            this.lastPlanTime = currentTime;
            
            elizaLogger.info({ 
              agentId: this.runtime.agentId, 
              action: 'planning_executed' 
            }, 'Planning function executed');
          } catch (error) {
            elizaLogger.error({ 
              agentId: this.runtime.agentId, 
              action: 'planning_error', 
              error: error instanceof Error ? error.message : String(error) 
            }, 'Error executing planning function');
          }
        }
      } catch (error) {
        // Catch any unexpected errors in the main loop
        elizaLogger.error({ 
          agentId: this.runtime.agentId, 
          action: 'loop_error', 
          error: error instanceof Error ? error.message : String(error) 
        }, 'Unexpected error in autonomous loop');
      }
    }, loopIntervalMs);
  }

  /**
   * Stops the autonomous loop.
   * 
   * This method halts the continuous event loop by clearing the timer
   * and performing any necessary cleanup.
   * 
   * @returns A Promise that resolves when the loop has stopped
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      elizaLogger.warn({ 
        agentId: this.runtime.agentId, 
        action: 'stop_ignored' 
      }, 'Autonomous loop not running');
      return; // Not running
    }
    
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    
    this.isRunning = false;
    this.lastPlanTime = 0;
    
    // Log that we've stopped
    elizaLogger.info({ 
      agentId: this.runtime.agentId, 
      action: 'stop' 
    }, 'Autonomous loop stopped');
  }

  /**
   * Registers a new trigger callback to be executed during the loop.
   * 
   * @param trigger - The callback function to be executed
   */
  public registerTrigger(trigger: TriggerCallback): void {
    this.triggers.push(trigger);
  }

  /**
   * Sets the planning function to be called periodically.
   * 
   * @param planningFunction - The planning function to call
   */
  public setPlanningFunction(planningFunction: PlanningFunction): void {
    this.planningFunction = planningFunction;
    elizaLogger.info({ 
      agentId: this.runtime.agentId, 
      action: 'set_planning_function' 
    }, 'Planning function registered');
  }

  /**
   * Executes all registered trigger callbacks.
   * 
   * This is a private helper method that runs all triggers
   * and handles any errors that might occur.
   * 
   * @private
   * @returns A Promise that resolves when all triggers have been executed
   */
  private async executeTriggers(): Promise<void> {
    for (const trigger of this.triggers) {
      try {
        await trigger();
      } catch (error) {
        // Log the error but continue with other triggers
        elizaLogger.error({ 
          agentId: this.runtime.agentId, 
          action: 'trigger_error', 
          error: error instanceof Error ? error.message : String(error) 
        }, 'Error executing trigger');
      }
    }
  }
} 