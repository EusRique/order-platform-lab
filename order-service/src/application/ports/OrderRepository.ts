import { Order } from "../../domain/entities/Order.js";

/*Isso é uma porta. O caso de uso não sabe se vai salvar em:
Postgres, MySQL, Mongo, memória arquivo
*/

export interface OrderRepository {
  save(order: Order): Promise<void>;
}
