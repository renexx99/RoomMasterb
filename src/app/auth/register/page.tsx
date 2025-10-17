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
        backgroundColor: 'var(--mantine-color-gray-1)',
      }}
    >
      <Container size="xs" w="100%">
        <Center>
          <Box style={{ width: '100%', maxWidth: 420 }}>
            <RegisterForm />
          </Box>
        </Center>
      </Container>
    </Box>
  );
}