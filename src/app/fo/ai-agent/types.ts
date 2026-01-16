// Tipe untuk pesan chat OpenAI
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
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