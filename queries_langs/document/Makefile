doc_start:
	docker-compose up -d

doc_stop:
	docker-compose down

doc_shell:
	mongosh mongodb://admin:password123@localhost:27017/hr_database?authSource=admin

doc_seed:
	./load_data.sh

doc_clean:
	docker-compose down -v

doc_reset:
	docker-compose down -v
	docker-compose up -d
	sleep 5
	./load_data.sh
