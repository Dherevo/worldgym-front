import { BarcodeScanner, BarcodeFormat } from "@capacitor-mlkit/barcode-scanning";
import { isApp } from "@/modules/platform";

// Barcode scanner with the phone camera (Google ML Kit). It uses Google's own scanner screen, so the app needs no
// camera permission. Only works in the installed app: in the browser it is never offered.

const FORMATS = [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE];

export type ScanResult =
    | { status: 'ok'; code: string }
    | { status: 'cancelled' }
    // Google's scanner module is not on the phone yet: it is being downloaded, try again in a moment
    | { status: 'installing' }
    | { status: 'error' };

export async function scanBarcode(): Promise<ScanResult> {
    if (!isApp) return { status: 'error' };

    try {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
            await BarcodeScanner.installGoogleBarcodeScannerModule();
            return { status: 'installing' };
        }

        const { barcodes } = await BarcodeScanner.scan({ formats: FORMATS });
        const code = barcodes?.[0]?.rawValue?.trim();
        return code ? { status: 'ok', code } : { status: 'cancelled' };
    } catch (e: any) {
        // Closing the scanner screen is not an error
        return /cancel/i.test(String(e?.message ?? e)) ? { status: 'cancelled' } : { status: 'error' };
    }
}
