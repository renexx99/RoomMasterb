// src/app/fo/log/actions.ts
'use server';

// Ini adalah placeholder. Di masa depan, Anda bisa menghubungkan ini ke tabel 'guest_logs'
export async function createLogEntry(data: {
  reservation_id: string;
  staff_id: string;
  message: string;
}) {
  // Simulasi delay server
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  console.log('Server Action: Log created', data);
  return { success: true };
}