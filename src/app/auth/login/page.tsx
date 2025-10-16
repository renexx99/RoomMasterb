import { Container, Center, Box } from '@mantine/core';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container size="xs">
        <Center>
          <Box style={{ width: '100%', maxWidth: 420 }}>
            <LoginForm />
          </Box>
        </Center>
      </Container>
    </Box>
  );
}
