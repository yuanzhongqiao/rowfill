import axios from "axios"
import { Poppler } from "node-poppler"
import fs from "fs"
import { getPresignedUrlForUpload } from "./file"
import { logger } from "./logger"

function getPDFPageImagePath(baseFilename: string, pageNum: number) {
    const patterns = [
        `${baseFilename}-${pageNum}.png`,
        `${baseFilename}-0${pageNum}.png`
    ];

    for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
            return pattern
        }
    }

    throw new Error(`Could not find page ${pageNum} with any known filename pattern`);
}


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
            pngFile: true,
        })

        const path = getPDFPageImagePath(filename, i)
        const imgFile = fs.readFileSync(path)
        const uploadPageFile = await getPresignedUrlForUpload(`${filename}-${i}.png`)
        const instance = axios.create()
        await instance.put(uploadPageFile.url, imgFile)
        images.push(uploadPageFile.filename)
        fs.unlinkSync(path)
    }

    return images

}
