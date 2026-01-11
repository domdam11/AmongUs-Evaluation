import React from "react";
import { Container, Typography, Grid, Paper } from "@mui/material";
import OntologiesTable from "../components/admin/OntologiesTable";
import StrategiesTable from "../components/admin/StrategiesTable";

export default function AdminPanel() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Admin Panel
            </Typography>

            <Grid container spacing={3}>
                {/* Tabella Ontologie */}
                <Grid item xs={12} md={7}>
                    <OntologiesTable />
                </Grid>

                {/* Strategie attuali */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <StrategiesTable />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
