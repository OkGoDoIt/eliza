import { IAgentRuntime, Plugin, State, UUID } from "@elizaos/core";
import { AutonomousLoop } from "./services/AutonomousLoop";
import { PlanningModule } from "./services/PlanningModule";

// Re-export classes for direct import
export { AutonomousLoop, PlanningModule };
export type { Plan, Subtask } from "./services/PlanningModule";

// Default settings
const DEFAULT_TRIGGER_INTERVAL = 10000; // 10 seconds
const DEFAULT_PLANNING_INTERVAL = 60000; // 1 minute

/**
 * Service name for the autonomous loop
 */
export const AUTONOMOUS_SERVICE = "autonomous_loop";

/**
 * The autonomous plugin offers continuous operation capabilities to ElizaOS agents
 * by implementing a background event loop and planning functionality.
 */
export const autonomousPlugin: Plugin = {
  name: "autonomous",
  description: "Provides continuous autonomous operation and planning capabilities",
  
  // No services, actions, providers, or evaluators yet
  // These could be added in future versions
  services: [],
  actions: [],
  providers: [],
  evaluators: [],
  clients: [],
  adapters: [],

  npmName: "@elizaos/plugin-autonomous",
  config: {}
};

// Create a function to initialize the plugin since init is not part of the Plugin interface
export async function initAutonomousPlugin(runtime: IAgentRuntime): Promise<void> {
  console.log("Initializing autonomous plugin");
  
  // Get settings from the agent configuration
  const enabledSetting = runtime.getSetting("autonomous.enabled");
  const enabled = enabledSetting === "true" || enabledSetting === "1"; 
  const triggerInterval = Number(runtime.getSetting("autonomous.triggerInterval")) || DEFAULT_TRIGGER_INTERVAL;
  const planningInterval = Number(runtime.getSetting("autonomous.planningInterval")) || DEFAULT_PLANNING_INTERVAL;
  
  if (!enabled) {
    console.log("Autonomous plugin is disabled");
    return;
  }
  
  // Create the autonomous loop and planning module
  const autonomousLoop = new AutonomousLoop(triggerInterval, planningInterval);
  const planningModule = new PlanningModule();
  
  // Cache instances since the runtime interface doesn't have setCache/getCache
  // We'll implement a workaround for these
  const cacheAdapter = runtime.databaseAdapter as any;
  if (cacheAdapter.setCache) {
    await cacheAdapter.setCache({
      agentId: runtime.agentId,
      key: "autonomousLoop", 
      value: JSON.stringify(autonomousLoop)
    });
    
    await cacheAdapter.setCache({
      agentId: runtime.agentId,
      key: "planningModule",
      value: JSON.stringify(planningModule)
    });
  }
  
  // Set up the planning callback
  autonomousLoop.setPlanningCallback(async () => {
    // Get the current state to generate a plan
    // Replace getMemories with databaseAdapter direct call
    const message = await runtime.messageManager.getMemories({
      roomId: runtime.agentId as UUID,
      count: 1
    });
    
    if (message.length === 0) {
      console.log("No messages found to compose state from");
      return;
    }
    
    const state = await runtime.composeState(message[0]);
    const plan = await planningModule.generatePlan(state);
    
    // Cache the current plan
    if (cacheAdapter.setCache) {
      await cacheAdapter.setCache({
        agentId: runtime.agentId,
        key: "currentPlan",
        value: JSON.stringify(plan)
      });
    }
    
    // Log the generated plan
    console.log(`Generated plan: ${plan.id} with ${plan.subtasks.length} subtasks`);
    
    // Monitor the plan for discrepancies
    await planningModule.monitorPlan(plan);
  });
  
  // Register trigger for continuous plan monitoring
  autonomousLoop.registerTrigger(async () => {
    // Get the current plan
    let currentPlan = null;
    if (cacheAdapter.getCache) {
      const cachedPlan = await cacheAdapter.getCache({
        agentId: runtime.agentId,
        key: "currentPlan"
      });
      
      if (cachedPlan) {
        currentPlan = JSON.parse(cachedPlan);
      }
    }
    
    if (!currentPlan) return;
    
    // Get latest state
    const message = await runtime.messageManager.getMemories({
      roomId: runtime.agentId as UUID,
      count: 1
    });
    
    if (message.length === 0) return;
    
    const state = await runtime.composeState(message[0]);
    
    // Check if we need to replan
    const updatedPlan = await planningModule.replanIfNeeded(state, currentPlan);
    
    // Cache the updated plan
    if (updatedPlan.id !== currentPlan.id && cacheAdapter.setCache) {
      await cacheAdapter.setCache({
        agentId: runtime.agentId,
        key: "currentPlan",
        value: JSON.stringify(updatedPlan)
      });
      console.log(`Updated plan: ${updatedPlan.id} with ${updatedPlan.subtasks.length} subtasks`);
    }
  });
  
  // Start the autonomous loop
  autonomousLoop.start();
  
  // Register a shutdown handler if the runtime supports event registration
  const runtimeWithEvents = runtime as any;
  if (runtimeWithEvents.registerEvent) {
    runtimeWithEvents.registerEvent("RUN_ENDED", async () => {
      let loop = null;
      if (cacheAdapter.getCache) {
        const cachedLoop = await cacheAdapter.getCache({
          agentId: runtime.agentId,
          key: "autonomousLoop"
        });
        
        if (cachedLoop) {
          loop = JSON.parse(cachedLoop);
          // Since we can't directly call methods on the deserialized object, create a new instance
          const newLoop = new AutonomousLoop(
            loop.triggerInterval || DEFAULT_TRIGGER_INTERVAL,
            loop.planningInterval || DEFAULT_PLANNING_INTERVAL
          );
          newLoop.stop();
        }
      }
    });
  }
}

export default autonomousPlugin; 