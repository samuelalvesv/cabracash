"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Box, Container, Typography, Link as MuiLink, Stack } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export default function Footer(): ReactElement {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        mt: 4,
        py: 2,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Site criado por
          </Typography>
          <MuiLink
            component={Link}
            href="https://www.linkedin.com/in/samuelalvesv/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
          >
            <LinkedInIcon fontSize="small" />
            <Typography variant="caption" component="span" fontWeight={600}>
              Samuel Alves
            </Typography>
          </MuiLink>
        </Stack>
      </Container>
    </Box>
  );
}
