'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { smtpSettingsSchema } from "@/lib/validation-schemas"
import { saveSmtpSettings, testSmtpConnection } from "../actions"
import { z } from "zod"
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
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react"

type SmtpSettingsFormProps = {
    initialSettings?: z.infer<typeof smtpSettingsSchema> | null
}

export function SmtpSettingsForm({ initialSettings }: SmtpSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<z.infer<typeof smtpSettingsSchema>>({
        resolver: zodResolver(smtpSettingsSchema) as any,
        defaultValues: initialSettings || {
            host: "",
            port: 587,
            encryption: "tls",
            username: "",
            password: "",
            fromName: "Fashion by Grant",
            fromEmail: "",
            replyToEmail: "",
        }
    })

    const onSubmit = async (data: z.infer<typeof smtpSettingsSchema>) => {
        setIsLoading(true)
        setMessage(null)

        try {
            const result = await saveSmtpSettings(data)
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: "Settings saved successfully" })
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Something went wrong" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleTestConnection = async () => {
        setIsTesting(true)
        setMessage(null)

        try {
            const result = await testSmtpConnection()
            if (result.error) {
                setMessage({ type: 'error', text: `Test failed: ${result.error}` })
            } else {
                setMessage({ type: 'success', text: "Test email sent successfully! Check your inbox." })
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Test failed unexpectedly" })
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input id="host" placeholder="smtp.example.com" {...register("host")} />
                        {errors.host && <p className="text-sm text-red-500">{errors.host.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input id="port" type="number" placeholder="587" {...register("port")} />
                        {errors.port && <p className="text-sm text-red-500">{errors.port.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="encryption">Encryption</Label>
                        <Select
                            defaultValue={initialSettings?.encryption || "tls"}
                            onValueChange={(val) => setValue("encryption", val as "none" | "ssl" | "tls")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select encryption" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                                <SelectItem value="tls">TLS (Port 587)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.encryption && <p className="text-sm text-red-500">{errors.encryption.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" {...register("username")} />
                        {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>
                </div>

                <div className="border-t border-obsidian-200 pt-6">
                    <h3 className="text-lg font-medium text-obsidian-900 mb-4">Sender Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fromName">From Name</Label>
                            <Input id="fromName" placeholder="Fashion by Grant" {...register("fromName")} />
                            {errors.fromName && <p className="text-sm text-red-500">{errors.fromName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fromEmail">From Email</Label>
                            <Input id="fromEmail" type="email" placeholder="noreply@fashionbygrant.com" {...register("fromEmail")} />
                            {errors.fromEmail && <p className="text-sm text-red-500">{errors.fromEmail.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
                            <Input id="replyToEmail" type="email" placeholder="support@fashionbygrant.com" {...register("replyToEmail")} />
                            {errors.replyToEmail && <p className="text-sm text-red-500">{errors.replyToEmail.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || isLoading}
                    >
                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Test SMTP Connection
                    </Button>

                    <Button type="submit" disabled={isLoading || isTesting} className="bg-obsidian-900 hover:bg-obsidian-800">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
