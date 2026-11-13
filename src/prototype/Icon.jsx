// Small line icons for the page sections (drawn inline, so no icon library or network request).
const PATHS = {
  building: <path d="M4 21V4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V21M14 9h5.5a.5.5 0 0 1 .5.5V21M2 21h20M7.5 8h3M7.5 12h3M7.5 16h3M17 13h0M17 17h0" />,
  store: <path d="M3.5 9 5 4h14l1.5 5M3.5 9h17M3.5 9a2.8 2.8 0 0 0 5.67 0 2.8 2.8 0 0 0 5.66 0 2.8 2.8 0 0 0 5.67 0M5 12v9h14v-9M10 21v-5h4v5" />,
  rocket: <path d="M12 15l-3-3a13 13 0 0 1 9.5-8.5c.3 0 .5.2.5.5A13 13 0 0 1 12 15ZM9 12H5l2.5-3.5H11M12 15v4l3.5-2.5V13M6.5 16.5C5 17 4.5 19.5 4.5 19.5S7 19 7.5 17.5" />,
  doc: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M9 13h6M9 17h6" />,
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5ZM9 13.5h6" />,
  calculator: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18.5h.01M12 18.5h3.5" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
}

export default function Icon({ name, size = 24, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}
