// Tipe untuk pesan chat OpenAI
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

// Tipe standar untuk hasil kembalian (return) dari setiap AI Tool
export interface ToolExecutionResult {
  success?: boolean;
  type: 
    | 'error' 
    | 'info' 
    | 'confirmation' 
    | 'reservation_success' 
    | 'availability' 
    | 'analytics' 
    | 'guest_profile' 
    | 'room_inspection' 
    | 'room_status'
    | 'room_types_list'
    | 'checkin_success'
    | 'checkout_success'
    | 'reservation_list'
    | 'text';
  message?: string;
  data?: any;
  error?: string;
}

// Tipe untuk parameter pencarian kamar (opsional, biar lebih strict di utils)
export interface RoomSearchCriteria {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomTypeName?: string;
}