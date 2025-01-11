import axios from "axios"
import { OpenAI } from "openai"

export async function transcribeAudio(url: string) {

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    const res = await axios.get(url, { responseType: 'arraybuffer' })

    const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: new File([res.data], 'audio.mp3', { type: 'audio/mp3' })
    })

    return transcription.text

}
