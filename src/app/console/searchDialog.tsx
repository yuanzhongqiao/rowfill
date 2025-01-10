import { Button } from "@/components/ui/button";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { PiMagnifyingGlassBold, PiPaperPlaneTilt, PiSpinner } from "react-icons/pi";

export default function SearchDialog() {

    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: any }>>([])

    const handleSendMessage = () => {
        console.log(message)
    }

    return (
        <DialogContent className="max-w-[60vw]">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-start gap-2"><PiMagnifyingGlassBold /> Search in documents</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px]">
                {messages.length < 1 && <div className="text-sm flex items-center justify-center h-[500px] text-gray-600">No messages found</div>}
            </ScrollArea>
            <DialogFooter>
                <div className="flex items-end w-full p-3 bg-zinc-50">
                    <textarea
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-zinc-50 p-3 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Enter your message here"
                    />
                    <Button onClick={handleSendMessage} disabled={sending}>{sending ? <PiSpinner className="text-xl animate-spin" /> : <PiPaperPlaneTilt className="text-xl" />}</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}
