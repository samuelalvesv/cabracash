"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Box, Container, Typography, Link as MuiLink } from "@mui/material";

export default function Footer(): ReactElement {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        mt: 8,
        py: 3,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Site criado por{" "}
          <MuiLink
            component={Link}
            href="https://www.linkedin.com/in/samuelalvesv/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
            Samuel Alves
          </MuiLink>
          .
        </Typography>
      </Container>
    </Box>
  );
}
