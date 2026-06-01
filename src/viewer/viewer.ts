import mammoth from "mammoth";

const input = document.querySelector("input");

input?.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (!file) return;

  const buffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({
    arrayBuffer: buffer,
  });

  document.getElementById("content")!.innerHTML =
    result.value;
});