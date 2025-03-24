# Autonomous Core Loop & Planning Module Plugin

This plugin implements an autonomous core loop and planning module for Eliza OS. It enables agents to continuously operate with planning capabilities, even when idle.

## Features

- **Autonomous Core Loop**: Continuously polls for triggers, executes registered callbacks, and periodically calls a planning function.
- **Planning Module**: Generates plans based on the current state, monitors progress, and re-plans if discrepancies arise.

## Installation

```bash
npm install @elizaos/plugin-autonomous
```

## Usage

Add the plugin to your agent's configuration:

```typescript
import { autonomousPlugin } from '@elizaos/plugin-autonomous';

const agent = {
  plugins: [autonomousPlugin],
  // ... other agent configuration
};
```

### Configuration

Configure the plugin through your agent's settings:

```json
{
  "settings": {
    "autonomous": {
      "enabled": true,
      "triggerInterval": 10000, // milliseconds
      "planningInterval": 60000 // milliseconds
    }
  }
}
```

## API

### AutonomousLoop

The core loop that continuously checks for triggers and executes planning functions.

```typescript
// Register a trigger callback
autonomousLoop.registerTrigger(async () => {
  // Trigger logic here
});

// Start the loop
autonomousLoop.start();

// Stop the loop
autonomousLoop.stop();
```

### PlanningModule

Generates and monitors plans.

```typescript
// Generate a plan based on current state
const plan = await planningModule.generatePlan(state);

// Monitor a plan for discrepancies
await planningModule.monitorPlan(plan);

// Generate a new plan if needed
const updatedPlan = await planningModule.replanIfNeeded(state, currentPlan);
```

## License

MIT 