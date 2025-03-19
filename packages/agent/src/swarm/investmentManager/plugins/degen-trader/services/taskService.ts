import { type AgentRuntime as IAgentRuntime, logger } from "@elizaos/core";
import { BuyService } from './buyService';
import { SellService } from './sellService';
import { v4 as uuidv4 } from "uuid";
import { ServiceTypes } from "../types";
import { TradeExecutionService } from './tradeExecutionService';
import { type SellSignalMessage } from '../types';
import type { AgentRuntime } from "@elizaos/core";

export class TaskService extends TradeExecutionService {
  private scheduledTasks: NodeJS.Timeout[] = [];

  constructor(
    protected override runtime: AgentRuntime,
    private buyService: BuyService,
    private sellService: SellService
  ) {
    // Get protected services from buyService via public methods
    super(
      runtime,
      buyService.getWalletService(),
      buyService.getDataService(),
      buyService.getAnalyticsService()
    );
  }

  // Implement required methods
  async initialize(): Promise<void> {
    // Implementation
  }

  async registerTasks(): Promise<void> {
    this.registerBuyTasks();
    this.registerSellTasks();
    this.registerMonitoringTasks();
  }

  async stop(): Promise<void> {
    // Clear all scheduled tasks
    this.scheduledTasks.forEach(task => clearTimeout(task));
    this.scheduledTasks = [];
  }

  private registerBuyTasks(): void {
    this.runtime.registerTaskWorker({
      name: "BUY_SIGNAL",
      execute: async (_runtime: typeof IAgentRuntime, options: any) => {
        logger.info("Executing BUY_SIGNAL task");
        if (!options?.metadata?.signal) {
          throw new Error("No signal data in buy task");
        }
        return await this.executeBuyTask(options.metadata);
      },
      validate: async () => true,
    });

    this.runtime.registerTaskWorker({
      name: "OPTIMIZE_BUY_PARAMETERS",
      execute: async () => {
        logger.info("Optimizing buy parameters");
        return await this.optimizeBuyParameters();
      },
      validate: async () => true,
    });
  }

  private registerSellTasks(): void {
    this.runtime.registerTaskWorker({
      name: "EXECUTE_SELL",
      execute: async (_runtime: typeof IAgentRuntime, options: any) => {
        logger.info("Executing sell task");
        return await this.executeSellTask(options);
      },
      validate: async () => true,
    });

    this.runtime.registerTaskWorker({
      name: "MONITOR_POSITIONS",
      execute: async () => {
        logger.info("Monitoring positions");
        return await this.monitorPositions();
      },
      validate: async () => true,
    });
  }

  private registerMonitoringTasks(): void {
    this.runtime.registerTaskWorker({
      name: "OPTIMIZE_SLIPPAGE",
      execute: async () => {
        logger.info("Optimizing slippage parameters");
        return await this.optimizeSlippageParameters();
      },
      validate: async () => true,
    });

    this.runtime.registerTaskWorker({
      name: "PERFORMANCE_ANALYSIS",
      execute: async () => {
        logger.info("Analyzing trading performance");
        return await this.analyzePerformance();
      },
      validate: async () => true,
    });
  }

  async createSellTask(signal: SellSignalMessage) {
    try {
      logger.info("Creating sell task", {
        tokenAddress: signal.tokenAddress,
        amount: signal.amount,
        currentBalance: signal.currentBalance
      });

      // Fetch expected receive amount (USDC) for this sell
      let expectedReceiveAmount = "0";
      try {
        // Get a quote for the expected amount we'll receive in USDC
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${signal.tokenAddress}&outputMint=So11111111111111111111111111111111111111112&amount=${Math.round(Number(signal.amount) * 1e9)}&slippageBps=0`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        if (quoteData?.outAmount) {
          expectedReceiveAmount = quoteData.outAmount;
          logger.info("Expected receive amount for sell", {
            expectedReceiveAmount,
            tokenAddress: signal.tokenAddress
          });
        }
      } catch (error) {
        console.log("Failed to fetch expected receive amount for sell", error);
      }

      // Calculate slippage using parent class method
      const slippage = await this.calculateExpectedAmount(signal.tokenAddress, Number(signal.amount), true);

      const taskId = uuidv4();
      await this.runtime.databaseAdapter.createTask({
        id: taskId,
        name: "EXECUTE_SELL",
        description: `Execute sell for ${signal.tokenAddress}`,
        tags: ["queue", "repeat", ServiceTypes.DEGEN_TRADING],
        metadata: {
          signal,
          expectedReceiveAmount,
          slippageBps: Number(slippage)
        },
      });

      logger.info("Sell task created", { taskId });
      return { success: true, taskId };
    } catch (error) {
      console.log("Error creating sell task", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async executeBuyTask(options: any) {
    try {
      const { signal, tradeAmount } = options;
      if (!signal) {
        throw new Error("No signal data in buy task");
      }

      const result = await this.buyService.handleBuySignal({
        ...signal,
        tradeAmount: tradeAmount || 0
      });

      if (result.success) {
        logger.info("Buy task executed successfully", {
          signature: result.signature,
          outAmount: result.outAmount
        });
      } else {
        logger.error("Buy task failed", { error: result.error });
      }

      return result;
    } catch (error) {
      console.log("Error executing buy task:", error)
      //logger.error("Error executing buy task:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async executeSellTask(options: any) {
    try {
      const { signal } = options;
      if (!signal) {
        throw new Error("No signal data in sell task");
      }

      const result = await this.sellService.handleSellSignal(signal);

      if (result.success) {
        logger.info("Sell task executed successfully", {
          signature: result.signature,
          receivedAmount: result.receivedAmount
        });
      } else {
        logger.error("Sell task failed", { error: result.error });
      }

      return result;
    } catch (error) {
      console.log("Error executing sell task:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async monitorPositions() {
    try {
      // Implement position monitoring logic
      // This could include checking stop losses, take profits, etc.
      logger.info("Position monitoring completed");
      return { success: true };
    } catch (error) {
      console.log("Error monitoring positions:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async optimizeSlippageParameters() {
    try {
      // Implement slippage optimization logic
      logger.info("Slippage parameters optimized");
      return { success: true };
    } catch (error) {
      console.log("Error optimizing slippage parameters:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async optimizeBuyParameters() {
    try {
      // Implement buy parameter optimization logic
      logger.info("Buy parameters optimized");
      return { success: true };
    } catch (error) {
      console.log("Error optimizing buy parameters:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async analyzePerformance() {
    try {
      // Implement performance analysis logic
      logger.info("Performance analysis completed");
      return { success: true };
    } catch (error) {
      console.log("Error analyzing performance:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}