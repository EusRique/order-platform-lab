import { FastifyInstance } from "fastify";
import { CreateOrderUseCase } from "../../../application/use-cases/CreateOrderUseCase.js";
import { logger } from "../../observability/logger.js";

type CreateOrderBody = {
  customerId: string;
  amount: number;
};

//A rota só adapta HTTP para caso de uso. Ela não contém regra de negócio.
export async function OrderRoutes(
  app: FastifyInstance,
  createOrderUseCase: CreateOrderUseCase,
) {
  app.post<{ Body: CreateOrderBody }>("/orders", async (request, reply) => {
    const correlationId =
      request.headers["x-correlation-id"]?.toString() ?? "unknown";

    logger.info(
      { correlationId, body: request.body },
      "Received create order request",
    );

    const result = await createOrderUseCase.execute({
      customerId: request.body.customerId,
      amount: request.body.amount,
      correlationId,
    });

    logger.info(
      {
        correlationId,
        orderId: result.id,
      },
      "Create order request finished",
    );

    return reply.status(201).send(result);
  });
}
