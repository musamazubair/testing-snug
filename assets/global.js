function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}


function fetchConfig(type = "json") {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: `application/${type}`,
        },
    };
}


let subscribers = {}
function subscribe(eventName, callback) {
  if (subscribers[eventName] === undefined) {
    subscribers[eventName] = []
  }

  subscribers[eventName] = [...subscribers[eventName], callback];

  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback
    });
  }
};

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data)
    })
  }
}


function checkFlexGap() {
    // create flex container with row-gap set
    var flex = document.createElement("div");
    flex.style.display = "flex";
    flex.style.flexDirection = "column";
    flex.style.rowGap = "1px";

    // create two, elements inside it
    flex.appendChild(document.createElement("div"));
    flex.appendChild(document.createElement("div"));

    // append to the DOM (needed to obtain scrollHeight)
    document.body.appendChild(flex);
    var isSupported = flex.scrollHeight === 1; // flex container should be 1px high from the row-gap
    //flex.parentNode.removeChild(flex);

    return isSupported;
}
if (checkFlexGap()) {
    document.documentElement.classList.add("flexbox-gap");
} else {
    document.documentElement.classList.add("no-flexbox-gap");
}


function focusVisiblePolyfill() {
    const navKeys = [
        "ARROWUP",
        "ARROWDOWN",
        "ARROWLEFT",
        "ARROWRIGHT",
        "TAB",
        "ENTER",
        "SPACE",
        "ESCAPE",
        "HOME",
        "END",
        "PAGEUP",
        "PAGEDOWN",
    ];
    let currentFocusedElement = null;
    let mouseClick = null;

    window.addEventListener("keydown", (event) => {
        if (navKeys.includes(event.code.toUpperCase())) {
            mouseClick = false;
        }
    });

    window.addEventListener("mousedown", (event) => {
        mouseClick = true;
    });

    window.addEventListener(
        "focus",
        () => {
            if (currentFocusedElement)
                currentFocusedElement.classList.remove("focused");

            if (mouseClick) return;

            currentFocusedElement = document.activeElement;
            currentFocusedElement.classList.add("focused");
        },
        true
    );
}
try {
    document.querySelector(":focus-visible");
} catch (e) {
    focusVisiblePolyfill();
}


function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
        )
    ).filter((ele) => ele.offsetWidth !== 0 || ele.offsetHeight !== 0);
}


const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
    var elements = getFocusableElements(container);
    // console.log(elements);
    var first = elements[0];
    var last = elements[elements.length - 1];

    removeTrapFocus();

    trapFocusHandlers.focusin = (event) => {
        if (
            event.target !== container &&
            event.target !== last &&
            event.target !== first
        )
            return;

        document.addEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.focusout = function () {
        document.removeEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.keydown = function (event) {
        if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
            event.preventDefault();
            first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if (
            (event.target === container || event.target === first) &&
            event.shiftKey
        ) {
            event.preventDefault();
            last.focus();
        }
    };

    document.addEventListener("focusout", trapFocusHandlers.focusout);
    document.addEventListener("focusin", trapFocusHandlers.focusin);

    elementToFocus.focus();

    if (elementToFocus.tagName === 'INPUT' &&
        ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
        elementToFocus.value) {
        elementToFocus.setSelectionRange(0, elementToFocus.value.length);
    }

}


function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener("focusin", trapFocusHandlers.focusin);
    document.removeEventListener("focusout", trapFocusHandlers.focusout);
    document.removeEventListener("keydown", trapFocusHandlers.keydown);

    if (elementToFocus) elementToFocus.focus();
}


function onKeyUpEscape(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    const summaryElement = openDetailsElement.querySelector("summary");
    openDetailsElement.removeAttribute("open");
    summaryElement.setAttribute("aria-expanded", false);
    summaryElement.focus();
}


function scrolledCheck() {
    if (window.pageYOffset > 0) {
        document.body.classList.add("window-scrolled");
    } else {
        document.body.classList.remove("window-scrolled");
    }
}
scrolledCheck();
window.addEventListener("scroll", scrolledCheck);


function setStaticViewportHeight() {
    const value = window.innerHeight;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--viewport-height-fixed");
    if (value != currentValue) {
        document.documentElement.style.setProperty(
            "--viewport-height-fixed",
            `${value}px`
        );
    }
}

function setViewportHeightUnit() {
    const value = window.innerHeight * 0.01;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--vh");

    if (value != currentValue) {
        document.documentElement.style.setProperty("--vh", `${value}px`);
    }
}

function setStaticHeaderTopPosition() {
    const header = document.getElementById("header");
    if(!header) return;
    const value = header.getBoundingClientRect().top;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--header-top-position-fixed");

    if (value && value != currentValue) {
        document.documentElement.style.setProperty(
            "--header-top-position-fixed",
            `${value}px`
        );
    }
}

function setHeaderTopPosition() {
    const header = document.getElementById("header");
    if(!header) return;
    const value = header.getBoundingClientRect().top;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--header-top-position");

    if (value && value != currentValue) {
        document.documentElement.style.setProperty(
            "--header-top-position",
            `${value}px`
        );
    }
}

function setStaticHeaderBottomPosition() {
    const header = document.getElementById("header-wrapper");
    if(!header) return;
    const value = header.getBoundingClientRect().bottom;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--header-bottom-position-fixed");

    if (value && value != currentValue) {
        document.documentElement.style.setProperty(
            "--header-bottom-position-fixed",
            `${value}px`
        );
    }
}

function setHeaderBottomPosition() {
    const header = document.getElementById("header-wrapper");
    if(!header) return;
    const value = header.getBoundingClientRect().bottom;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--header-bottom-position");

    if (value && value != currentValue) {
        document.documentElement.style.setProperty(
            "--header-bottom-position",
            `${value}px`
        );
    }
}

function setHeaderHeight() {
    const header = document.getElementById("header");
    if(!header) return;
    const value = header.getBoundingClientRect().height;
    const currentValue = getComputedStyle(document.documentElement).getPropertyValue("--header-height");

    if (value && value != currentValue) {
        document.documentElement.style.setProperty(
            "--header-height",
            `${value}px`
        );
    }
}






function setCustomPropertiesOnLoad() {

    setStaticViewportHeight();
    setStaticHeaderTopPosition();
    setStaticHeaderBottomPosition();

    setViewportHeightUnit();

    setHeaderTopPosition();
    setHeaderHeight();
    setHeaderBottomPosition();
}

function setCustomPropertiesOnScroll() {
    setHeaderBottomPosition();
    setHeaderTopPosition();
}

function setCustomPropertiesOnResize() {
    setViewportHeightUnit();
}

window.addEventListener("load", setCustomPropertiesOnLoad, false);

window.addEventListener("scroll", debounce(setCustomPropertiesOnScroll, 300), false);

window.addEventListener("resize", debounce(setCustomPropertiesOnResize, 300), false);


function pauseAllMedia() {
    document.querySelectorAll(".js-youtube").forEach((video) => {
        video.contentWindow.postMessage(
            '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
            "*"
        );
    });
    document.querySelectorAll(".js-vimeo").forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', "*");
    });
    document.querySelectorAll("video").forEach((video) => {
        if (video.hasAttribute("control") || video.id.includes("vjs")) {
            video.pause();
        }
    });
    document.querySelectorAll("product-model").forEach((model) => {
        if (model.modelViewerUI) model.modelViewerUI.pause();
    });
}




/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
    window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    }
};

Shopify.setSelectorByValue = function (selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];
        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function (target, eventName, callback) {
    target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
    options = options || {};
    var method = options['method'] || 'post';
    var params = options['parameters'] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
    this.countryEl = document.getElementById(country_domid);
    this.provinceEl = document.getElementById(province_domid);
    this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

    Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

    this.initCountry();
    this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
    initCountry: function () {
        var value = this.countryEl.getAttribute('data-default');
        Shopify.setSelectorByValue(this.countryEl, value);
        this.countryHandler();
    },

    initProvince: function () {
        var value = this.provinceEl.getAttribute('data-default');
        if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
        }
    },

    countryHandler: function (e) {
        var opt = this.countryEl.options[this.countryEl.selectedIndex];
        var raw = opt.getAttribute('data-provinces');
        var provinces = JSON.parse(raw);

        this.clearOptions(this.provinceEl);
        if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = 'none';
        } else {
            for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement('option');
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
            }

            this.provinceContainer.style.display = "";
        }
    },

    clearOptions: function (selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    },

    setOptions: function (selector, values) {
        for (var i = 0, count = values.length; i < values.length; i++) {
            var opt = document.createElement('option');
            opt.value = values[i];
            opt.innerHTML = values[i];
            selector.appendChild(opt);
        }
    }
};

/*
 * Shopify Common JS
 *
 */


document.querySelectorAll("details summary").forEach((summary) => {
    summary.setAttribute(
        "aria-expanded",
        summary.parentNode.hasAttribute("open")
    );

    if (summary.nextElementSibling.getAttribute("id")) {
        summary.setAttribute("aria-controls", summary.nextElementSibling.id);
    }

    summary.addEventListener("click", (event) => {
        event.currentTarget.setAttribute(
            "aria-expanded",
            !event.currentTarget.closest("details").hasAttribute("open")
        );
    });

    if (summary.closest("header-drawer")) return;
    summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

document.querySelectorAll(".accordion-group").forEach((item) => {
    item.addEventListener("click", function (event) {
        let currentAccordion = event.target.closest(".accordion");
        let currentSummary = event.target.closest(".accordion summary");
        let accordionGroup = event.currentTarget;

        if (!currentSummary) return;
        if (!accordionGroup.contains(currentSummary)) return;

        accordionGroup.querySelectorAll(".accordion").forEach((accordion) => {
            if (accordion != currentAccordion) {
                accordion.removeAttribute("open");
            }
        });
    });
});



class HeaderDrawer extends HTMLElement {
    constructor() {
        super();

        this.drawerContainer = this.querySelector('.header-drawer-container');
        this.drawerToggle = this.drawerContainer.querySelector('.header-drawer-toggle');
        this.drawer = this.drawerContainer.querySelector('.header-drawer');
        this.drawerLink = this.drawerContainer.querySelectorAll('.header-drawer-menu-link');

        this.subDrawerContainers = this.drawerContainer.querySelectorAll('.header-subdrawer-container');
        this.subDrawerToggles = this.drawerContainer.querySelectorAll('.header-subdrawer-toggle');

        this.subDrawerCloseButtons = this.drawerContainer.querySelectorAll('.header-subdrawer-close');
        this.subDrawers = this.drawerContainer.querySelectorAll('.header-subdrawer');

        this.bindEvents();

    }

    bindEvents() {

        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('focusout', this.onDrawerFocusOut.bind(this));

        this.drawerToggle.addEventListener('click', this.onDrawerToggleClick.bind(this));

        this.drawerLink.forEach(item => {
            item.addEventListener('mouseenter', this.onDrawerLinkMouseEnter.bind(this));
        });

        this.subDrawerToggles.forEach(item => {
            item.addEventListener('click', this.onSubDrawerToggleClick.bind(this));
            item.addEventListener('mouseenter', this.onSubDrawerToggleMouseEnter.bind(this));

        });

        this.subDrawerCloseButtons.forEach(item => {
            item.addEventListener('click', this.onSubDrawerCloseButtonClick.bind(this))
        });

        this.subDrawerContainers.forEach(item => {
            item.addEventListener('focusout', this.onSubDrawerFocusOut.bind(this))
        });

    }

    onDrawerToggleClick(event) {
        event.preventDefault();

        if (this.isDrawerOpen()) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }

    }

    onSubDrawerToggleClick(event) {
        event.preventDefault();

        const subDrawerToggle = event.currentTarget;
        const subDrawerContainer = subDrawerToggle.parentNode;

        if (this.isSubDrawerOpen(subDrawerContainer)) {
            this.closeSubDrawer(subDrawerContainer);
        } else {
            this.openSubDrawer(subDrawerContainer);
        }

    }

    onSubDrawerCloseButtonClick(event) {
        event.preventDefault();

        const detailsElement = event.currentTarget.closest('details');
        this.closeSubDrawer(detailsElement);
    }

    onSubDrawerToggleMouseEnter(event) {

        const subDrawerToggle = event.currentTarget;
        const subDrawerContainer = subDrawerToggle.parentNode;

        if (this.isSubDrawerClose(subDrawerContainer)) {
            this.openSubDrawer(subDrawerContainer);
        }

    }

    onDrawerLinkMouseEnter(event) {

        if (this.hasSubDrawerOpen()) {
            this.closeAllSubDrawers();
        }

    }

    onDrawerFocusOut(event) {
        const relatedTarget = event.relatedTarget;
        setTimeout(() => {
            if (this.isDrawerOpen() && !this.drawerContainer.contains(relatedTarget))
                this.closeDrawer();
        });
    }

    onSubDrawerFocusOut(event) {
        const subDrawerContainer = event.currentTarget;
        const relatedTarget = event.relatedTarget;
        setTimeout(() => {
            if (this.hasSubDrawerOpen() && relatedTarget === this.drawer)
                this.closeSubDrawer(subDrawerContainer);
        });
    }

    onKeyUp(event) {

        if (event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if (!openDetailsElement) return;

        if (openDetailsElement === this.drawerContainer) {
            this.closeDrawer(this.drawerToggle)
        } else {
            this.closeSubDrawer(openDetailsElement);
        }

    }


    isDrawerOpen() {
        return this.drawerContainer.hasAttribute('open') && this.drawerContainer.classList.contains('open');
    }

    isSubDrawerOpen(detailsElement) {
        return detailsElement.hasAttribute('open') && detailsElement.classList.contains('open');
    }

    isSubDrawerClose(detailsElement) {
        return !detailsElement.hasAttribute('open');
    }

    hasSubDrawerOpen() {
        return this.drawerContainer.classList.contains('subdrawer-open');
    }

    openDrawer() {

        // open drawer
        setTimeout(() => {
            this.drawerContainer.setAttribute('open', '');
            this.drawerContainer.classList.add('open');
            this.drawerToggle.setAttribute('aria-expanded', true);
        });

        // trap focus
        trapFocus(this.drawerContainer, this.drawerToggle);

        // update status
        document.body.classList.add("header-drawer-open", "overflow-hidden");
    }


    openSubDrawer(detailsElement) {

        const summaryElement = detailsElement.querySelector('summary');

        // close all sub drawers
        this.closeAllSubDrawers();

        // open sub drawer
        setTimeout(() => {
            detailsElement.setAttribute('open', '');
            detailsElement.classList.add('open');
            summaryElement.setAttribute('aria-expanded', true);
        });

        // trap focus
        trapFocus(detailsElement, summaryElement);

        // update status
        this.drawerContainer.classList.add('subdrawer-open');

    }


    closeDrawer(elementToFocus = false) {

        this.drawer.addEventListener('transitionend', (event) => {

            // close drawer
            this.drawerContainer.removeAttribute('open');
            this.drawerToggle.setAttribute("aria-expanded", false);

        }, { once: true });


        // close all sub drawers
        this.closeAllSubDrawers();

        // remove trap focus
        removeTrapFocus(elementToFocus);

        //  close drawer animation
        this.drawerContainer.classList.remove('open');

        // update status
        document.body.classList.remove("header-drawer-open", "overflow-hidden");

    }

    closeSubDrawer(detailsElement) {

        const summaryElement = detailsElement.querySelector('summary');
        const menuElement = summaryElement.nextElementSibling;

        menuElement.addEventListener('transitionend', (event) => {

            // close sub drawer

            detailsElement.removeAttribute('open');
            summaryElement.setAttribute('aria-expanded', false);

        }, { once: true });

        // remove trap focus
        removeTrapFocus(summaryElement);

        // close sub drawer animation
        detailsElement.classList.remove('open');

        // update status
        this.drawerContainer.classList.remove('subdrawer-open');
    }

    closeAllSubDrawers() {
        this.subDrawerContainers.forEach(item => {
            if (this.isSubDrawerOpen(item)) {
                this.closeSubDrawer(item);
            }
        });
    }

}
customElements.define("header-drawer", HeaderDrawer);

class MenuDrawer extends HTMLElement {
    constructor() {
        super();

        this.mainDetailsToggle = this.querySelector('details');

        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('focusout', this.onFocusOut.bind(this));
        this.bindEvents();
    }

    bindEvents() {
        this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
        this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if (!openDetailsElement) return;

        openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
    }

    onSummaryClick(event) {
        const summaryElement = event.currentTarget;
        const detailsElement = summaryElement.parentNode;
        const parentMenuElement = detailsElement.closest('.has-submenu');
        const isOpen = detailsElement.hasAttribute('open');
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        function addTrapFocus() {
            trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
            summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
        }

        if (detailsElement === this.mainDetailsToggle) {
            if (isOpen) event.preventDefault();
            isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

            if (window.matchMedia('(max-width: 990px)')) {
                document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
            }
        } else {
            setTimeout(() => {
                detailsElement.classList.add('menu-opening');
                summaryElement.setAttribute('aria-expanded', true);
                parentMenuElement && parentMenuElement.classList.add('submenu-open');
                !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
            }, 100);
        }
    }

    openMenuDrawer(summaryElement) {
        setTimeout(() => {
            this.mainDetailsToggle.classList.add('menu-opening');
        });
        summaryElement.setAttribute('aria-expanded', true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
    }

    closeMenuDrawer(event, elementToFocus = false) {
        if (event === undefined) return;

        this.mainDetailsToggle.classList.remove('menu-opening');
        this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
            details.removeAttribute('open');
            details.classList.remove('menu-opening');
        });
        this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach(submenu => {
            submenu.classList.remove('submenu-open');
        });
        document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
        removeTrapFocus(elementToFocus);
        this.closeAnimation(this.mainDetailsToggle);
    }

    onFocusOut(event) {
        setTimeout(() => {
            if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
        });
    }

    onCloseButtonClick(event) {
        const detailsElement = event.currentTarget.closest('details');
        this.closeSubmenu(detailsElement);
    }

    closeSubmenu(detailsElement) {
        const parentMenuElement = detailsElement.closest('.submenu-open');
        parentMenuElement && parentMenuElement.classList.remove('submenu-open');
        detailsElement.classList.remove('menu-opening');
        detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
        removeTrapFocus(detailsElement.querySelector('summary'));
        this.closeAnimation(detailsElement);
    }

    closeAnimation(detailsElement) {
        let animationStart;

        const handleAnimation = (time) => {
            if (animationStart === undefined) {
                animationStart = time;
            }

            const elapsedTime = time - animationStart;

            if (elapsedTime < 400) {
                window.requestAnimationFrame(handleAnimation);
            } else {
                detailsElement.removeAttribute('open');
                if (detailsElement.closest('details[open]')) {
                    trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
                }
            }
        }

        window.requestAnimationFrame(handleAnimation);
    }
}
customElements.define('menu-drawer', MenuDrawer);

class ModalOpener extends HTMLElement {
    constructor() {
        super();

        const button = this.querySelector("button");

        if (!button) return;
        button.addEventListener("click", () => {
            const modal = document.querySelector(this.getAttribute("data-modal"));
            if (modal) modal.show(button);
        });
    }
}
customElements.define("modal-opener", ModalOpener);

class ModalDialog extends HTMLElement {
    constructor() {
        super();

        this.querySelector('[id^="ModalClose-"]').addEventListener(
            "click",
            this.hide.bind(this, false)
        );

        this.addEventListener("keyup", (event) => {
            if (event.code.toUpperCase() === "ESCAPE") this.hide();
        });

        if (this.classList.contains("media-modal")) {
            this.addEventListener("click", (event) => {
                this.hide();
            });
        } else {
            this.addEventListener("click", (event) => {
                if (event.target === this) this.hide();
            });
        }
    }

    connectedCallback() {
        if (this.moved) return;
        this.moved = true;
        document.body.appendChild(this);
    }

    show(opener) {
        this.openedBy = opener;
        const popup = this.querySelector(".template-popup");
        document.body.classList.add("overflow-hidden");
        this.setAttribute("open", "");
        this.querySelector('[role="dialog"]').classList.add("active");
        if (popup) popup.loadContent();
        trapFocus(this, this.querySelector('[role="dialog"]'));
        window.pauseAllMedia();
    }

    hide() {

        if (this.querySelector('[role="dialog"]').classList.contains('modal-dialog--animation')) {

            this.querySelector('[role="dialog"]').addEventListener(
                "transitionend",
                () => {
                    window.pauseAllMedia();
                    removeTrapFocus(this.openedBy);
                    this.removeAttribute("open");
                    document.body.classList.remove("overflow-hidden");
                    document.body.dispatchEvent(new CustomEvent("modalClosed"));
                },
                { once: true }
            );

            this.querySelector('[role="dialog"]').classList.remove("active");

        }
        else {

            window.pauseAllMedia();
            removeTrapFocus(this.openedBy);
            this.querySelector('[role="dialog"]').classList.remove("active");
            this.removeAttribute("open");
            document.body.classList.remove("overflow-hidden");
            document.body.dispatchEvent(new CustomEvent("modalClosed"));

        }

    }
}
customElements.define("modal-dialog", ModalDialog);

class ProductModal extends ModalDialog {
    constructor() {
        super();
    }

    hide() {
        super.hide();
    }

    show(opener) {
        super.show(opener);
        this.showActiveMedia();
    }

    showActiveMedia() {
        this.querySelectorAll(
            `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute(
                "data-media-id"
            )}"])`
        ).forEach((element) => {
            element.classList.remove("active");
        });
        const activeMedia = this.querySelector(
            `[data-media-id="${this.openedBy.getAttribute("data-media-id")}"]`
        );
        const activeMediaTemplate = activeMedia.querySelector("template");
        const activeMediaContent = activeMediaTemplate
            ? activeMediaTemplate.content
            : null;
        activeMedia.classList.add("active");
        activeMedia.scrollIntoView();

        const container = this.querySelector('[role="document"]');

        if (activeMedia.clientWidth > container.clientWidth && activeMedia.clientHeight > container.clientHeight) {
            container.scrollLeft =
                (activeMedia.clientWidth - container.clientWidth) / 2;
            container.scrollTop =
                (activeMedia.clientHeight - container.clientHeight) / 2;
        }

    }
}
customElements.define("product-modal", ProductModal);

class ProductMediaCollage extends HTMLElement {
    constructor() {
        super();
    }

    refresh(variantData) {

        const variantTitle = variantData.title;
        const variantTitleArray = variantTitle.split(' / ');

        const target = this.querySelector('.product-media-collage-tile-list');
        let mediaCounter = 0;
        Array.from(target.children).forEach((item) => {

            const mediaAltLArray = item.dataset.mediaAlt.split(' / ');
            let isMediaAltMatched = true;

            for (const mediaAltItem of mediaAltLArray) {
                if (!variantTitleArray.includes(mediaAltItem)) {
                    isMediaAltMatched = false;
                    break;
                }
            }

            if (item.dataset.variantMedia == "true" && !isMediaAltMatched) {
                item.classList.add('hidden');
            }
            else {
                item.classList.remove('hidden');
                item.querySelector('[data-media-index]').dataset.mediaIndex = mediaCounter;
                mediaCounter++;
            }
        });

    }


}
customElements.define("product-media-collage", ProductMediaCollage);

class ProductMediaSlider extends HTMLElement {
    constructor() {
        super();

        this.swiper = null;
        this.init();
    }

    init() {
        this.loadContent(this.getDefaultVariantData());
        this.initSlider();
    }

    refresh(variantData) {
        if (this.swiper) {
            this.destroySlider();
        }
        this.loadContent(variantData);
        this.initSlider();
    }

    initSlider() {

        this.swiper = new Swiper(this, {
            loop: false,
            speed: 400,
            focusableElements: '.focusDisableSwiper',
            pagination: {
                el: '.swiper-pagination--line',
                type: 'bullets',
                bulletClass: 'swiper-pagination-bullet--line',
                bulletActiveClass: 'active'
            },
            on: {

                activeIndexChange: function (swiper) {

                    const currentSlideVideo = swiper.slides[swiper.activeIndex].querySelector('video');
                    const previousSlideVideo = swiper.slides[swiper.previousIndex].querySelector('video');
                    if (previousSlideVideo) {
                        previousSlideVideo.pause();
                    }
                    if (currentSlideVideo) {
                        currentSlideVideo.play();
                    }

                }
            }
        });

    }

    loadContent(variantData) {
        const variantTitle = variantData.title;
        const templateContent = this.querySelector('template').content.cloneNode(true);
        const target = this.querySelector('.swiper-wrapper');
        target.innerHTML = '';
        target.append(templateContent);
        let counter = 0;
        Array.from(target.children).forEach(function (item) {
            if (item.dataset.variantMedia == "true" && !variantTitle.includes(item.dataset.mediaAlt)) {
                item.remove();
            }
            else {
                item.querySelector('[data-media-index]').dataset.mediaIndex = counter;
                counter++;
            }
        });

    }

    destroySlider() {
        this.swiper.destroy(true, true);
    }

    getDefaultVariantData() {
        return JSON.parse(this.querySelector('[type="application/json"]').textContent);
    }

}
customElements.define("product-media-slider", ProductMediaSlider);

class ProductSliderModal extends ModalDialog {
    constructor() {
        super();

        this.slider = this.querySelector('.product-zoom-slider');
        this.swiper = null;
        this.init();
    }

    hide() {
        super.hide();
    }

    show(opener) {
        super.show(opener);
        this.showActiveMedia();
    }

    showActiveMedia() {
        const activeMediaIndex = this.openedBy.dataset.mediaIndex;
        this.swiper.slideTo(activeMediaIndex, 0);
    }

    init() {
        this.loadContent(this.getDefaultVariantData());
        this.initSlider();
    }

    refresh(variantData) {
        if (this.swiper) {
            this.destroySlider();
        }
        this.loadContent(variantData);
        this.initSlider();
    }

    initSlider() {

        this.swiper = new Swiper(this.slider, {
            loop: false,
            speed: 400,
            focusableElements: '.focusDisableSwiper',
            navigation: {
                prevEl: ".swiper-nav-button--prev",
                nextEl: ".swiper-nav-button--next",
                disabledClass: "disabled--hidden"
            },
            pagination: {
                el: '.swiper-pagination--fraction',
                type: 'fraction',
            },
            on: {
                activeIndexChange: function (swiper) {

                    const currentSlideVideo = swiper.slides[swiper.activeIndex].querySelector('video');
                    const previousSlideVideo = swiper.slides[swiper.previousIndex].querySelector('video');
                    if (previousSlideVideo) {
                        previousSlideVideo.pause();
                    }
                    if (currentSlideVideo) {
                        currentSlideVideo.play();
                    }

                },
            }
        });

    }

    loadContent(variantData) {
        const variantTitle = variantData.title;
        const templateContent = this.querySelector('template').content.cloneNode(true);
        const target = this.querySelector('.swiper-wrapper');
        target.innerHTML = '';
        target.append(templateContent);
        Array.from(target.children).forEach(function (item) {
            if (item.dataset.variantMedia == "true" && !variantTitle.includes(item.dataset.mediaAlt)) {
                item.remove();
            }
        });

    }

    destroySlider() {
        this.swiper.destroy(true, true);
    }

    getDefaultVariantData() {
        return JSON.parse(this.querySelector('[type="application/json"]').textContent);
    }

}
customElements.define("product-slider-modal", ProductSliderModal);

class DetailsModal extends HTMLElement {
    constructor() {
        super();
        this.detailsContainer = this.querySelector('details');
        this.summaryToggle = this.querySelector('summary');

        this.detailsContainer.addEventListener(
            'keyup',
            (event) => event.code.toUpperCase() === 'ESCAPE' && this.close()
        );
        this.summaryToggle.addEventListener(
            'click',
            this.onSummaryClick.bind(this)
        );
        this.querySelector('button[type="button"]').addEventListener(
            'click',
            this.close.bind(this)
        );

        this.summaryToggle.setAttribute('role', 'button');
    }

    isOpen() {
        return this.detailsContainer.hasAttribute('open');
    }

    onSummaryClick(event) {
        event.preventDefault();
        event.target.closest('details').hasAttribute('open')
            ? this.close()
            : this.open(event);
    }

    onBodyClick(event) {
        if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
    }

    open(event) {
        this.onBodyClickEvent =
            this.onBodyClickEvent || this.onBodyClick.bind(this);
        event.target.closest('details').setAttribute('open', true);
        document.body.addEventListener('click', this.onBodyClickEvent);
        document.body.classList.add('overflow-hidden');

        trapFocus(
            this.detailsContainer.querySelector('[tabindex="-1"]'),
            this.detailsContainer.querySelector('input:not([type="hidden"])')
        );
    }

    close(focusToggle = true) {
        removeTrapFocus(focusToggle ? this.summaryToggle : null);
        this.detailsContainer.removeAttribute('open');
        document.body.removeEventListener('click', this.onBodyClickEvent);
        document.body.classList.remove('overflow-hidden');
    }
}
customElements.define("details-modal", DetailsModal);

class DetailsDropdown extends HTMLElement {
    constructor() {
        super();
        this.mainDetailsToggle = this.querySelector("details");
        this.content =
            this.mainDetailsToggle.querySelector("summary").nextElementSibling;

        this.mainDetailsToggle.addEventListener(
            "focusout",
            this.onFocusOut.bind(this)
        );
        this.mainDetailsToggle.addEventListener("toggle", this.onToggle.bind(this));
    }

    onFocusOut() {
        setTimeout(() => {
            if (!this.contains(document.activeElement)) this.close();
        });
    }

    onToggle() {
        if (!this.animations) this.animations = this.content.getAnimations();

        if (this.mainDetailsToggle.hasAttribute("open")) {
            this.animations.forEach((animation) => animation.play());
        } else {
            this.animations.forEach((animation) => animation.cancel());
        }
    }

    close() {
        this.mainDetailsToggle.removeAttribute("open");
        this.mainDetailsToggle
            .querySelector("summary")
            .setAttribute("aria-expanded", false);
    }
}
customElements.define("details-dropdown", DetailsDropdown);

class ProductMediaGallery extends HTMLElement {
    constructor() {
        super();
    }

}
customElements.define("product-media-gallery", ProductMediaGallery);

class ProductRecommendations extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
  
        fetch(this.dataset.url)
          .then(response => response.text())
          .then(text => {
            const html = document.createElement('div');
            html.innerHTML = text;
            const recommendations = html.querySelector('product-recommendations');
  
            if (recommendations && recommendations.innerHTML.trim().length) {
              this.innerHTML = recommendations.innerHTML;
            }
  
            if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
              this.remove();
            }
  
            if (html.querySelector('.grid__item')) {
              this.classList.add('product-recommendations--loaded');
            }
          })
          .catch(e => {
            console.error(e);
          });
      }
  
      new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
    }
}
customElements.define('product-recommendations', ProductRecommendations);



class PromoBar extends HTMLElement {
    constructor() {
        super();

        this.slider = this.querySelector('.promo-bar-slider');
    }
    connectedCallback() {

        this.swiper = new Swiper(this.slider, {
            loop: true,
            speed: 400,
            allowTouchMove: false,
            followFinger: false,
            simulateTouch: false,
            effect: "fade",
            fadeEffect: {
                crossFade: true
            },
            autoplay: {
                pauseOnMouseEnter: false,
                disableOnInteraction: false,
            }
        });

    }
}
customElements.define('promo-bar', PromoBar);

class HomePageSlider extends HTMLElement {
    constructor() {
        super();

        this.slider = this.querySelector('.hp-slider');
    }
    connectedCallback() {

        this.swiper = new Swiper(this.slider, {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 0,
            mousewheel: {
                forceToAxis: true,
            },
            freeMode: {
                enabled: false,
                sticky: false,
            },
            navigation: {
                prevEl: ".swiper-nav-button--prev",
                nextEl: ".swiper-nav-button--next",
                disabledClass: "disabled--hidden"
            },

            pagination: {
                el: ".swiper-pagination",
                type: 'custom',
                renderCustom: function (swiper, current, total) {
                    return current + ' | ' + (total);
                }
            },

            keyboard: {
                enabled: true,
                onlyInViewport: true,
                pageUpDown: true
            },

            on: {

                slideChangeTransitionStart: function (swiper, speed, internal) {
                    // get the control color of the next slide
                    const activeSlide = swiper.slides[swiper.activeIndex];
                    const activeSlideControlColor = activeSlide.dataset.sliderControlColor;
                    // spread the control color to slider 
                    swiper.el.style.setProperty(
                        "--swiper-theme-color",
                        activeSlideControlColor
                    );
                    swiper.el.style.setProperty(
                        "--swiper-navigation-color",
                        activeSlideControlColor
                    );
                }

            }

        });

    }
}
customElements.define('homepage-slider', HomePageSlider);


class HomePageProductCarousel extends HTMLElement {
    constructor() {
        super();

        this.carousel = this.querySelector('.hp-product-carousel');
    }
    connectedCallback() {

        this.swiper = new Swiper(this.carousel, {

            slidesPerView: 1.5,
            spaceBetween: 2,
            mousewheel: {
                forceToAxis: true,
            },
            navigation: {
                prevEl: ".swiper-nav-button--prev",
                nextEl: ".swiper-nav-button--next",
                disabledClass: "disabled--hidden"
            },
            breakpoints: {
                769: {
                    slidesPerView: 2.2,
                    freeMode: {
                        enabled: true
                    },
                },
                992: {
                    slidesPerView: 3.2,
                    freeMode: {
                        enabled: true
                    },
                },
                1200: {
                    slidesPerView: 4.2,
                    freeMode: {
                        enabled: true
                    },
                },
            },

        });


    }
}
customElements.define('homepage-product-carousel', HomePageProductCarousel);