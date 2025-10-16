import React from "react";
import { Box, Card, CardContent, Container, Skeleton, Stack } from "@mui/material";

const CARD_COUNT = 6;

function CardSkeleton() {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width={120} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Skeleton variant="text" width="70%" height={24} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={110} height={26} />
          <Skeleton variant="rounded" width={90} height={26} />
          <Skeleton variant="rounded" width={75} height={26} />
        </Stack>

        <Stack spacing={1}>
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="rectangular" height={6} animation="wave" />
        </Stack>

        <Stack spacing={1}>
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="rectangular" height={6} animation="wave" />
        </Stack>

        <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={1}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Stack key={idx} spacing={0.5}>
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="80%" height={16} />
            </Stack>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RankingSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box>
            <Skeleton variant="text" width={240} height={40} />
            <Skeleton variant="text" width={360} height={24} />
          </Box>
          <Skeleton variant="rounded" width={140} height={32} />
        </Stack>

        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={58} />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {Array.from({ length: CARD_COUNT }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </Box>
      </Stack>
    </Container>
  );
}
