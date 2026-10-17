.PHONY: help install dev build preview check clean docker-build docker-up

help: ## Show this help message
	@echo "KiliSpatial - Available Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies with pnpm
	pnpm install

dev: ## Start local Astro development server
	pnpm dev

build: ## Build production static bundle
	pnpm build

preview: ## Preview production build locally
	pnpm preview

check: ## Run Astro diagnostics and TypeScript type checks
	pnpm astro check

clean: ## Remove build artifacts and caches
	rm -rf dist .astro node_modules/.vite

docker-build: ## Build production Docker image
	docker build -t kilispatial:latest .

docker-up: ## Start containerized service via docker-compose
	docker compose up -d --build
