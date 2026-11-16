'use client'

import dynamic from 'next/dynamic'

/* The intake is one long interaction with the browser — geolocation, a measured
   rail, pointer work. There is nothing to render on the server, so it mounts on
   the client and the shell's dark ground shows while it does. */
const App = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => <main className="shell" aria-busy="true" />,
})

export default function Page() {
  return <App />
}
