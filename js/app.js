(function ($) {
  "use strict";

  const KEYS = {
    listings: "ceh_listings_v2",
    inquiries: "ceh_inquiries_v2",
    reports: "ceh_reports_v2",
    favorites: "ceh_favorites_v2",
    role: "ceh_role_v2"
  };

  const DEMO_USER = { id: "member-demo", name: "Alex M." };
  const CATEGORIES = ["Books", "Electronics", "Furniture", "Bikes", "Clothing", "Other"];
  const CONDITIONS = ["Like new", "Good", "Fair", "Used"];
  const ICONS = { Books: "▤", Electronics: "⌁", Furniture: "⌂", Bikes: "↗", Clothing: "◇", Other: "•" };

  const App = {
    data: { listings: [], inquiries: [], reports: [], favorites: [] },

    init: function () {
      this.bindRole();
      this.loadData().always(() => {
        // Continue initialization even when seed.json cannot be loaded directly
        // from file://. loadData() provides its local fallback in that case.
        this.applyRoleUI();
        this.route();
      });
    },

    loadData: function () {
      const self = this;
      const parse = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch (_) { return fallback; }
      };
      const savedListings = localStorage.getItem(KEYS.listings);
      const savedInquiries = localStorage.getItem(KEYS.inquiries);
      const savedReports = localStorage.getItem(KEYS.reports);
      const savedFavorites = localStorage.getItem(KEYS.favorites);

      return $.getJSON("data/seed.json")
        .done(function (seed) {
          self.data.listings = savedListings ? parse(KEYS.listings, seed.listings) : seed.listings;
          self.data.inquiries = savedInquiries ? parse(KEYS.inquiries, seed.inquiries || []) : (seed.inquiries || []);
          self.data.reports = savedReports ? parse(KEYS.reports, seed.reports || []) : (seed.reports || []);
          self.data.favorites = savedFavorites ? parse(KEYS.favorites, []) : [];
          self.persist();
        })
        .fail(function () {
          const fallback = [
            { id: "L-1001", title: "MacBook Air M2 13-inch", description: "Lightly used laptop, ideal for study and coding. Includes charger and protective sleeve.", category: "Electronics", price: 690, condition: "Good", location: "Dortmund", seller: "Alex M.", sellerId: "member-demo", createdAt: "2026-08-05T10:15:00.000Z", status: "active", views: 128 },
            { id: "L-1002", title: "Bicycle — city commuter", description: "Reliable 7-speed city bike with front basket and recently serviced brakes.", category: "Bikes", price: 180, condition: "Good", location: "Dortmund", seller: "Mina K.", sellerId: "member-2", createdAt: "2026-08-08T08:40:00.000Z", status: "active", views: 94 },
            { id: "L-1003", title: "Web Development Textbook Bundle", description: "Three course-relevant books covering HTML/CSS, JavaScript and web architecture.", category: "Books", price: 45, condition: "Like new", location: "Dortmund", seller: "Sam R.", sellerId: "member-3", createdAt: "2026-08-09T16:25:00.000Z", status: "active", views: 61 },
            { id: "L-1004", title: "IKEA Desk + Desk Lamp", description: "Compact white study desk with matching adjustable lamp. Pickup only.", category: "Furniture", price: 55, condition: "Fair", location: "Dortmund", seller: "Noah T.", sellerId: "member-4", createdAt: "2026-08-11T12:05:00.000Z", status: "active", views: 72 },
            { id: "L-1005", title: "Noise-cancelling headphones", description: "Over-ear headphones with USB-C charging. Some cosmetic wear but fully functional.", category: "Electronics", price: 85, condition: "Fair", location: "Dortmund", seller: "Taylor J.", sellerId: "member-5", createdAt: "2026-08-12T09:10:00.000Z", status: "active", views: 49 }
          ];
          self.data.listings = savedListings ? parse(KEYS.listings, fallback) : fallback;
          self.data.inquiries = savedInquiries ? parse(KEYS.inquiries, []) : [];
          self.data.reports = savedReports ? parse(KEYS.reports, []) : [];
          self.data.favorites = savedFavorites ? parse(KEYS.favorites, []) : [];
          self.persist();
        });
    },

    persist: function () {
      localStorage.setItem(KEYS.listings, JSON.stringify(this.data.listings));
      localStorage.setItem(KEYS.inquiries, JSON.stringify(this.data.inquiries));
      localStorage.setItem(KEYS.reports, JSON.stringify(this.data.reports));
      localStorage.setItem(KEYS.favorites, JSON.stringify(this.data.favorites));
    },

    role: function () { return localStorage.getItem(KEYS.role) || "visitor"; },

    bindRole: function () {
      const self = this;
      $("#roleSelect").val(this.role()).on("change", function () {
        localStorage.setItem(KEYS.role, this.value);
        self.toast("Viewing as " + self.roleLabel(this.value) + ".");
        window.setTimeout(() => window.location.reload(), 250);
      });
    },

    roleLabel: function (role) {
      return ({ visitor: "Visitor", member: "Member", moderator: "Moderator" })[role] || "Visitor";
    },

    applyRoleUI: function () {
      const role = this.role();
      $("[data-role]").each(function () {
        const roles = String($(this).attr("data-role")).split(" ");
        $(this).toggleClass("role-hidden", roles.indexOf(role) === -1);
      });
      $("#currentRoleLabel").text(this.roleLabel(role));
    },

    can: function (action, listing) {
      const role = this.role();
      if (action === "create") return role === "member";
      if (action === "edit") return role === "member" && listing && listing.sellerId === DEMO_USER.id;
      if (action === "delete") return (role === "member" && listing && listing.sellerId === DEMO_USER.id) || role === "moderator";
      if (action === "inquire") return role === "visitor" || role === "member";
      if (action === "report") return role === "visitor" || role === "member";
      return false;
    },

    validateText: function (value, min, max) {
      const clean = String(value || "").trim();
      return clean.length >= min && clean.length <= max;
    },

    validate: function (payload) {
      const errors = {};
      const title = String(payload.title || "").trim();
      const description = String(payload.description || "").trim();
      const location = String(payload.location || "").trim();
      const seller = String(payload.seller || "").trim();
      const price = Number(payload.price);

      if (!this.validateText(title, 4, 70)) errors.title = "Use 4–70 characters.";
      if (!this.validateText(description, 15, 600)) errors.description = "Use 15–600 characters.";
      if (!Number.isFinite(price) || price < 0 || price > 100000) errors.price = "Enter a price from €0 to €100,000.";
      if (CATEGORIES.indexOf(payload.category) === -1) errors.category = "Choose a valid category.";
      if (CONDITIONS.indexOf(payload.condition) === -1) errors.condition = "Choose a valid condition.";
      if (!this.validateText(location, 2, 60) || !/^[\p{L}\p{N} .,'&()\-/]+$/u.test(location)) errors.location = "Use 2–60 characters and basic punctuation.";
      if (!this.validateText(seller, 2, 40) || !/^[\p{L} .'-]+$/u.test(seller)) errors.seller = "Use 2–40 characters and basic punctuation.";
      return errors;
    },

    formatPrice: function (value) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value)); },
    formatDate: function (value) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); },
    getListing: function (id) { return this.data.listings.find(l => l.id === id && l.status !== "removed"); },

    card: function (listing) {
      const self = this;
      const favorite = this.data.favorites.includes(listing.id);
      const $card = $("<article>").addClass("card listing-card");
      const $top = $("<div>").addClass("listing-top");
      const $icon = $("<div>").addClass("listing-icon").attr("aria-hidden", "true").text(ICONS[listing.category] || "•");
      const $price = $("<div>").addClass("price").text(this.formatPrice(listing.price));
      $top.append($icon, $price);
      $card.append($top,
        $("<div>").append($("<span>").addClass("tag accent").text(listing.category), $("<span>").addClass("tag").text(listing.condition)),
        $("<h3>").text(listing.title),
        $("<p>").addClass("muted card-description").text(listing.description.length > 118 ? listing.description.slice(0, 118) + "…" : listing.description),
        $("<div>").addClass("location-line").text("⌖ " + listing.location)
      );
      const $footer = $("<div>").addClass("card-footer");
      const $actions = $("<div>").addClass("actions card-actions");
      $actions.append($("<a>").addClass("btn btn-secondary btn-small").attr("href", "detail.html?id=" + encodeURIComponent(listing.id)).text("View listing"));
      $actions.append($("<button>").addClass("btn btn-small " + (favorite ? "btn-primary" : "btn-secondary")).attr({ type: "button", "aria-pressed": String(favorite) }).text(favorite ? "★ Saved" : "☆ Save").on("click", function () { self.toggleFavorite(listing.id); }));
      $footer.append($("<span>").addClass("seller-line").text("by " + listing.seller), $actions);
      $card.append($footer);
      return $card;
    },

    renderBrowse: function () {
      const self = this;
      const render = function () {
        const q = $("#search").val().trim().toLowerCase();
        const cat = $("#category").val();
        const minRaw = $("#minPrice").val();
        const maxRaw = $("#maxPrice").val();
        const min = minRaw === "" ? 0 : Number(minRaw);
        const max = maxRaw === "" ? Infinity : Number(maxRaw);
        const invalidRange = Number.isFinite(max) && Number.isFinite(min) && min > max;
        $("#priceRangeError").toggleClass("hidden", !invalidRange).text(invalidRange ? "Minimum price cannot be above maximum price." : "");
        let results = self.data.listings.filter(l => l.status === "active");
        if (!invalidRange) results = results.filter(l => (!q || (l.title + " " + l.description + " " + l.location).toLowerCase().includes(q)) && (!cat || l.category === cat) && l.price >= min && l.price <= max);
        $("#listingGrid").empty();
        $("#listingCount").text(results.length + " listing" + (results.length === 1 ? "" : "s") + " found");
        if (!results.length) $("#listingGrid").append($("<div>").addClass("empty full-width").text(invalidRange ? "Adjust the price range to continue." : "No listings match those filters."));
        results.forEach(l => $("#listingGrid").append(self.card(l)));
      };
      $("#filterForm").on("input change", render);
      render();
    },

    toggleFavorite: function (id) {
      const idx = this.data.favorites.indexOf(id);
      if (idx >= 0) this.data.favorites.splice(idx, 1); else this.data.favorites.push(id);
      this.persist();
      if ($("#listingGrid").length) this.renderBrowse();
      if ($("#favoritesRoot").length) this.renderFavorites();
      this.toast(idx >= 0 ? "Removed from saved items." : "Saved for later.");
    },

    renderDetail: function () {
      const self = this;
      const id = new URLSearchParams(window.location.search).get("id");
      const listing = this.getListing(id);
      const $root = $("#detailRoot").empty();
      if (!listing) { $root.append($("<div>").addClass("empty").text("That listing could not be found.")); return; }
      listing.views = Number(listing.views || 0) + 1;
      this.persist();

      const $layout = $("<div>").addClass("detail-grid");
      const $left = $("<section>").addClass("card");
      $left.append($("<div>").addClass("detail-hero").attr("aria-hidden", "true").append($("<span>").text(ICONS[listing.category] || "•")));
      $left.append($("<div>").addClass("eyebrow detail-eyebrow muted").text(listing.category + " · " + listing.condition));
      $left.append($("<h1>").text(listing.title), $("<p>").addClass("detail-description").text(listing.description));
      const $actions = $("<div>").addClass("actions detail-actions");
      const saved = this.data.favorites.includes(listing.id);
      $actions.append($("<button>").addClass("btn " + (saved ? "btn-primary" : "btn-secondary")).attr("type", "button").text(saved ? "★ Saved" : "☆ Save").on("click", () => this.toggleFavorite(listing.id)));
      if (this.can("edit", listing)) $actions.append($("<a>").addClass("btn btn-secondary").attr("href", "create.html?id=" + encodeURIComponent(listing.id)).text("Edit"));
      if (this.can("delete", listing)) $actions.append($("<button>").addClass("btn btn-danger").attr("type", "button").text("Delete").on("click", () => this.deleteListing(listing.id)));
      $left.append($actions);

      const $right = $("<aside>").addClass("card detail-sidebar");
      $right.append($("<div>").addClass("detail-price").text(this.formatPrice(listing.price)), $("<p>").addClass("muted small").text("Posted " + this.formatDate(listing.createdAt)));
      const $dl = $("<dl>").addClass("kv");
      [["Seller", listing.seller], ["Location", listing.location], ["Condition", listing.condition], ["Views", listing.views]].forEach(pair => $dl.append($("<dt>").text(pair[0]), $("<dd>").text(pair[1])));
      $right.append($dl);

      if (this.can("inquire", listing)) {
        const $form = $("<form>").attr({ id: "inquiryForm", novalidate: true }).addClass("inquiry-form");
        $form.append($("<div>").addClass("form-section-title").text("Contact seller"));
        const $field = $("<div>").addClass("field").append($("<label>").attr("for", "inquiryMessage").text("Your message"), $("<textarea>").attr({ id: "inquiryMessage", maxlength: 500, required: true, placeholder: "Ask a clear question about the item." }), $("<div>").attr("id", "inquiryError").addClass("error"));
        $form.append($field, $("<button>").addClass("btn btn-primary full-btn").attr("type", "submit").text("Send inquiry"));
        $form.on("submit", function (e) {
          e.preventDefault();
          const message = $("#inquiryMessage").val().trim();
          $("#inquiryError").text("");
          if (!self.validateText(message, 10, 500)) { $("#inquiryError").text("Use 10–500 characters."); return; }
          self.data.inquiries.push({ id: "I-" + Date.now(), listingId: listing.id, from: self.role() === "member" ? DEMO_USER.name : "Guest visitor", fromId: self.role() === "member" ? DEMO_USER.id : "visitor-demo", message: message, createdAt: new Date().toISOString(), status: "open" });
          self.persist();
          $("#inquiryError").removeClass("error").addClass("notice success").text("Inquiry sent. The seller can review it from their dashboard.");
          $("#inquiryMessage").val("");
        });
        $right.append($form);
      }

      if (this.can("report", listing)) {
        const $report = $("<div>").addClass("report-box");
        $report.append($("<button>").addClass("text-button").attr("type", "button").text("Report this listing").on("click", function () { $("#reportForm").slideToggle(180); }));
        const $reportForm = $("<form>").attr({ id: "reportForm", novalidate: true }).addClass("report-form").hide();
        $reportForm.append($("<label>").attr("for", "reportReason").text("Reason"), $("<select>").attr({ id: "reportReason", required: true }).append($("<option>").val("").text("Choose a reason"), $("<option>").val("Misleading or inaccurate").text("Misleading or inaccurate"), $("<option>").val("Prohibited item").text("Prohibited item"), $("<option>").val("Spam or duplicate").text("Spam or duplicate"), $("<option>").val("Other concern").text("Other concern")), $("<div>").attr("id", "reportError").addClass("error"), $("<button>").addClass("btn btn-secondary btn-small").attr("type", "submit").text("Submit report"));
        $reportForm.on("submit", function (e) {
          e.preventDefault();
          const reason = $("#reportReason").val();
          if (!reason) { $("#reportError").text("Choose a reason."); return; }
          const alreadyOpen = self.data.reports.some(r => r.listingId === listing.id && r.status === "open");
          if (alreadyOpen) { $("#reportError").text("This listing has already been reported."); return; }
          self.data.reports.push({ id: "R-" + Date.now(), listingId: listing.id, reason: reason, createdAt: new Date().toISOString(), status: "open" });
          self.persist();
          $reportForm.replaceWith($("<p>").addClass("notice success report-success").text("Thanks. The report has been sent to the moderation queue."));
        });
        $report.append($reportForm);
        $right.append($report);
      }

      $layout.append($left, $right);
      $root.append($layout);
    },

    deleteListing: function (id) {
      const listing = this.getListing(id);
      if (!listing || !this.can("delete", listing)) { this.toast("You do not have permission to remove this listing."); return; }
      if (!window.confirm("Remove this listing? This action cannot be undone in the demo.")) return;
      listing.status = "removed";
      this.data.reports = this.data.reports.filter(r => r.listingId !== id);
      this.data.favorites = this.data.favorites.filter(f => f !== id);
      this.persist();
      this.toast("Listing removed.");
      window.setTimeout(() => { window.location.href = "browse.html"; }, 450);
    },

    renderCreate: function () {
      const self = this;
      if (!this.can("create")) { $("#roleNotice").append($("<div>").addClass("notice info").text("Post and edit tools are available to Members. Switch the demo role above to continue.")); $("#listingForm").addClass("hidden"); return; }
      const id = new URLSearchParams(window.location.search).get("id");
      const listing = id ? this.getListing(id) : null;
      if (id && (!listing || listing.sellerId !== DEMO_USER.id)) { $("#roleNotice").append($("<div>").addClass("notice error").text("You can only edit your own listing.")); $("#listingForm").addClass("hidden"); return; }
      if (listing) {
        $("#formTitle").text("Edit listing"); $("#formIntro").text("Keep the information accurate and up to date.");
        $("#listingId").val(listing.id); $("#title").val(listing.title); $("#price").val(listing.price); $("#categorySelect").val(listing.category); $("#condition").val(listing.condition); $("#location").val(listing.location); $("#seller").val(listing.seller); $("#description").val(listing.description);
      }
      $("#listingForm").on("submit", function (e) {
        e.preventDefault(); $(".error").text(""); $("#formMessage").empty();
        const payload = { title: $("#title").val(), price: $("#price").val(), category: $("#categorySelect").val(), condition: $("#condition").val(), location: $("#location").val(), seller: $("#seller").val(), description: $("#description").val() };
        const errors = self.validate(payload);
        Object.keys(errors).forEach(k => $("#" + k + "Error").text(errors[k]));
        if (Object.keys(errors).length) return;
        if (listing) {
          Object.assign(listing, { title: payload.title.trim(), description: payload.description.trim(), category: payload.category, price: Number(payload.price), condition: payload.condition, location: payload.location.trim(), seller: payload.seller.trim() });
          $("#formMessage").append($("<div>").addClass("notice success").text("Listing updated successfully."));
        } else {
          self.data.listings.push({ id: "L-" + Date.now(), title: payload.title.trim(), description: payload.description.trim(), category: payload.category, price: Number(payload.price), condition: payload.condition, location: payload.location.trim(), seller: payload.seller.trim(), sellerId: DEMO_USER.id, createdAt: new Date().toISOString(), status: "active", views: 0 });
          $("#formMessage").append($("<div>").addClass("notice success").text("Listing published successfully."));
          this.reset();
        }
        self.persist(); window.setTimeout(() => { window.location.href = "dashboard.html"; }, 650);
      });
    },

    renderDashboard: function () {
      const self = this, $root = $("#dashboardRoot").empty();
      if (this.role() !== "member") { $root.append($("<div>").addClass("notice info").text("Switch the demo role to Member to manage your listings and inquiries.")); return; }
      const mine = this.data.listings.filter(l => l.sellerId === DEMO_USER.id && l.status === "active");
      const incoming = this.data.inquiries.filter(i => { const l = self.getListing(i.listingId); return l && l.sellerId === DEMO_USER.id && i.status === "open"; });
      $root.append($("<div>").addClass("stat-grid").append(
        $("<div>").addClass("stat").append($("<strong>").text(mine.length), $("<span>").addClass("muted").text("active listings")),
        $("<div>").addClass("stat").append($("<strong>").text(incoming.length), $("<span>").addClass("muted").text("open inquiries")),
        $("<div>").addClass("stat").append($("<strong>").text(this.data.favorites.length), $("<span>").addClass("muted").text("saved items")),
        $("<div>").addClass("stat").append($("<strong>").text("Live"), $("<span>").addClass("muted").text("local browser data"))
      ));
      const $section = $("<section>").addClass("dashboard-section").append($("<div>").addClass("section-head").append($("<div>").append($("<h2>").text("My listings"), $("<p>").addClass("muted").text("Your posts are stored locally and remain available after reload.")), $("<a>").addClass("btn btn-primary").attr("href", "create.html").text("+ New listing")));
      const $grid = $("<div>").addClass("grid cards-2");
      if (!mine.length) $grid.append($("<div>").addClass("empty full-width").text("You have no active listings yet."));
      mine.forEach(l => { const $c = self.card(l); $c.find(".card-footer .actions").append($("<a>").addClass("btn btn-secondary btn-small").attr("href", "create.html?id=" + encodeURIComponent(l.id)).text("Edit"), $("<button>").addClass("btn btn-danger btn-small").attr("type", "button").text("Delete").on("click", () => self.deleteListing(l.id))); $grid.append($c); });
      $root.append($section.append($grid));

      const $inq = $("<section>").addClass("dashboard-section").append($("<div>").addClass("section-head").append($("<div>").append($("<h2>").text("Incoming inquiries"), $("<p>").addClass("muted").text("Review questions from people interested in your listings."))));
      if (!incoming.length) $inq.append($("<div>").addClass("empty").text("No open inquiries."));
      else {
        const $wrap = $("<div>").addClass("table-wrap card"), $table = $("<table>").append("<thead><tr><th>Listing</th><th>From</th><th>Message</th><th>Received</th><th>Action</th></tr></thead>"), $tb = $("<tbody>");
        incoming.forEach(i => { const l = self.getListing(i.listingId), $tr = $("<tr>").append($("<td>").text(l ? l.title : "Removed"), $("<td>").text(i.from), $("<td>").text(i.message), $("<td>").text(self.formatDate(i.createdAt))); $tr.append($("<td>").append($("<button>").addClass("btn btn-secondary btn-small").attr("type", "button").text("Dismiss").on("click", () => { i.status = "dismissed"; self.persist(); self.renderDashboard(); }))); $tb.append($tr); });
        $table.append($tb); $wrap.append($table); $inq.append($wrap);
      }
      $root.append($inq);
    },

    renderFavorites: function () {
      const $root = $("#favoritesRoot").empty();
      const items = this.data.listings.filter(l => l.status === "active" && this.data.favorites.includes(l.id));
      if (!items.length) { $root.append($("<div>").addClass("empty").text("Nothing saved yet. Browse listings and choose ☆ Save.")); return; }
      const $grid = $("<div>").addClass("grid cards-3"); items.forEach(l => $grid.append(this.card(l))); $root.append($grid);
    },

    renderModerator: function () {
      const self = this, $root = $("#moderatorRoot").empty();
      if (this.role() !== "moderator") { $root.append($("<div>").addClass("notice info").text("Switch the demo role to Moderator to access the moderation queue.")); return; }
      const open = this.data.reports.filter(r => r.status === "open");
      $root.append($("<div>").addClass("stat-grid").append($("<div>").addClass("stat").append($("<strong>").text(open.length), $("<span>").addClass("muted").text("open reports")), $("<div>").addClass("stat").append($("<strong>").text(this.data.listings.filter(l => l.status === "active").length), $("<span>").addClass("muted").text("active listings")), $("<div>").addClass("stat").append($("<strong>").text(this.data.reports.length), $("<span>").addClass("muted").text("reports received")), $("<div>").addClass("stat").append($("<strong>").text("Safe"), $("<span>").addClass("muted").text("text rendering"))));
      const $section = $("<section>").addClass("dashboard-section");
      if (!open.length) $section.append($("<div>").addClass("empty").text("No open reports. The queue is clear."));
      else {
        const $wrap = $("<div>").addClass("table-wrap card"), $table = $("<table>").append("<thead><tr><th>Listing</th><th>Reason</th><th>Reported</th><th>Action</th></tr></thead>"), $tb = $("<tbody>");
        open.forEach(r => { const l = self.getListing(r.listingId), $tr = $("<tr>").append($("<td>").text(l ? l.title : "Removed listing"), $("<td>").text(r.reason), $("<td>").text(self.formatDate(r.createdAt))); const $action = $("<td>"); if (l) $action.append($("<button>").addClass("btn btn-danger btn-small").attr("type", "button").text("Remove listing").on("click", () => { if (!window.confirm("Remove this reported listing?")) return; l.status = "removed"; r.status = "resolved"; self.data.favorites = self.data.favorites.filter(f => f !== l.id); self.persist(); self.renderModerator(); self.toast("Reported listing removed."); })); else $action.append($("<span>").addClass("muted").text("Already removed")); $tr.append($action); $tb.append($tr); });
        $table.append($tb); $wrap.append($table); $section.append($wrap);
      }
      $root.append($section, $("<div>").addClass("card report-info").append($("<h3>").text("Trust & safety"), $("<p>").addClass("muted").text("User-written listing content and report reasons are rendered as text rather than trusted HTML. Reports are stored locally for this prototype and would be handled server-side in a real product.")));
    },

    route: function () {
      if ($("#homeCount").length) $("#homeCount").text(this.data.listings.filter(l => l.status === "active").length);
      if ($("#listingGrid").length) this.renderBrowse();
      if ($("#detailRoot").length) this.renderDetail();
      if ($("#listingForm").length) this.renderCreate();
      if ($("#dashboardRoot").length) this.renderDashboard();
      if ($("#favoritesRoot").length) this.renderFavorites();
      if ($("#moderatorRoot").length) this.renderModerator();
    },

    toast: function (message) { $("#toast").stop(true, true).text(message).fadeIn(140).delay(1800).fadeOut(220); }
  };

  window.CampusExchange = App;
  $(function () { App.init(); });
})(jQuery);
