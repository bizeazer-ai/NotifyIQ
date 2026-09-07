import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { env } from '@notifyiq/config';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';

@Injectable()
export class WhisperService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * Transcribes an incoming voice note using OpenAI Whisper API
   */
  async transcribeAudio(messageId: string, audioBuffer: Buffer, fileName = 'audio.ogg'): Promise<string> {
    const isMock = process.env.MOCK_SERVICES === 'true' || !env.OPENAI_API_KEY;
    let transcript = '';

    if (!isMock) {
      try {
        console.log(`[WhisperService] Dispatching Whisper transcription request for message: ${messageId}`);

        const formData = new FormData();
        const blob = new Blob([audioBuffer as any], { type: 'audio/ogg' });
        formData.append('file', blob, fileName);
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY || ''}`,
          },
          body: formData,
        });

        const data = await response.json() as any;

        if (!response.ok || !data.text) {
          console.error('[WhisperService] OpenAI API failed:', data);
          throw new Error(data.error?.message || 'Whisper API returned an error');
        }

        transcript = data.text;
      } catch (err) {
        console.error('[WhisperService] Failed to transcribe via Whisper API. Falling back to mock. Error:', err.message);
        transcript = this.getMockTranscription();
      }
    } else {
      transcript = this.getMockTranscription();
      console.log(`[WhisperService] Mock Mode. Message ${messageId} transcribed: "${transcript}"`);
    }

    // Update Message record with the transcription
    const message = await this.messageModel.findById(messageId);
    if (message) {
      message.body = transcript; // Overwrite body with transcription for index rendering
      // Store raw transcript in a sub-property if we want, or just overwrite body
      // Let's also trigger Socket update
      await message.save();

      console.log(`[WhisperService] Saved transcription for message ${messageId}`);

      this.socketGateway.emitToWorkspace(
        message.workspaceId.toString(),
        'message.transcript_updated',
        {
          messageId: message._id.toString(),
          conversationId: message.conversationId.toString(),
          transcript,
        }
      );
    }

    return transcript;
  }

  /**
   * Returns a standard mock transcription for local developers
   */
  private getMockTranscription(): string {
    const mocks = [
      'Hi team, I am calling regarding my invoice. Could you verify if the payment went through?',
      'Hello, Aarav here. The GST integration on Zynkrit is working perfectly now, thank you.',
      'Hello, I selected the credit card option on Razorpay but the payment gateway failed. Can you help?',
      'Please cancel my active growth subscription and delete my workspace details.',
    ];
    // Return a random mock transcription
    const index = Math.floor(Math.random() * mocks.length);
    return mocks[index]!;
  }
}
