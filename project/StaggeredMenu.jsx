/* StaggeredMenu — React Bits (JS + CSS), adapted for DC runtime.
   - Uses global window.React and window.gsap (loaded via CDN in the host).
   - Injects its own CSS (brand-tuned warm palette) once.
   - Closes the panel when a menu item is clicked. */

const { useCallback, useLayoutEffect, useRef, useState, useEffect } = React;

/* ---- inject component CSS once ---- */
(function injectCss() {
  if (document.getElementById('staggered-menu-css')) return;
  const css = `
.staggered-menu-wrapper{position:relative;width:100%;height:100%;z-index:40;pointer-events:none;}
.staggered-menu-wrapper.fixed-wrapper{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:40;overflow:hidden;}
.staggered-menu-header{position:absolute;top:0;left:0;width:100%;display:flex;align-items:center;justify-content:space-between;padding:1.4em 2em;background:transparent;pointer-events:none;z-index:20;}
.staggered-menu-header>*{pointer-events:auto;}
.sm-logo{display:flex;align-items:center;user-select:none;}
.sm-logo-img{display:block;height:30px;width:auto;object-fit:contain;}
.sm-toggle{position:relative;display:inline-flex;align-items:center;gap:0.5rem;background:transparent;border:none;cursor:pointer;color:#FBF6EE;font-family:'Figtree',sans-serif;font-weight:600;font-size:15px;letter-spacing:.04em;line-height:1;overflow:visible;}
.sm-toggle:focus-visible{outline:2px solid #BD933Faa;outline-offset:4px;border-radius:4px;}
.sm-toggle-textWrap{position:relative;display:inline-block;height:1em;overflow:hidden;white-space:nowrap;width:var(--sm-toggle-width,auto);min-width:var(--sm-toggle-width,auto);}
.sm-toggle-textInner{display:flex;flex-direction:column;line-height:1;}
.sm-toggle-line{display:block;height:1em;line-height:1;}
.sm-icon{position:relative;width:14px;height:14px;flex:0 0 14px;display:inline-flex;align-items:center;justify-content:center;will-change:transform;}
.sm-icon-line{position:absolute;left:50%;top:50%;width:100%;height:2px;background:currentColor;border-radius:2px;transform:translate(-50%,-50%);will-change:transform;}
.sm-panel-itemWrap{position:relative;overflow:hidden;line-height:1;}
.staggered-menu-panel{position:absolute;top:0;right:0;width:clamp(280px,40vw,460px);height:100%;background:#FBF6EE;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;flex-direction:column;padding:6.5em 2.6em 2.6em 2.6em;overflow-y:auto;z-index:10;pointer-events:auto;opacity:0;}
[data-position='left'] .staggered-menu-panel{right:auto;left:0;}
.sm-prelayers{position:absolute;top:0;right:0;bottom:0;width:clamp(280px,40vw,460px);pointer-events:none;z-index:5;opacity:0;}
[data-position='left'] .sm-prelayers{right:auto;left:0;}
.sm-prelayer{position:absolute;top:0;right:0;height:100%;width:100%;transform:translateX(0);opacity:0;}
.sm-panel-inner{flex:1;display:flex;flex-direction:column;gap:1.25rem;}
.sm-socials{margin-top:auto;padding-top:2rem;display:flex;flex-direction:column;gap:0.75rem;}
.sm-socials-title{margin:0;font-family:'Figtree',sans-serif;font-size:1rem;font-weight:600;letter-spacing:.04em;color:var(--sm-accent,#BD933F);}
.sm-socials-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:row;align-items:center;gap:1.2rem;flex-wrap:wrap;}
.sm-socials-link{font-family:'Figtree',sans-serif;font-size:1.15rem;font-weight:500;color:#3A2818;text-decoration:none;position:relative;padding:2px 0;display:inline-block;transition:color .3s ease,opacity .3s ease;}
.sm-socials-link:hover{color:var(--sm-accent,#BD933F);}
.staggered-menu-panel .sm-socials-list .sm-socials-link{opacity:1;transition:opacity .3s ease;}
.staggered-menu-panel .sm-socials-list:hover .sm-socials-link:not(:hover){opacity:0.4;}
.staggered-menu-panel .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible){opacity:0.4;}
.staggered-menu-panel .sm-socials-list .sm-socials-link:hover,.staggered-menu-panel .sm-socials-list .sm-socials-link:focus-visible{opacity:1;}
.sm-socials-link:focus-visible{outline:2px solid var(--sm-accent,#BD933F);outline-offset:3px;}
.sm-panel-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.4rem;}
.sm-panel-item{position:relative;color:#3A2818;font-family:'Figtree',sans-serif;font-weight:700;font-size:clamp(2.2rem,5vw,3.4rem);cursor:pointer;line-height:1.04;letter-spacing:-1.5px;text-transform:uppercase;transition:color .25s;display:inline-block;text-decoration:none;padding-right:1.4em;}
.sm-panel-item:hover{color:var(--sm-accent,#BD933F);}
.sm-panel-itemLabel{display:inline-block;will-change:transform;transform-origin:50% 100%;}
.sm-panel-list[data-numbering]{counter-reset:smItem;}
.sm-panel-list[data-numbering] .sm-panel-item::after{counter-increment:smItem;content:counter(smItem,decimal-leading-zero);position:absolute;top:0.2em;right:0.4em;font-size:16px;font-weight:500;font-family:'Figtree',sans-serif;color:var(--sm-accent,#BD933F);letter-spacing:0;pointer-events:none;user-select:none;opacity:var(--sm-num-opacity,0);}
@media (max-width:1024px){.staggered-menu-panel{width:100%;left:0;right:0;}.sm-prelayers{width:100%;left:0;right:0;}.staggered-menu-wrapper[data-open] .sm-logo-img{filter:invert(78%) sepia(18%) saturate(900%) hue-rotate(360deg) brightness(60%);}}
`;
  const style = document.createElement('style');
  style.id = 'staggered-menu-css';
  style.textContent = css;
  document.head.appendChild(style);
})();

const StaggeredMenu = ({
  position = 'right',
  colors = ['#B497CF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = 'assets/logo.svg',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#5227FF',
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);
  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const textWrapRef = useRef(null);
  const [textLines, setTextLines] = useState(['Menu', 'Close']);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = null;
    let cancelled = false;
    const init = () => {
      const gsap = window.gsap;
      if (!gsap) return false;
      ctx = gsap.context(() => {
        const panel = panelRef.current;
        const preContainer = preLayersRef.current;
        const plusH = plusHRef.current;
        const plusV = plusVRef.current;
        const icon = iconRef.current;
        const textInner = textInnerRef.current;
        if (!panel || !plusH || !plusV || !icon || !textInner) return;

        let preLayers = [];
        if (preContainer) preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
        preLayerElsRef.current = preLayers;

        const offscreen = position === 'left' ? -100 : 100;
        gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
        if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
        gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
        gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
        gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
        gsap.set(textInner, { yPercent: 0 });
        if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      });
      return true;
    };
    if (!init()) {
      const t = setInterval(() => {
        if (cancelled) { clearInterval(t); return; }
        if (init()) clearInterval(t);
      }, 60);
      setTimeout(() => clearInterval(t), 8000);
    }
    return () => { cancelled = true; if (ctx) ctx.revert(); };
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const gsap = window.gsap;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel || !gsap) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) { closeTweenRef.current.kill(); closeTweenRef.current = null; }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(panel, { xPercent: panelStart }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
      if (numberEls.length) {
        tl.to(numberEls, { duration: 0.6, ease: 'power2.out', '--sm-num-opacity': 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08, from: 'start' }, onComplete: () => { gsap.set(socialLinks, { clearProps: 'opacity' }); } }, socialsStart + 0.04);
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else { busyRef.current = false; }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    const gsap = window.gsap;
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel || !gsap) return;
    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
        const socialTitle = panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busyRef.current = false;
      }
    });
  }, [position]);

  const animateIcon = useCallback(opening => {
    const gsap = window.gsap;
    const icon = iconRef.current;
    if (!icon || !gsap) return;
    spinTweenRef.current?.kill();
    if (opening) spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    else spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
  }, []);

  const animateColor = useCallback(opening => {
    const gsap = window.gsap;
    const btn = toggleBtnRef.current;
    if (!btn || !gsap) return;
    colorTweenRef.current?.kill();
    if (changeMenuColorOnOpen) {
      const targetColor = opening ? openMenuButtonColor : menuButtonColor;
      colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
    } else { gsap.set(btn, { color: menuButtonColor }); }
  }, [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]);

  useEffect(() => {
    const gsap = window.gsap;
    if (toggleBtnRef.current && gsap) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else { gsap.set(toggleBtnRef.current, { color: menuButtonColor }); }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback(opening => {
    const gsap = window.gsap;
    const inner = textInnerRef.current;
    if (!inner || !gsap) return;
    textCycleAnimRef.current?.kill();
    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) { last = last === 'Menu' ? 'Close' : 'Menu'; seq.push(last); }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, { yPercent: -finalShift, duration: 0.5 + lineCount * 0.07, ease: 'power4.out' });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) { onMenuOpen?.(); playOpen(); } else { onMenuClose?.(); playClose(); }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handleClickOutside = event => {
      if (panelRef.current && !panelRef.current.contains(event.target) && toggleBtnRef.current && !toggleBtnRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, open, closeMenu]);

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={accentColor ? { ['--sm-accent']: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
          let arr = [...raw];
          if (arr.length >= 3) { const mid = Math.floor(arr.length / 2); arr.splice(mid, 1); }
          return arr.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>
      <header className="staggered-menu-header" aria-label="Main navigation header">
        <div className="sm-logo" aria-label="Logo">
          <img src={logoUrl} alt="Ivanna Soto" className="sm-logo-img" draggable={false} width={150} height={28} />
        </div>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((l, i) => (<span className="sm-toggle-line" key={i}>{l}</span>))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={plusHRef} className="sm-icon-line" />
            <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  <a className="sm-panel-item" href={it.link} aria-label={it.ariaLabel} data-index={idx + 1} onClick={() => closeMenu()}>
                    <span className="sm-panel-itemLabel">{it.label}</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item"><span className="sm-panel-itemLabel">No items</span></span>
              </li>
            )}
          </ul>
          {displaySocials && socialItems && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Sígueme</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <li key={s.label + i} className="sm-socials-item">
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">{s.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StaggeredMenu, default: StaggeredMenu };
}
window.StaggeredMenu = StaggeredMenu;
