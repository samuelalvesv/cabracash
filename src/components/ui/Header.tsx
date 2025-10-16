"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
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

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { buildRankingQueryString, loadRankingFilters, RANKING_FILTERS_EVENT } from "@/features/ranking/components/rankingFilterStorage";
import { useColorMode } from "@/shared/hooks/useColorMode";

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
  const [rankingHref, setRankingHref] = useState<string>("/");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const updateRankingHref = () => {
      const stored = loadRankingFilters();
      if (stored) {
        const query = buildRankingQueryString(stored);
        setRankingHref(`/${query}`);
      } else {
        setRankingHref("/");
      }
    };

    if (typeof window === "undefined") {
      return;
    }

    updateRankingHref();
    window.addEventListener(RANKING_FILTERS_EVENT, updateRankingHref);
    window.addEventListener("focus", updateRankingHref);

    return () => {
      window.removeEventListener(RANKING_FILTERS_EVENT, updateRankingHref);
      window.removeEventListener("focus", updateRankingHref);
    };
  }, []);

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          <Box
            component={Link}
            href={rankingHref}
            sx={{
              textDecoration: "none",
              color: "inherit",
              display: "inline-flex",
              alignItems: "center",
              mr: { xs: 2, md: 4 },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.2}
              sx={{
                px: 1,
                py: 0,
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
                bgcolor: "rgba(255, 255, 255, 0)",
                color: "inherit",
                transition: "background-color 0.2s ease",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : theme.palette.action.hover,
                },
              }}
            >
              <Image src="/logo.png" alt="CabraCash" width={56} height={56} priority style={{ borderRadius: "50%" }} />
              <Stack spacing={0.25} lineHeight={1}>
                <Typography variant="h6" fontWeight={300} sx={{ lineHeight: 1 }}>
                  CABRA
                </Typography>
                <Typography variant="h6" fontWeight={300} sx={{ lineHeight: 1 }}>
                  CASH
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map((link) => {
              const isActive = link.href === activeHref;
              const resolvedHref = link.href === "/" ? rankingHref : link.href;
              return (
                <Button
                  key={link.href}
                  component={Link}
                  href={resolvedHref}
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
          const resolvedHref = link.href === "/" ? rankingHref : link.href;
          return (
            <MenuItem
              key={link.href}
              component={Link}
              href={resolvedHref}
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
