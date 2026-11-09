(function () {
  "use strict";

  var DATA = window.WISHLIST;
  var CFG = window.WISHLIST_SUPABASE || {};
  var sb = (CFG.url && CFG.anonKey && window.supabase) ? window.supabase.createClient(CFG.url, CFG.anonKey) : null;
  var LS_KEY = "wishlist-claims-v1";

  var THEME_TEXT = {
    trevor: { eyebrow: '> wishlist.load("trevor") — birthday + christmas ' + DATA.year, bday: "birthday.exe", xmas: "christmas.exe" },
    maya:   { eyebrow: "Birthday + Christmas " + DATA.year + " · by moonlight", bday: "Birthday", xmas: "Christmas" }
  };
  var OCC = { birthday: "Birthday", christmas: "Christmas", either: "Either one" };

  var state = {
    person: pickPersonFromHash(),
    filter: "all",
    items: {},          // person -> [items]
    claims: {},         // item id -> true
    loaded: false,
    session: null,
    editorPerson: null, // which list the signed-in user may edit
    editingId: null     // item open in the dialog (null = new)
  };

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function svg(markup) { var w = document.createElement("span"); w.innerHTML = markup; return w.firstChild; } // static markup only
  var STAR = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  var ARROW = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try { var p = new URL(u); return (p.protocol === "http:" || p.protocol === "https:") ? p.href : ""; } catch (e) { return ""; }
  }
  function pickPersonFromHash() {
    var h = (location.hash || "").replace("#", "").toLowerCase();
    return DATA.people[h] ? h : Object.keys(DATA.people)[0];
  }
  function daysUntil(month, day) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var next = new Date(now.getFullYear(), month - 1, day);
    if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
    return Math.round((next - today) / 86400000);
  }
  function countdown(mmdd, todayText) {
    var m = String(mmdd || "").trim().match(/^(\d{1,2})[-\/](\d{1,2})$/);
    if (!m) return { num: "—", label: "Date coming soon" };
    var d = daysUntil(+m[1], +m[2]);
    if (d === 0) return { num: "Today", label: todayText };
    return { num: String(d), label: d === 1 ? "day to go" : "days to go" };
  }
  function canEdit() { return !!state.editorPerson && state.editorPerson === state.person; }

  // ---------- data ----------
  function loadDemo() {
    Object.keys(DATA.people).forEach(function (k) { state.items[k] = (DATA.people[k].items || []).slice(); });
    try { state.claims = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { state.claims = {}; }
    state.loaded = true;
    render();
  }

  function loadAll() {
    if (!sb) { loadDemo(); return; }
    Promise.all([
      sb.from("items").select("*").order("created_at", { ascending: false }),
      sb.from("claims").select("item_id")
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      var byPerson = {};
      Object.keys(DATA.people).forEach(function (k) { byPerson[k] = []; });
      (res[0].data || []).forEach(function (it) { if (byPerson[it.person]) byPerson[it.person].push(it); });
      state.items = byPerson;
      var c = {};
      ((res[1] && res[1].data) || []).forEach(function (r) { c[r.item_id] = true; });
      state.claims = c;
      state.loaded = true;
      render();
    }).catch(function (err) {
      console.error(err);
      state.loaded = true;
      render();
      $("summary").textContent = "Couldn't load the list. Try refreshing.";
    });
  }

  function setClaim(id, on) {
    if (on) state.claims[id] = true; else delete state.claims[id];
    render();
    if (!sb) { try { localStorage.setItem(LS_KEY, JSON.stringify(state.claims)); } catch (e) {} return; }
    var q = on
      ? sb.from("claims").upsert({ item_id: id })
      : sb.from("claims").delete().eq("item_id", id);
    q.then(function (r) {
      if (r.error) {
        if (on) delete state.claims[id]; else state.claims[id] = true;
        render();
        $("summary").textContent = "Couldn't save that. Check your connection and try again.";
      }
    });
  }

  // ---------- auth ----------
  function setSession(session) {
    state.session = session;
    state.editorPerson = null;
    if (!session) { render(); return; }
    sb.from("editors").select("person").eq("email", session.user.email).maybeSingle().then(function (r) {
      state.editorPerson = (r.data && r.data.person) || null;
      if (state.editorPerson && state.editorPerson !== state.person) {
        state.person = state.editorPerson; state.filter = "all";
        history.replaceState(null, "", location.pathname + "#" + state.person);
      }
      render();
    });
  }

  function openLogin() {
    if (!sb) {
      $("login-sub").textContent = "Editing turns on once Supabase is connected (see README).";
      $("login-email").disabled = true; $("login-send").disabled = true;
    }
    $("login-msg").textContent = ""; $("login-msg").className = "form-msg";
    $("login-dialog").showModal();
  }

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!sb) return;
    var email = $("login-email").value.trim();
    var msg = $("login-msg");
    $("login-send").disabled = true;
    msg.className = "form-msg"; msg.textContent = "Sending…";
    sb.auth.signInWithOtp({
      email: email,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname }
    }).then(function (r) {
      $("login-send").disabled = false;
      if (r.error) { msg.className = "form-msg error"; msg.textContent = "That email isn't set up to edit. Ask the site owner."; return; }
      msg.textContent = "Check your email and tap the link. It opens this site signed in.";
    });
  });

  // ---------- add / edit / delete ----------
  function openItem(item) {
    state.editingId = item ? item.id : null;
    $("item-title").textContent = item ? "Edit item" : "Add to " + DATA.people[state.person].name + "'s list";
    $("f-name").value = item ? item.name || "" : "";
    $("f-link").value = item ? item.link || "" : "";
    $("f-price").value = item ? item.price || "" : "";
    $("f-category").value = item ? item.category || "" : "";
    $("f-note").value = item ? item.note || "" : "";
    $("f-occ").value = item ? item.occ || "either" : "either";
    $("f-top").checked = item ? !!item.top : false;
    $("item-msg").textContent = ""; $("item-msg").className = "form-msg";

    var cats = {};
    (state.items[state.person] || []).forEach(function (it) { if (it.category) cats[it.category] = 1; });
    var dl = $("category-list"); dl.innerHTML = "";
    Object.keys(cats).forEach(function (c) { dl.appendChild(el("option", { value: c })); });

    $("item-dialog").showModal();
    if (!item) $("f-name").focus();
  }

  $("item-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var row = {
      person: state.person,
      name: $("f-name").value.trim(),
      link: safeUrl($("f-link").value),
      price: $("f-price").value.trim(),
      category: $("f-category").value.trim(),
      note: $("f-note").value.trim(),
      occ: $("f-occ").value,
      top: $("f-top").checked
    };
    var msg = $("item-msg");
    if (!row.name) { msg.className = "form-msg error"; msg.textContent = "Give it a name."; return; }
    if ($("f-link").value.trim() && !row.link) { msg.className = "form-msg error"; msg.textContent = "That link doesn't look right."; return; }
    $("item-save").disabled = true; msg.className = "form-msg"; msg.textContent = "Saving…";
    var q = state.editingId
      ? sb.from("items").update(row).eq("id", state.editingId)
      : sb.from("items").insert(row);
    q.then(function (r) {
      $("item-save").disabled = false;
      if (r.error) { msg.className = "form-msg error"; msg.textContent = "Couldn't save: " + r.error.message; return; }
      $("item-dialog").close();
      loadAll();
    });
  });

  function deleteItem(id, btn) {
    if (btn.getAttribute("data-armed") !== "true") {
      btn.setAttribute("data-armed", "true"); btn.textContent = "Tap again to delete";
      setTimeout(function () { if (btn.isConnected) { btn.setAttribute("data-armed", "false"); btn.textContent = "Delete"; } }, 3000);
      return;
    }
    sb.from("items").delete().eq("id", id).then(function (r) {
      if (r.error) { $("summary").textContent = "Couldn't delete: " + r.error.message; return; }
      loadAll();
    });
  }

  // ---------- render ----------
  function renderPeople() {
    var wrap = $("people"); wrap.innerHTML = "";
    Object.keys(DATA.people).forEach(function (key) {
      wrap.appendChild(el("button", {
        type: "button", "aria-pressed": String(key === state.person), text: DATA.people[key].name,
        onclick: function () { state.person = key; state.filter = "all"; history.replaceState(null, "", location.pathname + "#" + key); render(); }
      }));
    });
  }

  function renderHeader(p) {
    var tt = THEME_TEXT[state.person] || THEME_TEXT.trevor;
    document.body.setAttribute("data-theme", state.person);
    document.title = p.name + "'s Wishlist";
    $("eyebrow").textContent = tt.eyebrow;
    $("person-name").textContent = p.name;
    $("bday-title").textContent = tt.bday;
    $("xmas-title").textContent = tt.xmas;

    var av = $("avatar"); av.innerHTML = "";
    if (p.photo) av.appendChild(el("img", { src: p.photo, alt: p.name }));
    else av.appendChild(el("div", { "class": "avatar-empty" }, [
      el("span", { "class": "avatar-initial", text: p.name.charAt(0) }),
      el("span", { "class": "avatar-hint", text: "Photo here" })
    ]));

    var b = countdown(p.birthday, "Happy birthday");
    $("bday-days").textContent = b.num; $("bday-label").textContent = b.label;
    var x = countdown("12-25", "Merry Christmas");
    $("xmas-days").textContent = x.num; $("xmas-label").textContent = x.label;
    $("gift-line").textContent = p.giftLine || "";
    $("sizes-line").textContent = p.sizesLine || "";
  }

  function renderFilters() {
    Array.prototype.forEach.call($("filters").querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === state.filter));
    });
  }

  function renderItems() {
    var f = state.filter, editable = canEdit();
    var rows = (state.items[state.person] || [])
      .filter(function (it) { return f === "all" || it.occ === f || it.occ === "either"; })
      .map(function (it, i) { return { it: it, i: i, c: !!state.claims[it.id] }; })
      .sort(function (a, b) { return (a.c - b.c) || ((b.it.top ? 1 : 0) - (a.it.top ? 1 : 0)) || (a.i - b.i); });

    var grid = $("grid"); grid.innerHTML = "";
    rows.forEach(function (row) {
      var it = row.it, c = row.c, href = safeUrl(it.link);
      var kids = [
        el("div", { "class": "card-head" }, [
          el("span", { "class": "cat", text: it.category || "" }),
          it.top ? el("span", { "class": "badge" }, [svg(STAR), document.createTextNode("Most wanted")]) : null
        ]),
        el("div", null, [
          el("h2", { text: it.name }),
          it.note ? el("p", { "class": "note", text: it.note }) : null
        ]),
        el("div", { "class": "meta" }, [
          it.price ? el("span", { "class": "price", text: it.price }) : null,
          el("span", { "class": "occ", text: OCC[it.occ] || "Either one" })
        ]),
        el("div", { "class": "actions" }, [
          href ? el("a", { "class": "btn-link", href: href, target: "_blank", rel: "noopener noreferrer" }, [document.createTextNode("View item"), svg(ARROW)]) : null,
          el("button", {
            type: "button", "class": "btn-claim", "aria-pressed": String(c),
            text: c ? "Someone’s got it" : "I’m getting this",
            onclick: function () { setClaim(it.id, !c); }
          })
        ])
      ];
      if (editable) {
        var del = el("button", { type: "button", "class": "danger", "data-armed": "false", text: "Delete" });
        del.addEventListener("click", function () { deleteItem(it.id, del); });
        kids.push(el("div", { "class": "card-tools" }, [
          el("button", { type: "button", text: "Edit", onclick: function () { openItem(it); } }),
          del
        ]));
      }
      grid.appendChild(el("article", { "class": "card" + (it.top ? " top" : "") + (c ? " claimed" : "") }, kids));
    });

    var empty = $("empty");
    empty.hidden = !state.loaded || rows.length !== 0;
    empty.textContent = editable ? "Nothing here yet. Tap “+ Add item” to start." : "Nothing here for this one yet.";
    var open = rows.filter(function (r) { return !r.c; }).length;
    $("summary").textContent = state.loaded ? (open + " of " + rows.length + " still up for grabs") : "Loading…";
  }

  function renderEditBar() {
    var on = !!state.session;
    $("edit-bar").hidden = !on;
    document.body.classList.toggle("editing", on);
    $("edit-open").hidden = on;
    if (!on) return;
    if (!state.editorPerson) {
      $("edit-who").textContent = "Signed in, but not set up as an editor";
      $("add-item").hidden = true;
    } else {
      $("edit-who").textContent = "Editing " + DATA.people[state.editorPerson].name + "'s list";
      $("add-item").hidden = !canEdit();
    }
  }

  function render() {
    renderPeople();
    renderHeader(DATA.people[state.person]);
    renderFilters();
    renderItems();
    renderEditBar();
  }

  // ---------- events ----------
  $("filters").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-filter]");
    if (!b) return;
    state.filter = b.getAttribute("data-filter"); render();
  });
  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").replace("#", "").toLowerCase();
    if (DATA.people[h]) { state.person = h; render(); }
  });
  $("edit-open").addEventListener("click", openLogin);
  $("add-item").addEventListener("click", function () { openItem(null); });
  $("sign-out").addEventListener("click", function () { if (sb) sb.auth.signOut(); });
  Array.prototype.forEach.call(document.querySelectorAll("dialog [data-close]"), function (b) {
    b.addEventListener("click", function () { b.closest("dialog").close(); });
  });

  // ---------- start ----------
  render();
  loadAll();
  if (sb) {
    sb.auth.getSession().then(function (r) { setSession(r.data.session); });
    sb.auth.onAuthStateChange(function (_evt, session) {
      var had = state.session && state.session.user.id, now = session && session.user.id;
      if (had !== now) setSession(session);
    });
  }
})();
