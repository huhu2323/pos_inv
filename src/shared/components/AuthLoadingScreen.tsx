import { Box, CircularProgress } from '@mui/material'

interface AuthLoadingScreenProps {
  minHeight?: string
}

export function AuthLoadingScreen({ minHeight = '100vh' }: AuthLoadingScreenProps) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  )
}
