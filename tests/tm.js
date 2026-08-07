import { supabase } from "../js/supabase.js";
import { showToast } from "../js/ui.js";

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
});

uploadBtn.addEventListener("click", async () => {

    if (!compressedFile) {
        showToast("Choose an image first.");
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

    showToast("Upload successful!");

});