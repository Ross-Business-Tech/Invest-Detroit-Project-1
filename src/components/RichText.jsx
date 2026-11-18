// Renders **bold**, __bold underline__ and [link text](https://…) inside translated text,
// so translators can move emphasis and links to wherever their language needs them.
const TOKEN = /(\*\*[^*]+\*\*|__[^_]+__|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g

export default function RichText({ text }) {
  return String(text).split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('__') && part.endsWith('__')) return <b key={i}><u>{part.slice(2, -2)}</u></b>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    return part
  })
}
