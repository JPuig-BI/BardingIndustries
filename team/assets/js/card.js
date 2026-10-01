/**
 * card.js — Barding Industries team business card.
 *
 * Shared render + vCard engine for every team member's card. Each person's
 * HTML page defines one CARD_DATA object (see team/jaume-contact.html for
 * the reference instance, team/README.md for how to add a new person) and
 * loads this script, which renders the visible card AND builds the vCard
 * from that same object — there is deliberately only one place per person
 * to update contact details, unlike the two-place (markup + config object)
 * setup on the personal-site template this was adapted from.
 *
 * Expected CARD_DATA shape — see README for the annotated version:
 * {
 *   name, role, credential, tagline,
 *   photo: { src, alt },
 *   affiliations: [{ icon, text }],           // optional, omit section if empty
 *   contacts: [{ icon, value, href, hint }],   // rendered in order given
 *   socials: [{ icon, href, label }],
 *   primaryLink: { text, href },
 *   updated: "Month Year",
 *   vcard: {
 *     org, title,
 *     urls: [{ label, url }],
 *     photoScript: "assets/photos/<name>-photo.js"   // optional, lazy-loaded
 *   }
 * }
 */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function renderCard(data) {
  document.title = document.title || `${data.name} | Barding Industries`;

  // ---- Header ----
  const photoWrap = document.querySelector('[data-card-field="photo"]');
  if (photoWrap && data.photo) {
    const img = el('img', 'profile-img');
    img.src = data.photo.src;
    img.alt = data.photo.alt || data.name;
    img.width = 108;
    img.height = 108;
    photoWrap.appendChild(img);
  }
  setText('[data-card-field="name"]', data.name, 'h1');
  setText('[data-card-field="role"]', data.role, 'h2');
  setText('[data-card-field="credential"]', data.credential);
  setText('[data-card-field="tagline"]', data.tagline);

  // ---- Affiliations (optional) ----
  const affSection = document.querySelector('[data-card-section="affiliations"]');
  if (affSection) {
    if (data.affiliations && data.affiliations.length) {
      const list = affSection.querySelector('.info-list');
      data.affiliations.forEach((a) => {
        const li = el('li');
        const icon = el('i', `${a.icon} icon`);
        icon.setAttribute('aria-hidden', 'true');
        li.appendChild(icon);
        li.appendChild(document.createTextNode(' ' + a.text));
        list.appendChild(li);
      });
    } else {
      affSection.remove();
    }
  }

  // ---- Contact ----
  const contactList = document.querySelector('[data-card-field="contact-list"]');
  if (contactList && data.contacts) {
    data.contacts.forEach((c) => {
      const li = el('li', 'contact-item');
      const icon = el('i', `${c.icon} icon`);
      icon.setAttribute('aria-hidden', 'true');
      li.appendChild(icon);
      const a = el('a', 'contact-link');
      a.href = c.href;
      if (c.external) { a.target = '_blank'; a.rel = 'noopener'; }
      if (c.copyValue) a.setAttribute('data-copy', c.copyValue);
      a.title = c.copyHint || '';
      a.appendChild(document.createTextNode(c.value + ' '));
      if (c.hint) a.appendChild(el('span', 'hint', c.hint));
      li.appendChild(a);
      contactList.appendChild(li);
    });
  }

  // ---- Socials ----
  const socialWrap = document.querySelector('[data-card-field="socials"]');
  if (socialWrap && data.socials && data.socials.length) {
    data.socials.forEach((s) => {
      const a = el('a', 'social-icon');
      a.href = s.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', s.label);
      const icon = el('i', s.icon);
      icon.setAttribute('aria-hidden', 'true');
      a.appendChild(icon);
      socialWrap.appendChild(a);
    });
  } else if (socialWrap) {
    socialWrap.remove();
  }

  // ---- Footer ----
  const primary = document.querySelector('[data-card-field="primary-link"]');
  if (primary && data.primaryLink) {
    primary.href = data.primaryLink.href;
    primary.textContent = data.primaryLink.text;
  } else if (primary) {
    primary.remove();
  }
  setText('[data-card-field="updated"]', data.updated ? `Updated ${data.updated}` : '');

  wireCopyToClipboard();
  wireSaveContact(data);
}

function setText(selector, value, tag) {
  const node = document.querySelector(selector);
  if (!node) return;
  if (!value) { node.remove(); return; }
  node.textContent = value;
}

function wireCopyToClipboard() {
  const toast = document.getElementById('copy-toast');
  let toastTimeout;
  document.querySelectorAll('.contact-link[data-copy]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const isDesktop = window.matchMedia('(pointer: fine)').matches;
      if (!isDesktop) return; // touch devices follow the tel:/mailto: href normally
      e.preventDefault();
      const textToCopy = link.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (!toast) return;
        toast.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.add('hidden'), 2500);
      }).catch((err) => console.error('Failed to copy text: ', err));
    });
  });
}

/**
 * vCard 4.0 generation, driven by the same CARD_DATA object that renders
 * the visible card — phone/email/socials never need to be entered twice.
 */
function generateVCard(data) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const [first, ...rest] = data.name.split(' ');
  const last = rest.join(' ');

  const lines = ['BEGIN:VCARD', 'VERSION:4.0', `PRODID:-//Barding Industries//${data.name}//EN`];
  lines.push(`N:${last};${first};;;`);
  lines.push(`FN:${data.name}`);
  if (data.vcard.org) lines.push(`ORG:${data.vcard.org}`);
  if (data.vcard.title || data.role) lines.push(`TITLE:${data.vcard.title || data.role}`);
  if (typeof CARD_PHOTO !== 'undefined' && CARD_PHOTO) {
    lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${CARD_PHOTO}`);
  }
  (data.contacts || []).forEach((c) => {
    if (c.icon.includes('phone') || c.icon.includes('whatsapp')) {
      const num = (c.copyValue || c.value).replace(/[^\d+]/g, '');
      lines.push(`TEL;VALUE=uri;PREF=1;TYPE="voice";X-ABLabel="${c.hint || 'Phone'}":tel:${num}`);
    } else if (c.icon.includes('envelope')) {
      lines.push(`EMAIL;TYPE=PREF:${c.copyValue || c.value}`);
    }
  });
  (data.vcard.urls || []).forEach((u) => lines.push(`URL;TYPE=${u.label}:${u.url}`));
  if (data.tagline) lines.push(`NOTE:${data.tagline}`);
  lines.push(`REV:${now}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function wireSaveContact(data) {
  const btn = document.querySelector('[data-save-contact]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    function buildAndDownload() {
      const vcf = generateVCard(data);
      const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.name.toLowerCase().replace(/\s+/g, '-') + '.vcf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (!data.vcard.photoScript || typeof CARD_PHOTO !== 'undefined') {
      buildAndDownload();
      return;
    }
    const script = document.createElement('script');
    script.src = data.vcard.photoScript;
    script.onload = buildAndDownload;
    script.onerror = buildAndDownload;
    document.body.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CARD_DATA !== 'undefined') renderCard(CARD_DATA);
});
