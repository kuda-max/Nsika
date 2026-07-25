import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";
import { load } from "./storage.js";

export function renderEditImages(v){

    const container = document.querySelector("#edit-images");

    if(!container) return;


    if(!v.images || v.images.length === 0){

        container.innerHTML = `
            <p style="color:var(--text-muted);">
                No photos uploaded yet.
            </p>
        `;

        return;
    }


    container.innerHTML = `

        <h4 style="margin-bottom:10px;">
            Photos
        </h4>

        <div class="edit-photo-grid">

        ${v.images.map(img => `

            <div class="edit-photo">

                <img src="${img.image_url}" alt="">

                <button
                    type="button"
                    onclick="removeBusinessImage('${img.id}')">
                    Delete
                </button>

            </div>

        `).join("")}

        </div>
    `;
}

export async function removeBusinessImage(imageId){

    if(!confirm("Delete this photo?")){
        return;
    }


    showLoader("Deleting photo...");


    try {


        const vendorId = document.querySelector("#edit-id").value;


        // Get image URL first

        const { data:image, error:fetchError } = await supabase
            .from("business_images")
            .select("image_url")
            .eq("id", imageId)
            .single();


        if(fetchError) throw fetchError;



        // Remove storage file

        const path = new URL(image.image_url)
            .pathname
            .split("/business-images/")[1];


        const { error:storageError } = await supabase.storage
            .from("business-images")
            .remove([path]);


        if(storageError) throw storageError;



        // Remove database row

const { error:deleteError } = await supabase
    .from("business_images")
    .delete()
    .eq("id", imageId);


console.log("DATABASE DELETE RESULT:", deleteError);


        if(deleteError) throw deleteError;



        await load();


        const updatedVendor = state.vendors.find(
            v => v.id === vendorId
        );


        if(updatedVendor){
            renderEditImages(updatedVendor);
        }


        showToast("Photo deleted");


    } catch(err){

        console.error("Delete image error:", err);
        showToast("Could not delete photo");

    }


    hideLoader();

}