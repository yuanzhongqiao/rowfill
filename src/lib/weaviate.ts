import weaviate, { WeaviateClient } from "weaviate-client"

export async function getWeaviateClient(): Promise<WeaviateClient> {
    const url = process.env.WEAVIATE_URL
    const apiKey = process.env.WEAVIATE_API_KEY

    if (!url || !apiKey) {
        return await weaviate.connectToLocal()
    }

    return await weaviate.connectToWeaviateCloud(url, {
        authCredentials: new weaviate.ApiKey(apiKey)
    })
}
