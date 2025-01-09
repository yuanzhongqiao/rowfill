import { redirect } from "next/navigation"
import { checkAuth } from "./console/actions"

export default async function HomePage() {

  const auth = await checkAuth()

  if (auth) {
    redirect('/console')
  }

  if (!auth) {
    redirect('/auth/login')
  }
}
