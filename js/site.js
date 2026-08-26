/* =========================================================
   Website State
========================================================= */

const state = {
    profile: null,
    appearance: null,
    cards: [],
    gallery: []
};


/* =========================================================
   DOM
========================================================= */

const dom = {

    backgroundLayer:
        document.getElementById("backgroundLayer"),

    displayName:
        document.getElementById("displayName"),

    tagline:
        document.getElementById("tagline"),

    introduction:
        document.getElementById("introduction"),

    avatarImage:
        document.getElementById("avatarImage"),

    avatarFallback:
        document.getElementById("avatarFallback"),

    avatarButton:
        document.getElementById("avatarButton"),

    centerCards:
        document.getElementById("centerCards"),

    leftCards:
        document.getElementById("leftCards"),

    rightCards:
        document.getElementById("rightCards"),

    leftEar:
        document.getElementById("leftEar"),

    rightEar:
        document.getElementById("rightEar"),

    leftEarToggle:
        document.getElementById("leftEarToggle"),

    rightEarToggle:
        document.getElementById("rightEarToggle"),

    visitorCount:
        document.getElementById("visitorCount"),

    footerName:
        document.getElementById("footerName"),

    imageViewer:
        document.getElementById("imageViewer"),

    viewerImage:
        document.getElementById("viewerImage"),

    closeImageViewer:
        document.getElementById("closeImageViewer"),

    galleryPanel:
        document.getElementById("galleryPanel"),
   
    galleryToggle:
        document.getElementById("galleryToggle"),
   
    galleryList:
        document.getElementById("galleryList"),

    informationShell:
        document.getElementById("informationShell")

};


/* =========================================================
   Default Profile
========================================================= */

const defaultProfile = {

    display_name:
        "Your Name",

    tagline:
        "Welcome to my personal space.",

    introduction:
        "这里以后可以填写你的自我介绍。\n\n不用填写现实中的敏感个人信息，可以介绍你的兴趣、VRChat、喜欢的东西，以及你希望新朋友了解的内容。",

    avatar_url:
        null,

    active_title:
        "Ciallo～(∠・ω< )⌒★",

    inactive_title:
        "|´•ω•`)…"

};


/* =========================================================
   Default Appearance
========================================================= */

const defaultAppearance = {

    background_type:
        "default",

    solid_color:
        "#6d5dfc",

    gradient_start:
        "#667eea",

    gradient_end:
        "#764ba2",

    gradient_direction:
        "135deg",

    background_image_url:
        null,

    background_blur:
        0,

    background_brightness:
        100

};


/* =========================================================
   Init
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupEarControls();

        setupGalleryControls();

        setupImageViewer();

        await loadWebsite();

        await updateVisitor();

    }
);


/* =========================================================
   Load Website Data
========================================================= */

async function loadWebsite() {

    try {

        const [
            profileResult,
            appearanceResult,
            cardsResult,
            galleryResult
        ] = await Promise.all([

            supabaseClient
                .from("site_profile")
                .select("*")
                .eq("id", 1)
                .single(),

            supabaseClient
                .from("site_appearance")
                .select("*")
                .eq("id", 1)
                .single(),

            supabaseClient
                .from("info_cards")
                .select("*")
                .order("sort_order", { ascending: true }),

            supabaseClient
                .from("gallery_items")
                .select("*")
                .order("sort_order", { ascending: true })
                .limit(5)

        ]);


        state.profile =
            profileResult.data ||
            defaultProfile;


        state.appearance =
            appearanceResult.data ||
            defaultAppearance;


        state.cards =
            cardsResult.data ||
            [];

        state.gallery =
            galleryResult.data ||
            [];


        renderProfile();

        renderAppearance();

        renderCards();

        renderGallery();

        updateGalleryPosition();

    }
    catch (error) {

        console.error(
            "网站数据加载失败:",
            error
        );


        state.profile =
            defaultProfile;


        state.appearance =
            defaultAppearance;


        state.cards = [];

        state.gallery = [];


        renderProfile();

        renderAppearance();

        renderCards();

        renderGallery();

        updateGalleryPosition();

    }

}


/* =========================================================
   Profile
========================================================= */

function renderProfile() {

    const profile =
        state.profile;


    dom.displayName.textContent =
        profile.display_name ||
        defaultProfile.display_name;


    dom.tagline.textContent =
        profile.tagline ||
        "";


    dom.introduction.textContent =
        profile.introduction ||
        "";


    dom.footerName.textContent =
        profile.display_name ||
        "Personal Space";


    document.title =
        profile.active_title ||
        defaultProfile.active_title;


    renderAvatar(
        profile.avatar_url
    );

}


/* =========================================================
   Avatar
========================================================= */

function renderAvatar(url) {

    if (!url) {

        dom.avatarImage
            .classList
            .remove("is-visible");


        dom.avatarFallback
            .style
            .display = "flex";

        return;

    }


    dom.avatarImage.src =
        url;


    dom.avatarImage.onload =
        () => {

            dom.avatarImage
                .classList
                .add("is-visible");


            dom.avatarFallback
                .style
                .display = "none";

        };


    dom.avatarImage.onerror =
        () => {

            dom.avatarImage
                .classList
                .remove("is-visible");


            dom.avatarFallback
                .style
                .display = "flex";

        };

}


/* =========================================================
   Browser Title
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (!state.profile) {
            return;
        }


        if (document.hidden) {

            document.title =
                state.profile.inactive_title ||
                defaultProfile.inactive_title;

        }
        else {

            document.title =
                state.profile.active_title ||
                defaultProfile.active_title;

        }

    }
);


/* =========================================================
   Appearance
========================================================= */

function renderAppearance() {

    const appearance =
        state.appearance ||
        defaultAppearance;


    const blur =
        appearance.background_blur || 0;


    const brightness =
        appearance.background_brightness || 100;


    dom.backgroundLayer.style.filter =
        `blur(${blur}px) brightness(${brightness}%)`;


    dom.backgroundLayer.style.backgroundImage =
        "";


    switch (
        appearance.background_type
    ) {

        case "solid":

            dom.backgroundLayer.style.background =
                appearance.solid_color ||
                "#6d5dfc";

            break;


        case "gradient":

            dom.backgroundLayer.style.background =
                `linear-gradient(
                    ${appearance.gradient_direction || "135deg"},
                    ${appearance.gradient_start || "#667eea"},
                    ${appearance.gradient_end || "#764ba2"}
                )`;

            break;


        case "image":

            if (
                appearance.background_image_url
            ) {

                dom.backgroundLayer.style.background =
                    "none";


                dom.backgroundLayer.style.backgroundImage =
                    `url("${appearance.background_image_url}")`;


                dom.backgroundLayer.style.backgroundSize =
                    "cover";


                dom.backgroundLayer.style.backgroundPosition =
                    "center";

            }

            break;


        default:

            dom.backgroundLayer.style.background =
                "linear-gradient(135deg, #667eea, #764ba2)";

    }

}


/* =========================================================
   Render Cards
========================================================= */

function renderCards() {

    dom.centerCards.innerHTML = "";

    dom.leftCards.innerHTML = "";

    dom.rightCards.innerHTML = "";


    const groupedCards = {

        center: [],
        left: [],
        right: []

    };


    state.cards.forEach(
        card => {

            if (
                groupedCards[
                    card.position
                ]
            ) {

                groupedCards[
                    card.position
                ].push(card);

            }

        }
    );


    renderCardPosition(
        dom.centerCards,
        groupedCards.center
    );


    renderCardPosition(
        dom.leftCards,
        groupedCards.left
    );


    renderCardPosition(
        dom.rightCards,
        groupedCards.right
    );


    renderMobileCards(
        groupedCards
    );

}


/* =========================================================
   Render One Position
========================================================= */

function renderCardPosition(
    container,
    cards
) {

    if (!container) {
        return;
    }


    let index = 0;


    while (
        index < cards.length
    ) {

        const card =
            cards[index];


        if (

            card.display_style ===
            "connected"

            &&

            card.group_id

        ) {

            const group =
                document.createElement("div");


            group.className =
                "card-group";


            const currentGroupId =
                card.group_id;


            while (

                index < cards.length

                &&

                cards[index]
                    .display_style ===
                    "connected"

                &&

                cards[index]
                    .group_id ===
                    currentGroupId

            ) {

                group.appendChild(

                    createCard(
                        cards[index]
                    )

                );

                index++;

            }


            container.appendChild(
                group
            );

        }
        else {

            container.appendChild(

                createCard(card)

            );

            index++;

        }

    }

}


/* =========================================================
   Create Card
========================================================= */

function createCard(card) {

    const element =
        document.createElement(
            "article"
        );


    element.className =
        "info-card";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "card-title-bubble";


    title.textContent =
        card.title ||
        "Untitled";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "card-content";


    content.textContent =
        card.content ||
        "";


    element.appendChild(
        title
    );


    element.appendChild(
        content
    );


    return element;

}


/* =========================================================
   Ear Controls
========================================================= */

function setupEarControls() {

    const leftState =
        localStorage.getItem(
            "vrc_site_left_ear"
        );


    const rightState =
        localStorage.getItem(
            "vrc_site_right_ear"
        );


    if (
        leftState ===
        "expanded"
    ) {

        dom.leftEar
            .classList
            .add("expanded");

        dom.leftEarToggle.setAttribute("aria-expanded", "true");

    }


    if (
        rightState ===
        "expanded"
    ) {

        dom.rightEar
            .classList
            .add("expanded");

        dom.rightEarToggle.setAttribute("aria-expanded", "true");

    }


    dom.leftEarToggle.addEventListener(
        "click",
        () => {

            toggleEar(
                dom.leftEar,
                "vrc_site_left_ear"
            );

        }
    );


    dom.rightEarToggle.addEventListener(
        "click",
        () => {

            toggleEar(
                dom.rightEar,
                "vrc_site_right_ear"
            );

        }
    );

}


/* =========================================================
   Toggle Ear
========================================================= */

function toggleEar(
    ear,
    storageKey
) {

    const expanded =
        ear.classList.contains(
            "expanded"
        );


    if (expanded) {

        ear
            .classList
            .remove(
                "expanded"
            );


        localStorage.setItem(
            storageKey,
            "collapsed"
        );

        ear.querySelector(".ear-handle").setAttribute("aria-expanded", "false");

    }
    else {

        ear
            .classList
            .add(
                "expanded"
            );


        localStorage.setItem(
            storageKey,
            "expanded"
        );

        ear.querySelector(".ear-handle").setAttribute("aria-expanded", "true");

    }

}


/* =========================================================
   Mobile Cards

   手机端左右耳朵不显示，
   但左右卡片会复制到中间。

   这样不会丢失内容。
========================================================= */

function renderMobileCards(
    groupedCards
) {

    if (
        window.innerWidth > 900
    ) {
        return;
    }


    const mobileCards = [

        ...groupedCards.left,

        ...groupedCards.right

    ];


    mobileCards.forEach(
        card => {

            dom.centerCards.appendChild(

                createCard(card)

            );

        }
    );

}


/* =========================================================
   Avatar Viewer
========================================================= */

function setupImageViewer() {

    dom.avatarButton.addEventListener(
        "click",
        () => {

            if (
                !state.profile?.avatar_url
            ) {
                return;
            }


            dom.viewerImage.src =
                state.profile.avatar_url;


            dom.imageViewer.hidden =
                false;

        }
    );


    dom.closeImageViewer.addEventListener(
        "click",
        closeImageViewer
    );


    dom.imageViewer.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                dom.imageViewer
            ) {

                closeImageViewer();

            }

        }
    );

}


/* =========================================================
   Close Image Viewer
========================================================= */

function closeImageViewer() {

    dom.imageViewer.hidden =
        true;

}


/* =========================================================
   Gallery
========================================================= */

function renderGallery() {
    if (!dom.galleryList) return;

    dom.galleryList.innerHTML = "";

    const items = (state.gallery || []).slice(0, 5);

    if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "gallery-empty";
        empty.textContent = "暂无图片\n以后可以在管理后台添加。";
        dom.galleryList.appendChild(empty);
        return;
    }

    items.forEach(item => {
        const article = document.createElement("article");
        article.className = "gallery-item";

        const img = document.createElement("img");
        img.className = "gallery-thumb";
        img.src = item.image_url || "";
        img.alt = item.name || "Gallery image";
        img.loading = "lazy";
        img.addEventListener("click", () => {
            if (!item.image_url) return;
            dom.viewerImage.src = item.image_url;
            dom.imageViewer.hidden = false;
        });

        const info = document.createElement("div");
        info.className = "gallery-info";

        const name = document.createElement("div");
        name.className = "gallery-name";
        name.textContent = item.name || "未命名图片";

        const description = document.createElement("div");
        description.className = "gallery-description";
        description.textContent = item.description || "暂无描述";

        const map = document.createElement("div");
        map.className = "gallery-map";
        map.textContent = item.map_name || "未标注地图";

        info.append(name, description, map);
        article.append(img, info);
        dom.galleryList.appendChild(article);
    });
}

/* =========================================================
   Gallery Controls
========================================================= */

function setupGalleryControls() {

    if (
        !dom.galleryPanel ||
        !dom.galleryToggle
    ) {
        return;
    }


    const savedState =
        localStorage.getItem(
            "vrc_site_gallery"
        );


    if (
        savedState === "expanded"
    ) {

        dom.galleryPanel
            .classList
            .remove("collapsed");

        dom.galleryPanel
            .classList
            .add("expanded");

        dom.galleryToggle
            .setAttribute(
                "aria-expanded",
                "true"
            );

    }


    dom.galleryToggle
        .addEventListener(
            "click",
            () => {

                const expanded =
                    dom.galleryPanel
                        .classList
                        .contains("expanded");


                if (expanded) {

                    dom.galleryPanel
                        .classList
                        .remove("expanded");

                    dom.galleryPanel
                        .classList
                        .add("collapsed");

                    dom.galleryToggle
                        .setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    localStorage.setItem(
                        "vrc_site_gallery",
                        "collapsed"
                    );

                }
                else {

                    dom.galleryPanel
                        .classList
                        .remove("collapsed");

                    dom.galleryPanel
                        .classList
                        .add("expanded");

                    dom.galleryToggle
                        .setAttribute(
                            "aria-expanded",
                            "true"
                        );

                    localStorage.setItem(
                        "vrc_site_gallery",
                        "expanded"
                    );

                }

            }
        );

}


/* =========================================================
   Gallery Position
========================================================= */

function updateGalleryPosition() {

    if (
        !dom.galleryPanel ||
        !dom.informationShell
    ) {
        return;
    }


    const rect =
        dom.informationShell
            .getBoundingClientRect();


    /*
        限位：

        初始位置 = 第二主框顶部

        向下滚动后：
        画廊跟着上移

        最高不会超过视口顶部 24px
    */

    const safeTop = 24;


    const top =
        Math.max(
            safeTop,
            rect.top
        );


    document.documentElement
        .style
        .setProperty(
            "--gallery-top",
            `${top}px`
        );

}


window.addEventListener(
    "scroll",
    updateGalleryPosition,
    {
        passive: true
    }
);


window.addEventListener(
    "resize",
    updateGalleryPosition
);

/* =========================================================
   Visitor Counter
========================================================= */

async function updateVisitor() {

    try {

        let visitorId =
            localStorage.getItem(
                "vrc_site_visitor_id"
            );


        if (!visitorId) {

            visitorId =
                crypto.randomUUID();


            localStorage.setItem(
                "vrc_site_visitor_id",
                visitorId
            );

        }


        const {
            data: existingVisitor,
            error: visitorCheckError
        } =
        await supabaseClient
            .from(
                "visitor_sessions"
            )
            .select(
                "visitor_id"
            )
            .eq(
                "visitor_id",
                visitorId
            )
            .maybeSingle();


        if (
            visitorCheckError
        ) {

            throw visitorCheckError;

        }


        if (
            !existingVisitor
        ) {

            const {
                error
            } =
            await supabaseClient
                .from(
                    "visitor_sessions"
                )
                .insert({

                    visitor_id:
                        visitorId

                });


            if (error) {
                throw error;
            }

        }
        else {

            await supabaseClient
                .from(
                    "visitor_sessions"
                )
                .update({

                    last_seen_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "visitor_id",
                    visitorId
                );

        }


        const {
            count,
            error: countError
        } =
        await supabaseClient
            .from(
                "visitor_sessions"
            )
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );


        if (
            countError
        ) {

            throw countError;

        }


        dom.visitorCount.textContent =
            count || 0;

    }
    catch (error) {

        console.warn(
            "访客统计失败:",
            error
        );


        dom.visitorCount.textContent =
            "—";

    }

}
