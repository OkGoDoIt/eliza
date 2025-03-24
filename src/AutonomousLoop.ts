/**
 * AutonomousLoop.ts
 * 
 * Implements the Autonomous Core Loop for Eliza OS.
 * This module provides a continuously running loop that polls for triggers,
 * executes registered callbacks, and periodically calls a planning function.
 */

import type { IAgentRuntime } from "./packages/core/src/types.ts";

/**
 * Type definition for trigger callback functions.
 * These functions are executed during the loop and return a Promise.
 */
export type TriggerCallback = () => Promise<void>;

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
   * @param intervalMs - The interval in milliseconds between loop iterations (default: 5000ms)
   * @returns A Promise that resolves when the loop has started
   */
  public async start(intervalMs: number = 5000): Promise<void> {
    if (this.isRunning) {
      return; // Already running
    }
    
    this.isRunning = true;
    
    // Log that we've started
    await this.runtime.log({
      body: { action: 'start', intervalMs },
      entityId: this.runtime.agentId,
      type: 'AUTONOMOUS_LOOP',
    });
    
    // TODO: Implement the actual continuous loop
    this.loopTimer = setInterval(async () => {
      await this.executeTriggers();
    }, intervalMs);
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
      return; // Not running
    }
    
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    
    this.isRunning = false;
    
    // Log that we've stopped
    await this.runtime.log({
      body: { action: 'stop' },
      entityId: this.runtime.agentId,
      type: 'AUTONOMOUS_LOOP',
    });
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
   * Executes all registered trigger callbacks.
   * 
   * This is a private helper method that runs all triggers
   * and handles any errors that might occur.
   * 
   * @private
   * @returns A Promise that resolves when all triggers have been executed
   */
  private async executeTriggers(): Promise<void> {
    // TODO: Implement trigger execution logic
    for (const trigger of this.triggers) {
      try {
        await trigger();
      } catch (error) {
        // Log the error but continue with other triggers
        await this.runtime.log({
          body: { action: 'trigger_error', error: error instanceof Error ? error.message : String(error) },
          entityId: this.runtime.agentId,
          type: 'AUTONOMOUS_LOOP_ERROR',
        });
      }
    }
  }
} 