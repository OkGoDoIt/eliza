import { Service, IAgentRuntime, ServiceType } from '@elizaos/core';
import { AutonomousLoop } from '../AutonomousLoop';
import { PlanningModule } from '../PlanningModule';
import type { Plan, Subtask } from '../PlanningModule';
import type { TriggerCallback } from '../AutonomousLoop';

/**
 * Custom ServiceType for the autonomous service since it's not in the core enum
 */
export const AUTONOMOUS_SERVICE_TYPE = 'autonomous' as ServiceType;

/**
 * AutonomousService provides continuous operation capabilities for Eliza agents.
 * It manages the autonomous loop and planning module to enable agents to
 * continuously "think", plan, and respond to triggers even when idle.
 */
export class AutonomousService extends Service {
  // Required: Define the service type (used for runtime registration)
  static get serviceType(): ServiceType {
    return AUTONOMOUS_SERVICE_TYPE;
  }

  // Required: Describe what this service enables the agent to do
  capabilityDescription = 'Enables the agent to operate autonomously with continuous planning';
  
  private loop: AutonomousLoop;
  private planningModule: PlanningModule;

  /**
   * Constructs a new AutonomousService instance.
   * @param runtime The agent runtime
   */
  constructor(protected runtime: IAgentRuntime) {
    super();
    this.planningModule = new PlanningModule(runtime);
    this.loop = new AutonomousLoop(runtime);
    
    // Set the planning function to use the PlanningModule's plan method
    this.loop.setPlanningFunction(this.planningModule.plan.bind(this.planningModule));
  }

  /**
   * Initializes the autonomous service.
   * @param runtime The agent runtime
   * @returns A Promise that resolves when initialization is complete
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Any initialization logic can go here
    // In this case, the constructor already did the necessary setup
  }

  /**
   * Starts the autonomous service.
   * @param runtime The agent runtime
   * @returns A Promise that resolves to the AutonomousService instance
   */
  static async start(runtime: IAgentRuntime): Promise<AutonomousService> {
    const service = new AutonomousService(runtime);
    await service.initialize(runtime);
    await service.loop.start();
    return service;
  }

  /**
   * Stops the autonomous service.
   * @returns A Promise that resolves when the service is stopped
   */
  async stop(): Promise<void> {
    await this.loop.stop();
  }

  /**
   * Gets the current plan.
   * @returns The current plan or null if no plan exists
   */
  getCurrentPlan(): Plan | null {
    return this.planningModule.getCurrentPlan();
  }

  /**
   * Updates the status of a subtask in the current plan.
   * @param subtaskId The ID of the subtask to update
   * @param status The new status
   * @returns True if the subtask was updated, false otherwise
   */
  updateSubtaskStatus(subtaskId: string, status: Subtask['status']): boolean {
    return this.planningModule.updateSubtaskStatus(subtaskId, status);
  }

  /**
   * Registers a trigger callback to be executed during the loop.
   * @param trigger The trigger callback function
   */
  registerTrigger(trigger: TriggerCallback): void {
    this.loop.registerTrigger(trigger);
  }
} 