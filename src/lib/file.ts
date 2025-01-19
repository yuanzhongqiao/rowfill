import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getUniqueFileName } from "./filename"

export async function getPresignedUrlForUpload(filename: string) {
    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string
        },
        region: "us-east-1",
        endpoint: process.env.AWS_S3_ENDPOINT_URL,
        apiVersion: "v4"
    })

    filename = getUniqueFileName(filename)

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME,
        Key: filename,
        ContentType: "application/octet-stream"
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return { filename: filename, url: url }

}

export async function getPresignedUrlForGet(filename: string) {
    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string
        },
        region: "us-east-1",
        endpoint: process.env.AWS_S3_ENDPOINT_URL,
        apiVersion: "v4"
    });

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME,
        Key: filename,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return {
        filename: filename,
        url: url
    }

}