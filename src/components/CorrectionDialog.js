import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Box
} from "@mui/material";

export default function CorrectionDialog({
  open,
  onClose,
  allStrategies,
  selectedCorrection,
  setSelectedCorrection,
  onConfirm
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "#1e2a47", color: "#f9f9f9", borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ bgcolor: "#16213e", color: "#f9d342" }}>
        Provide Correct Strategy
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#1e2a47" }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select the strategy you believe is correct for this event:
        </Typography>

        <FormControl fullWidth>
          <Select
            value={selectedCorrection ?? ""}
            onChange={(e) => setSelectedCorrection(e.target.value)}
            sx={{
              color: "#f9f9f9",
              ".MuiSelect-icon": { color: "#f9d342" },
              ".MuiOutlinedInput-notchedOutline": {
                borderColor: "#374151",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#f9d342",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#f9d342",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#1e2a47",
                  color: "#f9f9f9",
                  border: "1px solid #374151",
                },
              },
            }}
          >
            <MenuItem value="">
              <em>— Select correction —</em>
            </MenuItem>
            {allStrategies.map((s) => (
              <MenuItem
                key={s.id}
                value={s.id}
                sx={{
                  backgroundColor: "#1e2a47",
                  color: "#f9f9f9",
                  "&:hover": {
                    backgroundColor: "#2c3e50",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", color: "#f9d342" }}
                  >
                    {s.name}
                  </Typography>
                  {s.description && (
                    <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                      {s.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#1e2a47" }}>
        <Button onClick={onClose} sx={{ color: "#f94c66" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!selectedCorrection}
          sx={{ bgcolor: "#2ecc71", "&:hover": { bgcolor: "#27ae60" } }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
