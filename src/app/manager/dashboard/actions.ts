'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithStandardLLM(userMessage: string, history: any[]) {
  try {
    // SYSTEM PROMPT STANDARD (DUMB MODE)
    // Kita tidak memberi tahu dia punya akses database, dan tidak memberikan tools.
    // Tujuannya agar dia mencoba menjawab hanya dengan "knowledge base" bawaan GPT (yang tidak tahu data real-time hotelmu).
    const systemMessage = {
      role: "system",
      content: "Anda adalah Asisten Manajer Hotel yang membantu di 'RoomMaster'. Anda sedang mengobrol dengan manajer hotel. Jawab pertanyaan mereka dengan sopan dan profesional berdasarkan pengetahuan umum Anda."
    };

    // Format history untuk OpenAI
    const apiMessages = [
        systemMessage,
        ...history.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Gunakan model yang SAMA persis dengan Agentic AI biar fair apple-to-apple
      messages: apiMessages as any,
      // PENTING: Di sini KITA TIDAK MEMASUKKAN 'tools' atau 'tool_choice'. 
      // Ini yang membuatnya jadi "Dumb Bot".
    });

    return {
      type: 'ai',
      content: response.choices[0].message.content || "Maaf, saya tidak bisa menjawab.",
      timestamp: new Date(),
    };

  } catch (error) {
    console.error("Standard LLM Error:", error);
    return {
      type: 'system',
      content: "Error: Gagal menghubungi AI Standard. Cek API Key.",
      timestamp: new Date(),
    };
  }
}