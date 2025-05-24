export class TranscriptionService {
  async transcribeAudio(audioUrl: string): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
    try {
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      const result = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!result.ok) {
        const errorData = await result.json().catch(() => null);
        throw new Error(
          `Failed to transcribe audio: ${result.status} ${result.statusText}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ''
          }`
        );
      }

      const data = await result.json();
      
      if (!data.text || !data.segments) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return {
        text: data.text,
        segments: data.segments.map((segment: any) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text
        }))
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }
      throw new Error('Failed to transcribe audio: Unknown error');
    }
  }
} 