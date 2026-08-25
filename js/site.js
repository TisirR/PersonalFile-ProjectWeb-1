/* =========================================================
   State
========================================================= */

const state = {
    profile: null,
    appearance: null,
    cards: []
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
        document.getElementById("closeImageViewer")

};


/* =========================================================
   Default Data
========================================================= */

const defaultProfile = {

    display_name: "Your Name",

    tagline:
        "Welcome to my personal space.",

    introduction:
        "这里以后可以填写你的自我介绍。\n\n不用暴露现实中的敏感个人信息，这里更适合介绍你的兴趣、VRChat、喜欢的东西，以及想让新朋友了解的内容。",

    avatar_url: null,

    active_title:
        "Ciallo～(∠・ω< )⌒★",

    inactive_title:
        "|´•ω•`)…"

};


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

        setupImageViewer();

        await loadWebsite();

        await updateVisitor();

    }
);


/* =========================================================
   Load Website
========================================================= */

async function loadWebsite() {

    try {

        const [
            profileResult,
            appearanceResult,
            cardsResult
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
                .order("sort_order", {
                    ascending: true
                })

        ]);


        state.profile =
            profileResult.data ||
            defaultProfile;

        state.appearance =
            appearanceResult.data ||
            defaultAppearance;

        state.cards =
            cardsResult.data || [];


        renderProfile();

        renderAppearance();

        renderCards();

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

        renderProfile();

        renderAppearance();

        renderCards();

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


    dom.avatarImage.src = url;

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
   Page Title
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (!state.profile) return;


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
   Cards
========================================================= */

function renderCards() {

    dom.centerCards.innerHTML = "";

    dom.leftCards.innerHTML = "";

    dom.rightCards.innerHTML = "";


    const positions = {

        center:
            dom.centerCards,

        left:
            dom.leftCards,

        right:
            dom.rightCards

    };


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


    Object.entries(
        groupedCards
    ).forEach(

        ([position, cards]) => {

            renderCardPosition(
                positions[position],
                cards
            );

        }

    );


    updateEarVisibility(
        groupedCards.left,
        groupedCards.right
    );


    setupMobileCards(
        groupedCards.left,
        groupedCards.right
    );

}


function renderCardPosition(
    container,
    cards
) {

    if (!container) return;


    let index = 0;


    while (
        index < cards.length
    ) {

        const card =
            cards[index];


        if (
            card.display_style === "connected" &&
            card.group_id
        ) {

            const group =
                document.createElement("div");

            group.className =
                "card-group";


            const currentGroupId =
                card.group_id;


            while (

                index < cards.length &&

                cards[index]
                    .display_style ===
                    "connected" &&

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


function createCard(card) {

    const element =
        document.createElement("article");


    element.className =
        "info-card";


    const title =
        document.createElement("div");

    title.className =
        "card-title-bubble";

    title.textContent =
        card.title || "Untitled";


    const content =
        document.createElement("div");

    content.className =
        "card-content";

    content.textContent =
        card.content || "";


    element.appendChild(title);

    element.appendChild(content);


    return element;

}


/* =========================================================
   Ear Visibility
========================================================= */

function updateEarVisibility(
    leftCards,
    rightCards
) {

    const hasLeft =
        leftCards.length > 0;

    const hasRight =
        rightCards.length > 0;


    dom.leftEar.style.display =
        hasLeft
            ? "block"
            : "none";


    dom.rightEar.style.display =
        hasRight
            ? "block"
            : "none";

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
        leftState === "expanded"
    ) {

        dom.leftEar
            .classList
            .remove("collapsed");

        dom.leftEar
            .classList
            .add("expanded");

    }


    if (
        rightState === "expanded"
    ) {

        dom.rightEar
            .classList
            .remove("collapsed");

        dom.rightEar
            .classList
            .add("expanded");

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
            .remove("expanded");

        ear
            .classList
            .add("collapsed");


        localStorage.setItem(
            storageKey,
            "collapsed"
        );

    }
    else {

        ear
            .classList
            .remove("collapsed");

        ear
            .classList
            .add("expanded");


        localStorage.setItem(
            storageKey,
            "expanded"
        );

    }

}


/* =========================================================
   Mobile Cards
========================================================= */

function setupMobileCards(
    leftCards,
    rightCards
) {

    if (
        window.innerWidth > 900
    ) return;


    const allCards = [

        ...leftCards,
        ...rightCards

    ];


    allCards.forEach(
        card => {

            dom.centerCards.appendChild(
                createCard(card)
            );

        }
    );

}


/* =========================================================
   Image Viewer
========================================================= */

function setupImageViewer() {

    dom.avatarButton.addEventListener(
        "click",
        () => {

            if (
                !state.profile?.avatar_url
            ) return;


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


function closeImageViewer() {

    dom.imageViewer.hidden =
        true;

}


/* =========================================================
   Visitor
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
            data: existingVisitor
        } =
        await supabaseClient
            .from("visitor_sessions")
            .select("visitor_id")
            .eq(
                "visitor_id",
                visitorId
            )
            .maybeSingle();


        if (!existingVisitor) {

            await supabaseClient
                .from("visitor_sessions")
                .insert({
                    visitor_id:
                        visitorId
                });

        }
        else {

            await supabaseClient
                .from("visitor_sessions")
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
            error
        } =
        await supabaseClient
            .from("visitor_sessions")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );


        if (error) {

            throw error;

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
