# Autonomous Plugin Examples

This directory contains standalone examples showing how to use the Autonomous Plugin components directly.

## Integration Example

The `integration-example.ts` file demonstrates how to wire together the AutonomousLoop and PlanningModule components without using the plugin architecture. This is useful for:

1. Understanding the fundamental interactions between these components
2. Testing specific trigger and planning configurations
3. Using these components in a non-Eliza OS environment

### How to Run the Example

You can integrate this example into your own code:

```typescript
import { runIntegrationExample } from './examples/integration-example';

// Run the example
await runIntegrationExample();
```

### What the Example Does

The integration example:

1. Creates instances of AutonomousLoop and PlanningModule
2. Registers trigger callbacks that execute periodically
3. Sets up a planning callback that generates and monitors plans
4. Starts the loop, which will run both triggers and planning functions at specific intervals
5. Demonstrates error handling in both triggers and planning

### Customizing the Example

You can modify the example to suit your needs:

- Adjust the trigger and planning intervals
- Add your own triggers for specific functionality
- Modify the planning logic to generate more sophisticated plans
- Integrate with other systems or data sources

## Running the Tests

The `__tests__/ExampleIntegration.test.ts` file contains comprehensive tests for the integration example. These tests verify:

1. The complete integration flow between AutonomousLoop and PlanningModule
2. Error handling and recovery
3. Plan generation, monitoring, and replanning when discrepancies are detected

To run the tests:

```bash
# From the plugin-autonomous directory
npm test
``` 