'use strict';

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} clientName
 * @property {string} item
 * @property {string} address
 * @property {boolean} isCooked
 * @property {boolean} isDelivered
 */

/**
 * @typedef {Object} Courier
 * @property {string} courierName
 * @property {string} transport
 * @property {boolean} hasOrder
 */

/**
 * @typedef {Object} DeliveryTask
 * @property {number} orderId
 * @property {string} clientName
 * @property {string} courierName
 * @property {string} address
 * @property {string} item
 */

/**
 * @template T
 * @param {T[]} tokens
 * @param {(t: T) => boolean} predicate
 * @returns {T | undefined}
 */
function removeFirst(tokens, predicate) {
  const index = tokens.findIndex(predicate);
  if (index === -1) return undefined;
  const [removed] = tokens.splice(index, 1);
  return removed;
}

/** @type {Order[]} */
const P_OrderPlaced = [];
/** @type {Order[]} */
const P_BeingCooked = [];
/** @type {Order[]} */
const P_ReadyForDelivery = [];
/** @type {Courier[]} */
const P_CourierAvailable = [];
/** @type {DeliveryTask[]} */
const P_OutForDelivery = [];
/** @type {Order[]} */
const P_Delivered = [];

P_OrderPlaced.push({
  id: 1,
  clientName: 'Олена',
  item: 'Маргарита',
  address: 'вул. Шевченка, 12',
  isCooked: false,
  isDelivered: false,
});

P_CourierAvailable.push({
  courierName: 'Ігор',
  transport: 'велосипед',
  hasOrder: false,
});

function T_StartCooking() {
  const order = P_OrderPlaced.shift();
  if (!order) throw new Error('T_StartCooking not enabled: no orders in P_OrderPlaced');
  P_BeingCooked.push(order);
  return `Піцайоло почав готувати піцу ${order.item} для клієнта ${order.clientName}.`;
}

function T_FinishCooking() {
  const order = P_BeingCooked.shift();
  if (!order) throw new Error('T_FinishCooking not enabled: no orders in P_BeingCooked');
  order.isCooked = true;
  P_ReadyForDelivery.push(order);
  return `Піца ${order.item} для ${order.clientName} готова до відправки.`;
}

function T_AssignCourier() {
  const order = removeFirst(P_ReadyForDelivery, (o) => o.isCooked === true);
  if (!order) throw new Error('T_AssignCourier not enabled: no cooked orders in P_ReadyForDelivery');

  const courier = removeFirst(P_CourierAvailable, (c) => c.hasOrder === false);
  if (!courier) {
    P_ReadyForDelivery.unshift(order);
    throw new Error('T_AssignCourier not enabled: no free couriers in P_CourierAvailable');
  }

  /** @type {DeliveryTask} */
  const task = {
    orderId: order.id,
    clientName: order.clientName,
    courierName: courier.courierName,
    address: order.address,
    item: order.item,
  };
  P_OutForDelivery.push(task);

  P_CourierAvailable.push({
    courierName: courier.courierName,
    transport: courier.transport,
    hasOrder: true,
  });

  return `Кур'єр ${courier.courierName} забрав піцу ${order.item} і виїхав на ${courier.transport} до адреси ${order.address}.`;
}

function T_DeliverOrder() {
  const task = P_OutForDelivery.shift();
  if (!task) throw new Error('T_DeliverOrder not enabled: no tasks in P_OutForDelivery');

  const courierBusy = removeFirst(
    P_CourierAvailable,
    (c) => c.hasOrder === true && c.courierName === task.courierName,
  );
  if (!courierBusy) {
    P_OutForDelivery.unshift(task);
    throw new Error('T_DeliverOrder not enabled: matching busy courier not found');
  }

  /** @type {Order} */
  const deliveredOrder = {
    id: task.orderId,
    clientName: task.clientName,
    item: task.item,
    address: task.address,
    isCooked: true,
    isDelivered: true,
  };
  P_Delivered.push(deliveredOrder);

  P_CourierAvailable.push({
    courierName: courierBusy.courierName,
    transport: courierBusy.transport,
    hasOrder: false,
  });

  return `Кур'єр ${courierBusy.courierName} доставив піцу ${task.item} клієнту ${task.clientName} за адресою ${task.address}. Замовлення виконане.`;
}

const story = [];
story.push(T_StartCooking());
story.push(T_FinishCooking());
story.push(T_AssignCourier());
story.push(T_DeliverOrder());

console.log(story.join('\n'));

module.exports = {
  places: {
    P_OrderPlaced,
    P_BeingCooked,
    P_ReadyForDelivery,
    P_CourierAvailable,
    P_OutForDelivery,
    P_Delivered,
  },
  transitions: {
    T_StartCooking,
    T_FinishCooking,
    T_AssignCourier,
    T_DeliverOrder,
  },
};
