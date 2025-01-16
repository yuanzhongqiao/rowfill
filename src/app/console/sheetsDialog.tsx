"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addSheet } from "./actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PiSpinner } from "react-icons/pi"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface AddSheetDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

// Add this schema definition
const sheetSchema = z.object({
    name: z.string()
        .min(3, "Sheet name must be at least 3 characters")
        .nonempty("Sheet name is required"),
    singleSource: z.boolean().default(false)
})

// Infer the type from the schema
type SheetFormValues = z.infer<typeof sheetSchema>

export function AddSheetDialog({ isOpen, onClose }: AddSheetDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const form = useForm<SheetFormValues>({
        defaultValues: {
            name: '',
            singleSource: false
        },
        resolver: zodResolver(sheetSchema)
    })
    const { toast } = useToast()

    const onSubmit = async (data: SheetFormValues) => {
        setIsSubmitting(true);
        try {
            await addSheet(data);
            onClose();
            form.reset();
        } catch (error) {
            toast({
                title: "Error adding sheet",
                description: "An error occurred while adding the sheet",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Sheet</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sheet Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sheet Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="singleSource"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Table Extraction</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Used for extracting tables from a single source.
                                            <div className="text-xs text-yellow-600">
                                                Note: This option cannot be changed later
                                            </div>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <PiSpinner className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Sheet'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
