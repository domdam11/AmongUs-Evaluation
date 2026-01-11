// server.js
const path = require('path');
const jsonServer = require('json-server');
const crypto = require('crypto');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json')); // usa il tuo db.json
const middlewares = jsonServer.defaults();

const API_PREFIX = '/amongus/api';

server.use(middlewares);
server.use(jsonServer.bodyParser);

/* =========================================================
 *  ENDPOINT CUSTOM (prima del rewriter!)
 * =======================================================*/

// --- LOGIN MOCK ---
// POST /api/auth/login { userId, sessionKey } -> { token, user:{id, role} }
// Middleware auth finto: associa token a userId
const tokenMap = new Map(); // token -> userId

server.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { userId, sessionKey } = req.body || {};
  if (!userId || !sessionKey) return res.status(400).send('Missing credentials');

  const db = router.db;
  const user = db.get('users').find({ id: userId, sessionKey }).value();
  if (!user) return res.status(401).send('Invalid credentials');

  const token = 'dev-' + crypto.randomBytes(8).toString('hex');
  tokenMap.set(token, userId);   // 🔑 memorizza l’associazione

  return res.json({
    access_token: token,
    user: { id: user.id, role: user.role }
  });
});

// Middleware che estrae userId dal token
server.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    const token = auth.substring(7);
    if (tokenMap.has(token)) {
      req.userId = tokenMap.get(token);  // 🔑 attacca userId
    }
  }
  next();
});

// --- ADMIN: CREATE USER ---
// POST /api/admin/users { userId, role? } -> { id, role, sessionKey }
server.post(`${API_PREFIX}/admin/users`, (req, res) => {
  const { userId, role = 'user' } = req.body || {};
  if (!userId) return res.status(400).send('userId required');

  const db = router.db;
  const exists = db.get('users').find({ id: userId }).value();
  if (exists) return res.status(409).send('User already exists');

  const sessionKey = crypto.randomBytes(16).toString('base64url');
  db.get('users').push({ id: userId, role, sessionKey }).write();

  return res.status(201).json({ id: userId, role, sessionKey });
});

// --- EVALUATIONS: semantica controllata ---
// PUT update (404 se non esiste)
// POST create or update (idempotente)
server.post(`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/evaluations`, (req, res) => {
  const { sessionId, eventId } = req.params;
  const userId = req.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  const db = router.db;
  const id = `${userId}-${eventId}`;
  const reaction = req.body?.reaction ?? null;
  const row = { id, sessionId, eventId, userId, reaction, timestamp: new Date().toISOString() };

  const exists = db.get("evaluations").find({ id }).value();
  if (exists) {
    db.get("evaluations").find({ id }).assign(row).write();
    return res.json(row); // update se esiste
  } else {
    db.get("evaluations").push(row).write();
    return res.status(201).json(row); // create
  }
});

// DELETE
server.delete(`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/evaluation`, (req, res) => {
  const { eventId } = req.params;
  const userId = req.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  const id = `${userId}-${eventId}`;
  const db = router.db;

  const exists = db.get('evaluations').find({ id }).value();
  if (!exists) return res.status(404).send('Not found');

  db.get('evaluations').remove({ id }).write();
  return res.status(204).end();
});

// --- PERMISSIONS: allowed sessions per user ---
// Struttura in db.json: permissions = [{ id:"<userId>-<sessionId>", userId, sessionId, canVote:true }]

// GET lista sessioni abilitate per un utente -> { userId, sessionIds: [...] }
server.get(`${API_PREFIX}/admin/users/:userId/allowed-sessions`, (req, res) => {
  const { userId } = req.params;
  const db = router.db;
  const sessionIds = db.get('permissions')
    .filter({ userId, canVote: true })
    .map('sessionId')
    .value();
  return res.json({ userId, sessionIds });
});

// PUT sostituisce completamente l’elenco delle sessioni abilitate per quell’utente
// body: { sessionIds: string[] }
server.put(`${API_PREFIX}/admin/users/:userId/allowed-sessions`, (req, res) => {
  const { userId } = req.params;
  const desired = new Set(Array.isArray(req.body?.sessionIds) ? req.body.sessionIds : []);
  const db = router.db;

  // accetta solo sessionId esistenti
  const validSessions = new Set(db.get('sessions').map('id').value());
  const filtered = [...desired].filter(sid => validSessions.has(sid));
  const finalSet = new Set(filtered);

  // rimuovi vecchi permessi dell’utente non più presenti
  const existing = db.get('permissions').filter({ userId }).value();
  for (const row of existing) {
    if (!finalSet.has(row.sessionId)) {
      db.get('permissions').remove({ id: row.id }).write();
    }
  }

  // set dei permessi desiderati
  for (const sid of finalSet) {
    const id = `${userId}-${sid}`;
    const found = db.get('permissions').find({ id }).value();
    if (found) {
      db.get('permissions').find({ id }).assign({ canVote: true }).write();
    } else {
      db.get('permissions').push({ id, userId, sessionId: sid, canVote: true }).write();
    }
  }

  return res.json({ userId, sessionIds: [...finalSet] });
});


// GET check: posso votare su questa sessione?
// -> { userId, sessionId, canVote: boolean }
server.get(`${API_PREFIX}/strategic/session/:sessionId/access/:userId`, (req, res) => {
  const { sessionId, userId } = req.params;
  const db = router.db;
  const allowed = !!db.get('permissions')
    .find({ userId, sessionId, canVote: true })
    .value();
  return res.json({ userId, sessionId, canVote: allowed });
});

// Totali like/dislike per TUTTI gli utenti di una sessione, raggruppati per eventId
server.get(`${API_PREFIX}/strategic/session/:sessionId/evaluations/totals`, (req, res) => {
  const { sessionId } = req.params;
  const db = router.db;
  const rows = db.get("evaluations").filter({ sessionId }).value() || [];

  const out = {};
  for (const ev of rows) {
    if (!out[ev.eventId]) out[ev.eventId] = { like: 0, dislike: 0 };
    if (ev.reaction === "like") out[ev.eventId].like += 1;
    if (ev.reaction === "dislike") out[ev.eventId].dislike += 1;
  }

  return res.json(out);
});

// --- CORRECTIONS (dislike con strategia corretta)
server.post(`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/correction`, (req, res) => {
  const { sessionId, eventId } = req.params;
  const userId = req.userId; // 🔑 preso dal token
  const { correctStrategy } = req.body || {};

  if (!userId) return res.status(401).send('Unauthorized');
  if (!correctStrategy) return res.status(400).send('Missing correctStrategy');

  const db = router.db;

  // 🔑 Verifica che la strategia esista ed estrai l'id
  const strategy = db.get("strategies").find({ id: correctStrategy }).value();
  if (!strategy) {
    return res.status(400).send('Invalid strategy id');
  }

  const id = `${userId}-${eventId}`;
  const row = {
    id,
    sessionId,
    eventId,
    userId,
    correctStrategy: strategy.id,
    timestamp: new Date().toISOString(),
  };

  const existing = db.get("corrections").find({ id }).value();
  if (existing) {
    db.get("corrections").find({ id }).assign(row).write();
    return res.json(row); // update
  } else {
    db.get("corrections").push(row).write();
    return res.status(201).json(row); // insert
  }
});

// GET correzione già salvata per un utente
server.get(`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/correction`, (req, res) => {
  const { sessionId, eventId } = req.params;
  const userId = req.userId; // 🔑 preso dal token
  if (!userId) return res.status(401).send('Unauthorized');

  const db = router.db;
  const row = db.get("corrections").find({ id: `${userId}-${eventId}` }).value();
  if (!row) return res.status(404).send('Not found');
  return res.json(row);
});

// DELETE correction
server.delete(`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/correction`, (req, res) => {
  const { sessionId, eventId } = req.params;
  const userId = req.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  const db = router.db;
  const id = `${userId}-${eventId}`;
  const exists = db.get("corrections").find({ id }).value();
  if (!exists) return res.status(404).send('Not found');

  db.get("corrections").remove({ id }).write();
  return res.status(204).end();
});

/* =========================================================
 *  REWRITER (mappa esattamente le tue route -> db.json)
 *  ATTENZIONE: è dopo gli endpoint custom
 * =======================================================*/
// REWRITER
server.use(jsonServer.rewriter({
  [`${API_PREFIX}/strategic/sessions`]: "/sessions",

  // lista eventi della sessione
  [`${API_PREFIX}/strategic/session/:sessionId/eventlist`]: "/eventlists?sessionId=:sessionId",

  // dettaglio evento
  [`${API_PREFIX}/strategic/session/:sessionId/eventdetails/:eventId`]: "/eventdetails/:eventId",

  // evaluations di un utente
  [`${API_PREFIX}/strategic/session/:sessionId/evaluations/:userId`]: "/evaluations?sessionId=:sessionId&userId=:userId",

  // evaluations di tutti gli utenti per una sessione
  [`${API_PREFIX}/strategic/session/:sessionId/evaluations`]: "/evaluations?sessionId=:sessionId",

  // single evaluation
  [`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/evaluation/:userId`]: "/evaluations/:userId-:eventId",

  // collection evaluations per POST
  [`${API_PREFIX}/strategic/session/:sessionId/event/:eventId/evaluations`]: "/evaluations",

  // admin users list
  [`${API_PREFIX}/admin/users`]: "/users",

  // strategies
  [`${API_PREFIX}/strategic/strategies`]: "/strategies"
}));


/* =========================================================
 *  ROUTER json-server (CRUD generico)
 * =======================================================*/
server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`mock API pronta su http://localhost:${PORT}`);
});

