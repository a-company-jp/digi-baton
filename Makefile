gen/orval-swagger:
	uv run python scripts/generate_orval_swagger.py

gen:
	make -C backend gen
	make gen/orval-swagger
	cd frontend && pnpm gen

