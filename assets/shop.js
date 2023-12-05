class QuantityInput extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('input');
        this.changeEvent = new Event('change', { bubbles: true });

        this.input.addEventListener('change', this.onInputChange.bind(this));
        this.querySelectorAll('button').forEach(
            (button) => button.addEventListener('click', this.onButtonClick.bind(this))
        );
    }

    quantityUpdateUnsubscriber = undefined;

    connectedCallback() {
        this.validateQtyRules();
        this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
    }

    disconnectedCallback() {
        if (this.quantityUpdateUnsubscriber) {
            this.quantityUpdateUnsubscriber();
        }
    }

    onInputChange(event) {
        this.validateQtyRules();
    }

    onButtonClick(event) {
        event.preventDefault();
        const previousValue = this.input.value;

        event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
        if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }

    validateQtyRules() {
        const value = parseInt(this.input.value);
        if (this.input.min) {
            const min = parseInt(this.input.min);
            const buttonMinus = this.querySelector(".quantity__button[name='minus']");
            buttonMinus.classList.toggle('disabled', value <= min);
        }
        if (this.input.max) {
            const max = parseInt(this.input.max);
            const buttonPlus = this.querySelector(".quantity__button[name='plus']");
            buttonPlus.classList.toggle('disabled', value >= max);
        }
    }
}
customElements.define("quantity-input", QuantityInput);


class VariantSelects extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('change', this.onVariantChange);
    }
  
    onVariantChange() {
      this.updateOptions();
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantStatuses();
  
      if (!this.currentVariant) {
        this.toggleAddButton(true, '', true);
        this.setUnavailable();
      } else {
        this.updateMedia();
        this.updateURL();
        this.updateVariantInput();
        this.renderProductInfo();
        this.updateShareUrl();
      }
    }
  
    updateOptions() {
      this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
    }
  
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }
  
    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media) return;
  
      const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
      mediaGalleries.forEach(mediaGallery => mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true));
  
      const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
      if (!modalContent) return;
      const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
      modalContent.prepend(newMediaModal);
    }
  
    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }
  
    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.dataset.section}`);
      if (!shareButton || !shareButton.updateUrl) return;
      shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
    }
  
    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  
    updateVariantStatuses() {
      const selectedOptionOneVariants = this.variantData.filter(variant => this.querySelector(':checked').value === variant.option1);
      const inputWrappers = [...this.querySelectorAll('.product-form__input')];
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
        const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
        const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
        this.setInputAvailability(optionInputs, availableOptionInputsValue)
      });
    }
  
    setInputAvailability(listOfOptions, listOfAvailableOptions) {
      listOfOptions.forEach(input => {
        if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
          input.innerText = input.getAttribute('value');
        } else {
          input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
        }
      });
    }
  
    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('pickup-availability');
      if (!pickUpAvailability) return;
  
      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }
  
    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;
  
      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }
  
    renderProductInfo() {
      const requestedVariantId = this.currentVariant.id;
      const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
  
      fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          // prevent unnecessary ui changes from abandoned selections
          if (this.currentVariant.id !== requestedVariantId) return;
  
          const html = new DOMParser().parseFromString(responseText, 'text/html')
          const destination = document.getElementById(`price-${this.dataset.section}`);
          const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
          const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
          if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
          if (skuSource && skuDestination) {
            skuDestination.innerHTML = skuSource.innerHTML;
            skuDestination.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
          }
  
          const price = document.getElementById(`price-${this.dataset.section}`);
  
          if (price) price.classList.remove('visibility-hidden');
  
          if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');
  
          const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
          this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);
  
          publish(PUB_SUB_EVENTS.variantChange, {data: {
            sectionId,
            html,
            variant: this.currentVariant
          }});
        });
    }
  
    toggleAddButton(disable = true, text, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
      const addButtonText = productForm.querySelector('[name="add"] > span');
      if (!addButton) return;
  
      if (disable) {
        addButton.setAttribute('disabled', 'disabled');
        if (text) addButtonText.textContent = text;
      } else {
        addButton.removeAttribute('disabled');
        addButtonText.textContent = window.variantStrings.addToCart;
      }
  
      if (!modifyClass) return;
    }
  
    setUnavailable() {
      const button = document.getElementById(`product-form-${this.dataset.section}`);
      const addButton = button.querySelector('[name="add"]');
      const addButtonText = button.querySelector('[name="add"] > span');
      const price = document.getElementById(`price-${this.dataset.section}`);
      const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
      const sku = document.getElementById(`Sku-${this.dataset.section}`);
  
      if (!addButton) return;
      addButtonText.textContent = window.variantStrings.unavailable;
      if (price) price.classList.add('visibility-hidden');
      if (inventory) inventory.classList.add('visibility-hidden');
      if (sku) sku.classList.add('visibility-hidden');
    }
  
    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
}
customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}
customElements.define("variant-radios", VariantRadios);

class ProductInfo extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('.quantity__input');
        this.currentVariant = this.querySelector('.product-variant-id');
        this.variantSelects = this.querySelector('variant-radios')
        this.submitButton = this.querySelector('[type="submit"]');
    }

    cartUpdateUnsubscriber = undefined;
    variantChangeUnsubscriber = undefined;

    connectedCallback() {
        if (!this.input) return;
        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;
        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
            this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
            if (event.data.sectionId !== sectionId) return;
            this.updateQuantityRules(event.data.sectionId, event.data.html);
            this.setQuantityBoundries();
        });
    }

    disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
            this.cartUpdateUnsubscriber();
        }
        if (this.variantChangeUnsubscriber) {
            this.variantChangeUnsubscriber();
        }
    }

    setQuantityBoundries() {
        const data = {
            cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
            min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
            max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
            step: this.input.step ? parseInt(this.input.step) : 1
        }

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.input.min = min;
        this.input.max = max;
        this.input.value = min;
        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
    }

    fetchQuantityRules() {
        if (!this.currentVariant || !this.currentVariant.value) return;
        this.querySelector('.quantity__rules-cart .loading-overlay').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${this.currentVariant.value}&section_id=${this.dataset.section}`).then((response) => {
            return response.text()
        })
            .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                this.updateQuantityRules(this.dataset.section, html);
                this.setQuantityBoundries();
            })
            .catch(e => {
                console.error(e);
            })
            .finally(() => {
                this.querySelector('.quantity__rules-cart .loading-overlay').classList.add('hidden');
            });
    }

    updateQuantityRules(sectionId, html) {
        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
            const current = this.quantityForm.querySelector(selector);
            const updated = quantityFormUpdated.querySelector(selector);
            if (!current || !updated) continue;
            if (selector === '.quantity__input') {
                const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
                for (let attribute of attributes) {
                    const valueUpdated = updated.getAttribute(attribute);
                    if (valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
                }
            } else {
                current.innerHTML = updated.innerHTML;
            }
        }
    }
}
customElements.define('product-info', ProductInfo);


class ProductForm extends HTMLElement {
    constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
            this.submitButton.setAttribute("aria-haspopup", "dialog");
    }

    onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading-overlay__spinner").classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
            formData.append(
                "sections",
                this.cart.getSectionsToRender().map((section) => section.section)
            );
            formData.append("sections_url", window.location.pathname);
            this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
            .then((response) => response.json())
            .then((response) => {
                if (response.status) {
                    this.handleErrorMessage(response.description);

                    const soldOutMessage =
                        this.submitButton.querySelector(".sold-out-message");
                    if (!soldOutMessage) return;
                    this.submitButton.setAttribute("aria-disabled", true);
                    this.submitButton.querySelector("span").classList.add("hidden");
                    soldOutMessage.classList.remove("hidden");
                    this.error = true;
                    return;
                } else if (!this.cart) {
                    window.location = window.routes.cart_url;
                    return;
                }

                if (!this.error) publish(PUB_SUB_EVENTS.cartUpdate, {source: 'product-form'});
                this.error = false;
                const quickAddModal = this.closest(".modal");
                if (quickAddModal) {
                    document.body.addEventListener(
                        "modalClosed",
                        () => {
                            setTimeout(() => {
                                this.cart.renderContents(response);
                            });
                        },
                        { once: true }
                    );
                    quickAddModal.hide(true);
                } else {
                    this.cart.renderContents(response);
                }
            })
            .catch((e) => {
                console.error(e);
            })
            .finally(() => {
                this.submitButton.classList.remove("loading");
                if (this.cart && this.cart.classList.contains("is-empty"))
                    this.cart.classList.remove("is-empty");
                if (!this.error) this.submitButton.removeAttribute("aria-disabled");
                this.querySelector(".loading-overlay__spinner").classList.add("hidden");
            });
    }

    handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
            this.errorMessageWrapper ||
            this.querySelector(".product-form-error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
            this.errorMessage ||
            this.errorMessageWrapper.querySelector(".product-form-error-message");

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
            this.errorMessage.textContent = errorMessage;
        }
    }
}
customElements.define("product-form", ProductForm);

class QuickAddModal extends ModalDialog {
    constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
    }

    hide(preventFocus = false) {
        const cartNotification =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = "";

        if (preventFocus) this.openedBy = null;
        super.hide();
    }

    show(opener) {
        opener.setAttribute("aria-disabled", true);
        opener.classList.add("loading");
        opener
            .querySelector(".loading-overlay__spinner")
            .classList.remove("hidden");

        fetch(opener.getAttribute("data-product-url"))
            .then((response) => response.text())
            .then((responseText) => {
                const responseHTML = new DOMParser().parseFromString(
                    responseText,
                    "text/html"
                );
                this.productElement = responseHTML.querySelector(
                    'section[id^="MainProduct-"]'
                );
                this.preventDuplicatedIDs();
                this.removeDOMElements();
                this.setInnerHTML(this.modalContent, this.productElement.innerHTML);

                if (window.Shopify && Shopify.PaymentButton) {
                    Shopify.PaymentButton.init();
                }

                if (window.ProductModel) window.ProductModel.loadShopifyXR();

                this.removeGalleryListSemantic();
                this.updateImageSizes();
                this.preventVariantURLSwitching();
                super.show(opener);
            })
            .finally(() => {
                opener.removeAttribute("aria-disabled");
                opener.classList.remove("loading");
                opener
                    .querySelector(".loading-overlay__spinner")
                    .classList.add("hidden");
            });
    }

    setInnerHTML(element, html) {
        element.innerHTML = html;

        // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
        element.querySelectorAll("script").forEach((oldScriptTag) => {
            const newScriptTag = document.createElement("script");
            Array.from(oldScriptTag.attributes).forEach((attribute) => {
                newScriptTag.setAttribute(attribute.name, attribute.value);
            });
            newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
            oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
    }

    preventVariantURLSwitching() {
        this.modalContent
            .querySelector("variant-radios,variant-selects")
            .setAttribute("data-update-url", "false");
    }

    removeDOMElements() {
        const pickupAvailability = this.productElement.querySelector(
            "pickup-availability"
        );
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = this.productElement.querySelector("product-modal");
        if (productModal) productModal.remove();
    }

    preventDuplicatedIDs() {
        const sectionId = this.productElement.dataset.section;
        this.productElement.innerHTML = this.productElement.innerHTML.replaceAll(
            sectionId,
            `quickadd-${sectionId}`
        );
        this.productElement
            .querySelectorAll("variant-selects, variant-radios")
            .forEach((variantSelect) => {
                variantSelect.dataset.originalSection = sectionId;
            });
    }

    removeGalleryListSemantic() {
        const galleryList = this.modalContent.querySelector(
            '[id^="Slider-Gallery"]'
        );
        if (!galleryList) return;

        galleryList.setAttribute("role", "presentation");
        galleryList
            .querySelectorAll('[id^="Slide-"]')
            .forEach((li) => li.setAttribute("role", "presentation"));
    }

    updateImageSizes() {
        const product = this.modalContent.querySelector(".product");
        const desktopColumns = product.classList.contains("product--columns");
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll(".product__media img");
        if (!mediaImages.length) return;

        let mediaImageSizes =
            "(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)";

        if (product.classList.contains("product--medium")) {
            mediaImageSizes = mediaImageSizes.replace("715px", "605px");
        } else if (product.classList.contains("product--small")) {
            mediaImageSizes = mediaImageSizes.replace("715px", "495px");
        }

        mediaImages.forEach((img) => img.setAttribute("sizes", mediaImageSizes));
    }
}
customElements.define("quick-add-modal", QuickAddModal);

class CartDrawer extends HTMLElement {
    constructor() {
        super();

        this.addEventListener(
            "keyup",
            (event) => event.code === "Escape" && this.close()
        );
        this.querySelector("#CartDrawer-Overlay").addEventListener(
            "click",
            this.close.bind(this)
        );

        this.querySelector("#CartDrawer-close").addEventListener(
            "click",
            this.close.bind(this)
        );

        this.setHeaderCartIconAccessibility();
    }

    setHeaderCartIconAccessibility() {
        const cartLink = document.querySelector("#cart-bubble");
        cartLink.setAttribute("role", "button");
        cartLink.setAttribute("aria-haspopup", "dialog");
        cartLink.addEventListener("click", (event) => {
            event.preventDefault();
            this.open(cartLink);
        });
        cartLink.addEventListener("keydown", (event) => {
            if (event.code.toUpperCase() === "SPACE") {
                event.preventDefault();
                this.open(cartLink);
            }
        });
    }

    open(opener) {
        if (opener) this.setActiveElement(opener);
        this.openBy = opener;
        this.setAttribute("open", "");
        this.querySelector(".cart-drawer-content").classList.add("active");

        trapFocus(this, this.querySelector('[role="dialog"]'));

        document.body.classList.add("cart-drawer-opening", "overflow-hidden");
    }

    close() {
        this.querySelector(".cart-drawer-content").addEventListener(
            "transitionend",
            () => {
                removeTrapFocus(this.openBy);
                this.removeAttribute("open");
                document.body.classList.remove(
                    "cart-drawer-opening",
                    "overflow-hidden"
                );
            },
            { once: true }
        );

        this.querySelector(".cart-drawer-content").classList.remove("active");
    }

    renderContents(parsedState) {

        this.querySelector(".cart-drawer-content").classList.contains("is-empty") &&
            this.querySelector(".cart-drawer-content").classList.remove("is-empty");

        this.getSectionsToRender().forEach((section => {
            const elementToReplace =
                document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id);
            if (elementToReplace)
                elementToReplace.innerHTML =
                    this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        }));

        window.Klarna.OnsiteMessaging.refresh();

        setTimeout(() => {
            this.querySelector("#CartDrawer-Overlay").addEventListener(
                "click",
                this.close.bind(this)
            );
            this.open();
        });
    }

    getSectionInnerHTML(html, selector = ".shopify-section") {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector).innerHTML;
    }

    getSectionsToRender() {
        return [
            {
                id: "CartDrawer",
                section: "cart-drawer",
                selector: ".cart-drawer-inner",
            },
            {
                id: "cart-bubble",
                section: "cart-bubble",
                selector: ".shopify-section",
            }
        ];
    }

    getSectionDOM(html, selector = ".shopify-section") {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector);
    }

    setActiveElement(element) {
        this.activeElement = element;
    }
}
customElements.define("cart-drawer", CartDrawer);

class CartItems extends HTMLElement {
    constructor() {
        super();
        this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');
    
        const debouncedOnChange = debounce((event) => {
          this.onChange(event);
        }, ON_CHANGE_DEBOUNCE_TIMER);
    
        this.addEventListener('change', debouncedOnChange.bind(this));
    }

    cartUpdateUnsubscriber = undefined;

    connectedCallback() {
      this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        if (event.source === 'cart-items') {
          return;
        }
        this.onCartUpdate();
      });
    }

    onChange(event) {
        this.updateQuantity(
            event.target.dataset.index,
            event.target.value,
            document.activeElement.getAttribute("name")
        );
    }

    onCartUpdate() {
        fetch(`${routes.cart_url}?section_id=main-cart-items`)
            .then((response) => response.text())
            .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                const sourceQty = html.querySelector('cart-items');
                this.innerHTML = sourceQty.innerHTML;
            })
            .catch(e => {
                console.error(e);
            });
    }

    getSectionsToRender() {
        return [
            {
                id: "CartDrawer",
                section: "cart-drawer",
                selector: ".cart-drawer-inner",
            },
            {
                id: "cart-bubble",
                section: "cart-bubble",
                selector: ".shopify-section",
            },
            {
                id: "main-cart-items",
                section: document.getElementById("main-cart-items")?.dataset.id,
                selector: ".js-contents",
            }
        ];
    }

    updateQuantity(line, quantity, name) {
        this.enableLoading(line);

        const body = JSON.stringify({
            line,
            quantity,
            sections: this.getSectionsToRender().map((section) => section.section),
            sections_url: window.location.pathname,
        });

        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
            .then((response) => {
                return response.text();
            })
            .then((state) => {
                const parsedState = JSON.parse(state);
                this.classList.toggle("is-empty", parsedState.item_count === 0);
                const cartDrawerWrapper = document.querySelector("cart-drawer");
                const cartFooter = document.getElementById("main-cart-footer");

                if (cartFooter)
                    cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
                if (cartDrawerWrapper)
                    cartDrawerWrapper.classList.toggle(
                        "is-empty",
                        parsedState.item_count === 0
                    );

                this.getSectionsToRender().forEach((section => {
                    const elementToReplace =
                        document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id);
                    if (elementToReplace)
                        elementToReplace.innerHTML =
                            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
                }));

                window.Klarna.OnsiteMessaging.refresh();

                this.updateLiveRegions(line, parsedState.item_count);
                const lineItem =
                    document.getElementById(`CartItem-${line}`) ||
                    document.getElementById(`CartDrawer-Item-${line}`);
                if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
                    cartDrawerWrapper
                        ? trapFocus(
                            cartDrawerWrapper,
                            lineItem.querySelector(`[name="${name}"]`)
                        )
                        : lineItem.querySelector(`[name="${name}"]`).focus();
                } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
                    trapFocus(
                        cartDrawerWrapper.querySelector(".drawer__inner-empty"),
                        cartDrawerWrapper.querySelector("a")
                    );
                } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
                    trapFocus(
                        cartDrawerWrapper,
                        document.querySelector(".cart-item__name")
                    );
                }
                this.disableLoading();
            })
            .catch(() => {
                this.querySelectorAll(".loading-overlay").forEach((overlay) =>
                    overlay.classList.add("hidden")
                );
                const errors =
                    document.getElementById("cart-errors") ||
                    document.getElementById("CartDrawer-CartErrors");
                errors.textContent = window.cartStrings.error;
                this.disableLoading();
            });
    }

    updateLiveRegions(line, itemCount) {
        if (this.currentItemCount === itemCount) {
            const lineItemError =
                document.getElementById(`Line-item-error-${line}`) ||
                document.getElementById(`CartDrawer-LineItemError-${line}`);
            const quantityElement =
                document.getElementById(`Quantity-${line}`) ||
                document.getElementById(`Drawer-quantity-${line}`);
            lineItemError.querySelector(".cart-item__error-text").innerHTML =
                window.cartStrings.quantityError.replace(
                    "[quantity]",
                    quantityElement.value
                );
        }

        this.currentItemCount = itemCount;
        this.lineItemStatusElement.setAttribute("aria-hidden", true);

        const cartStatus =
            document.getElementById("cart-live-region-text") ||
            document.getElementById("CartDrawer-LiveRegionText");
        cartStatus.setAttribute("aria-hidden", false);

        setTimeout(() => {
            cartStatus.setAttribute("aria-hidden", true);
        }, 1000);
    }

    getSectionInnerHTML(html, selector) {
        return new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(selector).innerHTML;
    }

    enableLoading(line) {
        const mainCartItems =
            document.getElementById("main-cart-items") ||
            document.getElementById("CartDrawer-CartItems");
        mainCartItems.classList.add("cart__items--disabled");

        const cartItemElements = this.querySelectorAll(
            `#CartItem-${line} .loading-overlay`
        );
        const cartDrawerItemElements = this.querySelectorAll(
            `#CartDrawer-Item-${line} .loading-overlay`
        );

        [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
            overlay.classList.remove("hidden")
        );

        document.activeElement.blur();
        this.lineItemStatusElement.setAttribute("aria-hidden", false);
    }

    disableLoading() {
        const mainCartItems =
            document.getElementById("main-cart-items") ||
            document.getElementById("CartDrawer-CartItems");
        mainCartItems.classList.remove("cart__items--disabled");
    }
}
customElements.define("cart-items", CartItems);

class CartDrawerItems extends CartItems {
    constructor() {
        super();
    }
}
customElements.define("cart-drawer-items", CartDrawerItems);

class CartRemoveButton extends HTMLElement {
    constructor() {
        super();
        this.addEventListener("click", (event) => {
            event.preventDefault();
            const cartItems =
                this.closest("cart-items") || this.closest("cart-drawer-items");
            cartItems.updateQuantity(this.dataset.index, 0);
        });
    }
}
customElements.define("cart-remove-button", CartRemoveButton);

class CartNote extends HTMLElement {
    constructor() {
        super();

        this.addEventListener('change', debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
        }, ON_CHANGE_DEBOUNCE_TIMER))
    }
}
customElements.define("cart-note", CartNote);
