import { app } from './app.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const URI = process.env.MONGODB_URI ?? '';

app.listen(PORT, () => {
  console.log(`FieldOps API on http://localhost:${PORT} · Mongo ${URI ? 'on' : 'off (memory)'} · office CRUD on`);
});
