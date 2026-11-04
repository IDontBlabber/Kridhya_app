// Sets the /admin login. Usage:  npm run admin:password -- "new password" [username]
// Writes the username and a SHA-256 hash of the password to .env.local (git-ignored). Only the hash reaches the
// browser bundle, never the password. For Vercel, copy the two VITE_ values into Project > Settings > Environment Variables.
import { createHash, randomInt } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const words = ['Lotus', 'Gold', 'Velvet', 'Pearl', 'Rose', 'Saree', 'Lumen', 'Amber']
const pick = () => words[randomInt(words.length)]
const password = process.argv[2] || `${pick()}-${pick()}-${randomInt(1000, 9999)}!`
const user = process.argv[3] || 'admin'
if (password.length < 8) {
  console.error('Use a password of at least 8 characters.')
  process.exit(1)
}
const hash = createHash('sha256').update(`kridhya-admin:${password}`).digest('hex')
writeFileSync(
  '.env.local',
  `# Kridhya admin portal login - this file is git-ignored. Share the login with the client privately.
# Username: ${user}
# Password: ${password}
# Change it with:  npm run admin:password -- "new password"   then restart npm run dev.
# Vercel: add the two keys below under Project > Settings > Environment Variables, then redeploy.
VITE_ADMIN_USER=${user}
VITE_ADMIN_PASSWORD_HASH=${hash}
`,
)
console.log(`Admin login saved to .env.local (username: ${user}). Restart the dev server to use it.`)
