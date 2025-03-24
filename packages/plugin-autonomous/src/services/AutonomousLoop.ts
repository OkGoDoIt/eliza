/**
 * AutonomousLoop - Core component that continuously polls for triggers and executes them.
 * This class manages a continuous event loop that executes registered trigger callbacks
 * and periodically calls a planning function.
 */
export class AutonomousLoop {
  /**
   * Array of trigger callbacks that will be executed during the loop
   * @private
   */
  private triggers: Array<() => Promise<void>> = [];

  /**
   * Planning function to be called periodically
   * @private
   */
  private planningCallback: (() => Promise<void>) | null = null;

  /**
   * Timer reference for the main loop interval
   * @private
   */
  private loopTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Timer reference for the planning interval
   * @private
   */
  private planningTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Interval (in milliseconds) between each trigger check
   * @private
   */
  private triggerInterval: number;

  /**
   * Interval (in milliseconds) between each planning function call
   * @private
   */
  private planningInterval: number;

  /**
   * Flag indicating whether the loop is currently running
   * @private
   */
  private isRunning: boolean = false;

  /**
   * Creates a new AutonomousLoop instance
   * @param triggerInterval - Milliseconds between trigger checks (default: 10000ms)
   * @param planningInterval - Milliseconds between planning calls (default: 60000ms)
   */
  constructor(triggerInterval: number = 10000, planningInterval: number = 60000) {
    this.triggerInterval = triggerInterval;
    this.planningInterval = planningInterval;
  }

  /**
   * Starts the autonomous loop
   * The loop will continuously check for triggers and execute the planning function
   */
  public start(): void {
    if (this.isRunning) {
      console.log('AutonomousLoop is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting autonomous loop');

    // Set up the main loop for triggers
    this.loopTimer = setInterval(async () => {
      await this.executeTriggers();
    }, this.triggerInterval);

    // Set up the planning loop if a planning callback is registered
    if (this.planningCallback) {
      this.planningTimer = setInterval(async () => {
        await this.executePlanningCallback();
      }, this.planningInterval);
    }
  }

  /**
   * Stops the autonomous loop
   * Clears all timers and resets the running state
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('AutonomousLoop is not running');
      return;
    }

    console.log('Stopping autonomous loop');

    // Clear the main loop timer
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    // Clear the planning timer
    if (this.planningTimer) {
      clearInterval(this.planningTimer);
      this.planningTimer = null;
    }

    this.isRunning = false;
  }

  /**
   * Registers a trigger callback to be executed in the loop
   * @param trigger - Async function to be called during the loop
   */
  public registerTrigger(trigger: () => Promise<void>): void {
    this.triggers.push(trigger);
  }

  /**
   * Sets the planning function callback
   * @param planningFn - Async function to be called periodically
   */
  public setPlanningCallback(planningFn: () => Promise<void>): void {
    this.planningCallback = planningFn;

    // If the loop is already running, start the planning timer
    if (this.isRunning && !this.planningTimer) {
      this.planningTimer = setInterval(async () => {
        await this.executePlanningCallback();
      }, this.planningInterval);
    }
  }

  /**
   * Executes all registered trigger callbacks
   * @private
   */
  private async executeTriggers(): Promise<void> {
    for (const trigger of this.triggers) {
      try {
        await trigger();
      } catch (error) {
        console.error('Error executing trigger:', error);
        // Continue with the next trigger even if one fails
      }
    }
  }

  /**
   * Executes the planning callback
   * @private
   */
  private async executePlanningCallback(): Promise<void> {
    if (!this.planningCallback) return;

    try {
      await this.planningCallback();
    } catch (error) {
      console.error('Error executing planning callback:', error);
    }
  }
} 