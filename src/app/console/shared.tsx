import { create } from "zustand"

export const useSheetStore = create<{
    dueForRefresh: string,
    setDueForRefresh: (slug: string) => void
}>((set) => ({
    dueForRefresh: "",
    setDueForRefresh: (slug: string) => set({ dueForRefresh: slug })
}))
