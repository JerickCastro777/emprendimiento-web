// lib/cloudinary.ts
export async function uploadImageToCloudinary(file: File, cloudName: string, uploadPreset: string) {
  // file -> FormData upload to Cloudinary unsigned
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Cloudinary upload failed: " + txt);
  }

  const data = await res.json();
  // secure_url es lo que queremos guardar
  return data.secure_url as string;
}
