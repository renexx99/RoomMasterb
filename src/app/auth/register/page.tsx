import { Container, Box } from '@mantine/core';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <Container size="xs" w="100%">
        <Box 
          style={{ 
            width: '100%', 
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <RegisterForm />
        </Box>
      </Container>
    </Box>
  );
}