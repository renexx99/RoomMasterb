'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, Select, Button, Group } from '@mantine/core';
import { StaffMember } from '../page';
import { Role } from '@/core/types/database';

interface Props {
  opened: boolean;
  onClose: () => void;
  user: StaffMember | null;
  availableRoles: Role[];
  onConfirm: (roleId: string) => void;
  isSubmitting: boolean;
}

export function RoleAssignmentModal({ opened, onClose, user, availableRoles, onConfirm, isSubmitting }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const roleOptions = availableRoles.map(r => ({ value: r.id, label: r.name }));

  useEffect(() => {
    if (opened && user?.assignment) {
      setSelectedRoleId(user.assignment.role_id);
    } else {
      setSelectedRoleId(null);
    }
  }, [opened, user]);

  return (
    <Modal opened={opened} onClose={onClose} title={`Ubah Peran: ${user?.full_name}`} centered>
      <Stack gap="md">
        <Select
          label="Pilih Peran Baru"
          placeholder="Pilih peran"
          data={roleOptions}
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button 
            onClick={() => selectedRoleId && onConfirm(selectedRoleId)} 
            loading={isSubmitting} 
            disabled={!selectedRoleId || selectedRoleId === user?.assignment?.role_id}
            color="teal"
          >
            Simpan Peran
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}