import client from "prom-client";

export const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "order_worker_",
});

export const workerMessagesProcessedTotal = new client.Counter({
  name: "order_worker_messages_processed_total",
  help: "Total messages processed successfully by order-worker",
  labelNames: ["queue"],
});

export const workerMessagesFailedTotal = new client.Counter({
  name: "order_worker_messages_failed_total",
  help: "Total messages failed by order-worker",
  labelNames: ["queue"],
});

register.registerMetric(workerMessagesProcessedTotal);
register.registerMetric(workerMessagesFailedTotal);
