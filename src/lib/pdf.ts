import axios from "axios"
import { Poppler } from "node-poppler"
import fs from "fs"
import { getPresignedUrlForUpload } from "./file"

export async function convertPdfToImages(path: string, filename: string): Promise<Array<string>> {

    const images: Array<string> = []

    const res = await axios.get(path, { responseType: "arraybuffer" })

    const poppler = new Poppler()

    const info = await poppler.pdfInfo(res.data)

    let infoObj: any = {}

    for (const line of info.toString().split("\n")) {
        const lineArr = line.split(":")
        infoObj[lineArr[0].toString().trim()] = lineArr[1].toString().trim()
    }

    let pages: number = 0
    pages = parseInt(infoObj.Pages)

    for (let i = 1; i <= pages; i++) {
        await poppler.pdfToCairo(res.data, filename, {
            firstPageToConvert: i,
            lastPageToConvert: i,
            pngFile: true
        })

        const imgFile = fs.readFileSync(i > 9 ? `${filename}-${i}.png` : `${filename}-0${i}.png`)
        const uploadPageFile = await getPresignedUrlForUpload(`${filename}-${i}.png`)
        const instance = axios.create()
        await instance.put(uploadPageFile.url, imgFile)
        images.push(uploadPageFile.filename)
        fs.unlinkSync(i > 9 ? `${filename}-${i}.png` : `${filename}-0${i}.png`)
    }

    return images

}
