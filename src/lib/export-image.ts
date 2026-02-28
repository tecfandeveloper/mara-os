/**
 * Client-side export of an HTML element to PNG.
 * Use in "use client" components only; call the returned function in response to user action.
 */
export async function exportElementAsPng(
  element: HTMLElement | null,
  filename: string = "export.png"
): Promise<void> {
  if (!element) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 2,
    backgroundColor: null,
    logging: false,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = filename.replace(/\.png$/i, "") + ".png";
  link.href = dataUrl;
  link.click();
}
