// Privacy-safe usage events (brief: "anonymous diagnostics, issue frequency").
// Events carry counts, field ids and categories only: never answers, messages or names.
// Nothing is sent anywhere until a sink is registered, e.g. on the real site:
//   onTrack((e) => navigator.sendBeacon('/copilot-metrics', JSON.stringify(e)))

const sinks = new Set()

export function onTrack(sink) {
  sinks.add(sink)
  return () => sinks.delete(sink)
}

export function track(event) {
  const stamped = { ...event, at: new Date().toISOString() }
  for (const sink of sinks) {
    try { sink(stamped) } catch { /* a broken sink must never break the form */ }
  }
}
