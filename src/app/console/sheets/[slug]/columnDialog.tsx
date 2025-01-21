"use client"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PiFloppyDisk, PiSpinner } from "react-icons/pi"
import { addColumnToSheet, updateColumnToSheet } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { SheetColumn } from "@prisma/client"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    instruction: z.string().min(1, "Instruction is required"),
    taskType: z.enum(["GENERATION", "EXTRACTION", "CLASSIFICATION", "OTHERS"]),
    dataType: z.enum(["TEXT", "NUMBER", "DATE", "TIME", "BOOLEAN", "LIST", "OBJECT"]),
    defaultValue: z.string().default("N/A"),
})

export default function ColumnDialog({ open, defaultData, sheetId, onSubmit }: { open: boolean, defaultData: SheetColumn | null, sheetId: string, onSubmit: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            defaultValue: "N/A",
        },
    })

    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const handleOnSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            if (defaultData) {
                await updateColumnToSheet(sheetId, defaultData.id, data.name, data.instruction, data.taskType, data.dataType, data.defaultValue)
            } else {
                await addColumnToSheet(sheetId, data.name, data.instruction, data.taskType, data.dataType, data.defaultValue)
            }
            form.reset()
            onSubmit()
            toast({
                title: "Column Saved",
                description: "The column has been saved to the sheet",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while saving the column",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        form.reset()
        if (open && defaultData) {
            form.setValue("name", defaultData.name)
            form.setValue("instruction", defaultData.instruction)
            form.setValue("taskType", defaultData.taskType)
            form.setValue("dataType", defaultData.dataType)
            form.setValue("defaultValue", defaultData.defaultValue)
        }
    }, [open, defaultData])

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{defaultData ? "Edit" : "Add"} Column</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleOnSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter column name" {...field} />
                                </FormControl>
                                <FormDescription>
                                    The name of your column that will be displayed in the sheet
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instruction"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instruction</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter instructions for AI"
                                        rows={5}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Instructions for AI on how to generate or extract this column's data
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taskType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Task Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a task type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="GENERATION">Generation</SelectItem>
                                        <SelectItem value="EXTRACTION">Extraction</SelectItem>
                                        <SelectItem value="CLASSIFICATION">Classification</SelectItem>
                                        <SelectItem value="OTHERS">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    The type of AI task for this column
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dataType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a data type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                        <SelectItem value="DATE">Date</SelectItem>
                                        <SelectItem value="TIME">Time</SelectItem>
                                        <SelectItem value="BOOLEAN">Boolean</SelectItem>
                                        <SelectItem value="LIST">List</SelectItem>
                                        <SelectItem value="OBJECT">Object</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    The expected data type for this column's values
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Default Value</FormLabel>
                                <FormControl>
                                    <Input placeholder="Default value when empty" {...field} />
                                </FormControl>
                                <FormDescription>
                                    The value to use when no data is available
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? <PiSpinner className="animate-spin" /> : <PiFloppyDisk />} {loading ? "Saving" : "Save"} Column</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    )
}
