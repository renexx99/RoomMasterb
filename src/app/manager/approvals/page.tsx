'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  ActionIcon,
  Button,
  Card,
  Badge,
  Avatar,
  Divider,
  TextInput,
  Select,
  Grid,
  SimpleGrid,
  Box,
  ThemeIcon,
  Tooltip,
  Stack
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconReceiptRefund,
  IconDiscount2,
  IconBox,
  IconSearch,
  IconFilter,
  IconChecks,
  IconUser
} from '@tabler/icons-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { notifications } from '@mantine/notifications';

// --- TYPES ---
interface RequestItem {
  id: string;
  type: 'discount' | 'refund' | 'service';
  title: string;
  requester: {
    name: string;
    role: string;
    initials: string;
  };
  details: string;
  value?: string;
  created_at: string;
  priority: 'normal' | 'high' | 'urgent';
}

// --- MOCK DATA (Business Context) ---
const mockRequests: RequestItem[] = [
  {
    id: 'req_001',
    type: 'discount',
    title: 'Corporate Rate Approval',
    requester: { name: 'Sarah Jenkins', role: 'Sales Manager', initials: 'SJ' },
    details: 'Requesting 15% off for "TechCorp Inc." group booking (10 Rooms) for next month.',
    value: '15%',
    created_at: '2025-10-31T09:15:00Z',
    priority: 'normal'
  },
  {
    id: 'req_002',
    type: 'refund',
    title: 'Service Recovery Refund',
    requester: { name: 'David Chen', role: 'Front Office', initials: 'DC' },
    details: 'Guest in 505 complained about AC noise all night. Proposing 1-night refund as compensation.',
    value: '$120.00',
    created_at: '2025-10-31T08:30:00Z',
    priority: 'high'
  },
  {
    id: 'req_003',
    type: 'service',
    title: 'VIP Amenity Setup',
    requester: { name: 'Maria Garcia', role: 'Guest Relations', initials: 'MG' },
    details: 'Mr. Wick (Diamond Member) arriving at 2 PM. Requesting premium welcome package in Suite 1001.',
    created_at: '2025-10-31T07:00:00Z',
    priority: 'urgent'
  },
  {
    id: 'req_004',
    type: 'discount',
    title: 'Long Stay Adjustment',
    requester: { name: 'David Chen', role: 'Front Office', initials: 'DC' },
    details: 'Guest extending stay for 14 more days. Requesting long-stay rate application.',
    value: '$85/night',
    created_at: '2025-10-30T16:00:00Z',
    priority: 'normal'
  },
];

function ApprovalsContent() {
  const { profile } = useAuth();
  const MAX_WIDTH = 1400; 

  // State
  const [requests, setRequests] = useState<RequestItem[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter Logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType ? req.type === filterType : true;
      
      return matchesSearch && matchesType;
    });
  }, [requests, searchTerm, filterType]);

  // Actions
  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    // Simulating API call
    setTimeout(() => {
      setRequests(prev => prev.filter(r => r.id !== id));
      setProcessingId(null);
      
      notifications.show({
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        message: `The request has been successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
        color: action === 'approve' ? 'green' : 'red',
        icon: action === 'approve' ? <IconCheck size={16}/> : <IconX size={16}/>
      });
    }, 600);
  };

  const getTypeConfig = (type: string) => {
    switch(type) {
      case 'discount': return { color: 'blue', icon: IconDiscount2, label: 'Discount' };
      case 'refund': return { color: 'red', icon: IconReceiptRefund, label: 'Refund' };
      case 'service': return { color: 'grape', icon: IconBox, label: 'Service' };
      default: return { color: 'gray', icon: IconBox, label: 'Other' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      
      {/* 1. Header & Toolbar */}
      <Box style={{ background: 'white', borderBottom: '1px solid #e9ecef', padding: '1rem 0' }}>
        <Container size="xl" maw={MAX_WIDTH}>
          <Grid align="center" gutter="md">
            {/* Title Section */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Group gap="xs">
                <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                  <IconChecks size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Title order={4} c="dark.8">Approvals</Title>
                  <Text size="xs" c="dimmed">{filteredRequests.length} Pending Review</Text>
                </div>
              </Group>
            </Grid.Col>

            {/* Filter Section */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Group justify="flex-end" gap="sm">
                <Select
                  placeholder="Filter Type"
                  data={[
                    { value: 'discount', label: 'Discount' },
                    { value: 'refund', label: 'Refund' },
                    { value: 'service', label: 'Service' },
                  ]}
                  value={filterType}
                  onChange={setFilterType}
                  clearable
                  leftSection={<IconFilter size={16} />}
                  radius="md"
                  size="sm"
                  w={180}
                />
                <TextInput
                  placeholder="Search request or staff..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                  w={280}
                />
              </Group>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* 2. Content Grid */}
      <Container size="xl" maw={MAX_WIDTH} mt="lg">
        {filteredRequests.length === 0 ? (
          <Paper p="xl" radius="md" withBorder ta="center" bg="gray.0">
            <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius="xl" color="gray" variant="light">
                    <IconChecks size={24} />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">No pending requests found</Text>
                <Text size="sm" c="dimmed">All caught up! New requests will appear here.</Text>
            </Stack>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filteredRequests.map((req) => {
              const config = getTypeConfig(req.type);
              const isUrgent = req.priority === 'urgent';
              
              return (
                <Card 
                  key={req.id} 
                  shadow="sm" 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    borderTop: isUrgent ? '3px solid var(--mantine-color-red-5)' : undefined
                  }}
                >
                  {/* Card Header */}
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <Group gap="xs" align="center">
                      <Badge 
                        variant="light" 
                        color={config.color} 
                        size="sm" 
                        leftSection={<config.icon size={10} />}
                        radius="sm"
                      >
                        {config.label}
                      </Badge>
                      {req.priority !== 'normal' && (
                        <Badge size="xs" variant="outline" color={getPriorityColor(req.priority)}>
                            {req.priority}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                         {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </Text>
                  </Group>

                  {/* Main Content */}
                  <Stack gap="xs" mb="lg" style={{ flex: 1 }}>
                     <Group justify="space-between" align="flex-start">
                        <Text fw={600} size="md" style={{ lineHeight: 1.3 }}>{req.title}</Text>
                        {req.value && (
                           <Badge variant="filled" color={config.color} size="md" radius="sm">
                              {req.value}
                           </Badge>
                        )}
                     </Group>
                     <Text size="sm" c="dark.6" style={{ lineHeight: 1.5 }}>
                       {req.details}
                     </Text>
                  </Stack>

                  <Divider mb="sm" />

                  {/* Requester Info & Actions */}
                  <Group justify="space-between" align="flex-end">
                    <Group gap="xs">
                        <Avatar color="indigo" radius="xl" size="sm" variant="light">
                            {req.requester.initials}
                        </Avatar>
                        <Box>
                            <Text size="xs" fw={600} c="dark.8">{req.requester.name}</Text>
                            <Text size="10px" c="dimmed" tt="uppercase" fw={700}>{req.requester.role}</Text>
                        </Box>
                    </Group>

                    <Group gap={8}>
                       <Tooltip label="Reject Request">
                         <ActionIcon 
                            variant="light" 
                            color="red" 
                            size="lg" 
                            radius="md"
                            onClick={() => handleAction(req.id, 'reject')}
                            loading={processingId === req.id}
                         >
                           <IconX size={18} />
                         </ActionIcon>
                       </Tooltip>
                       <Button 
                          size="xs" 
                          color="teal" 
                          radius="md"
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleAction(req.id, 'approve')}
                          loading={processingId === req.id}
                       >
                          Approve
                       </Button>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}

export default function ManagerApprovalsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ApprovalsContent />
    </ProtectedRoute>
  );
}