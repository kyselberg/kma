export function randomInt(minInclusive: number, maxInclusive: number): number {
  return (
    Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive
  );
}

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface Market {
  id: number;
  name: string;
}

export interface Transaction {
  id: string;
  market_id: number;
  total_amount: number;
  item_count: number;
  transaction_date: string;
}

export interface TransactionItem {
  transaction_id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  transaction_date: string;
  market_id: number;
  market_name: string;
}

export function getProductNames(): string[] {
  return [
    "Молоко",
    "Хліб",
    "Яйця",
    "Масло",
    "Сир",
    "Курка",
    "Яловичина",
    "Риба",
    "Рис",
    "Макарони",
    "Картопля",
    "Помідори",
    "Цибуля",
    "Морква",
    "Банани",
    "Яблука",
    "Апельсини",
    "Полуниця",
    "Йогурт",
    "Каша",
    "Вівсянка",
    "Борошно",
    "Цукор",
    "Сіль",
    "Перець",
    "Оливкова олія",
    "Оцет",
    "Вода",
    "Кава",
    "Чай",
    "Апельсиновий сік",
    "Яблучний сік",
    "Газована вода",
    "Пиво",
    "Вино",
    "Туалетний папір",
    "Рулонні рушники",
    "Засіб для миття посуду",
    "Пральний порошок",
    "Сміттєві пакети",
    "Лампочки",
    "Батарейки",
    "Засіб для прибирання",
    "Губки",
    "Мітла",
    "Шампунь",
    "Мило",
    "Зубна паста",
    "Зубна щітка",
    "Дезодорант",
    "Бритва",
    "Піна для гоління",
    "Печиво",
    "Чіпси",
    "Крекери",
    "Горіхи",
    "Шоколад",
    "Цукерки",
    "Морозиво",
  ];
}

export function getKyivDistricts(): string[] {
  return [
    "Печерський 1",
    "Печерський 2",
    "Печерський 3",
    "Шевченківський 1",
    "Шевченківський 2",
    "Шевченківський 3",
    "Солом'янський 1",
    "Солом'янський 2",
    "Оболонський 1",
    "Оболонський 2",
    "Оболонський 3",
    "Подільський 1",
    "Подільський 2",
    "Деснянський 1",
    "Деснянський 2",
    "Деснянський 3",
    "Дарницький 1",
    "Дарницький 2",
    "Дніпровський 1",
    "Голосіївський 1",
  ];
}

export function generateProducts(): Product[] {
  const productNames = getProductNames();
  const priceCache = new Map<string, number>();

  const getOrCreatePrice = (name: string): number => {
    const found = priceCache.get(name);
    if (found !== undefined) return found;
    const price = randomInt(100, 4900);
    priceCache.set(name, price);
    return price;
  };

  return productNames.map((name, index) => ({
    id: index + 1,
    name,
    price: getOrCreatePrice(name),
  }));
}

export function generateMarkets(): Market[] {
  const kyivDistricts = getKyivDistricts();
  return kyivDistricts.map((district, index) => ({
    id: index + 1,
    name: `Novus ${district}`,
  }));
}

export interface TransactionBatch {
  transactions: Transaction[];
  items: TransactionItem[];
}

export function generateTransactionBatch(
  batchNum: number,
  batchSize: number,
  productPrices: Map<number, number>,
  productNames: Map<number, string>,
  marketNames: Map<number, string>,
): TransactionBatch {
  const productIds = Array.from(productPrices.keys());
  const transactionValues: Transaction[] = [];
  const itemValues: TransactionItem[] = [];

  for (let i = 0; i < batchSize; i++) {
    const transactionID = BigInt(batchNum * batchSize + i + 1);
    const marketID = randomInt(1, 20);
    const itemCount = randomInt(5, 50);

    const daysAgo = randomInt(0, 365);
    const transactionDate = new Date();
    transactionDate.setUTCDate(transactionDate.getUTCDate() - daysAgo);
    const transactionDateStr = transactionDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const transactionDateOnly = transactionDate.toISOString().slice(0, 10);

    let totalAmount = 0;
    const marketName = marketNames.get(marketID) ?? "Unknown Market";

    for (let j = 0; j < itemCount; j++) {
      const pid = productIds[randomInt(0, productIds.length - 1)]!;
      const quantity = randomInt(1, 10);
      const unitPrice = productPrices.get(pid) ?? 350;
      const totalPrice = unitPrice * quantity;
      totalAmount += totalPrice;
      const productName = productNames.get(pid) ?? "Unknown Product";

      itemValues.push({
        transaction_id: transactionID.toString(),
        product_id: pid,
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        transaction_date: transactionDateOnly,
        market_id: marketID,
        market_name: marketName,
      });
    }

    transactionValues.push({
      id: transactionID.toString(),
      market_id: marketID,
      total_amount: totalAmount,
      item_count: itemCount,
      transaction_date: transactionDateStr,
    });
  }

  return {
    transactions: transactionValues,
    items: itemValues,
  };
}

export function logMemoryUsage(): void {
  const used = process.memoryUsage();
  console.log(
    `Memory usage: RSS=${Math.round(used.rss / 1024 / 1024)}MB, Heap=${Math.round(used.heapUsed / 1024 / 1024)}MB`,
  );
}
