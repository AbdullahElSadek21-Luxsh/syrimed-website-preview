# SyriMed Website Redesign — preview

> **Status: DRAFT — for review, not a released build.**

Public preview of the redesigned SyriMed website (syrimed.co.uk), built on the existing static site and its content.

**Live:** https://abdullahelsadek21-luxsh.github.io/syrimed-website-preview/

The link opens the site's homepage; it can be browsed like the live site.

## Files
Static pages, no build step, no backend. The site lives in `version-1/`; the start page redirects there. The redesign
is in `css/modern.css` and `js/modern.js`, and web-sized image copies are in `img/opt/` and `img/modern/`.

The contact, careers and partnership forms post to PHP endpoints that are not part of this preview, so they do not
submit here.

Differences from the source folder, applied to this preview only:
- every page carries `noindex, nofollow`;
- the third-party analytics script (inspiration-insight.com) is removed, so preview visits are not recorded.

The pages are served with `noindex` and excluded in `robots.txt`, so they should stay out of search results. The URL
is unlisted, not access-controlled — anyone holding the link can open it.
