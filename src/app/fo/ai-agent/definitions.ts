export const AI_TOOLS_DEFINITION = [
  {
    type: "function" as const,
    function: {
      name: "confirm_booking_details",
      description: "Panggil ini PERTAMA kali saat user ingin booking. Validasi data & harga sebelum disimpan.",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string" },
          user_email: { type: "string", description: "Ekstrak email dari input user jika ada" },
          phone_number: { type: "string", description: "Ekstrak no HP dari input user jika ada" },
          room_type_name: { type: "string" },
          check_in: { type: "string", format: "date" },
          check_out: { type: "string", format: "date" },
        },
        required: ["guest_name", "room_type_name", "check_in", "check_out"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_reservation",
      description: "Panggil ini HANYA jika user sudah konfirmasi (bilang Ya/Oke) setelah melihat detail.",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string" },
          user_email: { type: "string" },
          phone_number: { type: "string" },
          room_type_name: { type: "string" },
          check_in: { type: "string", format: "date" },
          check_out: { type: "string", format: "date" },
          payment_method: { type: "string", enum: ["cash", "transfer", "qris", "credit_card"] },
        },
        required: ["guest_name", "room_type_name", "check_in", "check_out"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description: "Cek ketersediaan kamar (hanya untuk melihat-lihat/checking).",
      parameters: {
        type: "object",
        properties: {
          check_in: { type: "string", format: "date" },
          check_out: { type: "string", format: "date" },
          room_type_name: { type: "string" },
        },
        required: ["check_in", "check_out"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
        name: "analytics_reporter",
        description: "Buat laporan revenue & okupansi.",
        parameters: {
            type: "object",
            properties: { start_date: { type: "string" }, end_date: { type: "string" } },
            required: ["start_date", "end_date"]
        }
    }
  },
  {
    type: "function" as const,
    function: {
        name: "guest_profiler",
        description: "Cari info tamu (loyalitas, history).",
        parameters: {
            type: "object",
            properties: { guest_identifier: { type: "string" } },
            required: ["guest_identifier"]
        }
    }
  },
  {
    type: "function" as const,
    function: {
        name: "room_inspector",
        description: "Cek detail status fisik satu kamar.",
        parameters: {
            type: "object",
            properties: { room_number: { type: "string" } },
            required: ["room_number"]
        }
    }
  }
];