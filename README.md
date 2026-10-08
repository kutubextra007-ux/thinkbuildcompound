# think.build.compound.

KB's personal journal: **https://thinkbuildcompound.com**

A plain static site: HTML, one CSS file, one small vanilla-JS file. There is no build step, no framework and no server. It is hosted free on GitHub Pages.

## Structure

```
index.html                  Home (hero, Think/Build/Compound, latest stories, About teaser)
stories.html                Stories archive (filters + search, newest first)
about.html                  About KB and the philosophy
404.html                    Not-found page (GitHub Pages serves it automatically)
stories/
  a-saturday-morning-at-walmart.html
  _template.html            Copy this to write a new story (not listed, noindex)
assets/
  css/style.css             All styles; design tokens at the top
  js/main.js                Mobile nav + renders story cards from stories.json
  data/stories.json         The story index: one entry per story
  fonts/                    Self-hosted fonts (Source Serif 4, Inter, Caveat; OFL)
  images/                   Illustrations, favicon, social-share image
sitemap.xml  robots.txt  .nojekyll
```

## Adding a story (about 5 minutes)

1. **Copy** `stories/_template.html` to `stories/<slug>.html`. The slug is lowercase with hyphens, e.g. `lessons-from-my-first-customer`.
2. **Edit the new file:** replace every `[BRACKETED]` value (title, description, dates, category, canonical URL, image), remove the `<meta name="robots" content="noindex">` line, and write the story as `<p>` paragraphs.
3. **Add an image** (optional) to `assets/images/`. A 1200×675 JPG works best. Always write alt text.
4. **Register it** in `assets/data/stories.json` by adding one object:
   ```json
   {
     "slug": "lessons-from-my-first-customer",
     "title": "Lessons From My First Customer",
     "url": "stories/lessons-from-my-first-customer.html",
     "date": "2026-10-20",
     "category": "build",
     "tags": ["Business"],
     "excerpt": "One or two sentences for the card.",
     "image": "assets/images/lessons-first-customer.jpg",
     "imageAlt": "Describe the image",
     "readMinutes": 5
   }
   ```
   `category` must be `think`, `build` or `compound`. Order doesn't matter; the site sorts by date. Add `"draft": true` to hide an entry.

   **Scheduling:** give a story a future `date` and it stays off the Home and Stories pages until midnight US Central on that date, then appears on its own. The story page itself is live at its URL as soon as it's pushed (unlinked), so you can proofread it there first.
5. **Add the URL** to `sitemap.xml`.
6. **Commit and push.** GitHub Pages republishes in about a minute. The home page, Stories archive, filters and search pick it up automatically.

## Local preview

```
python3 -m http.server 8000
```
Then open http://localhost:8000. Story cards load through `fetch`, so opening the files directly with `file://` won't show them.

## Content rules

- Real content only. No invented stories, stats, testimonials or quotes.
- Refer to the author as **KB**.
- No coaching or consulting offers, newsletter pop-ups, or net-worth details.
- The book project is not mentioned on the site until KB decides otherwise.

## Images to replace before or after launch

All current artwork consists of original placeholder illustrations made for this site. Replace them with real photos (keep the same filenames, or update the paths):

| File | Used on | Suggested size |
|---|---|---|
| `assets/images/hero-landscape.svg` | Home hero (right side) | 1600×1000 JPG |
| `assets/images/about-morning.svg` | Home About section, About page | 1200×900 JPG |
| `assets/images/banner-ridge.svg` | Home quote banner | 2400×640 JPG |
| `assets/images/story-saturday-morning.svg` | Walmart story card + header | 1200×675 JPG |
| `assets/images/og-image.png` | Link previews (social share) | 1200×630 PNG |

If you switch an image to `.jpg`, update its path in the HTML (and in `stories.json` for story images).

## Analytics

Cloudflare Web Analytics (cookie-free, no consent banner needed). The beacon snippet sits just before `</body>` on every page, including `stories/_template.html`, so new stories are tracked automatically. View traffic in the Cloudflare dashboard under Web Analytics.

## Deployment

GitHub Pages serves this repository from the `main` branch root. The custom domain `thinkbuildcompound.com` is set in the repository's Pages settings, together with the `CNAME` file. HTTPS is enforced there once DNS resolves.
