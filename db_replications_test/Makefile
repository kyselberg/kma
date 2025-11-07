.PHONY: help install build clean start-physical start-logical stop test-physical test-logical metrics-physical metrics-logical

help:
	@echo "Available commands:"
	@echo "  make install          - Install dependencies"
	@echo "  make build            - Build TypeScript"
	@echo "  make clean            - Stop all containers and clean volumes"
	@echo ""
	@echo "  make start-physical   - Start physical replication topology"
	@echo "  make start-logical    - Start logical replication topology"
	@echo "  make stop             - Stop all topologies"
	@echo ""
	@echo "  make test-physical    - Test physical replication"
	@echo "  make test-logical     - Test logical replication"
	@echo ""
	@echo "  make metrics-physical - Show physical replication metrics"
	@echo "  make metrics-logical  - Show logical replication metrics"
	@echo ""
	@echo "  make api              - Start API server"
	@echo ""
	@echo "  make scenario-physical-5   - Run physical test with 5min partition"
	@echo "  make scenario-physical-10  - Run physical test with 10min partition"
	@echo "  make scenario-logical-5    - Run logical test with 5min partition"
	@echo "  make scenario-logical-10   - Run logical test with 10min partition"

install:
	npm install
	chmod +x scripts/*.sh
	chmod +x setup-logical-replication.sh

build:
	npm run build

clean:
	./scripts/stop-all.sh
	docker volume prune -f
	docker network prune -f

start-physical:
	./scripts/start-physical.sh

start-logical:
	./scripts/start-logical.sh

stop:
	./scripts/stop-all.sh

test-physical:
	npm run test:physical

test-logical:
	npm run test:logical

metrics-physical:
	npm run metrics:physical

metrics-logical:
	npm run metrics:logical

api:
	npm start

dev:
	npm run dev

scenario-physical-5:
	./scripts/test-scenarios.sh physical 5

scenario-physical-10:
	./scripts/test-scenarios.sh physical 10

scenario-physical-15:
	./scripts/test-scenarios.sh physical 15

scenario-logical-5:
	./scripts/test-scenarios.sh logical 5

scenario-logical-10:
	./scripts/test-scenarios.sh logical 10

scenario-logical-15:
	./scripts/test-scenarios.sh logical 15

# Compare scenarios
compare-physical:
	./scripts/compare-scenarios.sh physical

compare-logical:
	./scripts/compare-scenarios.sh logical

# High load scenarios (fast writes for bigger lag)
scenario-physical-5-high:
	./scripts/test-scenarios.sh physical 5 1

scenario-physical-5-extreme:
	./scripts/test-scenarios.sh physical 5 0.5

scenario-logical-5-high:
	./scripts/test-scenarios.sh logical 5 1
