// Explicitly local-only. Never changes the production .env file.
process.env.NODE_ENV = 'development';
process.env.HOST = '127.0.0.1';
process.env.PORT = process.env.LOCAL_DEBUG_PORT || '3000';
process.env.PUBLIC_URL = `http://127.0.0.1:${process.env.PORT}`;
process.env.LOCAL_DISCOVERY_DEBUG = '1';
process.env.ENABLE_PHASE2 = '1';
await import('./index.mjs');
