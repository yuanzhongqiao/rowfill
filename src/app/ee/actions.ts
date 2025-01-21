"use server"

export async function checkEE() {
    if (process.env.EE_ENABLED && process.env.EE_ENABLED === "false") {
        return false
    }
    return true
}

