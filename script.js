(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const money = (n) => {
    const num = Number(n) || 0;
    return new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(num) + "₮";
  };

  const parseCSV = (str) =>
    String(str || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

  const escapeHTML = (str) =>
    String(str ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");

  const grid = $("#productsGrid");
  if (!grid) return;

  // modal
  const modal = $("#productModal");
  const modalClose = $("#modalCloseBtn");
  const modalImage = $("#modalImage");
  const modalTitle = $("#modalTitle");
  const modalCategory = $("#modalCategory");
  const modalPrice = $("#modalPrice");
  const modalSale = $("#modalSale");
  const modalDesc = $("#modalDesc");
  const modalSizes = $("#modalSizes");
  const modalColors = $("#modalColors");
  const nextImgBtn = $("#nextImgBtn");

  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));

  function getProduct(card){
    const name = card.dataset.name || "";
    const price = Number(card.dataset.price || 0);
    const discount = clamp(Number(card.dataset.discount || 0), 0, 90);
    const category = card.dataset.category || "";
    const desc = card.dataset.desc || "";
    const images = parseCSV(card.dataset.images);
    const sizes = parseCSV(card.dataset.sizes);
    const colors = parseCSV(card.dataset.colors);

    const fallbackImg = card.querySelector(".media img")?.src || "";
    const imgs = images.length ? images : (fallbackImg ? [fallbackImg] : []);

    return { name, price, discount, category, desc, images: imgs, sizes, colors };
  }

  function enhanceCards(){
    $$(".product-card").forEach(card => {
      const p = getProduct(card);

      // price ui
      const priceUi = card.querySelector("[data-price-ui]");
      const oldUi = card.querySelector("[data-old-ui]");
      if (priceUi) priceUi.textContent = money(p.price);

      if (oldUi){
        if (p.discount > 0){
          const oldPrice = Math.round(p.price / (1 - p.discount/100));
          oldUi.textContent = `${money(oldPrice)} (-${p.discount}%)`;
          oldUi.style.display = "";
        } else {
          oldUi.textContent = "";
          oldUi.style.display = "none";
        }
      }

      // image counter badge
      const media = card.querySelector(".media");
      if (media){
        let badge = media.querySelector(".img-count");
        if (!badge){
          badge = document.createElement("div");
          badge.className = "img-count";
          media.appendChild(badge);
        }
        badge.style.display = p.images.length > 1 ? "" : "none";
        badge.textContent = p.images.length > 1 ? `1/${p.images.length}` : "";
        card.dataset._imgIndex = "0";
      }
    });
  }

  function cycleCardImage(card){
    const p = getProduct(card);
    if (p.images.length < 2) return;

    const imgEl = card.querySelector(".media img");
    const badge = card.querySelector(".img-count");
    if (!imgEl) return;

    const current = Number(card.dataset._imgIndex || 0);
    const next = (current + 1) % p.images.length;

    imgEl.src = p.images[next];
    card.dataset._imgIndex = String(next);

    if (badge) badge.textContent = `${next+1}/${p.images.length}`;
  }

  // modal state
  let active = { p:null, idx:0 };

  function openModal(card){
    const p = getProduct(card);
    active.p = p;
    active.idx = 0;

    modalTitle.textContent = p.name;
    modalCategory.textContent = p.category || "";
    modalPrice.textContent = money(p.price);
    modalDesc.textContent = p.desc || "—";

    modalSale.textContent = p.discount > 0 ? `-${p.discount}%` : "";
    modalSale.style.display = p.discount > 0 ? "" : "none";

    modalImage.src = p.images[0] || "";

    modalSizes.innerHTML = p.sizes.length
      ? p.sizes.map(s => `<span class="chip">${escapeHTML(s)}</span>`).join("")
      : `<span class="chip">—</span>`;

    modalColors.innerHTML = p.colors.length
      ? p.colors.map(c => `<span class="chip">${escapeHTML(c)}</span>`).join("")
      : `<span class="chip">—</span>`;

    modal.classList.add("open");
    document.body.classList.add("no-scroll");
  }

  function closeModal(){
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
    active.p = null;
    active.idx = 0;
  }

  function nextModalImage(){
    if (!active.p || active.p.images.length < 2) return;
    active.idx = (active.idx + 1) % active.p.images.length;
    modalImage.src = active.p.images[active.idx];
  }

  // events
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;

    // image click => cycle
    if (e.target.closest(".media img")){
      cycleCardImage(card);
      return;
    }

    // open modal
    openModal(card);
  });

  modalClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  nextImgBtn?.addEventListener("click", nextModalImage);
  modalImage?.addEventListener("click", nextModalImage);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    if (e.key === "ArrowRight" && modal.classList.contains("open")) nextModalImage();
  });

  enhanceCards();
})();
