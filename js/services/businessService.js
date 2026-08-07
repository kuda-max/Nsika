
// Submit a new vendor listing. This function validates the current auth session,
// inserts the business into Supabase, uploads photos, and links uploaded images.
export async function submitVendor(event) {
    event.preventDefault();
    showLoader("business yanu ikulowetsedwa mmakina athu...");
    const form = event.target;

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        hideLoader();
        showToast("Mukuyenera kupanga login kuti muyike business yanu.");
        return;
    }

    const business = {
        owner_id: user.id,
        name: form.name.value,
        phone: form.phone.value,
        whatsapp: form.whatsapp.value || form.phone.value,
        category_id: form.category.value,
        description: form.description.value,
        latitude: state.location.lat,
        longitude: state.location.lng,
        address: state.location.address,
        town: state.location.town
    };

    const { data, error } = await supabase
        .from("businesses")
        .insert(business)
        .select()
        .single();

    if (error) {
        console.error("Business creation error:", error);
        hideLoader();
        showToast("Business yanu yakanika kuyikidwa chifukwa: " + error.message);
        return;
    }

    try {
        const photoUrls = await uploadBusinessPhotos(data.id);
        let imageRows = [];

        if (photoUrls.length > 0) {
            imageRows = photoUrls.map(url => ({
                business_id: data.id,
                image_url: url,
                is_cover: photoUrls.indexOf(url) === 0
            }));

            const { error: imageError } = await supabase
                .from("business_images")
                .insert(imageRows);

            if (imageError) {
                console.error("Image DB error:", imageError);
                showToast("Business yapangidwa,koma zithunzi zanu sizinaikidwe.");
            }
        }

        // Merge the new vendor into local state directly instead of a
        // full load() round-trip — makes it show up immediately.
        const newVendor = {
            id: String(data.id),
            ownerId: data.owner_id,
            name: data.name,
            phone: data.phone,
            whatsapp: data.whatsapp,
            category: data.category_id,
            categoryName: state.cats.find(c => c.id === data.category_id)?.name ?? "",
            address: data.address,
            town: data.town,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            photoUrls: photoUrls,
            images: imageRows.map((row, i) => ({ image_url: row.image_url, is_cover: i === 0 })),
            createdAt: new Date(data.created_at).getTime(),
            isActive: data.is_active
        };

        state.vendors.unshift(newVendor);

        hideLoader();
        showToast("Business yanu ili live tsopano!");
        confetti({
            particleCount: 60,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#B8623F', '#ffffff'] // match--primary + neutral
        });
        state.location = { lat: null, lng: null, address: "", town: "" };
        go("home");

        // New vendor lands first (state.vendors is createdAt-desc sorted
        // and we unshifted) — animate just that card in.
        requestAnimationFrame(() => {
            const firstCard = document.querySelector('#home-list .v-card');
            if(firstCard && firstCard.dataset.id === newVendor.id) animateCardIn(firstCard);
        });
    } catch (err) {
        console.error("Photo upload error:", err);
        hideLoader(); // was missing in the original — loader would hang forever on this path
        showToast("Business yayikidwa, koma zithunzi zanu zakanika.");
    }
}

//remove vendor account and all associated data
export async function deleteVendor(){

    const confirmed = await showConfirmModal({
        title: "Delete Account?",
        message: "Your account, vendor profile, listings and saved information will be permanently deleted. This action cannot be undone.",
        icon: "trash-2",
        danger: true,
        confirmText: "Delete"
    });

    if(!confirmed) return;

    try{

        const business = await getMyBusiness();

        if(business){
            await deleteBusinessImages(business.id);
            await deleteBusiness(business.id);
        }

        await deleteAuthUser();
        await clearDeletedAccount();

    }catch(err){
        console.error(err);
    }
}