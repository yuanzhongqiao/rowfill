import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { PiFile, PiImage, PiMagnifyingGlassBold, PiPaperPlaneTilt, PiRobotFill, PiSpinner, PiUserCircleFill } from "react-icons/pi";
import { sendMessageToSearch } from "./actions";
import ReactMarkdown from "react-markdown"
import { produce } from "immer"
import Image from "next/image";
import { stripCodeBlockBackTicks } from "@/lib/utils";

export default function SearchDialog({ open }: { open: boolean }) {

    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: any }>>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const handleSendMessage = async () => {
        try {
            setSending(true)
            setMessage("")
            setMessages(produce((draft) => {
                draft.push({
                    role: "user",
                    content: message
                })
            }))
            const response = await sendMessageToSearch(
                messages.map(m => ({
                    role: m.role,
                    content: m.role === "user" ? m.content : m.content.answer
                })),
                message
            )
            setMessages(produce((draft) => {
                draft.push({
                    role: "assistant",
                    content: response
                })
            }))
        } catch (err) {
            console.log(err)
            setMessages(produce((draft) => {
                draft.push({
                    role: "assistant",
                    content: {
                        answer: "There was some error with the server. Please try again later.",
                        sources: []
                    }
                })
            }))
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    useEffect(() => {
        setMessages([])
        setMessage("")
    }, [open])

    return (
        <DialogContent className="max-w-[60vw]">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-start gap-2"><PiMagnifyingGlassBold /> Search in documents</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px] pl-3 pr-5">
                {messages.map((message, index) => (
                    <div className={`pb-5 flex flex-col gap-2 mt-5 border-b-[1px] border-zinc-200`} key={`msg-${index}`}>
                        {message.role === "user" ? (
                            <div className="flex items-center font-bold gap-2">
                                <PiUserCircleFill className="text-lg" />
                                User
                            </div>
                        ) : (
                            <div className="flex items-center font-bold gap-2">
                                <PiRobotFill className="text-lg" />
                                Assistant
                            </div>
                        )}
                        {message.role === "user" && <div className="mdc"><ReactMarkdown>{message.content}</ReactMarkdown></div>}
                        {message.role === "assistant" &&
                            <div>
                                <div className="mdc">
                                    <ReactMarkdown>{message.content.answer}</ReactMarkdown>
                                </div>
                                <div className="flex gap-2">
                                    {message.content.sources.map((source: any, index: number) => (
                                        <div key={`source-${index}`} className="flex gap-2">
                                            <button
                                                className="flex items-center gap-1 mt-2 w-[150px] px-3 py-1 hover:bg-zinc-200 text-gray-600 rounded-full border-[1px] border-zinc-300 p-2"
                                                onClick={() => window.open(source.url)}
                                            >
                                                <PiFile className="text-sm" />
                                                <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap w-[140px]">{source.title}</span>
                                            </button>
                                            {source.referenceImage &&
                                                <Dialog>
                                                    <DialogTrigger>
                                                        <button
                                                            className="flex items-center gap-1 mt-2 w-[150px] px-3 py-1 hover:bg-zinc-200 text-gray-600 rounded-full border-[1px] border-zinc-300 p-2"
                                                        >
                                                            <PiImage className="text-sm" />
                                                            <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap w-[140px]">View Reference Image</span>
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Reference Image</DialogTitle>
                                                        </DialogHeader>
                                                        <Image src={source.referenceImage} alt="Reference Image" width={500} height={500} />
                                                    </DialogContent>
                                                </Dialog>
                                            }
                                            {source.referenceText && <Dialog>
                                                <DialogTrigger>
                                                    <button className="flex items-center gap-1 mt-2 w-[150px] px-3 py-1 hover:bg-zinc-200 text-gray-600 rounded-full border-[1px] border-zinc-300 p-2">
                                                        <PiFile className="text-sm" />
                                                        <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap w-[140px]">View Reference Text</span>
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-[600px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Reference Text</DialogTitle>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[400px] pr-5">
                                                        <div className="mdc">
                                                            <ReactMarkdown>{stripCodeBlockBackTicks(source.referenceText || "No reference text")}</ReactMarkdown>
                                                        </div>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                    </div>
                ))}
                <div ref={messagesEndRef} />
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
                        disabled={sending}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-zinc-50 p-3 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Enter your message here"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={sending}>
                        {sending ? <PiSpinner className="text-xl animate-spin" /> : <PiPaperPlaneTilt className="text-xl" />}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}
