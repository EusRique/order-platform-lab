import pino from "pino";
import { trace } from "@opentelemetry/api";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: process.env.SERVICE_NAME ?? "order-worker",
    environment: process.env.NODE_ENV ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const span = trace.getActiveSpan();

    if (!span) {
      return {};
    }

    const spanContext = span.spanContext();

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  },
});
