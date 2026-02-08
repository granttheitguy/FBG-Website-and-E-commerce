import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    debug: process.env.NODE_ENV !== "production",
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user) {
                    return null
                }

                // Check if user is suspended
                if (user.status === "SUSPENDED") {
                    throw new Error("Account suspended. Please contact support.")
                }

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    return null
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() }
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                }
            }
        })
    ],
})
