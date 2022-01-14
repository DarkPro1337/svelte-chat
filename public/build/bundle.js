
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

    /* src\Header.svelte generated by Svelte v3.46.1 */

    const file$2 = "src\\Header.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(div0, file$2, 8, 8, 149);
    			add_location(p, file$2, 10, 12, 224);
    			if (!src_url_equal(img.src, img_src_value = /*userAvatar*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			add_location(img, file$2, 11, 12, 255);
    			attr_dev(div1, "class", "user");
    			add_location(div1, file$2, 9, 8, 192);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$2, 7, 4, 116);
    			attr_dev(div3, "id", "header");
    			add_location(div3, file$2, 6, 0, 93);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let { appName } = $$props;
    	let { userName } = $$props;
    	let { userAvatar } = $$props;
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { appName: 0, userName: 1, userAvatar: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*appName*/ ctx[0] === undefined && !('appName' in props)) {
    			console.warn("<Header> was created without expected prop 'appName'");
    		}

    		if (/*userName*/ ctx[1] === undefined && !('userName' in props)) {
    			console.warn("<Header> was created without expected prop 'userName'");
    		}

    		if (/*userAvatar*/ ctx[2] === undefined && !('userAvatar' in props)) {
    			console.warn("<Header> was created without expected prop 'userAvatar'");
    		}
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

    /* src\UsersList.svelte generated by Svelte v3.46.1 */

    const file$1 = "src\\UsersList.svelte";

    function create_fragment$1(ctx) {
    	let div9;
    	let div0;
    	let t1;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let p2;
    	let t9;
    	let p3;
    	let t11;
    	let div3;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let p4;
    	let t14;
    	let p5;
    	let t16;
    	let div4;
    	let img3;
    	let img3_src_value;
    	let t17;
    	let p6;
    	let t19;
    	let p7;
    	let t21;
    	let div5;
    	let img4;
    	let img4_src_value;
    	let t22;
    	let p8;
    	let t24;
    	let p9;
    	let t26;
    	let div6;
    	let img5;
    	let img5_src_value;
    	let t27;
    	let p10;
    	let t29;
    	let p11;
    	let t31;
    	let div7;
    	let img6;
    	let img6_src_value;
    	let t32;
    	let p12;
    	let t34;
    	let p13;
    	let t36;
    	let div8;
    	let img7;
    	let img7_src_value;
    	let t37;
    	let p14;
    	let t39;
    	let p15;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div0 = element("div");
    			div0.textContent = "#main";
    			t1 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = `${userName}`;
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = `${userStatus}`;
    			t6 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Maria Mango";
    			t9 = space();
    			p3 = element("p");
    			p3.textContent = "online";
    			t11 = space();
    			div3 = element("div");
    			img2 = element("img");
    			t12 = space();
    			p4 = element("p");
    			p4.textContent = "Ashlynn Bator";
    			t14 = space();
    			p5 = element("p");
    			p5.textContent = "online";
    			t16 = space();
    			div4 = element("div");
    			img3 = element("img");
    			t17 = space();
    			p6 = element("p");
    			p6.textContent = "Kaylynn Schleifer";
    			t19 = space();
    			p7 = element("p");
    			p7.textContent = "online";
    			t21 = space();
    			div5 = element("div");
    			img4 = element("img");
    			t22 = space();
    			p8 = element("p");
    			p8.textContent = "Cooper Westervelt";
    			t24 = space();
    			p9 = element("p");
    			p9.textContent = "online";
    			t26 = space();
    			div6 = element("div");
    			img5 = element("img");
    			t27 = space();
    			p10 = element("p");
    			p10.textContent = "Alena Lubin";
    			t29 = space();
    			p11 = element("p");
    			p11.textContent = "online";
    			t31 = space();
    			div7 = element("div");
    			img6 = element("img");
    			t32 = space();
    			p12 = element("p");
    			p12.textContent = "Phillip Torff";
    			t34 = space();
    			p13 = element("p");
    			p13.textContent = "online";
    			t36 = space();
    			div8 = element("div");
    			img7 = element("img");
    			t37 = space();
    			p14 = element("p");
    			p14.textContent = "Anika Bergson";
    			t39 = space();
    			p15 = element("p");
    			p15.textContent = "online";
    			attr_dev(div0, "class", "selected-chat");
    			add_location(div0, file$1, 1, 4, 27);
    			if (!src_url_equal(img0.src, img0_src_value = userAvatar)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "avatar");
    			add_location(img0, file$1, 3, 8, 99);
    			attr_dev(p0, "class", "name");
    			add_location(p0, file$1, 4, 8, 144);
    			attr_dev(p1, "class", "status");
    			add_location(p1, file$1, 5, 8, 184);
    			attr_dev(div1, "class", "user");
    			add_location(div1, file$1, 2, 4, 71);
    			if (!src_url_equal(img1.src, img1_src_value = "/img/users/user2.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "avatar");
    			add_location(img1, file$1, 8, 8, 264);
    			attr_dev(p2, "class", "name");
    			add_location(p2, file$1, 9, 8, 319);
    			attr_dev(p3, "class", "status");
    			add_location(p3, file$1, 10, 8, 360);
    			attr_dev(div2, "class", "user");
    			add_location(div2, file$1, 7, 4, 236);
    			if (!src_url_equal(img2.src, img2_src_value = "/img/users/user3.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "avatar");
    			add_location(img2, file$1, 13, 8, 434);
    			attr_dev(p4, "class", "name");
    			add_location(p4, file$1, 14, 8, 489);
    			attr_dev(p5, "class", "status");
    			add_location(p5, file$1, 15, 8, 532);
    			attr_dev(div3, "class", "user");
    			add_location(div3, file$1, 12, 4, 406);
    			if (!src_url_equal(img3.src, img3_src_value = "/img/users/user4.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "avatar");
    			add_location(img3, file$1, 18, 8, 606);
    			attr_dev(p6, "class", "name");
    			add_location(p6, file$1, 19, 8, 661);
    			attr_dev(p7, "class", "status");
    			add_location(p7, file$1, 20, 8, 708);
    			attr_dev(div4, "class", "user");
    			add_location(div4, file$1, 17, 4, 578);
    			if (!src_url_equal(img4.src, img4_src_value = "/img/users/user5.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "avatar");
    			add_location(img4, file$1, 23, 8, 782);
    			attr_dev(p8, "class", "name");
    			add_location(p8, file$1, 24, 8, 837);
    			attr_dev(p9, "class", "status");
    			add_location(p9, file$1, 25, 8, 884);
    			attr_dev(div5, "class", "user");
    			add_location(div5, file$1, 22, 4, 754);
    			if (!src_url_equal(img5.src, img5_src_value = "/img/users/user6.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "avatar");
    			add_location(img5, file$1, 28, 8, 958);
    			attr_dev(p10, "class", "name");
    			add_location(p10, file$1, 29, 8, 1013);
    			attr_dev(p11, "class", "status");
    			add_location(p11, file$1, 30, 8, 1054);
    			attr_dev(div6, "class", "user");
    			add_location(div6, file$1, 27, 4, 930);
    			if (!src_url_equal(img6.src, img6_src_value = "/img/users/user7.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "avatar");
    			add_location(img6, file$1, 33, 8, 1128);
    			attr_dev(p12, "class", "name");
    			add_location(p12, file$1, 34, 8, 1183);
    			attr_dev(p13, "class", "status");
    			add_location(p13, file$1, 35, 8, 1226);
    			attr_dev(div7, "class", "user");
    			add_location(div7, file$1, 32, 4, 1100);
    			if (!src_url_equal(img7.src, img7_src_value = "/img/users/user8.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "avatar");
    			add_location(img7, file$1, 38, 8, 1300);
    			attr_dev(p14, "class", "name");
    			add_location(p14, file$1, 39, 8, 1355);
    			attr_dev(p15, "class", "status");
    			add_location(p15, file$1, 40, 8, 1398);
    			attr_dev(div8, "class", "user");
    			add_location(div8, file$1, 37, 4, 1272);
    			attr_dev(div9, "id", "users-list");
    			add_location(div9, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div9, t1);
    			append_dev(div9, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(div9, t6);
    			append_dev(div9, div2);
    			append_dev(div2, img1);
    			append_dev(div2, t7);
    			append_dev(div2, p2);
    			append_dev(div2, t9);
    			append_dev(div2, p3);
    			append_dev(div9, t11);
    			append_dev(div9, div3);
    			append_dev(div3, img2);
    			append_dev(div3, t12);
    			append_dev(div3, p4);
    			append_dev(div3, t14);
    			append_dev(div3, p5);
    			append_dev(div9, t16);
    			append_dev(div9, div4);
    			append_dev(div4, img3);
    			append_dev(div4, t17);
    			append_dev(div4, p6);
    			append_dev(div4, t19);
    			append_dev(div4, p7);
    			append_dev(div9, t21);
    			append_dev(div9, div5);
    			append_dev(div5, img4);
    			append_dev(div5, t22);
    			append_dev(div5, p8);
    			append_dev(div5, t24);
    			append_dev(div5, p9);
    			append_dev(div9, t26);
    			append_dev(div9, div6);
    			append_dev(div6, img5);
    			append_dev(div6, t27);
    			append_dev(div6, p10);
    			append_dev(div6, t29);
    			append_dev(div6, p11);
    			append_dev(div9, t31);
    			append_dev(div9, div7);
    			append_dev(div7, img6);
    			append_dev(div7, t32);
    			append_dev(div7, p12);
    			append_dev(div7, t34);
    			append_dev(div7, p13);
    			append_dev(div9, t36);
    			append_dev(div9, div8);
    			append_dev(div8, img7);
    			append_dev(div8, t37);
    			append_dev(div8, p14);
    			append_dev(div8, t39);
    			append_dev(div8, p15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
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
    	validate_slots('UsersList', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UsersList> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class UsersList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UsersList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div21;
    	let header;
    	let t0;
    	let userslist;
    	let t1;
    	let div14;
    	let p0;
    	let t3;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div0;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t9;
    	let div2;
    	let p3;
    	let t11;
    	let p4;
    	let t13;
    	let div5;
    	let img2;
    	let img2_src_value;
    	let t14;
    	let div4;
    	let p5;
    	let t16;
    	let p6;
    	let t18;
    	let div7;
    	let div6;
    	let p7;
    	let b;
    	let t20;
    	let t21;
    	let div9;
    	let div8;
    	let p8;
    	let t23;
    	let div11;
    	let div10;
    	let p9;
    	let t25;
    	let div13;
    	let img3;
    	let img3_src_value;
    	let t26;
    	let div12;
    	let p10;
    	let t28;
    	let p11;
    	let t30;
    	let div20;
    	let div19;
    	let div15;
    	let i0;
    	let t31;
    	let div16;
    	let input;
    	let t32;
    	let div17;
    	let i1;
    	let t33;
    	let div18;
    	let i2;
    	let current;

    	header = new Header({
    			props: {
    				appName: /*appName*/ ctx[0],
    				userName: /*userName*/ ctx[1],
    				userAvatar: /*userAvatar*/ ctx[2]
    			},
    			$$inline: true
    		});

    	userslist = new UsersList({ $$inline: true });

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(userslist.$$.fragment);
    			t1 = space();
    			div14 = element("div");
    			p0 = element("p");
    			p0.textContent = "This is beggining of the #main chat";
    			t3 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = "Maria Mango";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Hello, team! Sent some task updates to Jira!";
    			t8 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t9 = space();
    			div2 = element("div");
    			p3 = element("p");
    			p3.textContent = "Ashlynn Bator";
    			t11 = space();
    			p4 = element("p");
    			p4.textContent = "Wow, this new chat is awesome!";
    			t13 = space();
    			div5 = element("div");
    			img2 = element("img");
    			t14 = space();
    			div4 = element("div");
    			p5 = element("p");
    			p5.textContent = "Cooper Westervelt";
    			t16 = space();
    			p6 = element("p");
    			p6.textContent = "Yep, already seen this task update, working on it.";
    			t18 = space();
    			div7 = element("div");
    			div6 = element("div");
    			p7 = element("p");
    			b = element("b");
    			b.textContent = "@Kadin_Vaccaro";
    			t20 = text(", are you checked it?");
    			t21 = space();
    			div9 = element("div");
    			div8 = element("div");
    			p8 = element("p");
    			p8.textContent = "Yep, frontend part on me. Already working on it.";
    			t23 = space();
    			div11 = element("div");
    			div10 = element("div");
    			p9 = element("p");
    			p9.textContent = "Figma mockup already done, started the HTML.";
    			t25 = space();
    			div13 = element("div");
    			img3 = element("img");
    			t26 = space();
    			div12 = element("div");
    			p10 = element("p");
    			p10.textContent = "Cooper Westervelt";
    			t28 = space();
    			p11 = element("p");
    			p11.textContent = "Happy to hear it!";
    			t30 = space();
    			div20 = element("div");
    			div19 = element("div");
    			div15 = element("div");
    			i0 = element("i");
    			t31 = space();
    			div16 = element("div");
    			input = element("input");
    			t32 = space();
    			div17 = element("div");
    			i1 = element("i");
    			t33 = space();
    			div18 = element("div");
    			i2 = element("i");
    			attr_dev(p0, "class", "start-message");
    			add_location(p0, file, 13, 2, 310);
    			if (!src_url_equal(img0.src, img0_src_value = "img/users/user2.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "avatar");
    			add_location(img0, file, 16, 3, 405);
    			attr_dev(p1, "class", "name");
    			add_location(p1, file, 18, 4, 476);
    			attr_dev(p2, "class", "text");
    			add_location(p2, file, 19, 4, 512);
    			attr_dev(div0, "class", "body");
    			add_location(div0, file, 17, 3, 453);
    			attr_dev(div1, "class", "message");
    			add_location(div1, file, 15, 2, 380);
    			if (!src_url_equal(img1.src, img1_src_value = "img/users/user3.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "avatar");
    			add_location(img1, file, 24, 3, 624);
    			attr_dev(p3, "class", "name");
    			add_location(p3, file, 26, 4, 695);
    			attr_dev(p4, "class", "text");
    			add_location(p4, file, 27, 4, 733);
    			attr_dev(div2, "class", "body");
    			add_location(div2, file, 25, 3, 672);
    			attr_dev(div3, "class", "message");
    			add_location(div3, file, 23, 2, 599);
    			if (!src_url_equal(img2.src, img2_src_value = "img/users/user5.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "avatar");
    			add_location(img2, file, 32, 3, 831);
    			attr_dev(p5, "class", "name");
    			add_location(p5, file, 34, 4, 902);
    			attr_dev(p6, "class", "text");
    			add_location(p6, file, 35, 4, 944);
    			attr_dev(div4, "class", "body");
    			add_location(div4, file, 33, 3, 879);
    			attr_dev(div5, "class", "message");
    			add_location(div5, file, 31, 2, 806);
    			add_location(b, file, 40, 20, 1100);
    			attr_dev(p7, "class", "text");
    			add_location(p7, file, 40, 4, 1084);
    			attr_dev(div6, "class", "body");
    			add_location(div6, file, 39, 3, 1061);
    			attr_dev(div7, "class", "message");
    			add_location(div7, file, 38, 2, 1036);
    			attr_dev(p8, "class", "text");
    			add_location(p8, file, 46, 4, 1222);
    			attr_dev(div8, "class", "body");
    			add_location(div8, file, 45, 3, 1199);
    			attr_dev(div9, "class", "user-message");
    			add_location(div9, file, 44, 2, 1169);
    			attr_dev(p9, "class", "text");
    			add_location(p9, file, 51, 4, 1365);
    			attr_dev(div10, "class", "body");
    			add_location(div10, file, 50, 3, 1342);
    			attr_dev(div11, "class", "user-message");
    			add_location(div11, file, 49, 2, 1312);
    			if (!src_url_equal(img3.src, img3_src_value = "img/users/user5.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "avatar");
    			add_location(img3, file, 56, 3, 1477);
    			attr_dev(p10, "class", "name");
    			add_location(p10, file, 58, 4, 1548);
    			attr_dev(p11, "class", "text");
    			add_location(p11, file, 59, 4, 1590);
    			attr_dev(div12, "class", "body");
    			add_location(div12, file, 57, 3, 1525);
    			attr_dev(div13, "class", "message");
    			add_location(div13, file, 55, 2, 1452);
    			attr_dev(div14, "id", "users-chat");
    			add_location(div14, file, 12, 1, 286);
    			attr_dev(i0, "class", "fas fa-paperclip");
    			add_location(i0, file, 65, 27, 1727);
    			attr_dev(div15, "class", "attachment");
    			add_location(div15, file, 65, 3, 1703);
    			attr_dev(input, "class", "itself");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Write a message...");
    			add_location(input, file, 67, 4, 1793);
    			attr_dev(div16, "class", "input");
    			add_location(div16, file, 66, 3, 1769);
    			attr_dev(i1, "class", "fas fa-grin-alt");
    			add_location(i1, file, 69, 22, 1893);
    			attr_dev(div17, "class", "emoji");
    			add_location(div17, file, 69, 3, 1874);
    			attr_dev(i2, "class", "fas fa-paper-plane");
    			add_location(i2, file, 70, 21, 1952);
    			attr_dev(div18, "class", "send");
    			add_location(div18, file, 70, 3, 1934);
    			attr_dev(div19, "class", "container");
    			add_location(div19, file, 64, 2, 1676);
    			attr_dev(div20, "id", "footer");
    			add_location(div20, file, 63, 1, 1656);
    			attr_dev(div21, "class", "main-container");
    			add_location(div21, file, 9, 0, 195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			mount_component(header, div21, null);
    			append_dev(div21, t0);
    			mount_component(userslist, div21, null);
    			append_dev(div21, t1);
    			append_dev(div21, div14);
    			append_dev(div14, p0);
    			append_dev(div14, t3);
    			append_dev(div14, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(div14, t8);
    			append_dev(div14, div3);
    			append_dev(div3, img1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, p3);
    			append_dev(div2, t11);
    			append_dev(div2, p4);
    			append_dev(div14, t13);
    			append_dev(div14, div5);
    			append_dev(div5, img2);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, p5);
    			append_dev(div4, t16);
    			append_dev(div4, p6);
    			append_dev(div14, t18);
    			append_dev(div14, div7);
    			append_dev(div7, div6);
    			append_dev(div6, p7);
    			append_dev(p7, b);
    			append_dev(p7, t20);
    			append_dev(div14, t21);
    			append_dev(div14, div9);
    			append_dev(div9, div8);
    			append_dev(div8, p8);
    			append_dev(div14, t23);
    			append_dev(div14, div11);
    			append_dev(div11, div10);
    			append_dev(div10, p9);
    			append_dev(div14, t25);
    			append_dev(div14, div13);
    			append_dev(div13, img3);
    			append_dev(div13, t26);
    			append_dev(div13, div12);
    			append_dev(div12, p10);
    			append_dev(div12, t28);
    			append_dev(div12, p11);
    			append_dev(div21, t30);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div15);
    			append_dev(div15, i0);
    			append_dev(div19, t31);
    			append_dev(div19, div16);
    			append_dev(div16, input);
    			append_dev(div19, t32);
    			append_dev(div19, div17);
    			append_dev(div17, i1);
    			append_dev(div19, t33);
    			append_dev(div19, div18);
    			append_dev(div18, i2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*appName*/ 1) header_changes.appName = /*appName*/ ctx[0];
    			if (dirty & /*userName*/ 2) header_changes.userName = /*userName*/ ctx[1];
    			if (dirty & /*userAvatar*/ 4) header_changes.userAvatar = /*userAvatar*/ ctx[2];
    			header.$set(header_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(userslist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(userslist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    			destroy_component(header);
    			destroy_component(userslist);
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
    	const writable_props = ['appName', 'userName', 'userStatus', 'userAvatar'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(3, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    	};

    	$$self.$capture_state = () => ({
    		appName,
    		userName,
    		userStatus,
    		userAvatar,
    		Header,
    		UsersList
    	});

    	$$self.$inject_state = $$props => {
    		if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
    		if ('userName' in $$props) $$invalidate(1, userName = $$props.userName);
    		if ('userStatus' in $$props) $$invalidate(3, userStatus = $$props.userStatus);
    		if ('userAvatar' in $$props) $$invalidate(2, userAvatar = $$props.userAvatar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [appName, userName, userAvatar, userStatus];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			appName: 0,
    			userName: 1,
    			userStatus: 3,
    			userAvatar: 2
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

    		if (/*userStatus*/ ctx[3] === undefined && !('userStatus' in props)) {
    			console.warn("<App> was created without expected prop 'userStatus'");
    		}

    		if (/*userAvatar*/ ctx[2] === undefined && !('userAvatar' in props)) {
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
