import { Container, Grid, Box } from '@mantine/core';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AuthBranding } from '../AuthBranding'; // <-- PERBAIKI BARIS INI

export default function LoginPage() {
  return (
    <Container size="lg" py="xl" style={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
      <Grid grow align="center" gutter={{ base: 40, md: 80 }}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <LoginForm />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
          <AuthBranding />
        </Grid.Col>
      </Grid>
    </Container>
  );
}