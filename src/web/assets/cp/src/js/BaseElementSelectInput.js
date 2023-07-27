/** global: Craft */
/** global: Garnish */
/**
 * Element Select input
 */
Craft.BaseElementSelectInput = Garnish.Base.extend(
  {
    elementSelect: null,
    elementSort: null,
    modal: null,
    elementEditor: null,

    $container: null,
    $form: null,
    $elementsContainer: null,
    $elements: null,
    $addElementBtn: null,
    $spinner: null,

    _initialized: false,

    get thumbLoader() {
      console.warn(
        'Craft.BaseElementSelectInput::thumbLoader is deprecated. Craft.cp.elementThumbLoader should be used instead.'
      );
      return Craft.cp.elementThumbLoader;
    },

    init: function (settings) {
      // Normalize the settings and set them
      // ---------------------------------------------------------------------

      // Are they still passing in a bunch of arguments?
      if (!$.isPlainObject(settings)) {
        // Loop through all of the old arguments and apply them to the settings
        var normalizedSettings = {},
          args = [
            'id',
            'name',
            'elementType',
            'sources',
            'criteria',
            'sourceElementId',
            'limit',
            'modalStorageKey',
            'fieldId',
          ];

        for (var i = 0; i < args.length; i++) {
          if (typeof arguments[i] !== 'undefined') {
            normalizedSettings[args[i]] = arguments[i];
          } else {
            break;
          }
        }

        settings = normalizedSettings;
      }

      this.setSettings(settings, Craft.BaseElementSelectInput.defaults);

      // Apply the storage key prefix
      if (this.settings.modalStorageKey) {
        this.modalStorageKey =
          'BaseElementSelectInput.' + this.settings.modalStorageKey;
      }

      // No reason for this to be sortable if we're only allowing 1 selection
      if (this.settings.limit == 1 || this.settings.maintainHierarchy) {
        this.settings.sortable = false;
      }

      this.$container = this.getContainer();
      this.$form = this.$container.closest('form');

      // Store a reference to this class
      this.$container.data('elementSelect', this);

      this.$elementsContainer = this.getElementsContainer();
      this.$addElementBtn = this.getAddElementsBtn();
      this.$spinner = this.getSpinner();

      this.initElementSelect();
      this.initElementSort();
      this.resetElements();

      if (this.$addElementBtn) {
        this.addListener(this.$addElementBtn, 'activate', 'showModal');
      }

      Garnish.requestAnimationFrame(() => {
        this._initialized = true;
      });

      if (this.elementSelect) {
        this.addListener(Garnish.$win, 'mousedown', (ev) => {
          if (
            !this.$container.is(ev.target) &&
            !this.$container.find(ev.target).length
          ) {
            this.elementSelect.deselectAll();
          }
        });
      }
    },

    get totalSelected() {
      return this.$elements.length;
    },

    getContainer: function () {
      return $('#' + this.settings.id);
    },

    getElementsContainer: function () {
      return this.$container.children('.elements');
    },

    getElements: function () {
      return this.$elementsContainer.find('.element');
    },

    getAddElementsBtn: function () {
      return this.$container.find('.btn.add:first');
    },

    getSpinner: function () {
      return this.$container.find('.spinner');
    },

    initElementSelect: function () {
      if (this.settings.selectable) {
        this.elementSelect = new Garnish.Select({
          multi: this.settings.sortable,
          filter: ':not(a):not(button)',
        });
      }
    },

    initElementSort: function () {
      if (this.settings.sortable) {
        this.elementSort = new Garnish.DragSort({
          container: this.$elementsContainer,
          filter: this.settings.selectable
            ? () => {
                // Only return all the selected items if the target item is selected
                if (this.elementSort.$targetItem.hasClass('sel')) {
                  return this.elementSelect.getSelectedItems();
                } else {
                  return this.elementSort.$targetItem;
                }
              }
            : null,
          ignoreHandleSelector: '.delete',
          handle: (() => {
            switch (this.settings.viewMode) {
              case 'list':
              case 'large':
                return '> .chip-content > .chip-actions > .move';
              case 'cards':
                return '> .card-actions > .move';
              default:
                return null;
            }
          })(),
          axis: this.getElementSortAxis(),
          collapseDraggees: true,
          magnetStrength: 4,
          helperLagBase: 1.5,
          onSortChange: this.settings.selectable
            ? () => {
                this.elementSelect.resetItemOrder();
              }
            : null,
        });
      }
    },

    getElementSortAxis: function () {
      return ['list'].includes(this.settings.viewMode) ? 'y' : null;
    },

    canAddMoreElements: function () {
      return (
        !this.settings.limit || this.$elements.length < this.settings.limit
      );
    },

    updateAddElementsBtn: function () {
      if (this.canAddMoreElements()) {
        this.enableAddElementsBtn();
      } else {
        this.disableAddElementsBtn();
      }
    },

    enableAddElementsBtn: function () {
      if (this.$addElementBtn) {
        this.$addElementBtn.removeClass('hidden');
      }

      this.updateButtonContainer();
    },

    disableAddElementsBtn: function () {
      if (this.$addElementBtn) {
        this.$addElementBtn.addClass('hidden');
      }

      this.updateButtonContainer();
    },

    showSpinner: function () {
      if (this.$spinner) {
        this.$spinner.removeClass('hidden');
      }

      this.updateButtonContainer();
    },

    hideSpinner: function () {
      if (this.$spinner) {
        this.$spinner.addClass('hidden');
      }

      this.updateButtonContainer();
    },

    updateButtonContainer: function () {
      const $container =
        this.$addElementBtn && this.$addElementBtn.parent('.flex');
      if ($container && $container.length) {
        if ($container.children(':not(.hidden)').length) {
          $container.removeClass('hidden');
        } else {
          $container.addClass('hidden');
        }
      }
    },

    focusNextLogicalElement: function () {
      if (this.canAddMoreElements()) {
        // If can add more elements, focus ADD button
        let $btn = this.$addElementBtn;

        if ($btn) {
          $btn.get(0).focus();
        }
      } else {
        // If can't add more elements, focus on the final remove
        this.focusLastRemoveBtn();
      }
    },

    focusLastRemoveBtn: function () {
      const $removeBtns = this.$container.find('.delete');

      if (!$removeBtns.length) return;

      $removeBtns.last()[0].focus();
    },

    resetElements: function () {
      if (this.$elements !== null) {
        this.removeElements(this.$elements);
      } else {
        this.$elements = $();
      }

      this.addElements(this.getElements());
    },

    addElements: function ($elements) {
      // add the action triggers
      const actionSelector = ['list', 'large'].includes(this.settings.viewMode)
        ? '.chip-actions'
        : '.card-actions';

      for (let i = 0; i < $elements.length; i++) {
        const $element = $elements.eq(i);
        const $actions = $element.find(actionSelector).empty();
        const actions = this.defineElementActions($element);

        if (actions.length) {
          const actionMenuId = `element-actions-${Math.floor(
            Math.random() * 1000000
          )}`;
          const safeActions = actions.filter((a) => !a.destructive);
          const destructiveActions = actions.filter((a) => a.destructive);
          let $options = $();

          const $actionBtn = $('<button/>', {
            type: 'button',
            class: 'btn settings menubtn',
            title: Craft.t('app', 'Actions'),
            'aria-controls': actionMenuId,
          }).appendTo($actions);
          const $menu = $('<div/>', {
            id: actionMenuId,
            class: 'menu menu--disclosure',
          }).appendTo($actions);
          if (safeActions.length) {
            const $ul = $('<ul/>', {class: 'padded'}).appendTo($menu);
            for (let action of safeActions) {
              const $li = $('<li/>').appendTo($ul);
              const $a = $('<a/>', {
                type: 'button',
                role: 'button',
                'data-icon': action.icon,
                'aria-label': action.label,
                text: action.label,
              })
                .appendTo($li)
                .data('actionCallback', action.callback);
              $options = $options.add($a);
            }
          }
          if (safeActions.length && destructiveActions.length) {
            $('<hr/>').appendTo($menu);
          }
          if (destructiveActions.length) {
            const $ul = $('<ul/>', {class: 'padded'}).appendTo($menu);
            for (let action of destructiveActions) {
              const $li = $('<li/>').appendTo($ul);
              const $a = $('<a/>', {
                class: 'error',
                type: 'button',
                role: 'button',
                'data-icon': action.icon,
                'aria-label': action.label,
                text: action.label,
              })
                .appendTo($li)
                .data('actionCallback', action.callback);
              $options = $options.add($a);
            }
          }

          this.addListener($options, 'activate', (ev) => {
            $actionBtn.data('trigger').hide();
            $(ev.currentTarget).data('actionCallback')();
          });

          $actionBtn.disclosureMenu();
        }

        if (this.settings.sortable) {
          $('<button/>', {
            type: 'button',
            class: 'move icon',
            title: Craft.t('app', 'Reorder'),
            'aria-label': Craft.t('app', 'Reorder'),
          }).appendTo($actions);
        }
      }

      Craft.cp.elementThumbLoader.load($elements);

      if (this.settings.selectable) {
        this.elementSelect.addItems($elements);
      }

      if (this.settings.sortable) {
        this.elementSort.addItems($elements);
      }

      if (this.settings.editable) {
        this._handleShowElementEditor = (ev) => {
          var $element = $(ev.currentTarget);
          if (
            Garnish.hasAttr($element, 'data-editable') &&
            !$element.hasClass('disabled') &&
            !$element.hasClass('loading')
          ) {
            this.elementEditor = this.createElementEditor($element);
          }
        };

        this.addListener($elements, 'dblclick', this._handleShowElementEditor);

        if ($.isTouchCapable()) {
          this.addListener($elements, 'taphold', this._handleShowElementEditor);
        }
      }

      $elements.on('keydown', (ev) => {
        if ([Garnish.BACKSPACE_KEY, Garnish.DELETE_KEY].includes(ev.keyCode)) {
          ev.stopPropagation();
          ev.preventDefault();
          const $elements = this.elementSelect.getSelectedItems();
          for (let i = 0; i < $elements.length; i++) {
            this.removeElement($elements.eq(i));
          }
        }
      });

      this.$elements = this.$elements.add($elements);

      this.updateAddElementsBtn();

      this.onAddElements();
    },

    defineElementActions: function ($element) {
      const actions = [];

      const url = $element.data('url');
      if (url) {
        actions.push({
          icon: 'share',
          label: Craft.t('app', 'View in a new tab'),
          callback: () => {
            window.open(url);
          },
        });
      }

      if (
        this.settings.editable &&
        Garnish.hasAttr($element, 'data-editable') &&
        !$element.hasClass('disabled') &&
        !$element.hasClass('loading')
      ) {
        const elementType = $element.data('type');
        actions.push({
          icon: 'edit',
          label: Craft.elementTypeNames[elementType]
            ? Craft.t('app', 'Edit {type}', {
                type: Craft.elementTypeNames[elementType][2],
              })
            : Craft.t('app', 'Edit'),
          callback: () => {
            this.elementEditor = this.createElementEditor($element);
          },
        });
      }

      actions.push({
        icon: 'remove',
        label: Craft.t('app', 'Remove'),
        callback: () => {
          this.removeElement($element);
        },
        destructive: true,
      });

      return actions;
    },

    createElementEditor: function ($element, settings) {
      settings = Object.assign(
        {
          elementSelectInput: this,
          prevalidate: this.settings.prevalidate,
        },
        settings
      );

      return Craft.createElementEditor(
        this.settings.elementType,
        $element,
        settings
      );
    },

    replaceElement: function (elementId, replacementId) {
      return new Promise((resolve, reject) => {
        const $existing = this.$elements.filter(`[data-id="${elementId}"]`);

        if (!$existing.length) {
          reject(`No element selected with an ID of ${elementId}.`);
          return;
        }

        this.showSpinner();

        const data = {
          elementId: replacementId,
          siteId: this.settings.criteria.siteId,
          thumbSize: this.settings.viewMode,
        };

        Craft.sendActionRequest('POST', 'app/render-elements', {
          data: {
            elements: [
              {
                type: this.settings.elementType,
                id: replacementId,
                siteId: this.settings.criteria.siteId,
                instances: [
                  {
                    context: 'field',
                    ui: ['list', 'large'].includes(this.settings.viewMode)
                      ? 'chip'
                      : 'card',
                    size:
                      this.settings.viewMode === 'large' ? 'large' : 'small',
                  },
                ],
              },
            ],
          },
        })
          .then(({data}) => {
            this.removeElement($existing);
            const elementInfo = Craft.getElementInfo(
              data.elements[replacementId][0]
            );
            this.selectElements([elementInfo]).then(resolve);
          })
          .catch(({response}) => {
            if (response && response.data && response.data.message) {
              Craft.cp.displayError(response.data.message);
            } else {
              Craft.cp.displayError();
            }

            reject(response.data.message);
          })
          .finally(() => {
            this.hideSpinner();
          });
      });
    },

    removeElements: function ($elements) {
      if (this.settings.selectable) {
        this.elementSelect.removeItems($elements);
      }

      if (this.modal) {
        var ids = [];

        for (var i = 0; i < $elements.length; i++) {
          var id = $elements.eq(i).data('id');

          if (id) {
            ids.push(id);
          }
        }

        if (ids.length) {
          this.modal.elementIndex.enableElementsById(ids);
        }
      }

      // Disable the hidden input in case the form is submitted before this element gets removed from the DOM
      $elements.children('input').prop('disabled', true);

      // Move the focus to the next element in the list, if there is one
      let $nextDeleteBtn;
      if (this.settings.selectable) {
        const lastElementIndex = this.$elements.index($elements.last());
        $nextDeleteBtn = this.$elements
          .eq(lastElementIndex + 1)
          .find('.delete');
      }
      if ($nextDeleteBtn.length) {
        $nextDeleteBtn.focus();
      } else {
        this.focusNextLogicalElement();
      }

      this.$elements = this.$elements.not($elements);
      this.updateAddElementsBtn();

      this.onRemoveElements();
    },

    removeElement: function ($element) {
      if (this.settings.maintainHierarchy) {
        // Find any descendants this element might have
        const $allElements = $element.add(
          $element.parent().siblings('ul').find('.element')
        );

        // Remove any inputs from the form data
        $('[name]', $allElements).removeAttr('name');

        // Remove our record of them all at once
        this.removeElements($allElements);

        // Animate them away one at a time
        for (let i = 0; i < $allElements.length; i++) {
          this._animateStructureElementAway($allElements, i);
        }
      } else {
        // Remove any inputs from the form data
        $('[name]', $element).removeAttr('name');
        this.removeElements($element);
        this.animateElementAway($element, () => {
          $element.remove();
        });
      }
    },

    animateElementAway: function ($element, callback) {
      $element.css('z-index', 0);

      var animateCss = {
        opacity: -1,
      };
      animateCss['margin-' + Craft.left] = -(
        $element.outerWidth() + parseInt($element.css('margin-' + Craft.right))
      );

      if (
        ['list', 'cards'].includes(this.settings.viewMode) ||
        this.$elements.length === 0
      ) {
        animateCss['margin-bottom'] = -(
          $element.outerHeight() + parseInt($element.css('margin-bottom'))
        );
      }

      $element.velocity(
        animateCss,
        Craft.BaseElementSelectInput.REMOVE_FX_DURATION,
        () => {
          if (callback) {
            callback();
          }
        }
      );
    },

    showModal: function () {
      // Make sure we haven't reached the limit
      if (!this.canAddMoreElements()) {
        return;
      }

      if (!this.modal) {
        this.modal = this.createModal();
      } else {
        this.modal.show();
      }
    },

    createModal: function () {
      return Craft.createElementSelectorModal(
        this.settings.elementType,
        this.getModalSettings()
      );
    },

    getModalSettings: function () {
      return $.extend(
        {
          closeOtherModals: false,
          storageKey: this.modalStorageKey,
          sources: this.settings.sources,
          condition: this.settings.condition,
          referenceElementId: this.settings.referenceElementId,
          referenceElementSiteId: this.settings.referenceElementSiteId,
          criteria: this.settings.criteria,
          multiSelect: this.settings.limit != 1,
          hideOnSelect: false,
          showSiteMenu: this.settings.showSiteMenu,
          disabledElementIds: this.getDisabledElementIds(),
          onSelect: this.onModalSelect.bind(this),
          onHide: this.onModalHide.bind(this),
          triggerElement: this.$addElementBtn,
          modalTitle: Craft.t('app', 'Choose'),
        },
        this.settings.modalSettings
      );
    },

    getSelectedElementIds: function () {
      var ids = [];

      for (var i = 0; i < this.$elements.length; i++) {
        ids.push(this.$elements.eq(i).data('id'));
      }

      return ids;
    },

    getDisabledElementIds: function () {
      var ids = this.getSelectedElementIds();

      if (!this.settings.allowSelfRelations && this.settings.sourceElementId) {
        ids.push(this.settings.sourceElementId);
      }

      if (this.settings.disabledElementIds) {
        ids.push(...this.settings.disabledElementIds);
      }

      return ids;
    },

    onModalSelect: async function (elements) {
      // Disable the modal
      this.modal.disable();
      this.modal.disableCancelBtn();
      this.modal.disableSelectBtn();
      this.modal.showFooterSpinner();

      // do we need to load the elements with the correct UI?
      const [modalUiType, modalUiSize] = (() => {
        switch (this.modal.elementIndex.getSelectedViewMode()) {
          case 'table':
          case 'structure':
            return ['chip', 'small'];
          case 'thumbs':
            return ['chip', 'large'];
          default:
            return [null, null];
        }
      })();
      const [inputUiType, inputUiSize] = (() => {
        switch (this.settings.viewMode) {
          case 'large':
            return ['chip', 'large'];
          case 'cards':
            return ['card', null];
          default:
            return ['chip', 'small'];
        }
      })();

      if (modalUiType !== inputUiType || modalUiSize !== inputUiSize) {
        const {data} = await Craft.sendActionRequest(
          'POST',
          'app/render-elements',
          {
            data: {
              elements: [
                {
                  type: this.settings.elementType,
                  id: elements.map((e) => e.id),
                  siteId: elements[0].siteId,
                  instances: [
                    {
                      context: 'field',
                      ui: inputUiType,
                      size: inputUiSize,
                    },
                  ],
                },
              ],
            },
          }
        );

        for (let i = 0; i < elements.length; i++) {
          if (typeof data.elements[elements[i].id] !== 'undefined') {
            elements[i].$modalElement = elements[i].$element;
            elements[i].$element = $(data.elements[elements[i].id][0]);
          }
        }
      } else {
        // add the link hrefs in
        for (let element of elements) {
          const url = element.$element.data('cp-url');
          if (url) {
            element.$element.find('.label-link').attr('href', url);
          }
        }
      }

      if (this.settings.maintainHierarchy) {
        await this.selectStructuredElements(elements);
      } else {
        if (this.settings.limit) {
          // Cut off any excess elements
          var slotsLeft = this.settings.limit - this.$elements.length;

          if (elements.length > slotsLeft) {
            elements = elements.slice(0, slotsLeft);
          }
        }

        await this.selectElements(elements);
        this.updateDisabledElementsInModal();
      }

      // Re-enable and hide the modal
      this.modal.enable();
      this.modal.enableCancelBtn();
      this.modal.enableSelectBtn();
      this.modal.hideFooterSpinner();
      this.modal.hide();
    },

    onModalHide: function () {
      // If the modal has a condition and a reference element, recreate it each time it’s opened
      // in case something about the edited element is going to affect the condition
      if (
        this.modal &&
        this.settings.condition &&
        this.settings.referenceElementId
      ) {
        this.modal.destroy();
        this.modal = null;
      }

      // If can add more elements, do default behavior of focus on "Add" button
      if (this.canAddMoreElements()) return;

      setTimeout(() => {
        this.focusNextLogicalElement();
      }, 200);
    },

    selectElements: async function (elements) {
      for (let i = 0; i < elements.length; i++) {
        let elementInfo = elements[i],
          $element = this.createNewElement(elementInfo);

        this.appendElement($element);
        this.addElements($element);

        const $modalElement = elementInfo.$modalElement || elementInfo.$element;
        if ($modalElement && $modalElement.parent().length) {
          this.animateElementIntoPlace($modalElement, $element);
        }

        // Override the element reference with the new one
        elementInfo.$element = $element;
      }

      this.onSelectElements(elements);
    },

    selectStructuredElements: async function (elements) {
      // Get the new element HTML
      var selectedElementIds = this.getSelectedElementIds();

      for (var i = 0; i < elements.length; i++) {
        selectedElementIds.push(elements[i].id);
      }

      var data = {
        elementIds: selectedElementIds,
        siteId: elements[0].siteId,
        containerId: this.settings.id,
        name: this.settings.name,
        branchLimit: this.settings.branchLimit,
        selectionLabel: this.settings.selectionLabel,
        elementType: this.settings.elementType,
      };

      const response = await Craft.sendActionRequest(
        'POST',
        'relational-fields/structured-input-html',
        {data}
      );

      const $newInput = $(response.data.html),
        $newElementsContainer = $newInput.children('.elements');

      this.$elementsContainer.replaceWith($newElementsContainer);
      this.$elementsContainer = $newElementsContainer;
      this.resetElements();

      const filteredElements = [];

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const $element = this.getElementById(element.id);

        if ($element) {
          this.animateElementIntoPlace(element.$element, $element);
          filteredElements.push(element);
        }
      }

      this.updateDisabledElementsInModal();
      this.onSelectElements(filteredElements);
    },

    createNewElement: function (elementInfo) {
      var $element = elementInfo.$element.clone();
      var removeText = Craft.t('app', 'Remove {label}', {
        label: Craft.escapeHtml(elementInfo.label),
      });
      // Make a couple tweaks
      Craft.setElementSize(
        $element,
        this.settings.viewMode === 'large' ? 'large' : 'small'
      );
      $element.addClass('removable').append(
        $('<input/>', {
          type: 'hidden',
          name: this.settings.name + (this.settings.single ? '' : '[]'),
          value: elementInfo.id,
        })
      );

      return $element;
    },

    appendElement: function ($element) {
      $element.appendTo(this.$elementsContainer);
    },

    animateElementIntoPlace: function ($modalElement, $inputElement) {
      var origOffset = $modalElement.offset(),
        destOffset = $inputElement.offset(),
        $helper = $inputElement
          .clone()
          .appendTo(Garnish.$bod)
          .width($inputElement.width());

      $inputElement.css('visibility', 'hidden');

      $helper.css({
        position: 'absolute',
        zIndex: 10000,
        top: origOffset.top,
        left: origOffset.left,
      });

      var animateCss = {
        top: destOffset.top,
        left: destOffset.left,
      };

      $helper.velocity(
        animateCss,
        Craft.BaseElementSelectInput.ADD_FX_DURATION,
        function () {
          $helper.remove();
          $inputElement.css('visibility', 'visible');
        }
      );
    },

    updateDisabledElementsInModal: function () {
      if (this.modal.elementIndex) {
        this.modal.elementIndex.disableElementsById(
          this.getDisabledElementIds()
        );
      }
    },

    getElementById: function (id) {
      for (var i = 0; i < this.$elements.length; i++) {
        var $element = this.$elements.eq(i);

        if ($element.data('id') == id) {
          return $element;
        }
      }
    },

    onSelectElements: function (elements) {
      this.trigger('selectElements', {elements});
      this.settings.onSelectElements(elements);
      this.$container.trigger('change');
    },

    onAddElements: function () {
      this.trigger('addElements');
      this.settings.onAddElements();
      this.$container.trigger('change');
    },

    onRemoveElements: function () {
      this.trigger('removeElements');
      this.settings.onRemoveElements();
      this.$container.trigger('change');
    },

    _animateStructureElementAway: function ($allElements, i) {
      let callback;

      // Is this the last one?
      if (i === $allElements.length - 1) {
        callback = () => {
          const $li = $allElements.first().parent().parent();
          const $ul = $li.parent();

          if ($ul[0] === this.$elementsContainer[0] || $li.siblings().length) {
            $li.remove();
          } else {
            $ul.remove();
          }
        };
      }

      const func = () => {
        this.animateElementAway($allElements.eq(i), callback);
      };

      if (i === 0) {
        func();
      } else {
        setTimeout(func, 100 * i);
      }
    },
  },
  {
    ADD_FX_DURATION: 200,
    REMOVE_FX_DURATION: 200,

    defaults: {
      id: null,
      name: null,
      fieldId: null,
      elementType: null,
      sources: null,
      condition: null,
      referenceElementId: null,
      referenceElementSiteId: null,
      criteria: {},
      allowSelfRelations: false,
      sourceElementId: null,
      disabledElementIds: null,
      viewMode: 'list',
      single: false,
      maintainHierarchy: false,
      branchLimit: null,
      limit: null,
      showSiteMenu: false,
      modalStorageKey: null,
      modalSettings: {},
      onAddElements: $.noop,
      onSelectElements: $.noop,
      onRemoveElements: $.noop,
      sortable: true,
      selectable: true,
      editable: true,
      prevalidate: false,
      editorSettings: {},
    },
  }
);
