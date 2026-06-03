export const AI_TOOLS_DEFINITION = [
  // ==========================================
  // 📋 INFORMASI & STATUS (Tanpa perlu tanggal)
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "room_status_summary",
      description: `Ambil status real-time SEMUA kamar SAAT INI. TIDAK BUTUH TANGGAL.
Gunakan tool ini untuk pertanyaan seperti:
- "Status kamar deluxe?" → room_type_name: "deluxe"
- "Ada kamar kosong?" → tanpa parameter
- "Berapa kamar yang terisi?" → tanpa parameter
- "Kamar mana yang available?" → tanpa parameter
JANGAN gunakan check_availability untuk pertanyaan seperti ini. Tool ini tidak butuh tanggal sama sekali.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          room_type_name: {
            type: "string",
            description: "Opsional. Filter berdasarkan nama tipe kamar (contoh: 'Deluxe', 'Suite', 'Standard'). Kosongkan untuk melihat semua tipe."
          }
        },
        required: ["thought_process"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_room_types",
      description: `Tampilkan SEMUA tipe kamar yang tersedia beserta harga, fasilitas, kapasitas, dll.
Gunakan untuk:
- "Tipe kamar apa saja?" 
- "Berapa harga kamar deluxe?"
- "Fasilitas suite apa saja?"
- "Ada kamar yang bisa untuk 4 orang?"
Tidak memerlukan parameter apapun.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
        },
        required: ["thought_process"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "room_inspector",
      description: `Cek detail lengkap SATU kamar spesifik berdasarkan nomor kamar.
Gunakan untuk: "Detail kamar 101", "Kondisi kamar 205", "Info kamar nomor 302".
BUKAN untuk cek ketersediaan atau status umum — gunakan room_status_summary untuk itu.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          room_number: { type: "string", description: "Nomor kamar yang ingin dicek (contoh: '101', '205')" }
        },
        required: ["thought_process", "room_number"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "guest_profiler",
      description: `Cari informasi lengkap tentang seorang tamu: profil, riwayat menginap, loyalti, preferensi.
Gunakan untuk: "Info tamu Budi", "Riwayat menginap Sari", "Tamu bernama Ahmad pernah booking?".`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          guest_identifier: { type: "string", description: "Nama tamu atau email untuk dicari" }
        },
        required: ["thought_process", "guest_identifier"]
      }
    }
  },

  // ==========================================
  // 🔍 PENCARIAN RESERVASI
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "search_reservations",
      description: `Cari dan tampilkan daftar reservasi. Bisa filter berdasarkan nama tamu, tanggal, atau status pembayaran.
Gunakan untuk:
- "Reservasi atas nama Budi" → guest_name: "Budi"
- "Booking hari ini" → date: (tanggal hari ini)
- "Reservasi yang belum dibayar" → status_filter: "pending"
- "Reservasi minggu depan" → upcoming_only: true
- "Ada booking untuk besok?" → date: (tanggal besok)`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          guest_name: { type: "string", description: "Opsional. Nama tamu untuk dicari." },
          date: { type: "string", format: "date", description: "Opsional. Tanggal spesifik (YYYY-MM-DD) untuk melihat reservasi yang aktif pada tanggal itu." },
          status_filter: { type: "string", enum: ["pending", "paid", "cancelled", "city_ledger"], description: "Opsional. Filter berdasarkan status pembayaran." },
          upcoming_only: { type: "boolean", description: "Opsional. Jika true, hanya tampilkan reservasi yang belum dimulai (check_in >= hari ini)." },
        },
        required: ["thought_process"],
      },
    },
  },

  // ==========================================
  // 📅 CEK KETERSEDIAAN (Butuh tanggal)
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description: `Cek ketersediaan kamar untuk TANGGAL TERTENTU di masa depan. WAJIB ada tanggal check-in dan check-out.
Gunakan HANYA jika user menyebutkan tanggal spesifik:
- "Ada kamar deluxe tanggal 1-5 Juni?" → check_in: "2026-06-01", check_out: "2026-06-05"
- "Cek ketersediaan weekend ini" → (hitung tanggalnya)
JANGAN gunakan ini untuk pertanyaan status saat ini — gunakan room_status_summary.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          check_in: { type: "string", format: "date", description: "Tanggal check-in (YYYY-MM-DD)" },
          check_out: { type: "string", format: "date", description: "Tanggal check-out (YYYY-MM-DD)" },
          room_type_name: { type: "string", description: "Opsional. Filter tipe kamar (contoh: 'Deluxe')" },
        },
        required: ["thought_process", "check_in", "check_out"],
      },
    },
  },

  // ==========================================
  // 📝 BOOKING & RESERVASI
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "confirm_booking_details",
      description: `FASE DRAFT BOOKING. Panggil ini PERTAMA kali saat user ingin membuat reservasi baru.
Validasi ketersediaan kamar + hitung harga, lalu tampilkan ringkasan ke user untuk dikonfirmasi.
JANGAN panggil ini lagi jika user sudah konfirmasi — langsung panggil create_reservation.
Contoh: "Booking kamar deluxe untuk Budi tanggal 1-3 Juni"`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          guest_name: { type: "string", description: "Nama lengkap tamu" },
          user_email: { type: "string", description: "Email tamu. Isi '-' jika tidak disebutkan." },
          phone_number: { type: "string", description: "No HP tamu. Isi '-' jika tidak disebutkan." },
          room_type_name: { type: "string", description: "Tipe kamar yang diminta (contoh: 'Deluxe', 'Suite')" },
          check_in: { type: "string", format: "date", description: "Tanggal check-in (YYYY-MM-DD)" },
          check_out: { type: "string", format: "date", description: "Tanggal check-out (YYYY-MM-DD)" },
        },
        required: ["thought_process", "guest_name", "room_type_name", "check_in", "check_out"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_reservation",
      description: `FASE EKSEKUSI BOOKING. Panggil HANYA jika user sudah bilang "Ya", "Konfirmasi", "Lanjut", "Setuju" setelah melihat draft dari confirm_booking_details.
JANGAN panggil ini tanpa konfirmasi user terlebih dahulu.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          guest_name: { type: "string" },
          user_email: { type: "string" },
          phone_number: { type: "string" },
          room_type_name: { type: "string" },
          check_in: { type: "string", format: "date" },
          check_out: { type: "string", format: "date" },
          payment_method: { type: "string", enum: ["cash", "transfer", "qris", "credit_card"] },
        },
        required: ["thought_process", "guest_name", "room_type_name", "check_in", "check_out"],
      },
    },
  },

  // ==========================================
  // 🚪 CHECK-IN & CHECK-OUT
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "checkin_guest",
      description: `Proses check-in tamu. Cari reservasi berdasarkan nama tamu ATAU ID reservasi, lalu lakukan check-in.
Gunakan untuk: "Check-in tamu Budi", "Proses kedatangan kamar 101", "Checkin reservasi ABC12345".
Minimal satu dari guest_identifier atau reservation_id harus diisi.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          guest_identifier: { type: "string", description: "Nama tamu yang akan check-in" },
          reservation_id: { type: "string", description: "ID reservasi atau nomor folio (opsional, jika diketahui)" },
        },
        required: ["thought_process"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "checkout_guest",
      description: `Proses check-out tamu. Cari berdasarkan nomor kamar ATAU nama tamu.
Gunakan untuk: "Checkout kamar 205", "Tamu Sari mau checkout", "Proses keberangkatan kamar 101".
Kamar akan otomatis direset ke 'available + dirty' dan housekeeping task dibuat.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          room_number: { type: "string", description: "Nomor kamar yang akan checkout (contoh: '205')" },
          guest_identifier: { type: "string", description: "Nama tamu yang akan checkout (alternatif jika nomor kamar tidak diketahui)" },
        },
        required: ["thought_process"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "force_checkout",
      description: `Force checkout untuk reservasi yang tagihannya belum lunas. HANYA panggil setelah user mengonfirmasi dari warning checkout_guest.
Gunakan saat user bilang "Ya, checkout" atau "Tetap checkout" setelah peringatan tagihan belum lunas.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          reservation_id: { type: "string", description: "ID reservasi yang akan di-force checkout" },
        },
        required: ["thought_process", "reservation_id"],
      },
    },
  },

  // ==========================================
  // 📊 ANALYTICS & LAPORAN
  // ==========================================
  {
    type: "function" as const,
    function: {
      name: "analytics_reporter",
      description: `Buat laporan revenue dan okupansi untuk periode tertentu.
Gunakan untuk: "Laporan bulan ini", "Revenue minggu lalu", "Okupansi hari ini".
WAJIB ada start_date dan end_date. Hitung dari konteks percakapan jika user bilang "bulan ini", "minggu lalu", dll.`,
      parameters: {
        type: "object",
        properties: {
          thought_process: {
            type: "string",
            description: "Chain-of-Thought: Tuliskan langkah-langkah pemikiran dan alasan kamu sebelum mengeksekusi tool ini. Jelaskan mengapa tool ini dipilih dan bagaimana parameter ditentukan."
          },
          start_date: { type: "string", format: "date", description: "Tanggal mulai periode (YYYY-MM-DD)" },
          end_date: { type: "string", format: "date", description: "Tanggal akhir periode (YYYY-MM-DD)" },
        },
        required: ["thought_process", "start_date", "end_date"]
      }
    }
  },
];