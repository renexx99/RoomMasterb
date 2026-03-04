import { getSupabase } from '../utils';
import { ToolExecutionResult } from '../types';

export async function analyticsReporterTool(args: any): Promise<ToolExecutionResult> {
  const supabase = await getSupabase();
  const { start_date, end_date } = args;
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: roleData } = await supabase.from('user_roles').select('hotel_id').eq('user_id', session?.user.id).maybeSingle();
  const hotelId = roleData?.hotel_id;

  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId);

  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_price, payment_status, check_in_date')
    .eq('hotel_id', hotelId)
    .neq('payment_status', 'cancelled')
    .gte('check_in_date', start_date)
    .lte('check_in_date', end_date);

  if (!reservations || reservations.length === 0) return { 
    type: 'info',
    message: "Belum ada data reservasi pada periode ini." 
  };

  const totalRevenue = reservations.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
  const totalBookings = reservations.length;
  const paidBookings = reservations.filter(r => r.payment_status === 'paid').length;
  
  const start = new Date(start_date);
  const end = new Date(end_date);
  const daysDiff = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const capacity = (totalRooms || 1) * daysDiff;
  const occupancyRate = Math.min(100, Math.round((totalBookings / capacity) * 100));

  return {
    success: true,
    type: 'analytics',
    data: {
      period: {
        start: start_date,
        end: end_date,
        days: daysDiff
      },
      revenue: {
        total: totalRevenue,
        average_per_booking: Math.round(totalRevenue / totalBookings)
      },
      bookings: {
        total: totalBookings,
        paid: paidBookings,
        pending: totalBookings - paidBookings
      },
      occupancy: {
        rate: occupancyRate,
        rooms_available: totalRooms || 0,
        capacity: capacity
      }
    }
  };
}