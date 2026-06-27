import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { logger } from "./logger.js";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "order-service";

const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

export const otelSdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

export async function startTracing() {
  otelSdk.start();
  logger.info({ serviceName }, "OpenTelemetry tracing started");
}

export async function shutdownTracing() {
  await otelSdk.shutdown();
  logger.info("OpenTelemetry tracing stopped");
}