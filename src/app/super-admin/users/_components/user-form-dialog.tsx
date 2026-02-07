'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUserSchema, updateUserSchema } from "@/lib/validation-schemas"
import { createUser, updateUser } from "../actions"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type UserFormDialogProps = {
    children?: React.ReactNode
    mode: 'create' | 'edit'
    role?: 'ADMIN' | 'STAFF'
    user?: {
        id: string
        name: string
        email: string
        status: 'ACTIVE' | 'SUSPENDED'
    }
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UserFormDialog({ children, mode, role, user, open, onOpenChange }: UserFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const formSchema = mode === 'create' ? createUserSchema : updateUserSchema
    type FormData = z.infer<typeof formSchema>

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema as any),
        defaultValues: mode === 'edit' && user ? {
            name: user.name,
            email: user.email,
            status: user.status,
        } : {
            name: "",
            email: "",
            password: "",
        }
    })

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
        if (!newOpen) {
            reset()
            setError("")
        }
    }

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        setError("")

        try {
            let result
            if (mode === 'create' && role) {
                result = await createUser(data as z.infer<typeof createUserSchema>, role)
            } else if (mode === 'edit' && user) {
                result = await updateUser(user.id, data as z.infer<typeof updateUserSchema>)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                handleOpenChange(false)
            }
        } catch (e) {
            setError("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? `Create ${role === 'ADMIN' ? 'Admin' : 'Staff'}` : 'Edit User'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? `Add a new ${role?.toLowerCase()} to the system.`
                            : "Make changes to the user's profile."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message as string}</p>
                        )}
                    </div>

                    {mode === 'create' && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password")} />
                            {(errors as any).password && (
                                <p className="text-sm text-red-500">{(errors as any).password.message as string}</p>
                            )}
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                defaultValue={user?.status}
                                onValueChange={(val) => setValue("status", val as "ACTIVE" | "SUSPENDED")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                            {(errors as any).status && (
                                <p className="text-sm text-red-500">{(errors as any).status.message as string}</p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? 'Create User' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
