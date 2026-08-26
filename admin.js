const adminDom = {
    loginView: document.getElementById("loginView"),
    dashboardView: document.getElementById("dashboardView"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginButton: document.getElementById("loginButton"),
    loginStatus: document.getElementById("loginStatus"),
    logoutButton: document.getElementById("logoutButton"),
    adminUser: document.getElementById("adminUser"),
    profileName: document.getElementById("profileName"),
    profileTagline: document.getElementById("profileTagline"),
    profileIntroduction: document.getElementById("profileIntroduction"),
    profileActiveTitle: document.getElementById("profileActiveTitle"),
    profileInactiveTitle: document.getElementById("profileInactiveTitle"),
    profileAvatarUrl: document.getElementById("profileAvatarUrl"),
    profileAvatarFile: document.getElementById("profileAvatarFile"),
    saveProfileButton: document.getElementById("saveProfileButton"),
    appearanceType: document.getElementById("appearanceType"),
    appearanceSolid: document.getElementById("appearanceSolid"),
    appearanceStart: document.getElementById("appearanceStart"),
    appearanceEnd: document.getElementById("appearanceEnd"),
    appearanceDirection: document.getElementById("appearanceDirection"),
    appearanceImageUrl: document.getElementById("appearanceImageUrl"),
    appearanceImageFile: document.getElementById("appearanceImageFile"),
    appearanceBlur: document.getElementById("appearanceBlur"),
    appearanceBlurValue: document.getElementById("appearanceBlurValue"),
    appearanceBrightness: document.getElementById("appearanceBrightness"),
    appearanceBrightnessValue: document.getElementById("appearanceBrightnessValue"),
    saveAppearanceButton: document.getElementById("saveAppearanceButton"),
    addCardButton: document.getElementById("addCardButton"),
    cardsEditor: document.getElementById("cardsEditor"),
    saveCardsButton: document.getElementById("saveCardsButton"),
    cardTemplate: document.getElementById("cardTemplate"),
    addGalleryButton: document.getElementById("addGalleryButton"),
    galleryEditor: document.getElementById("galleryEditor"),
    saveGalleryButton: document.getElementById("saveGalleryButton"),
    galleryTemplate: document.getElementById("galleryTemplate"),
    adminStatus: document.getElementById("adminStatus")
};

const LIMIT = 10 * 1024 * 1024;

document.addEventListener("DOMContentLoaded", async () => {
    bindAdminEvents();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) showDashboard(session.user);
});

function bindAdminEvents() {
    adminDom.loginButton.addEventListener("click", login);
    adminDom.logoutButton.addEventListener("click", logout);
    adminDom.saveProfileButton.addEventListener("click", saveProfile);
    adminDom.saveAppearanceButton.addEventListener("click", saveAppearance);
    adminDom.addCardButton.addEventListener("click", () => addCard({
        title: "", content: "", position: "center", display_style: "normal", group_id: "", sort_order: nextSort()
    }));
    adminDom.saveCardsButton.addEventListener("click", saveCards);
    adminDom.addGalleryButton.addEventListener("click", () => {
        if (adminDom.galleryEditor.children.length >= 5) {
            return setStatus("画廊最多只能显示 5 张图片。");
        }
        addGalleryItem({ name: "", description: "", map_name: "", image_url: "", sort_order: nextGallerySort() });
    });
    adminDom.saveGalleryButton.addEventListener("click", saveGallery);
    adminDom.appearanceBlur.addEventListener("input", updateRangeLabels);
    adminDom.appearanceBrightness.addEventListener("input", updateRangeLabels);
    adminDom.loginPassword.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
}

async function login() {
    setLoginStatus("正在登录…");
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: adminDom.loginEmail.value.trim(),
        password: adminDom.loginPassword.value
    });
    if (error) return setLoginStatus(`登录失败：${error.message}`);
    showDashboard(data.user);
}

async function logout() {
    await supabaseClient.auth.signOut();
    adminDom.dashboardView.hidden = true;
    adminDom.loginView.hidden = false;
    adminDom.loginPassword.value = "";
}

async function showDashboard(user) {
    adminDom.loginView.hidden = true;
    adminDom.dashboardView.hidden = false;
    adminDom.adminUser.textContent = user.email || "已登录";
    await loadAdminData();
}

async function loadAdminData() {
    setStatus("正在读取网站数据…");
    const [profile, appearance, cards, gallery] = await Promise.all([
        supabaseClient.from("site_profile").select("*").eq("id", 1).maybeSingle(),
        supabaseClient.from("site_appearance").select("*").eq("id", 1).maybeSingle(),
        supabaseClient.from("info_cards").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("gallery_items").select("*").order("sort_order", { ascending: true }).limit(5)
    ]);
    if (profile.error || appearance.error || cards.error || gallery.error) {
        return setStatus(`读取失败：${profile.error?.message || appearance.error?.message || cards.error?.message}`);
    }
    fillProfile(profile.data || {});
    fillAppearance(appearance.data || {});
    adminDom.cardsEditor.innerHTML = "";
    (cards.data || []).forEach(addCard);
    adminDom.galleryEditor.innerHTML = "";
    (gallery.data || []).forEach(addGalleryItem);
    setStatus("数据已读取。");
}

function fillProfile(p) {
    adminDom.profileName.value = p.display_name || "";
    adminDom.profileTagline.value = p.tagline || "";
    adminDom.profileIntroduction.value = p.introduction || "";
    adminDom.profileActiveTitle.value = p.active_title || "";
    adminDom.profileInactiveTitle.value = p.inactive_title || "";
    adminDom.profileAvatarUrl.value = p.avatar_url || "";
}

function fillAppearance(a) {
    adminDom.appearanceType.value = a.background_type || "default";
    adminDom.appearanceSolid.value = a.solid_color || "#6d5dfc";
    adminDom.appearanceStart.value = a.gradient_start || "#667eea";
    adminDom.appearanceEnd.value = a.gradient_end || "#764ba2";
    adminDom.appearanceDirection.value = a.gradient_direction || "135deg";
    adminDom.appearanceImageUrl.value = a.background_image_url || "";
    adminDom.appearanceBlur.value = a.background_blur ?? 0;
    adminDom.appearanceBrightness.value = a.background_brightness ?? 100;
    updateRangeLabels();
}

function updateRangeLabels() {
    adminDom.appearanceBlurValue.textContent = adminDom.appearanceBlur.value;
    adminDom.appearanceBrightnessValue.textContent = adminDom.appearanceBrightness.value;
}

async function uploadImage(file, folder) {
    if (!file) return null;
    if (!file.type.startsWith("image/")) throw new Error("请选择图片文件。");
    if (file.size > LIMIT) throw new Error("图片不能超过 10 MB。");
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseClient.storage.from("site-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type
    });
    if (error) throw error;
    const { data } = supabaseClient.storage.from("site-images").getPublicUrl(path);
    return data.publicUrl;
}

async function saveProfile() {
    try {
        setStatus("正在保存个人资料…");
        let avatarUrl = adminDom.profileAvatarUrl.value.trim() || null;
        if (adminDom.profileAvatarFile.files[0]) avatarUrl = await uploadImage(adminDom.profileAvatarFile.files[0], "avatars");
        const row = {
            id: 1,
            display_name: adminDom.profileName.value.trim(),
            tagline: adminDom.profileTagline.value.trim(),
            introduction: adminDom.profileIntroduction.value,
            active_title: adminDom.profileActiveTitle.value.trim(),
            inactive_title: adminDom.profileInactiveTitle.value.trim(),
            avatar_url: avatarUrl
        };
        const { error } = await supabaseClient.from("site_profile").upsert(row, { onConflict: "id" });
        if (error) throw error;
        adminDom.profileAvatarUrl.value = avatarUrl || "";
        adminDom.profileAvatarFile.value = "";
        setStatus("个人资料已保存。");
    } catch (e) { setStatus(`保存失败：${e.message}`); }
}

async function saveAppearance() {
    try {
        setStatus("正在保存背景…");
        let imageUrl = adminDom.appearanceImageUrl.value.trim() || null;
        if (adminDom.appearanceImageFile.files[0]) imageUrl = await uploadImage(adminDom.appearanceImageFile.files[0], "backgrounds");
        const row = {
            id: 1,
            background_type: adminDom.appearanceType.value,
            solid_color: adminDom.appearanceSolid.value,
            gradient_start: adminDom.appearanceStart.value,
            gradient_end: adminDom.appearanceEnd.value,
            gradient_direction: adminDom.appearanceDirection.value.trim() || "135deg",
            background_image_url: imageUrl,
            background_blur: Number(adminDom.appearanceBlur.value),
            background_brightness: Number(adminDom.appearanceBrightness.value)
        };
        const { error } = await supabaseClient.from("site_appearance").upsert(row, { onConflict: "id" });
        if (error) throw error;
        adminDom.appearanceImageUrl.value = imageUrl || "";
        adminDom.appearanceImageFile.value = "";
        setStatus("背景设置已保存。");
    } catch (e) { setStatus(`保存失败：${e.message}`); }
}

function addCard(card) {
    const node = adminDom.cardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = card.id || "";
    node.querySelector(".card-title-input").value = card.title || "";
    node.querySelector(".card-content-input").value = card.content || "";
    node.querySelector(".card-position-input").value = card.position || "center";
    node.querySelector(".card-style-input").value = card.display_style || "normal";
    node.querySelector(".card-group-input").value = card.group_id || "";
    node.querySelector(".card-sort-input").value = card.sort_order ?? nextSort();
    node.querySelector(".delete-card").addEventListener("click", () => node.remove());
    adminDom.cardsEditor.appendChild(node);
}

function nextSort() {
    return adminDom.cardsEditor.children.length;
}

async function saveCards() {
    try {
        setStatus("正在保存资料卡…");
        const rows = [...adminDom.cardsEditor.querySelectorAll(".editor-card")].map((node, index) => ({
            id: node.dataset.id ? Number(node.dataset.id) : undefined,
            title: node.querySelector(".card-title-input").value.trim() || "Untitled",
            content: node.querySelector(".card-content-input").value,
            position: node.querySelector(".card-position-input").value,
            display_style: node.querySelector(".card-style-input").value,
            group_id: node.querySelector(".card-group-input").value.trim() || null,
            sort_order: Number(node.querySelector(".card-sort-input").value || index)
        }));
        const existing = await supabaseClient.from("info_cards").select("id");
        if (existing.error) throw existing.error;
        const currentIds = rows.filter(r => r.id).map(r => r.id);
        const deleteIds = (existing.data || []).map(r => r.id).filter(id => !currentIds.includes(id));
        if (deleteIds.length) {
            const { error } = await supabaseClient.from("info_cards").delete().in("id", deleteIds);
            if (error) throw error;
        }
        for (const row of rows) {
            if (row.id) {
                const { id, ...data } = row;
                const { error } = await supabaseClient.from("info_cards").update(data).eq("id", id);
                if (error) throw error;
            } else {
                delete row.id;
                const { error } = await supabaseClient.from("info_cards").insert(row);
                if (error) throw error;
            }
        }
        setStatus("资料卡已保存。刷新主页即可查看效果。");
    } catch (e) { setStatus(`保存失败：${e.message}`); }
}

function setStatus(text) { adminDom.adminStatus.textContent = text; }
function setLoginStatus(text) { adminDom.loginStatus.textContent = text; }


function nextGallerySort() {
    return adminDom.galleryEditor.children.length;
}

function addGalleryItem(item) {
    const node = adminDom.galleryTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id || "";
    node.querySelector(".gallery-name-input").value = item.name || "";
    node.querySelector(".gallery-description-input").value = item.description || "";
    node.querySelector(".gallery-map-input").value = item.map_name || "";
    node.querySelector(".gallery-image-url-input").value = item.image_url || "";
    node.querySelector(".gallery-sort-input").value = item.sort_order ?? nextGallerySort();
    node.querySelector(".delete-gallery").addEventListener("click", () => node.remove());
    adminDom.galleryEditor.appendChild(node);
}

async function saveGallery() {
    try {
        if (adminDom.galleryEditor.children.length > 5) {
            throw new Error("画廊最多只能保存 5 张图片。");
        }
        setStatus("正在保存画廊…");
        const rows = [];
        for (const [index, node] of [...adminDom.galleryEditor.querySelectorAll(".gallery-editor-card")].entries()) {
            let imageUrl = node.querySelector(".gallery-image-url-input").value.trim() || null;
            const file = node.querySelector(".gallery-image-file-input").files[0];
            if (file) imageUrl = await uploadImage(file, "gallery");
            rows.push({
                id: node.dataset.id ? Number(node.dataset.id) : undefined,
                name: node.querySelector(".gallery-name-input").value.trim() || "未命名图片",
                description: node.querySelector(".gallery-description-input").value,
                map_name: node.querySelector(".gallery-map-input").value.trim() || "",
                image_url: imageUrl,
                sort_order: Number(node.querySelector(".gallery-sort-input").value || index)
            });
        }
        const existing = await supabaseClient.from("gallery_items").select("id");
        if (existing.error) throw existing.error;
        const currentIds = rows.filter(r => r.id).map(r => r.id);
        const deleteIds = (existing.data || []).map(r => r.id).filter(id => !currentIds.includes(id));
        if (deleteIds.length) {
            const { error } = await supabaseClient.from("gallery_items").delete().in("id", deleteIds);
            if (error) throw error;
        }
        for (const row of rows) {
            if (!row.image_url) throw new Error("每个画廊项目都需要图片 URL 或上传图片。");
            if (row.id) {
                const { id, ...data } = row;
                const { error } = await supabaseClient.from("gallery_items").update(data).eq("id", id);
                if (error) throw error;
            } else {
                delete row.id;
                const { error } = await supabaseClient.from("gallery_items").insert(row);
                if (error) throw error;
            }
        }
        setStatus("画廊已保存。刷新主页即可查看效果。");
    } catch (e) { setStatus(`保存失败：${e.message}`); }
}
