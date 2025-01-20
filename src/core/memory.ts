import { OpenAI } from "openai"
import weaviate, { WeaviateClient } from "weaviate-client"


async function createTenantOrCollectionIfNotExists(client: WeaviateClient, collectionName: string, organizationId: string) {

    const collectionExists = await client.collections.exists(collectionName)

    if (!collectionExists) {
        await client.collections.create({
            name: collectionName,
            multiTenancy: {
                enabled: true
            },
            properties: [
                {
                    name: "source",
                    dataType: "text",
                    indexFilterable: true,
                    indexSearchable: true,
                    tokenization: "word"
                }
            ]
        })
    }

    const tenant = await client.collections.get(collectionName).tenants.getByName(organizationId)

    if (!tenant) {
        await client.collections.get(collectionName).tenants.create({
            name: organizationId,
            activityStatus: "ACTIVE"
        })
    }
}


export async function indexTextToVectorDB(text: string, organizationId: string, sourceId: string) {

    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL as string, {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY as string)
    })

    await createTenantOrCollectionIfNotExists(client, "Documents", organizationId)

    const collection = client.collections.get("Documents").withTenant(organizationId)

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    const embedding = await openai.embeddings.create({
        input: text,
        model: "text-embedding-3-small"
    })

    const result = await collection.data.insert({
        properties: {
            source: sourceId
        },
        vectors: embedding.data[0].embedding,
    })

    return result

}

export async function queryVectorDB(text: string, organizationId: string, sourceId: string | null = null) {
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL as string, {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY as string)
    })

    await createTenantOrCollectionIfNotExists(client, "Documents", organizationId)

    const collection = client.collections.get("Documents").withTenant(organizationId)

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    const embedding = await openai.embeddings.create({
        input: text,
        model: "text-embedding-3-small"
    })

    const result = await collection.query.nearVector(embedding.data[0].embedding, {
        limit: 1,
        filters: sourceId ? {
            target: {
                property: "source"
            },
            operator: "Equal",
            value: sourceId
        } : undefined
    })

    return result.objects.length > 0 ? result.objects[0].uuid : ""
}


export async function deleteVectorIndex(indexId: string, organizationId: string) {
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(process.env.WEAVIATE_URL as string, {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY as string)
    })

    await createTenantOrCollectionIfNotExists(client, "Documents", organizationId)

    const collection = client.collections.get("Documents").withTenant(organizationId)

    await collection.data.deleteById(indexId)

    return
}
