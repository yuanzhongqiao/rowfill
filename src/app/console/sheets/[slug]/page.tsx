"use client"

import { Sheet as SheetType, SheetColumn, SheetColumnValue, SheetSource, Source } from "@prisma/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { deleteColumnFromSheet, deleteSheet, fetchSheet, runColumnSourceTask, updateSheetName } from "./actions"
import { PiArrowUpRight, PiDownload, PiList, PiListBold, PiPencil, PiPlay, PiPlayFill, PiPlus, PiSpinner, PiTrash, PiWarning } from "react-icons/pi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import SourcesDialog from "./sourcesDialog"
import { useSheetStore } from "../../shared"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ColumnDialog from "./columnDialog"
import { useToast } from "@/hooks/use-toast"
import { SheetContent, SheetHeader, SheetTitle, SheetTrigger, Sheet } from "@/components/ui/sheet"
import { produce } from "immer"
import { Alert } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import SourceIndexComponent from "./sourceIndex"

export default function SheetPage() {
    const { slug } = useParams()
    const [sheet, setSheet] = useState<SheetType | null>(null)
    const [sources, setSources] = useState<(SheetSource & { source: Source })[]>([])
    const [columns, setColumns] = useState<SheetColumn[]>([])
    const [columnValues, setColumnValues] = useState<{ [key: string]: SheetColumnValue }>({})
    const [nameEdit, setNameEdit] = useState(false)
    const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false)
    const [columnDialogOpen, setColumnDialogOpen] = useState(false)
    const { setDueForRefresh } = useSheetStore()
    const [columnDialogData, setColumnDialogData] = useState<SheetColumn | null>(null)
    const router = useRouter()
    const { toast } = useToast()
    const [runAlert, setRunAlert] = useState({ open: false, count: 0, done: 0 })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        if (slug && typeof slug === 'string') {
            try {
                const data = await fetchSheet(slug)
                setSheet(data.sheet)
                setSources(data.sources as (SheetSource & { source: Source })[])
                setColumns(data.columns)
                setColumnValues(data.columnValues)
            } catch (error) {
                console.error("Error fetching sheet data:", error)
            }
        }
    }

    if (!sheet) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center h-full w-full text-muted-foreground">
                <PiSpinner className="animate-spin text-2xl" />
            </div>
        )
    }

    const handleNameEdit = () => {
        if (sheet.name === "" || sheet.name.length < 3) {
            setSheet({ ...sheet, name: "Untitled" })
            updateSheetName(sheet.id, "Untitled")
        } else {
            updateSheetName(sheet.id, sheet.name)
        }
        setNameEdit(false)
        setDueForRefresh(sheet.id)
    }

    const handleDeleteColumn = async (columnId: string) => {
        try {
            await deleteColumnFromSheet(sheet.id, columnId)
            await fetchData()
            toast({
                title: "Column Deleted",
                description: "The column has been deleted from the sheet",
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "An error occurred while deleting the column",
                variant: "destructive",
            })
        }
    }


    const handleRunColumnSourceTask = async (columnId: string, sourceId: string) => {
        try {
            setColumnValues(produce((draft) => {
                draft[`${sourceId}_${columnId}`]["value"] = "Loading"
            }))
            const result = await runColumnSourceTask(sheet.id, columnId, sourceId)
            setColumnValues(produce((draft) => {
                draft[`${sourceId}_${columnId}`]["value"] = result.answer
                draft[`${sourceId}_${columnId}`]["sourceIndexId"] = result.sourceIndexId
            }))
            setRunAlert(produce((draft) => {
                draft.done += 1
            }))
        } catch (err) {
            setColumnValues(produce((draft) => {
                draft[`${sourceId}_${columnId}`]["value"] = "Error"
            }))
        }
    }

    const handleRunAll = async () => {
        try {
            // TODO: Run all columns concurrently
            const promises = []

            setRunAlert(produce((draft) => {
                draft.count = columns.length * sources.length
                draft.open = true
                draft.done = 0
            }))

            for (const column of columns) {
                for (const source of sources) {
                    promises.push(handleRunColumnSourceTask(column.id, source.id))
                }
            }

            await Promise.all(promises)
        } catch (err) {
            toast({
                title: "Error",
                description: "An error occurred while running the column",
                variant: "destructive",
            })
        } finally {
            setRunAlert(produce((draft) => {
                draft.open = false
                draft.done = 0
                draft.count = 0
            }))
        }
    }

    const handleRunColumn = async (columnId: string) => {
        try {
            // TODO: Run the columns concurrently
            const promises = []

            setRunAlert(produce((draft) => {
                draft.count = sources.length
                draft.open = true
                draft.done = 0
            }))
            for (const source of sources) {
                promises.push(handleRunColumnSourceTask(columnId, source.id))
            }
            await Promise.all(promises)

        } catch (err) {
            toast({
                title: "Error",
                description: "An error occurred while running the column",
                variant: "destructive",
            })
        } finally {
            setRunAlert(produce((draft) => {
                draft.open = false
                draft.done = 0
                draft.count = 0
            }))
        }
    }

    const handleDeleteSheet = async () => {
        await deleteSheet(sheet.id)
        router.push("/console")
        setDueForRefresh(sheet.id)
    }


    const handleExport = async () => {

    }

    return (
        <div className="h-full w-full" onClick={() => handleNameEdit()}>
            <div className="w-full border-b-[1px] border-gray-200 h-[50px] flex justify-between items-center px-2">
                <div>
                    {nameEdit ? (
                        <Input
                            className="w-[250px]"
                            placeholder="Enter a name"
                            value={sheet.name}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSheet({ ...sheet, name: e.target.value })}
                        />
                    ) : (
                        <p onDoubleClick={() => setNameEdit(true)} className="text-gray-700 font-medium">
                            {sheet.name}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRunAll}>
                        <PiPlay />
                        Run All
                    </Button>
                    <Button>
                        <PiDownload />
                        Export as CSV
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <PiList />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDeleteSheet}>
                                <PiTrash /> Delete Sheet
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="border-r-[1px] bg-gray-100 border-gray-200">Source</TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.id} className="border-r-[1px] border-gray-200">
                                <div className="flex items-center justify-between">
                                    {column.name}
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleRunColumn(column.id)} className="hover:bg-gray-200 bg-gray-100 rounded p-2"><PiPlayFill className="text-green-600" /></button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="hover:bg-gray-200 bg-gray-100 rounded p-2"><PiListBold className="text-black" /></button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => { setColumnDialogData(column); setColumnDialogOpen(true) }}>
                                                    <PiPencil /> Edit Column
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteColumn(column.id)}>
                                                    <PiTrash className="text-red-500" /> Delete Column
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="bg-gray-100">
                            <button onClick={() => setColumnDialogOpen(true)} className="flex items-center gap-2 hover:underline">
                                <PiPlus />Add Column
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sources.map((source) => (
                        <TableRow key={source.id}>
                            <TableCell className="border-r-[1px] border-gray-200 bg-gray-50">{source.source.nickName}</TableCell>
                            {columns.map((column) => {

                                const columnValue = columnValues[`${source.id}_${column.id}`]

                                return (
                                    <TableCell className="border-r-[1px] border-gray-200" key={`${source.id}_${column.id}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {columnValue.value === "Loading" && <PiSpinner className="animate-spin" />}
                                                {columnValue.value === "Error" && <PiWarning className="text-red-500" />}
                                                {columnValue.value || "N/A"}
                                            </div>
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <button disabled={columnValue.value === "Loading" || !columnValue.value} className="hover:bg-gray-200 bg-gray-100 rounded p-2">
                                                        <PiArrowUpRight className="text-black" />
                                                    </button>
                                                </SheetTrigger>
                                                <SheetContent>
                                                    <SheetHeader>
                                                        <SheetTitle>Column Value</SheetTitle>
                                                    </SheetHeader>
                                                    <div className="mt-4 space-y-4">
                                                        <div className="p-4 rounded-lg border">
                                                            <h2 className="font-bold">Answer</h2>
                                                            <p>{columnValues[`${source.id}_${column.id}`].value}</p>
                                                        </div>
                                                        <Separator />
                                                        {columnValue.sourceIndexId && <SourceIndexComponent sourceIndexId={columnValue.sourceIndexId} />}
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </TableCell>
                                )
                            })}
                            <TableCell className="bg-gray-50 text-gray-500 hover:underline">
                                <button onClick={() => setColumnDialogOpen(true)} className="flex items-center gap-2">
                                    <PiPlus />
                                    Add Column
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell className="bg-gray-100 border-r-[1px] border-gray-200">
                            <Dialog open={sourcesDialogOpen} onOpenChange={setSourcesDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="flex items-center gap-2 hover:underline">
                                        <PiPlus />
                                        Add Source
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <SourcesDialog sheetId={sheet.id} onAdd={() => { fetchData(); setSourcesDialogOpen(false) }} />
                                </DialogContent>
                            </Dialog>
                        </TableCell>
                        <TableCell colSpan={columns.length + 1} className="bg-gray-50"></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Dialog open={columnDialogOpen} onOpenChange={(open) => { setColumnDialogOpen(open); setColumnDialogData(null) }}>
                <ColumnDialog open={columnDialogOpen} defaultData={columnDialogData} sheetId={sheet.id} onSubmit={() => { fetchData(); setColumnDialogOpen(false); setColumnDialogData(null) }} />
            </Dialog>
            {runAlert.open && <div className="fixed bottom-5 right-5">
                <Alert className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <PiSpinner className="animate-spin text-lg" />
                        <h2 className="font-bold">Running Rows {runAlert.done} of {runAlert.count}</h2>
                    </div>
                    <p>Please wait while we process the rows. Don't close this window.</p>
                </Alert>
            </div>}
        </div>
    )
}
