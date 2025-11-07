#!/usr/bin/env python3

import json
import threading
import time
from datetime import datetime

import pika

RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'admin'
RABBITMQ_PASSWORD = 'admin'
QUEUE_NAME = 'task_queue'
EXCHANGE_NAME = 'task_exchange'


class MessageProducer:

    def __init__(self):
        self.credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        self.parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=self.credentials
        )

        # Producer connection and channel
        self.producer_connection = pika.BlockingConnection(self.parameters)
        self.producer_channel = self.producer_connection.channel()

        self.producer_channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type='direct',
            durable=True
        )

        self.producer_channel.queue_declare(queue=QUEUE_NAME, durable=True)

        self.producer_channel.queue_bind(
            exchange=EXCHANGE_NAME,
            queue=QUEUE_NAME,
            routing_key=QUEUE_NAME
        )

        self.message_id = 1

        print("✅ Connected to RabbitMQ")
        print(f"📤 Publishing messages to queue: {QUEUE_NAME}\n")

    def send_message(self, content, msg_type='task'):
        message = {
            'id': self.message_id,
            'type': msg_type,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'sender': 'Python Producer'
        }

        self.producer_channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=QUEUE_NAME,
            body=json.dumps(message, ensure_ascii=False),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        print(f"📨 Sent message #{message['id']}: {content}")
        self.message_id += 1

    def callback(self, ch, method, properties, body):
        try:
            message = json.loads(body.decode('utf-8'))

            if message.get('sender') != 'Python Producer':
                print(f"\n📬 Received from {message['sender']}:")
                print(f"   ID: {message['id']}")
                print(f"   Type: {message['type']}")
                print(f"   Content: {message['content']}")
                print(f"   Timestamp: {message['timestamp']}\n")

                ack_message = {
                    'id': message['id'],
                    'type': 'ack',
                    'content': f"Confirmed: {message['content']}",
                    'timestamp': datetime.now().isoformat(),
                    'sender': 'Python Producer'
                }

                ch.basic_publish(
                    exchange=EXCHANGE_NAME,
                    routing_key=QUEUE_NAME,
                    body=json.dumps(ack_message, ensure_ascii=False),
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        content_type='application/json'
                    )
                )

            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"Error processing message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def start_consuming(self):
        # Create separate connection and channel for consumer thread
        consumer_connection = pika.BlockingConnection(self.parameters)
        consumer_channel = consumer_connection.channel()

        consumer_channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type='direct',
            durable=True
        )

        consumer_channel.queue_declare(queue=QUEUE_NAME, durable=True)

        consumer_channel.queue_bind(
            exchange=EXCHANGE_NAME,
            queue=QUEUE_NAME,
            routing_key=QUEUE_NAME
        )

        consumer_channel.basic_qos(prefetch_count=1)
        consumer_channel.basic_consume(
            queue=QUEUE_NAME,
            on_message_callback=self.callback
        )

        print("📥 Waiting for incoming messages...\n")
        try:
            consumer_channel.start_consuming()
        finally:
            consumer_connection.close()

    def start_producing(self):
        messages = [
            "Welcome to the message queue!",
            "Order processing #12345",
            "Registration completed",
            "Synchronization started",
            "Backup process initiated"
        ]

        message_index = 0

        while True:
            try:
                content = messages[message_index % len(messages)]
                self.send_message(content)
                message_index += 1
                time.sleep(3)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error sending message: {e}")
                time.sleep(1)

    def close(self):
        self.producer_connection.close()


def main():
    print("Starting Python Producer server...\n")

    try:
        producer = MessageProducer()

        consumer_thread = threading.Thread(target=producer.start_consuming, daemon=True)
        consumer_thread.start()

        producer.start_producing()

    except KeyboardInterrupt:
        print("\n\nStopping producer...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Quitting...")


if __name__ == '__main__':
    main()
