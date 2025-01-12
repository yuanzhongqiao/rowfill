import { OpenAI } from "openai"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"

export async function generateAnswer(
    query: string,
    imageUrls: Array<string> = [],
    history: Array<{ role: "user" | "assistant", content: string }> = []
) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    let messages: Array<ChatCompletionMessageParam> = []

    messages.push({
        role: "system",
        content: `Answer the question based on the data${imageUrls.length > 0 ? " and the image" : ""}`
    })

    if(history.length > 0) {
        history.forEach(message => {
            messages.push(message)
        })
    }

    if (imageUrls.length > 0) {
        imageUrls.forEach(image => {
            messages.push({
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: image
                        }
                    }
                ]
            })
        })
    }

    messages.push({
        role: "user",
        content: query
    })

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages
    })

    return response.choices[0].message.content || ""
}
