import * as amqp from "amqplib";
import { Channel, ConsumeMessage } from "amqplib";

const RABBITMQ_URL = "amqp://admin:admin@localhost:5672";
const QUEUE_NAME = "task_queue";
const EXCHANGE_NAME = "task_exchange";

interface Message {
  id: number;
  type: string;
  content: string;
  timestamp: string;
  sender: string;
}

async function main() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);

    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "direct", {
      durable: true,
    });

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, QUEUE_NAME);

    await channel.prefetch(1);

    startSendingMessages(channel);

    await channel.consume(
      QUEUE_NAME,
      async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            const content = msg.content.toString();
            const message: Message = JSON.parse(content);

            if (message.sender !== "TypeScript Consumer") {
              console.log(`!! Received from ${message.sender}:`);
              console.log(`   ID: ${message.id}`);
              console.log(`   Type: ${message.type}`);
              console.log(`   Content: ${message.content}`);
              console.log(`   Timestamp: ${message.timestamp}\n`);

              await processMessage(message);

              const response: Message = {
                id: message.id,
                type: "response",
                content: `Processed: ${message.content}`,
                timestamp: new Date().toISOString(),
                sender: "TypeScript Consumer",
              };

              channel.publish(
                EXCHANGE_NAME,
                QUEUE_NAME,
                Buffer.from(JSON.stringify(response)),
                { persistent: true }
              );
            }

            channel.ack(msg);
          } catch (error) {
            console.error("❌ Error processing message:", error);
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );

    connection.on("close", () => {
      console.log("❌ Connection to RabbitMQ closed");
      process.exit(1);
    });

    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start consumer:", error);
    process.exit(1);
  }
}

async function processMessage(message: Message): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Processed message #${message.id}\n`);
      resolve();
    }, 1000);
  });
}

async function startSendingMessages(channel: Channel) {
  let messageId = 1000;
  const messages = [
    "Привіт від TypeScript сервера!",
    "Database backup completed",
    "Email notification sent",
    "Cache cleared successfully",
    "Report generation finished",
  ];

  let messageIndex = 0;

  setInterval(() => {
    const message: Message = {
      id: messageId++,
      type: "notification",
      content: messages[messageIndex % messages.length],
      timestamp: new Date().toISOString(),
      sender: "TypeScript Consumer",
    };

    channel.publish(
      EXCHANGE_NAME,
      QUEUE_NAME,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    console.log(`📨 Sent message #${message.id}: ${message.content}`);
    messageIndex++;
  }, 5000);
}

main();
