/**
 * Autonomous Plugin for Eliza OS
 * 
 * This plugin provides autonomous operation capabilities for Eliza agents,
 * including continuous event loops, planning, and more.
 */

import { Plugin } from '@elizaos/core';
import { AutonomousService, AUTONOMOUS_SERVICE_TYPE } from './services/AutonomousService';
import { autonomousActions } from './actions';

/**
 * The main autonomous plugin object that follows the Eliza OS plugin interface.
 */
export const autonomousPlugin: Plugin = {
  name: 'autonomous',
  description: 'Provides autonomous operation capabilities for Eliza agents, including continuous event loops, planning, and task tracking',
  // We need to cast the array to avoid type errors with the abstract Service class
  services: [AutonomousService] as any,
  actions: autonomousActions,
};

// Export types and classes for direct use when needed
export { AutonomousLoop, type TriggerCallback, type PlanningFunction } from './AutonomousLoop';
export { PlanningModule, type Plan, type Subtask } from './PlanningModule';
export { AutonomousService, AUTONOMOUS_SERVICE_TYPE } from './services/AutonomousService';
export { autonomousActions } from './actions'; 