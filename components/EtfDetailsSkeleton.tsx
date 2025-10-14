import React from "react";
import { Box, Card, CardContent, Container, Skeleton, Stack, Table, TableBody, TableCell, TableRow } from "@mui/material";

function SummaryCard() {
  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={1}>
        <Skeleton variant="text" width={120} height={18} />
        <Skeleton variant="text" width={90} height={36} />
        <Skeleton variant="rectangular" height={6} animation="wave" />
      </Stack>
    </Card>
  );
}

function BreakdownCard(titleWidth: number = 160) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Skeleton variant="text" width={titleWidth} height={24} />
        <Table size="small">
          <TableBody>
            {Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: 0 }}>
                  <Skeleton variant="text" width={120} height={16} />
                </TableCell>
                <TableCell align="right" sx={{ border: 0 }}>
                  <Skeleton variant="text" width={80} height={16} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function EtfDetailsSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Skeleton variant="text" width={200} height={24} />

        <Stack spacing={1}>
          <Skeleton variant="text" width={140} height={40} />
          <Skeleton variant="text" width={260} height={28} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={140} height={28} />
            <Skeleton variant="rounded" width={120} height={28} />
            <Skeleton variant="rounded" width={90} height={28} />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <SummaryCard />
          <SummaryCard />
          <SummaryCard />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <BreakdownCard />
          <BreakdownCard />
        </Box>

        {Array.from({ length: 6 }).map((_, idx) => (
          <Card variant="outlined" key={idx}>
            <CardContent>
              <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
              <Table size="small">
                <TableBody>
                  {Array.from({ length: 5 }).map((__, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell sx={{ border: 0 }}>
                        <Skeleton variant="text" width={140} height={16} />
                      </TableCell>
                      <TableCell sx={{ border: 0 }} align="right">
                        <Skeleton variant="text" width={120} height={16} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
