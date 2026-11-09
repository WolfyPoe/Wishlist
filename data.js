// ============================================================
//  Site settings: names, birthdays, photos, sizes.
//
//  Once Supabase is connected (bottom of this file), the wishlist
//  ITEMS come from Supabase and you add them from your phone with
//  "Edit my list" at the bottom of the site. The `items` below are
//  only demo cards shown until then.
//
//  birthday: "MM-DD"   photo: path or URL, e.g. "images/trevor.jpg"
// ============================================================

window.WISHLIST = {
  year: 2026,

  people: {
    trevor: {
      name: "Trevor",
      birthday: "12-08",            // e.g. "12-08"
      photo: "trev.png",               // e.g. "images/trevor.jpg"
      giftLine: "Gift cards are always a win too: Steam || Amazon || MicroCenter.",
      sizesLine: "Sizes: shirt Medium/Large · hoodie Large · boots 12",
      items: [
        { id: "t1", category: "Fishing",     name: "[Item name]", note: "[Rod, reel, lure, or gear details]",          price: "[$ price]", occ: "christmas", top: true,  link: "#" },
        { id: "t2", category: "3D Printing", name: "[Item name]", note: "[Filament type and color, part, or upgrade]", price: "[$ price]", occ: "birthday",  top: true,  link: "#" },
        { id: "t3", category: "Gaming",      name: "[Item name]", note: "[Game, platform, or edition]",                price: "[$ price]", occ: "either",    top: false, link: "#" },
        { id: "t4", category: "Hunting",     name: "[Item name]", note: "[Size, camo pattern, or model]",              price: "[$ price]", occ: "christmas", top: false, link: "#" },
        { id: "t5", category: "Coding",      name: "[Item name]", note: "[Keyboard, gadget, book, or course]",         price: "[$ price]", occ: "birthday",  top: false, link: "#" },
        { id: "t6", category: "Wildcard",    name: "[Item name]", note: "[Something fun]",                             price: "[$ price]", occ: "either",    top: false, link: "#" }
      ]
    },

    maya: {
      name: "Maya",
      birthday: "09-03",
      photo: "may.png",
      giftLine: "Gift cards are always a win too: Amazon.",
      sizesLine: "Sizes: shirt [SIZE] · hoodie [SIZE] · ring [SIZE]",
      items: [
        { id: "m1", category: "Crystals & Gems", name: "[Item name]", note: "[Stone, shape, or size]",                      price: "[$ price]", occ: "christmas", top: true,  link: "#" },
        { id: "m2", category: "Music & Merch",   name: "[Item name]", note: "[Album, vinyl, tee size, or tour merch]",      price: "[$ price]", occ: "birthday",  top: true,  link: "#" },
        { id: "m3", category: "Witchy",          name: "[Item name]", note: "[Tarot deck, candles, herbs, or altar pieces]", price: "[$ price]", occ: "either",    top: false, link: "#" },
        { id: "m4", category: "Jewelry",         name: "[Item name]", note: "[Metal, stone, or ring size]",                 price: "[$ price]", occ: "christmas", top: false, link: "#" },
        { id: "m5", category: "Books",           name: "[Item name]", note: "[Title or author]",                            price: "[$ price]", occ: "birthday",  top: false, link: "#" },
        { id: "m6", category: "Wildcard",        name: "[Item name]", note: "[Something fun]",                              price: "[$ price]", occ: "either",    top: false, link: "#" }
      ]
    }
  }
};

// ------------------------------------------------------------
//  Supabase: holds the items and the "I'm getting this" claims.
//  Fill in from your Supabase project (Project Settings → API).
//  Left blank, the site shows the demo items above.
// ------------------------------------------------------------
window.WISHLIST_SUPABASE = {
  url: "",      // e.g. "https://abcd1234.supabase.co"
  anonKey: ""   // the "anon public" key
};
