
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Header.svelte generated by Svelte v3.46.1 */

    const file$4 = "src\\components\\Header.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let p;
    	let t2;
    	let t3;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*appName*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			p = element("p");
    			t2 = text(/*userName*/ ctx[1]);
    			t3 = space();
    			img = element("img");
    			attr_dev(div0, "class", "logo");
    			add_location(div0, file$4, 8, 8, 203);
    			add_location(p, file$4, 10, 12, 278);
    			if (!src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			add_location(img, file$4, 11, 12, 309);
    			attr_dev(div1, "class", "user");
    			add_location(div1, file$4, 9, 8, 246);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$4, 7, 4, 170);
    			attr_dev(div3, "id", "header");
    			add_location(div3, file$4, 6, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t2);
    			append_dev(div1, t3);
    			append_dev(div1, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*appName*/ 1) set_data_dev(t0, /*appName*/ ctx[0]);
    			if (dirty & /*userName*/ 2) set_data_dev(t2, /*userName*/ ctx[1]);

    			if (dirty & /*userAvatar*/ 4 && !src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let { appName = "AppName" } = $$props;
    	let { userName = "Unknown" } = $$props;
    	let { userAvatar = "img/users/unknownUser.png" } = $$props;
    	const writable_props = ['appName', 'userName', 'userAvatar'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    	};

    	$$self.$capture_state = () => ({ appName, userName, userAvatar });

    	$$self.$inject_state = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [appName, userName, userAvatar];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { appName: 0, userName: 1, userAvatar: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get appName() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appName(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userName() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userAvatar() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userAvatar(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\UsersList.svelte generated by Svelte v3.46.1 */

    const file$3 = "src\\components\\UsersList.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t3;
    	let p0;
    	let t4;
    	let t5;
    	let p1;
    	let t6;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("#");
    			t1 = text(/*chatName*/ ctx[3]);
    			t2 = space();
    			div1 = element("div");
    			img = element("img");
    			t3 = space();
    			p0 = element("p");
    			t4 = text(/*userName*/ ctx[0]);
    			t5 = space();
    			p1 = element("p");
    			t6 = text(/*userStatus*/ ctx[1]);
    			attr_dev(div0, "class", "selected-chat");
    			add_location(div0, file$3, 8, 4, 215);
    			if (!src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			add_location(img, file$3, 10, 8, 293);
    			attr_dev(p0, "class", "name");
    			add_location(p0, file$3, 11, 8, 338);
    			attr_dev(p1, "class", "status");
    			add_location(p1, file$3, 12, 8, 378);
    			attr_dev(div1, "class", "user");
    			add_location(div1, file$3, 9, 4, 265);
    			attr_dev(div2, "id", "users-list");
    			add_location(div2, file$3, 7, 0, 188);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(p0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, p1);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chatName*/ 8) set_data_dev(t1, /*chatName*/ ctx[3]);

    			if (dirty & /*userAvatar*/ 4 && !src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*userName*/ 1) set_data_dev(t4, /*userName*/ ctx[0]);
    			if (dirty & /*userStatus*/ 2) set_data_dev(t6, /*userStatus*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('UsersList', slots, []);
    	let { userName = "Unknown" } = $$props;
    	let { userStatus = "offline" } = $$props;
    	let { userAvatar = "img/users/unknownUser.png" } = $$props;
    	let { chatName = "unknown" } = $$props;
    	const writable_props = ['userName', 'userStatus', 'userAvatar', 'chatName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UsersList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(1, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    		if ('chatName' in $$props) $$invalidate(3, chatName = $$props.chatName);
    	};

    	$$self.$capture_state = () => ({
    		userName,
    		userStatus,
    		userAvatar,
    		chatName
    	});

    	$$self.$inject_state = $$props => {
    		if ('userName' in $$props) $$invalidate(0, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(1, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    		if ('chatName' in $$props) $$invalidate(3, chatName = $$props.chatName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userName, userStatus, userAvatar, chatName];
    }

    class UsersList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			userName: 0,
    			userStatus: 1,
    			userAvatar: 2,
    			chatName: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UsersList",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get userName() {
    		throw new Error("<UsersList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<UsersList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userStatus() {
    		throw new Error("<UsersList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userStatus(value) {
    		throw new Error("<UsersList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userAvatar() {
    		throw new Error("<UsersList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userAvatar(value) {
    		throw new Error("<UsersList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chatName() {
    		throw new Error("<UsersList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chatName(value) {
    		throw new Error("<UsersList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Chat.svelte generated by Svelte v3.46.1 */

    const file$2 = "src\\components\\Chat.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("This is beggining of the #");
    			t1 = text(/*chatName*/ ctx[0]);
    			t2 = text(" chat");
    			attr_dev(p, "class", "start-message");
    			add_location(p, file$2, 5, 4, 88);
    			attr_dev(div, "id", "users-chat");
    			add_location(div, file$2, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chatName*/ 1) set_data_dev(t1, /*chatName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chat', slots, []);
    	let { chatName = "unknown" } = $$props;
    	const writable_props = ['chatName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chat> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('chatName' in $$props) $$invalidate(0, chatName = $$props.chatName);
    	};

    	$$self.$capture_state = () => ({ chatName });

    	$$self.$inject_state = $$props => {
    		if ('chatName' in $$props) $$invalidate(0, chatName = $$props.chatName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [chatName];
    }

    class Chat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { chatName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chat",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get chatName() {
    		throw new Error("<Chat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chatName(value) {
    		throw new Error("<Chat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Input.svelte generated by Svelte v3.46.1 */

    const file$1 = "src\\components\\Input.svelte";

    function create_fragment$1(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let i0;
    	let t0;
    	let div1;
    	let input;
    	let t1;
    	let div2;
    	let i1;
    	let t2;
    	let div3;
    	let i2;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			div2 = element("div");
    			i1 = element("i");
    			t2 = space();
    			div3 = element("div");
    			i2 = element("i");
    			attr_dev(i0, "class", "fas fa-paperclip");
    			add_location(i0, file$1, 2, 32, 80);
    			attr_dev(div0, "class", "attachment");
    			add_location(div0, file$1, 2, 8, 56);
    			attr_dev(input, "class", "itself");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Write a message...");
    			add_location(input, file$1, 4, 12, 161);
    			attr_dev(div1, "class", "input");
    			add_location(div1, file$1, 3, 8, 128);
    			attr_dev(i1, "class", "fas fa-grin-alt");
    			add_location(i1, file$1, 6, 27, 273);
    			attr_dev(div2, "class", "emoji");
    			add_location(div2, file$1, 6, 8, 254);
    			attr_dev(i2, "class", "fas fa-paper-plane");
    			add_location(i2, file$1, 7, 26, 338);
    			attr_dev(div3, "class", "send");
    			add_location(div3, file$1, 7, 8, 320);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 1, 4, 23);
    			attr_dev(div5, "id", "footer");
    			add_location(div5, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, i0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, input);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, i1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, i2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Input', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let title_value;
    	let t0;
    	let div;
    	let header;
    	let t1;
    	let userslist;
    	let t2;
    	let chat;
    	let t3;
    	let input;
    	let current;
    	document.title = title_value = "" + (/*appName*/ ctx[0] + " - #" + /*chatName*/ ctx[4]);

    	header = new Header({
    			props: {
    				appName: /*appName*/ ctx[0],
    				userName: /*userName*/ ctx[1],
    				userAvatar: /*userAvatar*/ ctx[3]
    			},
    			$$inline: true
    		});

    	userslist = new UsersList({
    			props: {
    				userName: /*userName*/ ctx[1],
    				userAvatar: /*userAvatar*/ ctx[3],
    				userStatus: /*userStatus*/ ctx[2],
    				chatName: /*chatName*/ ctx[4]
    			},
    			$$inline: true
    		});

    	chat = new Chat({
    			props: { chatName: /*chatName*/ ctx[4] },
    			$$inline: true
    		});

    	input = new Input({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			div = element("div");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(userslist.$$.fragment);
    			t2 = space();
    			create_component(chat.$$.fragment);
    			t3 = space();
    			create_component(input.$$.fragment);
    			attr_dev(div, "class", "main-container");
    			add_location(div, file, 18, 0, 408);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t1);
    			mount_component(userslist, div, null);
    			append_dev(div, t2);
    			mount_component(chat, div, null);
    			append_dev(div, t3);
    			mount_component(input, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*appName, chatName*/ 17) && title_value !== (title_value = "" + (/*appName*/ ctx[0] + " - #" + /*chatName*/ ctx[4]))) {
    				document.title = title_value;
    			}

    			const header_changes = {};
    			if (dirty & /*appName*/ 1) header_changes.appName = /*appName*/ ctx[0];
    			if (dirty & /*userName*/ 2) header_changes.userName = /*userName*/ ctx[1];
    			if (dirty & /*userAvatar*/ 8) header_changes.userAvatar = /*userAvatar*/ ctx[3];
    			header.$set(header_changes);
    			const userslist_changes = {};
    			if (dirty & /*userName*/ 2) userslist_changes.userName = /*userName*/ ctx[1];
    			if (dirty & /*userAvatar*/ 8) userslist_changes.userAvatar = /*userAvatar*/ ctx[3];
    			if (dirty & /*userStatus*/ 4) userslist_changes.userStatus = /*userStatus*/ ctx[2];
    			userslist.$set(userslist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(userslist.$$.fragment, local);
    			transition_in(chat.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(userslist.$$.fragment, local);
    			transition_out(chat.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(userslist);
    			destroy_component(chat);
    			destroy_component(input);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { appName } = $$props;
    	let { userName } = $$props;
    	let { userStatus } = $$props;
    	let { userAvatar } = $$props;
    	let chatName = 'main';
    	const writable_props = ['appName', 'userName', 'userStatus', 'userAvatar'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(2, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(3, userAvatar = $$props.userAvatar);
    	};

    	$$self.$capture_state = () => ({
    		appName,
    		userName,
    		userStatus,
    		userAvatar,
    		Header,
    		UsersList,
    		Chat,
    		Input,
    		chatName
    	});

    	$$self.$inject_state = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(2, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(3, userAvatar = $$props.userAvatar);
    		if ('chatName' in $$props) $$invalidate(4, chatName = $$props.chatName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [appName, userName, userStatus, userAvatar, chatName];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			appName: 0,
    			userName: 1,
    			userStatus: 2,
    			userAvatar: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*appName*/ ctx[0] === undefined && !('appName' in props)) {
    			console.warn("<App> was created without expected prop 'appName'");
    		}

    		if (/*userName*/ ctx[1] === undefined && !('userName' in props)) {
    			console.warn("<App> was created without expected prop 'userName'");
    		}

    		if (/*userStatus*/ ctx[2] === undefined && !('userStatus' in props)) {
    			console.warn("<App> was created without expected prop 'userStatus'");
    		}

    		if (/*userAvatar*/ ctx[3] === undefined && !('userAvatar' in props)) {
    			console.warn("<App> was created without expected prop 'userAvatar'");
    		}
    	}

    	get appName() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appName(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userName() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userStatus() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userStatus(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userAvatar() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userAvatar(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		appName: 'ChatApp',
    		userName: 'Artem Darkov',
    		userStatus: 'online',
    		userAvatar: 'img/users/user0.png'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
