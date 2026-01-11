import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from "@mui/material";
import api from "../../api/axiosInstance";

export default function StrategiesTable() {
  const [strategies, setStrategies] = useState([]);

  async function load() {
    const res = await api.get("/strategic/strategies");
    setStrategies(res.data);
  }

  useEffect(() => { load(); }, []);

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {strategies.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.description}</TableCell>
              </TableRow>
            ))}
            {strategies.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No strategies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
