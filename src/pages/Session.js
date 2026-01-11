import React, { useState, useEffect, useCallback } from 'react';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import {
  Container, Button, TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, Box, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, 
  Stack, Tooltip, IconButton, Select, MenuItem
} from '@mui/material';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axiosInstance';   // nuova importazione
import GraphDialog from '../components/GraphDialog';
import CorrectionDialog from "../components/CorrectionDialog";
//import { useAuth } from '../auth/AuthContext'; // usa AuthContext: user + authFetch
cytoscape.use(dagre);

function Session() {
  const { user } = useAuth();   // non serve più authFetch
  const currentUserId = user?.id || null;
  const isAdmin = user?.role === 'admin';

  const [sessionId, setSessionId] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [rows, setRows] = useState([]);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [currentEventInfo, setCurrentEventInfo] = useState(null);
  const [canVote, setCanVote] = useState(false);

  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState("");
  const [correctionEvent, setCorrectionEvent] = useState(null);   // evento corrente da correggere
  const [allStrategies, setAllStrategies] = useState([]);         // lista completa di strategie

  const mapEvalReaction = (ev) => {
    if (!ev) return null;
    if (ev.reaction) return ev.reaction;
    if (typeof ev.value === 'number') {
      if (ev.value > 0) return 'like';
      if (ev.value < 0) return 'dislike';
    }
    return null;
  };

  // Nuovo: legge le MIE valutazioni via /evaluations (user-scoped; userId dal token)
  const fetchMyEvaluations = useCallback(async (sid) => {
    try {
      const res = await api.get(`/strategic/session/${encodeURIComponent(sid)}/evaluations`);
      const arr = res.data;
      const byEvent = {};
      for (const ev of (Array.isArray(arr) ? arr : [])) {
        byEvent[ev.eventId] = mapEvalReaction(ev);
      }
      return byEvent;
    } catch {
      return {};
    }
  }, []);

  const fetchEventList = useCallback(async () => {
    try {
      if (!sessionId) return;

      // 1) eventi della sessione
      const res = await api.get(`/strategic/session/${encodeURIComponent(sessionId)}/eventlist`);
      const data = res.data;
      const rawEvents = Array.isArray(data) ? data : [];

      // de-dup
      const uniqMap = new Map();
      for (const e of rawEvents) {
        if (!uniqMap.has(e.id)) uniqMap.set(e.id, e);
      }
      const events = Array.from(uniqMap.values());

      // 2) valutazioni SOLO dell’utente loggato
      const userEvals = await fetchMyEvaluations(sessionId);

      // 3) totali globali SOLO per admin; per user metteremo -1
      let totalsMap = {};
      if (isAdmin) {
        const tr = await api.get(`/strategic/session/${encodeURIComponent(sessionId)}/evaluations/totals`);
        totalsMap = tr.data;
      }

      // 4) costruisci le righe
      setRows(prev => {
        const byId = new Map(prev.map(r => [r.id, r]));
        let changed = false;

        for (const e of events) {
          const incoming = {
            id: e.id,
            timestamp: e.timestamp ?? null,
            strategy: e.strategy ?? 'Unknown',
            score: typeof e.score === 'number' ? e.score : 0,
            userReaction: userEvals[e.id] ?? null,
            likes: isAdmin ? (totalsMap?.[e.id]?.like ?? 0) : -1,
            dislikes: isAdmin ? (totalsMap?.[e.id]?.dislike ?? 0) : -1,
          };

          if (!byId.has(e.id)) {
            byId.set(e.id, { ...incoming });
            changed = true;
          } else {
            const old = byId.get(e.id);
            if (
              old.timestamp !== incoming.timestamp ||
              old.strategy !== incoming.strategy ||
              old.score !== incoming.score ||
              old.userReaction !== incoming.userReaction ||
              old.likes !== incoming.likes ||
              old.dislikes !== incoming.dislikes
            ) {
              byId.set(e.id, { ...old, ...incoming });
              changed = true;
            }
          }
        }

        if (!changed) return prev;

        const sorted = Array.from(byId.values())
          .sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return new Date(a.timestamp) - new Date(b.timestamp);
            }
            if (a.timestamp) return -1;
            if (b.timestamp) return 1;
            return a.id.localeCompare(b.id);
          })
          .map((r, i) => ({ ...r, index: i }));

        return sorted;
      });

      setSelectedStrategy(prev => prev || (events[0]?.strategy || ''));

    } catch (error) {
      console.error('Error loading event list:', error);
    }
  }, [sessionId, fetchMyEvaluations, isAdmin]);


  // carica le sessioni disponibili
  useEffect(() => {
    let cancelled = false;

    const fetchSessions = async () => {
      try {
        const res = await api.get('/strategic/sessions');
        const data = res.data;
        if (cancelled) return;

        setAvailableSessions(Array.isArray(data) ? data : []);
        //setSessionId(prev => prev || (data?.[0]?.id ?? ''));
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
    const t = setInterval(fetchSessions, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // polling event list
  useEffect(() => {
    if (!sessionId) return;   // ✅ se non hai scelto session, non partire

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await fetchEventList();
    };

    tick();
    const id = setInterval(tick, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [sessionId, fetchEventList]);

  // ✅ Reset eventi e grafico quando cambia sessione
  useEffect(() => {
    setRows([]);
    setCurrentEventInfo(null);
    setGraphData(null);
  }, [sessionId]);

  // carica l'elenco globale delle strategie
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await api.get("/strategic/strategies");
        const arr = Array.isArray(res.data) ? res.data : [];
        setAllStrategies(arr);
      } catch (err) {
        console.error("Error fetching strategies:", err);
      }
    };
    fetchStrategies();
  }, []);

  // verifica permesso voto (user-scoped; admin non vota)
  useEffect(() => {
    if (isAdmin) {
      setCanVote(false);
      return;
    }
    if (!sessionId || !currentUserId) {
      setCanVote(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get(
          `/strategic/session/${encodeURIComponent(sessionId)}/access/${encodeURIComponent(currentUserId)}`
        );
        if (!cancelled) setCanVote(!!r.data?.canVote);
      } catch {
        if (!cancelled) setCanVote(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, currentUserId, isAdmin]);


const handleReact = async (rowIndex, type) => {
  if (!currentUserId || !canVote) return;
  const row = rows[rowIndex];
  if (!row) return;
  const eventId = row.id;
  const prev = row.userReaction;

  // --- LIKE ---
  if (type === "like") {
    if (prev === "like") return; // già like → non fare nulla

    setRows(prevRows =>
      prevRows.map((r, i) => i === rowIndex ? { ...r, userReaction: "like" } : r)
    );
    setSavingId(eventId);

    try {
      await saveReaction(eventId, "like");

      // se c’era una correzione, eliminala
      await api.delete(
        `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/correction`
      ).catch(err => {
        if (err.response?.status !== 404) {
          console.error("Error deleting correction:", err);
        }
      });
    } catch (err) {
      console.error("Error setting like:", err);
    } finally {
      setSavingId(null);
    }
    return;
  }

  // --- DISLIKE ---
  setCorrectionEvent(row);

  if (prev === "dislike") {
    // già dislike → recupera eventuale correzione salvata
    try {
      const res = await api.get(
        `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/correction`
      );
      setSelectedCorrection(res.data?.correctStrategy || "");
    } catch (err) {
      if (err.response?.status === 404) {
        setSelectedCorrection("");
      } else {
        console.error("Error fetching correction", err);
      }
    }
  } else {
    // prima volta dislike → campo vuoto
    setSelectedCorrection("");
  }

  setCorrectionOpen(true);
};

async function saveReaction(eventId, reaction, prevReaction) {
  if (!sessionId) return;

  const itemUrl = `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/evaluation`;

  // --- DELETE ---
  if (!reaction) {
    try {
      await api.delete(itemUrl);
    } catch (err) {
      if (err.response?.status !== 404) {
        throw new Error(`Delete reaction failed: ${err.message}`);
      }
    }
    return;
  }

  // --- NEW (POST) ---
  if (!prevReaction) {
    const postUrl = `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/evaluations`;
    await api.post(postUrl, {
      reaction,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // --- UPDATE (PUT) ---
  try {
    await api.put(itemUrl, {
      reaction,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err.response?.status === 404) {
      // fallback in caso edge
      const postUrl = `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/evaluations`;
      await api.post(postUrl, {
        reaction,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(`Save reaction failed: ${err.message}`);
    }
  }
}



// submit
// submit
const handleConfirmCorrection = async () => {
  if (!correctionEvent || !selectedCorrection) return;
  const eventId = correctionEvent.id;

  try {
    // 🔹 forza o aggiorna la evaluation come dislike (usa PUT se già esiste)
    await saveReaction(eventId, "dislike");

    // 🔹 salva o aggiorna la correzione
    await api.post(
      `/strategic/session/${encodeURIComponent(sessionId)}/event/${encodeURIComponent(eventId)}/correction`,
      {
        correctStrategy: selectedCorrection, // userId viene preso dal token lato server
      }
    );

    // 🔹 aggiorna la tabella localmente
    setRows(prevRows =>
      prevRows.map(r =>
        r.id === eventId
          ? { ...r, userReaction: "dislike", correction: selectedCorrection }
          : r
      )
    );
  } catch (err) {
    console.error("Error confirming correction:", err);
  } finally {
    setCorrectionEvent(null);
    setSelectedCorrection(null);
    setCorrectionOpen(false);
  }
};



  const handleShowGraph = async (index) => {
    try {
      const event = rows[index];

      setCurrentEventInfo({
        id: event.id,
        strategy: event.strategy,
        timestamp: event.timestamp,
        score: event.score,
        reaction: event.userReaction ?? null,
      });

      const eventId = event.id;
      const res = await api.get(
        `/strategic/session/${encodeURIComponent(sessionId)}/eventdetails/${encodeURIComponent(eventId)}`
      );
      const details = res.data;

      const graph = details?.metadata?.graph;
      const suggestedStrategies = details?.metadata?.suggestedStrategies || [];

      if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
        console.warn("Graph non valido nei details:", details);
        return;
      }
      if (!suggestedStrategies.length) {
        console.warn("Nessuna suggested strategy.");
        return;
      }

      // 🔹 Passiamo solo i dati raw + la strategia attuale
      setGraphData({
        graph: details?.metadata?.graph,
        suggestedStrategies: details?.metadata?.suggestedStrategies || [],
        eventStrategy: event.strategy,
      });

      setGraphOpen(true);
    } catch (err) {
      console.error("Error loading event details:", err);
    }
  };


  return (
    <Container
      maxWidth="md"
      sx={{
        py: 4,
        backgroundColor: "#0f3460",
        borderRadius: 2,
        boxShadow: 3,
        color: "white",
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: "#f9d342" }}>
        Session Data
      </Typography>

      {!sessionId ? (
        // 🔹 LISTA SESSIONI
        <TableContainer component={Paper} sx={{ backgroundColor: "#1e2a47", mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>
                  Session ID
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>
                  Created At
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availableSessions.map((s, i) => (
                <TableRow
                  key={i}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSessionId(s.id)}   // 🔑 basta settare sessionId
                >
                  <TableCell sx={{ color: '#f9f9f9' }}>{s.id}</TableCell>
                  <TableCell sx={{ color: '#f9f9f9' }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSessionId(s.id)}
                      sx={{
                        color: '#00bcd4',
                        borderColor: '#00bcd4',
                        '&:hover': { borderColor: '#00acc1', color: '#00acc1' }
                      }}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // 🔹 LISTA EVENTI DELLA SESSIONE
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: "#f9d342" }}>
              Events for session {sessionId}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSessionId("")}
              sx={{
                color: "#f94c66",
                borderColor: "#f94c66",
                "&:hover": { borderColor: "#d32f2f", color: "#d32f2f" },
              }}
            >
              ← Back
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: "#1e2a47" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>Event ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>Strategy</TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }} align="center">
                    Feedback
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#16213e", color: "#f9d342" }} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
  key={idx}
  hover
  sx={{
    "&:hover": { backgroundColor: "#2c3e50" }
  }}
>
                    <TableCell sx={{ color: "#f9f9f9" }}>{row.timestamp}</TableCell>
                    <TableCell sx={{ color: "#f9f9f9" }}>{row.id}</TableCell>
                    <TableCell sx={{ color: "#f9f9f9" }}>{row.strategy}</TableCell>
                    <TableCell sx={{ color: "#f9f9f9" }}>{row.score.toFixed(1)}%</TableCell>

                    {/* 🔹 FEEDBACK */}
                    <TableCell align="center">
                      {isAdmin ? (
                        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                          {(() => {
                            const likeCount = row.likes ?? 0;
                            const dislikeCount = row.dislikes ?? 0;
                            const more =
                              likeCount > dislikeCount
                                ? "like"
                                : dislikeCount > likeCount
                                  ? "dislike"
                                  : "tie";
                            return (
                              <>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    transform: more === "like" ? "scale(1.06)" : "none",
                                    filter:
                                      more === "like"
                                        ? "drop-shadow(0 0 6px rgba(46,204,113,.7))"
                                        : "none",
                                  }}
                                >
                                  <ThumbUpOffAltIcon
                                    fontSize="small"
                                    sx={{ color: more === "like" ? "#2ecc71" : "#9aa0a6" }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#e5e7eb",
                                      fontWeight: more === "like" ? 700 : 400,
                                    }}
                                  >
                                    {likeCount}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    transform: more === "dislike" ? "scale(1.06)" : "none",
                                    filter:
                                      more === "dislike"
                                        ? "drop-shadow(0 0 6px rgba(231,76,60,.7))"
                                        : "none",
                                  }}
                                >
                                  <ThumbDownOffAltIcon
                                    fontSize="small"
                                    sx={{ color: more === "dislike" ? "#e74c3c" : "#9aa0a6" }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#e5e7eb",
                                      fontWeight: more === "dislike" ? 700 : 400,
                                    }}
                                  >
                                    {dislikeCount}
                                  </Typography>
                                </Box>
                              </>
                            );
                          })()}
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Tooltip title={!currentUserId ? "Login per votare" : canVote ? "Like" : "Voting disabilitato"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={savingId === row.id}
                                aria-disabled={!canVote || !currentUserId}
                                onClick={() => handleReact(idx, "like")}
                                disableRipple={!canVote || !currentUserId}
                                sx={{ cursor: !canVote || !currentUserId ? "not-allowed" : "pointer" }}
                              >
                                <ThumbUpOffAltIcon
                                  fontSize="small"
                                  sx={{ color: row.userReaction === "like" ? "#2ecc71" : "#9aa0a6" }}
                                />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={!currentUserId ? "Login per votare" : canVote ? "Dislike" : "Voting disabilitato"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={savingId === row.id}
                                aria-disabled={!canVote || !currentUserId}
                                onClick={() => handleReact(idx, "dislike")}
                                disableRipple={!canVote || !currentUserId}
                                sx={{ cursor: !canVote || !currentUserId ? "not-allowed" : "pointer" }}
                              >
                                <ThumbDownOffAltIcon
                                  fontSize="small"
                                  sx={{ color: row.userReaction === "dislike" ? "#e74c3c" : "#9aa0a6" }}
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>

                    {/* 🔹 ACTION */}
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleShowGraph(idx)}
                        sx={{
                          color: "#00bcd4",
                          borderColor: "#00bcd4",
                          "&:hover": { borderColor: "#00acc1", color: "#00acc1" },
                        }}
                      >
                        Explain
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <GraphDialog
        open={graphOpen}
        onClose={() => setGraphOpen(false)}
        graphData={graphData}
        meta={currentEventInfo}
      />
<CorrectionDialog
  open={correctionOpen}
  onClose={() => setCorrectionOpen(false)}
  allStrategies={allStrategies}
  selectedCorrection={selectedCorrection}          // ✅ corretto
  setSelectedCorrection={setSelectedCorrection}    // ✅ corretto
  onConfirm={handleConfirmCorrection}              // usa la funzione già scritta sopra
/>
    </Container>
  );
}

export default Session;
