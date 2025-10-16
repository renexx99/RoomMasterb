import { Container, Center, Box } from '@mantine/core';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
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
            <RegisterForm />
          </Box>
        </Center>
      </Container>
    </Box>
  );
}
