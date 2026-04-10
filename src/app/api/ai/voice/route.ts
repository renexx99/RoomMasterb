// src/app/api/ai/voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Tidak ada file audio yang diterima.' },
        { status: 400 }
      );
    }

    // Transcribe audio menggunakan OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'id', // Bahasa Indonesia
      response_format: 'text',
    });

    const transcript = typeof transcription === 'string' 
      ? transcription.trim() 
      : (transcription as any).text?.trim() || '';

    if (!transcript) {
      return NextResponse.json(
        { error: 'Tidak dapat mengenali suara. Silakan coba lagi.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ transcript });

  } catch (error: any) {
    console.error('Voice transcription error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses suara.' },
      { status: 500 }
    );
  }
}
