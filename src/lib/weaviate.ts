import weaviate, { WeaviateClient } from "weaviate-client"

export async function getWeaviateClient(): Promise<WeaviateClient> {
    const url = process.env.WEAVIATE_URL || ""
    const apiKey = process.env.WEAVIATE_API_KEY || ""
    const localUrl = process.env.WEAVIATE_LOCAL_URL || ""

    if (localUrl) {
        return await weaviate.connectToLocal({
            host: localUrl.split(":")[0],
            port: parseInt(localUrl.split(":")[1])
        })
    }

    return await weaviate.connectToWeaviateCloud(url, {
        authCredentials: new weaviate.ApiKey(apiKey)
    })
}
