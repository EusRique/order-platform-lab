import client from "prom-client";

export const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "order_service_",
});

export const httpRequestsTotal = new client.Counter({
  name: "order_service_http_requests_total",
  help: "otal HTTP requests received by order-service",
  labelNames: ["method", "route", "status_code"],
});

export const ordersCreatedTotal = new client.Counter({
  name: "order_service_orders_created_total",
  help: "Total number of orders created",
});

export const rabbitmqEventsPublishedTotal = new client.Counter({
  name: "order_service_rabbitmq_events_published_total",
  help: "Total events published to RabbitMQ",
  labelNames: ["queue"],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(ordersCreatedTotal);
register.registerMetric(rabbitmqEventsPublishedTotal);
