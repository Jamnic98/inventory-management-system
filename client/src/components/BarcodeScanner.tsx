import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: string) => void
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'html5-qrcode-reader'

  useEffect(() => {
    let isMounted = true
    const html5Qrcode = new Html5Qrcode(elementId)
    scannerRef.current = html5Qrcode

    const forceStopCameraTracks = () => {
      const container = document.getElementById(elementId)
      const videoElem = container?.querySelector('video') as HTMLVideoElement | null
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
          track.enabled = false
        })
        videoElem.srcObject = null
      }
    }

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            // Match this to the container's aspect ratio (16/9 here)
            // so the library doesn't size the video taller/wider than
            // what's actually visible.
            aspectRatio: 1.7777778,
          },
          (decodedText) => {
            if (isMounted) onScanSuccess(decodedText)
          },
          (errorMessage) => {
            if (isMounted && onScanFailure) onScanFailure(errorMessage)
          }
        )

        // Once the video element exists, force it to fill/crop correctly
        // regardless of its native resolution.
        const container = document.getElementById(elementId)
        const videoElem = container?.querySelector('video') as HTMLVideoElement | null
        if (videoElem) {
          videoElem.style.width = '100%'
          videoElem.style.height = '100%'
          videoElem.style.objectFit = 'cover'
          videoElem.style.position = 'absolute'
          videoElem.style.inset = '0'
        }

        if (!isMounted) {
          forceStopCameraTracks()
          if (html5Qrcode.isScanning) {
            await html5Qrcode.stop()
          }
          html5Qrcode.clear()
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to start scanner:', error)
        }
      }
    }

    startScanner()

    return () => {
      isMounted = false
      forceStopCameraTracks()
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current
              .stop()
              .then(() => scannerRef.current?.clear())
              .catch((error) => console.error('Error stopping html5Qrcode:', error))
          } else {
            scannerRef.current.clear()
          }
        } catch (e) {
          // Ignore DOM cleanup errors if element already removed
        }
      }
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-lg bg-black relative aspect-video w-full">
      <div
        id={elementId}
        className="absolute inset-0 w-full h-full [&_video]:absolute! [&_video]:inset-0! [&_video]:w-full! [&_video]:h-full! [&_video]:object-cover!"
      />
    </div>
  )
}
