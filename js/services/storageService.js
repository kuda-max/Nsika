import { supabase } from "../supabase.js";


// Upload all selected business photos to Supabase Storage.
// Returns an array of public image URLs.
export async function uploadBusinessPhotos(businessId, photos) {

    const photoUrls = [];

    for (let i = 0; i < photos.length; i++) {

        const file = photos[i];

        if (!file) continue;

        const ext = file.name.split(".").pop() || "jpg";

        const filename = `${crypto.randomUUID()}.${ext}`;

        const path = `${businessId}/${filename}`;


        const { error } = await supabase.storage
            .from("business-images")
            .upload(path, file);


        if (error) {

            console.error("Photo upload error:", error);

            throw error;

        }


        const { data } = supabase.storage
            .from("business-images")
            .getPublicUrl(path);


        photoUrls.push(data.publicUrl);

    }

    return photoUrls;

}

// Delete a single business image from Storage and the database.
export async function deleteBusinessImage(imageUrl) {

    const url = new URL(imageUrl);

    const path = decodeURIComponent(
        url.pathname.split("/business-images/")[1]
    );


    const { error: storageError } = await supabase.storage
        .from("business-images")
        .remove([path]);


    if (storageError) {
        throw storageError;
    }


    const { error: dbError } = await supabase
        .from("business_images")
        .delete()
        .eq("image_url", imageUrl);


    if (dbError) {
        throw dbError;
    }

}


// Delete every image belonging to a business.
export async function deleteBusinessImages(businessId) {

    // Get all image URLs for this business.
    const { data: images, error } = await supabase
        .from("business_images")
        .select("image_url")
        .eq("business_id", businessId);


    if (error) {
        throw error;
    }


    if (!images.length) {
        return;
    }


    // Convert public URLs into Storage paths.
    const paths = images.map(img => {

        const url = new URL(img.image_url);

        return decodeURIComponent(
            url.pathname.split("/business-images/")[1]
        );

    });


    // Delete the actual files from Storage.
    const { error: removeError } = await supabase.storage
        .from("business-images")
        .remove(paths);


    if (removeError) {
        throw removeError;
    }


    // Delete the database records.
    const { error: dbError, count } = await supabase
        .from("business_images")
        .delete({ count: "exact" })
        .eq("business_id", businessId);


    if (dbError) {
        throw dbError;
    }


    if (count !== images.length) {
        throw new Error(
            "Not all business image records were deleted."
        );
    }

}