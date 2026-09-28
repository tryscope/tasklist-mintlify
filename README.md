# Tasklist API

A small task-list service: lists, tasks, due dates and completion. It keeps everything in memory, so it runs with no database and resets on restart.

## Run it

```bash
npm install
npm start
```

The server listens on `http://localhost:4000`. Every request needs a bearer token:

```bash
curl -H "Authorization: Bearer dev-token" http://localhost:4000/lists
```

## API

The full description is in [`openapi.json`](./openapi.json) (OpenAPI 3.0.3).

- `GET /lists`, `POST /lists`, `GET /lists/{listId}`, `DELETE /lists/{listId}`
- `GET /tasks`, `POST /tasks`, `GET /tasks/{taskId}`, `PATCH /tasks/{taskId}`, `DELETE /tasks/{taskId}`
- `POST /tasks/{taskId}/complete`

## Documentation

The public docs live in [`docs/`](./docs) and are published with Mintlify. To preview them locally:

```bash
npm i -g mint
cd docs
mint dev
```

## License

[MIT](./LICENSE)
