/** "Omar Saleh" → "Omar", as in "Replying to Omar". */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** The avatar shows the first letter of the name, as in the design ("O", "ع"). */
export const avatarLetter = (name: string) => (Array.from(name.trim())[0] ?? '?').toLocaleUpperCase();
