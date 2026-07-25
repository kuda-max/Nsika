import { supabase } from "../js/supabase.js";

const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");

let compressedFile = null;

input.addEventListener("change", async () => {

    const file = input.files[0];

    if (!file) return;

    compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.8
    });

    preview.src = URL.createObjectURL(compressedFile);

    console.log("Original:", (file.size / 1024).toFixed(1), "KB");
    console.log("Compressed:", (compressedFile.size / 1024).toFixed(1), "KB");

});

uploadBtn.addEventListener("click", async () => {

    if (!compressedFile) {
        alert("Choose an image first.");
        return;
    }

    const ext = compressedFile.name.split(".").pop() || "jpg";

    const path = `test/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
        .from("business-images")
        .upload(path, compressedFile);

    if (error) {
        console.error(error);
        return;
    }

    const { data } = supabase.storage
        .from("business-images")
        .getPublicUrl(path);

    console.log("Public URL:", data.publicUrl);

    alert("Upload successful!");

});