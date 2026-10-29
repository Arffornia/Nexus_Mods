# Thin wrappers over npm scripts. `make check` is what CI runs (offline-safe).
.PHONY: install check lint typecheck test test-live build clean

install:
	npm ci

check: lint test build

# No linter is configured yet; the TypeScript compiler is the lint gate.
lint: typecheck

typecheck:
	npm run typecheck

test:
	npm test

test-live:
	npm run test:live

build:
	npm run build

clean:
	rm -rf dist .minecraft
