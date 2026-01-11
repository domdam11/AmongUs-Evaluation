import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Stack
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import api from "../../api/axiosInstance";

export default function OntologiesTable() {
  const [ontologies, setOntologies] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await api.get("/strategic/ontologies");
    setOntologies(res.data);
  }

  async function handleDelete(id) {
    await api.delete(`/strategic/ontologies/${id}`);
    load();
  }

  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await api.post("/strategic/ontologies/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFile(null);
      setOpenUpload(false);
      load(); // 🔄 refresh tabella
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ color: "#f9d342" }}>
          Ontologies
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setOpenUpload(true)}
        >
          Add new version
        </Button>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Saved At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ontologies.map(o => (
              <TableRow key={o.id}>
                <TableCell>{o.id}</TableCell>
                <TableCell>{o.version}</TableCell>
                <TableCell>{new Date(o.date).toLocaleString()}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(o.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {ontologies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: "#aaa" }}>
                  No ontologies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog per upload nuova versione */}
      <Dialog
        open={openUpload}
        onClose={() => !uploading && setOpenUpload(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload new ontology version</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <input
              type="file"
              accept=".owl,.rdf,.xml"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && (
              <Typography variant="body2" color="text.secondary">
                Selected file: {file.name}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            variant="contained"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
