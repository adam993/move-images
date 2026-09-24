/**
 * Gives the event loop one turn so the page can repaint progress and handle input during a long export.
 * A MessageChannel message is used rather than setTimeout, which background tabs throttle to 1 s.
 */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      resolve()
    }
    channel.port2.postMessage(null)
  })
}
