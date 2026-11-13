// Single-process durable queue. Do not run multiple application instances against one data directory.
export class IllustrationQueue {
  constructor(db, env, runner, { interval = 250 } = {}) {
    this.db = db;
    this.env = env;
    this.runner = runner;
    this.interval = interval;
    this.stopping = false;
    this.active = null;
    db.exec(`
      CREATE TABLE IF NOT EXISTS server_jobs (
        id TEXT PRIMARY KEY, params TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', error TEXT,
        FOREIGN KEY (id) REFERENCES illustration_jobs(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS server_job_steps (
        job_id TEXT NOT NULL, name TEXT NOT NULL, result TEXT NOT NULL,
        PRIMARY KEY (job_id, name),
        FOREIGN KEY (job_id) REFERENCES server_jobs(id) ON DELETE CASCADE
      );
      UPDATE server_jobs SET status = 'queued' WHERE status = 'running';
    `);
  }
  start() { this.schedule(); }
  schedule() {
    if (!this.stopping) this.timer = setTimeout(() => {
      this.active = this.tick().catch(error => console.error('[queue]', error.message)).finally(() => {
        this.active = null;
        this.schedule();
      });
    }, this.interval);
  }
  async create({ id, params }) {
    await this.db.prepare('INSERT INTO server_jobs (id, params) VALUES (?, ?)').bind(id, JSON.stringify(params)).run();
    return this.get(id);
  }
  async get(id) {
    return { status: async () => {
      const row = await this.db.prepare('SELECT status, error FROM server_jobs WHERE id = ?').bind(id).first();
      if (!row) throw new Error('job_not_found');
      return { status: row.status, ...(row.error ? { error: { message: row.error } } : {}) };
    } };
  }
  async tick() {
    const row = await this.db.prepare("SELECT id, params FROM server_jobs WHERE status = 'queued' ORDER BY rowid LIMIT 1").first();
    if (!row || this.stopping) return;
    await this.db.prepare("UPDATE server_jobs SET status = 'running', error = NULL WHERE id = ?").bind(row.id).run();
    await this.db.prepare("UPDATE illustration_jobs SET status = 'running', error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
    const step = { do: async (name, action) => {
      const saved = await this.db.prepare('SELECT result FROM server_job_steps WHERE job_id = ? AND name = ?').bind(row.id, name).first();
      if (saved) return JSON.parse(saved.result);
      const result = await action();
      await this.db.prepare('INSERT INTO server_job_steps (job_id, name, result) VALUES (?, ?, ?)').bind(row.id, name, JSON.stringify(result ?? null)).run();
      return result;
    } };
    try {
      await this.runner(this.env, JSON.parse(row.params), step);
      await this.db.prepare("UPDATE illustration_jobs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
      await this.db.prepare("UPDATE server_jobs SET status = 'completed' WHERE id = ?").bind(row.id).run();
    } catch (error) {
      await this.db.prepare("UPDATE server_jobs SET status = 'failed', error = ? WHERE id = ?").bind(error.message, row.id).run();
      await this.db.prepare("UPDATE illustration_jobs SET status = 'failed', error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(error.message, row.id).run();
      console.error('[illustration]', row.id, error.message);
    }
  }
  async close() {
    this.stopping = true;
    clearTimeout(this.timer);
    await this.active;
  }
}
