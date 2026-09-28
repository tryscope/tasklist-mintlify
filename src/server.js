const express = require("express");
const crypto = require("node:crypto");

const app = express();
app.use(express.json());

const lists = new Map();
const tasks = new Map();

function seed() {
  const inbox = { id: "lst_inbox", name: "Inbox", createdAt: "2026-01-05T09:00:00Z" };
  const launch = { id: "lst_launch", name: "Launch checklist", createdAt: "2026-01-06T14:30:00Z" };
  lists.set(inbox.id, inbox);
  lists.set(launch.id, launch);
  const seeded = [
    { id: "tsk_01", listId: inbox.id, title: "Renew domain", notes: null, dueDate: "2026-02-01", status: "open", createdAt: "2026-01-05T09:05:00Z", completedAt: null },
    { id: "tsk_02", listId: launch.id, title: "Write release notes", notes: "Cover the new export format.", dueDate: "2026-01-20", status: "open", createdAt: "2026-01-06T14:31:00Z", completedAt: null },
    { id: "tsk_03", listId: launch.id, title: "Rotate API keys", notes: null, dueDate: null, status: "done", createdAt: "2026-01-06T14:32:00Z", completedAt: "2026-01-08T10:00:00Z" },
  ];
  for (const task of seeded) tasks.set(task.id, task);
}
seed();

function error(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

app.use((req, res, next) => {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return error(res, 401, "unauthenticated", "A bearer token is required in the Authorization header.");
  }
  next();
});

app.get("/lists", (req, res) => {
  res.json({ data: [...lists.values()] });
});

app.post("/lists", (req, res) => {
  const { name } = req.body || {};
  if (typeof name !== "string" || name.trim().length === 0) {
    return error(res, 400, "validation_error", "name is required.");
  }
  const list = { id: `lst_${crypto.randomBytes(4).toString("hex")}`, name: name.trim(), createdAt: new Date().toISOString() };
  lists.set(list.id, list);
  res.status(201).json(list);
});

app.get("/lists/:listId", (req, res) => {
  const list = lists.get(req.params.listId);
  if (!list) return error(res, 404, "not_found", "No list with that id.");
  res.json(list);
});

app.delete("/lists/:listId", (req, res) => {
  if (!lists.delete(req.params.listId)) return error(res, 404, "not_found", "No list with that id.");
  for (const [id, task] of tasks) if (task.listId === req.params.listId) tasks.delete(id);
  res.status(204).end();
});

app.get("/tasks", (req, res) => {
  const { listId, status } = req.query;
  if (status !== undefined && status !== "open" && status !== "done") {
    return error(res, 400, "validation_error", "status must be open or done.");
  }
  const data = [...tasks.values()].filter((task) => (listId === undefined || task.listId === listId) && (status === undefined || task.status === status));
  res.json({ data });
});

app.post("/tasks", (req, res) => {
  const { listId, title, notes, dueDate } = req.body || {};
  if (!lists.has(listId)) return error(res, 400, "validation_error", "listId must reference an existing list.");
  if (typeof title !== "string" || title.trim().length === 0) return error(res, 400, "validation_error", "title is required.");
  const task = {
    id: `tsk_${crypto.randomBytes(4).toString("hex")}`,
    listId,
    title: title.trim(),
    notes: typeof notes === "string" ? notes : null,
    dueDate: typeof dueDate === "string" ? dueDate : null,
    status: "open",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

app.get("/tasks/:taskId", (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) return error(res, 404, "not_found", "No task with that id.");
  res.json(task);
});

app.patch("/tasks/:taskId", (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) return error(res, 404, "not_found", "No task with that id.");
  const { title, notes, dueDate } = req.body || {};
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) return error(res, 400, "validation_error", "title must be a non-empty string.");
    task.title = title.trim();
  }
  if (notes !== undefined) task.notes = notes === null ? null : String(notes);
  if (dueDate !== undefined) task.dueDate = dueDate === null ? null : String(dueDate);
  res.json(task);
});

app.delete("/tasks/:taskId", (req, res) => {
  if (!tasks.delete(req.params.taskId)) return error(res, 404, "not_found", "No task with that id.");
  res.status(204).end();
});

app.post("/tasks/:taskId/complete", (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) return error(res, 404, "not_found", "No task with that id.");
  if (task.status === "done") return error(res, 409, "already_done", "The task is already completed.");
  task.status = "done";
  task.completedAt = new Date().toISOString();
  res.json(task);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`tasklist api listening on http://localhost:${port}`);
});
