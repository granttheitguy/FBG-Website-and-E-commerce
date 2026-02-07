import crypto from 'crypto'

const IV_LENGTH = 16

function getKey(): string {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    return crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32)
}

export function encrypt(text: string): string {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
    const key = getKey()
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}
