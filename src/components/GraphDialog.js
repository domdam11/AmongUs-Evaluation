import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Popover,
} from "@mui/material";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

cytoscape.use(dagre);

// 🔑 tutta la logica qui
function initCytoscape(container, graphData, setEdgePopover) {
  if (!graphData?.graph) return;

  const { graph, suggestedStrategies = [], eventStrategy } = graphData;
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return;

  const ceil2 = (n) => Math.ceil(n * 100 - 1e-12) / 100;
  const ceil2str = (n) => ceil2(n).toFixed(2);

  const selectedStrategyData =
    suggestedStrategies.find((s) => s.name === eventStrategy) ??
    suggestedStrategies[0];

  const favorPaths = (selectedStrategyData?.explanation?.favor ?? [])
    .map((x) => x?.path)
    .filter((p) => Array.isArray(p) && p.length);
  const againstPaths = (selectedStrategyData?.explanation?.against ?? [])
    .map((x) => x?.path)
    .filter((p) => Array.isArray(p) && p.length);

  const posNodes = new Set();
  const negNodes = new Set();
  const posEdges = new Set();
  const negEdges = new Set();
  const key = (a, b) => `${a}->${b}`;

  const posTerminals = new Set();
  const negTerminals = new Set();

  for (const path of favorPaths) {
    for (let i = 0; i < path.length; i++) {
      posNodes.add(path[i]);
      if (i < path.length - 1) posEdges.add(key(path[i], path[i + 1]));
    }
    if (path.length) posTerminals.add(path[path.length - 1]);
  }
  for (const path of againstPaths) {
    for (let i = 0; i < path.length; i++) {
      negNodes.add(path[i]);
      if (i < path.length - 1) negEdges.add(key(path[i], path[i + 1]));
    }
    if (path.length) negTerminals.add(path[path.length - 1]);
  }

  const terminalNodes = new Set([...posTerminals, ...negTerminals]);

  const nodes = graph.nodes.map((n) => {
    const id = n.data.id;
    const isPos = posNodes.has(id);
    const isNeg = negNodes.has(id);
    const isTerminal = terminalNodes.has(id);

    let backgroundColor = "#f9d342";
    let borderColor = "#000000";

    if (isPos && !isNeg) {
      backgroundColor = "#2ecc71";
      borderColor = "#2ecc71";
    }
    if (isNeg && !isPos) {
      backgroundColor = "#e74c3c";
      borderColor = "#e74c3c";
    }

    let classes = "";
    if (isPos && isNeg && !isTerminal) {
      backgroundColor = "#f9d342";
      borderColor = "#2ecc71";
      classes = "both";
    }

    if (isTerminal) {
      backgroundColor = "#4922e6";
      borderColor = "#2e00d3";
      classes = "";
    }

    return {
      data: { ...n.data, backgroundColor, borderColor },
      classes,
    };
  });

  const edgeHint = (e) => {
    const s = `Nodo ${e.data.source}`;
    const t = `Nodo ${e.data.target}`;
    const w = Number(e.data.label);
    const verb = w > 0 ? "favorisce" : w < 0 ? "ostacola" : "è neutro su";
    return `${s} ${verb} ${t}`;
  };

  const edges = graph.edges.map((e) => {
    const k = `${e.data.source}->${e.data.target}`;
    const w = Number(e.data.label);

    const inPos = posEdges.has(k);
    const inNeg = negEdges.has(k);

    const lineStyle = inNeg || w < 0 ? "dashed" : "solid";
    const color = inNeg ? "#e74c3c" : inPos ? "#2ecc71" : "#888";

    return {
      data: {
        ...e.data,
        weight: w,
        label: isFinite(w) ? ceil2str(w) : `${e.data.label}`,
        color,
        lineStyle,
        hint: edgeHint(e),
      },
    };
  });

  const cy = cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          color: "#ffffff",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": 9,
          width: 40,
          height: 40,
          "border-width": 2,
          "border-color": "data(borderColor)",
          "background-color": "data(backgroundColor)",
        },
      },
      {
        selector: "node.both",
        style: {
          "border-width": 4,
          "shadow-blur": 12,
          "shadow-opacity": 0.95,
          "shadow-color": "#e74c3c",
        },
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "data(color)",
          "target-arrow-color": "data(color)",
          "target-arrow-shape": "triangle",
          label: "data(label)",
          "font-size": 8,
          color: "#f1f1f1",
          "curve-style": "bezier",
          "line-style": "data(lineStyle)",
        },
      },
    ],
    layout: { name: "dagre" },
  });

  // edge popover
  cy.on("tap", "edge", (evt) => {
    const e = evt.target;
    const mp = e.midpoint ? e.midpoint() : { x: 0, y: 0 };
    const rect = cy.container().getBoundingClientRect();
    setEdgePopover({
      open: true,
      text: e.data("hint"),
      pos: { top: rect.top + mp.y, left: rect.left + mp.x },
    });
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) setEdgePopover((s) => ({ ...s, open: false }));
  });

  setTimeout(() => {
    cy.resize();
    cy.fit();
  }, 50);

  return cy;
}

export default function GraphDialog({ open, onClose, graphData, meta }) {
  const cyRef = useRef(null);
  const [edgePopover, setEdgePopover] = useState({
    open: false,
    text: "",
    pos: { top: 0, left: 0 },
  });

  const scoreLabel =
    typeof meta?.score === "number"
      ? `${((meta.score > 1 ? meta.score : meta.score * 100)).toFixed(1)}%`
      : "—";

  return (
<Dialog
  open={open}
  onClose={() => {
    if (cyRef.current && cyRef.current._cy) {
      cyRef.current._cy.destroy();
      cyRef.current._cy = null;
    }
    onClose();
  }}
  maxWidth="md"
  fullWidth
  TransitionProps={{
    onEntered: () => {
      if (cyRef.current && graphData?.graph) {
        if (cyRef.current._cy) {
          cyRef.current._cy.destroy();
          cyRef.current._cy = null;
        }
        cyRef.current._cy = initCytoscape(
          cyRef.current,
          graphData,
          setEdgePopover
        );
      }
    },
  }}
>
      <DialogTitle
  sx={{ backgroundColor: "#16213e", color: "#f9d342", py: 1.5 }}
>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
    }}
  >
    <Box>
      <Typography variant="subtitle1" sx={{ color: "#f9d342" }}>
        Explanation • {meta?.id ?? "—"}
      </Typography>
      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
        {meta?.strategy ?? "—"} • Score {scoreLabel} •{" "}
        {meta?.timestamp
          ? new Date(meta.timestamp).toLocaleString()
          : "—"}
      </Typography>
    </Box>

    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {meta?.reaction === "like" && (
        <>
          <ThumbUpOffAltIcon sx={{ color: "#2ecc71" }} fontSize="small" />
          <Typography variant="caption" sx={{ color: "#2ecc71" }}>
            Liked
          </Typography>
        </>
      )}
      {meta?.reaction === "dislike" && (
        <>
          <ThumbDownOffAltIcon
            sx={{ color: "#e74c3c" }}
            fontSize="small"
          />
          <Typography variant="caption" sx={{ color: "#e74c3c" }}>
            Disliked
          </Typography>
        </>
      )}
    </Box>
  </Box>
</DialogTitle>

      <DialogContent sx={{ backgroundColor: "#1e2a47", height: 500, p: 0 }}>
        <div ref={cyRef} style={{ width: "100%", height: "100%" }} />
        <Popover
          open={edgePopover.open}
          onClose={() => setEdgePopover((s) => ({ ...s, open: false }))}
          anchorReference="anchorPosition"
          anchorPosition={edgePopover.pos}
          PaperProps={{
            sx: {
              p: 1,
              bgcolor: "#111827",
              color: "#f9f9f9",
              border: "1px solid #374151",
            },
          }}
        >
          <Typography variant="caption">{edgePopover.text}</Typography>
        </Popover>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: "#1e2a47" }}>
        <Button onClick={onClose} sx={{ color: "#f94c66" }}>
          Close
        </Button>
      </DialogActions> 
    </Dialog>
  );
}
