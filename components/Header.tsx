"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

import { useColorMode } from "@/hooks/useColorMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Ranking", href: "/" },
  { label: "Sobre", href: "/about" },
];

export default function Header(): React.ReactElement {
  const pathname = usePathname();
  const activeHref = useMemo(() => (pathname?.startsWith("/about") ? "/about" : "/"), [pathname]);
  const { mode, toggleColorMode } = useColorMode();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          <Box
            component={Link}
            href="/"
            sx={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              mr: { xs: 2, md: 4 },
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              CabraCash
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map((link) => {
              const isActive = link.href === activeHref;
              return (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  color={isActive ? "primary" : "inherit"}
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    textTransform: "none",
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={toggleColorMode} color="inherit" aria-label="Alternar tema">
              {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="Abrir menu"
              sx={{ display: { xs: "inline-flex", md: "none" } }}
              onClick={isMenuOpen ? handleMenuClose : handleMenuOpen}
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {NAV_LINKS.map((link) => {
          const isActive = link.href === activeHref;
          return (
            <MenuItem
              key={link.href}
              component={Link}
              href={link.href}
              onClick={handleMenuClose}
              sx={{
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {link.label}
            </MenuItem>
          );
        })}
      </Menu>
    </AppBar>
  );
}
