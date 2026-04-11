/**
 * Lightweight autocomplete component designed to work reliably in iOS Safari.
 *
 * iOS-specific behavior addressed:
 * - Uses `pointerdown` + `touchstart` on options so a tap selects before input blur.
 * - Keeps focus on the input after selection.
 * - Explicitly sets text-assist attributes for iOS keyboard behavior.
 */
export function attachIOSAutocomplete(input, {
  source,
  minChars = 1,
  maxItems = 8,
  onSelect,
} = {}) {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError('attachIOSAutocomplete: input must be an HTMLInputElement');
  }

  const getItems = typeof source === 'function'
    ? source
    : (query) => (Array.isArray(source) ? source : [])
        .filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'on');
  input.setAttribute('autocapitalize', 'none');
  input.setAttribute('spellcheck', 'true');

  const list = document.createElement('ul');
  list.className = 'ios-autocomplete-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  Object.assign(list.style, {
    position: 'absolute',
    zIndex: '1000',
    listStyle: 'none',
    margin: '4px 0 0',
    padding: '0',
    background: '#fff',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    maxHeight: '220px',
    overflowY: 'auto',
    width: `${input.getBoundingClientRect().width}px`,
  });

  document.body.appendChild(list);

  const placeList = () => {
    const rect = input.getBoundingClientRect();
    list.style.left = `${window.scrollX + rect.left}px`;
    list.style.top = `${window.scrollY + rect.bottom}px`;
    list.style.width = `${rect.width}px`;
  };

  const closeList = () => {
    list.hidden = true;
    list.innerHTML = '';
    input.removeAttribute('aria-activedescendant');
  };

  const choose = (value) => {
    input.value = value;
    onSelect?.(value);
    closeList();
    input.focus({ preventScroll: true });
  };

  let activeIndex = -1;
  let currentItems = [];

  const render = (items) => {
    currentItems = items.slice(0, maxItems);
    list.innerHTML = '';

    if (!currentItems.length) {
      closeList();
      return;
    }

    currentItems.forEach((item, index) => {
      const li = document.createElement('li');
      const id = `ios-autocomplete-item-${index}`;
      li.id = id;
      li.setAttribute('role', 'option');
      li.textContent = item;
      li.style.padding = '10px 12px';
      li.style.cursor = 'pointer';

      const selectFromTap = (event) => {
        event.preventDefault();
        event.stopPropagation();
        choose(item);
      };

      li.addEventListener('pointerdown', selectFromTap);
      li.addEventListener('touchstart', selectFromTap, { passive: false });

      list.appendChild(li);
    });

    activeIndex = -1;
    placeList();
    list.hidden = false;
  };

  const refresh = async () => {
    const q = input.value.trim();
    if (q.length < minChars) {
      closeList();
      return;
    }

    const items = await Promise.resolve(getItems(q));
    render((items || []).map(String));
  };

  const setActive = (index) => {
    const children = [...list.children];
    children.forEach((el, i) => {
      el.style.background = i === index ? '#f2f7ff' : '#fff';
    });

    if (index >= 0 && children[index]) {
      input.setAttribute('aria-activedescendant', children[index].id);
      children[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  input.addEventListener('input', refresh);
  input.addEventListener('focus', refresh);
  input.addEventListener('keydown', (event) => {
    if (list.hidden) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
      setActive(activeIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      setActive(activeIndex);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(currentItems[activeIndex]);
    } else if (event.key === 'Escape') {
      closeList();
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target !== input && !list.contains(event.target)) {
      closeList();
    }
  });

  window.addEventListener('resize', placeList);
  window.addEventListener('scroll', placeList, true);

  return {
    destroy() {
      closeList();
      list.remove();
      window.removeEventListener('resize', placeList);
      window.removeEventListener('scroll', placeList, true);
    },
  };
}
