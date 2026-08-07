import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";
import { load } from "./storage.js";

// Render the image management panel inside the edit view.
// Displays each photo along with cover/delete actions.
export function renderEditImages(v){
    const container = document.querySelector("#edit-images");
    if(!container) return;

    if(!v.images || v.images.length === 0){
        container.innerHTML = `
            <p style="color:var(--text-muted);">
                Zithunzi sizinayikedwe.
            </p>
        `;
        return;
    }

    container.innerHTML = `
        <h4 style="margin-bottom:10px;">
            Zinthunzi (${v.images.length}/5)
        </h4>
        <div class="edit-photo-grid">
        ${v.images.map(img => `
            <div class="edit-photo">
                <img src="${img.image_url}" alt="">
            <div class="edit-photo-actions">
                ${
                    img.is_cover
                    ? `<span class="cover-badge">⭐ Cover</span>`
                    : `<button
                            type="button"
                            onclick="setCoverImage('${img.id}')">
                            ikhale Cover?
                    </button>`
                }
                <button
                    type="button"
                    onclick="removeBusinessImage('${img.id}')">
                    Chotsani
                </button>
            </div>
            </div>
        `).join("")}
        </div>
    `;
}

export async function removeBusinessImage(imageId){
    if(!(await showConfirmModal({
    title: "Chichotsedwe?",
    message: "Chithunzichi chichotsedwa.",
    confirmText: "Delete"
    }))){
        return;
    }

    showLoader("Chithunzi chznu chikuchotsedwa...");

    try {
        const vendorId = document.querySelector("#edit-id").value;
        const { count, error: countError } = await supabase
            .from("business_images")
            .select("*", { count: "exact", head: true })
            .eq("business_id", vendorId);

        if (countError) throw countError;

        if (count <= 1) {
            showToast("Business yikuyenera kukhala ndi chithunzi.");
            hideLoader();
            return;
        }

        // Retrieve the selected image record so we can remove its storage file.
        const { data:image, error:fetchError } = await supabase
            .from("business_images")
            .select("image_url, is_cover")
            .eq("id", imageId)
            .single();

        if(fetchError) throw fetchError;

        // Remove the file from Supabase storage.
        const path = new URL(image.image_url)
            .pathname
            .split("/business-images/")[1];

        const { error:storageError } = await supabase.storage
            .from("business-images")
            .remove([path]);

        if(storageError) throw storageError;

        // Remove the image row in the database.
        const { error:deleteError } = await supabase
            .from("business_images")
            .delete()
            .eq("id", imageId);

        if(deleteError) throw deleteError;

        // If the image being deleted was the cover photo, choose a new cover.
        if (image.is_cover) {
            const { data: remainingImages, error:remainingError } = await supabase
                .from("business_images")
                .select("id")
                .eq("business_id", vendorId)
                .order("created_at", { ascending: true });

            if (remainingError) throw remainingError;

            if (remainingImages.length > 0) {
                const { error:coverError } = await supabase
                    .from("business_images")
                    .update({ is_cover: true })
                    .eq("id", remainingImages[0].id);

                if (coverError) throw coverError;
            }
        }

        await load();

        const updatedVendor = state.vendors.find(
            v => v.id === vendorId
        );

        if(updatedVendor){
            renderEditImages(updatedVendor);
        }

        showToast("Chithunzi chija chachotsedwa.");
    } catch(err){
        console.error("Delete image error:", err);
        showToast("Takanika kukuchotserani chithunzichi.");
    }

    hideLoader();
}

export async function handleEditPhotos(input){

    const files = [...input.files];

    if(!files.length) return;


    const id = document.querySelector("#edit-id").value;

    const vendor = state.vendors.find(
        v => v.id === id
    );


    if(!vendor) return;


    const currentCount = vendor.images?.length || 0;


    if(currentCount + files.length > 5){

        showToast(
            `Malire azithunzi zomwe mungayike ndi 5`
        );

        input.value = "";
        return;

    }


    showLoader("Zithunzi zanu zikuyikidwa...");


    try{


        for(let i=0;i<files.length;i++){

            const compressed = await imageCompression(
                files[i],
                {
                    maxSizeMB:0.3,
                    maxWidthOrHeight:1280,
                    useWebWorker:true,
                    initialQuality:0.8
                }
            );


            const ext = compressed.name.split(".").pop() || "jpg";


            const path =
                `${id}/${crypto.randomUUID()}.${ext}`;


            const {error:uploadError} =
                await supabase.storage
                .from("business-images")
                .upload(path, compressed);



            if(uploadError)
                throw uploadError;



            const {data:urlData} =
                supabase.storage
                .from("business-images")
                .getPublicUrl(path);



            const {error:dbError} =
                await supabase
                .from("business_images")
                .insert({

                    business_id:id,

                    image_url:urlData.publicUrl

                });



            if(dbError)
                throw dbError;

        }

        await load();

        const updatedVendor =
            state.vendors.find(
                v=>v.id===id
            );

        renderEditImages(updatedVendor);
        showToast("Zithunzi zayikidwa.");
        input.value="";
    }
    catch(err){

        console.error(err);
        showToast("Zinthunzi zakanika kuyikidwa");

    }
    hideLoader();
}

// Set a new cover photo for the listing by clearing the current cover flag
// and marking the selected image as the new cover.
export async function setCoverImage(imageId){
    showLoader("Cover yanu yikusinthidwa...");

    try{
        const businessId = document.querySelector("#edit-id").value;

        // Clear the old cover photo flag for all images of this business.
        await supabase
            .from("business_images")
            .update({
                is_cover:false
            })
            .eq("business_id", businessId);

        // Mark the chosen image row as the new cover.
        const { error } = await supabase
            .from("business_images")
            .update({
                is_cover:true
            })
            .eq("id", imageId);

        if(error) throw error;

        await load();
        const vendor = state.vendors.find(v => v.id === businessId);
        renderEditImages(vendor);
        showToast("Cover updated");
    } catch(err){
        console.error(err);
        showToast("Takanika kusintha cover ya business yanu");
    }

    hideLoader();
}
