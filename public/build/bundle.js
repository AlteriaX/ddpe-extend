
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    function hasContext(key) {
        return get_current_component().$$.context.has(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
    /**
     * Base class to create strongly typed Svelte components.
     * This only exists for typing purposes and should be used in `.d.ts` files.
     *
     * ### Example:
     *
     * You have component library on npm called `component-library`, from which
     * you export a component called `MyComponent`. For Svelte+TypeScript users,
     * you want to provide typings. Therefore you create a `index.d.ts`:
     * ```ts
     * import { SvelteComponentTyped } from "svelte";
     * export class MyComponent extends SvelteComponentTyped<{foo: string}> {}
     * ```
     * Typing this makes it possible for IDEs like VS Code with the Svelte extension
     * to provide intellisense and to use the component like this in a Svelte file
     * with TypeScript:
     * ```svelte
     * <script lang="ts">
     * 	import { MyComponent } from "component-library";
     * </script>
     * <MyComponent foo={'bar'} />
     * ```
     *
     * #### Why not make this part of `SvelteComponent(Dev)`?
     * Because
     * ```ts
     * class ASubclassOfSvelteComponent extends SvelteComponent<{foo: string}> {}
     * const component: typeof SvelteComponent = ASubclassOfSvelteComponent;
     * ```
     * will throw a type error, so we need to seperate the more strictly typed class.
     */
    class SvelteComponentTyped extends SvelteComponentDev {
        constructor(options) {
            super(options);
        }
    }



    var svelte = /*#__PURE__*/Object.freeze({
        __proto__: null,
        SvelteComponent: SvelteComponentDev,
        SvelteComponentTyped: SvelteComponentTyped,
        afterUpdate: afterUpdate,
        beforeUpdate: beforeUpdate,
        createEventDispatcher: createEventDispatcher,
        getContext: getContext,
        hasContext: hasContext,
        onDestroy: onDestroy,
        onMount: onMount,
        setContext: setContext,
        tick: tick
    });

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    function hostMatches(anchor) {
      const host = location.host;
      return (
        anchor.host == host ||
        // svelte seems to kill anchor.host value in ie11, so fall back to checking href
        anchor.href.indexOf(`https://${host}`) === 0 ||
        anchor.href.indexOf(`http://${host}`) === 0
      )
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
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
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(7, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(6, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(5, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 32) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 192) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		$base,
    		$location,
    		$routes,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.38.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 4,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[2],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, routeParams, $location*/ 532)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[2],
    		/*routeProps*/ ctx[3]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 28)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 2) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(2, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A link action that can be added to <a href=""> tags rather
     * than using the <Link> component.
     *
     * Example:
     * ```html
     * <a href="/post/{postId}" use:link>{post.title}</a>
     * ```
     */
    function link(node) {
      function onClick(event) {
        const anchor = event.currentTarget;

        if (
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event)
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    /* src\components\Header.svelte generated by Svelte v3.38.2 */
    const file = "src\\components\\Header.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let a;
    	let link_action;
    	let t1;
    	let h1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "#";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Discord Data Package Explorer";
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-16r6hxi");
    			add_location(a, file, 7, 45, 191);
    			attr_dev(div0, "class", "app-header-icon tag svelte-16r6hxi");
    			add_location(div0, file, 7, 12, 158);
    			attr_dev(h1, "class", "svelte-16r6hxi");
    			add_location(h1, file, 8, 12, 236);
    			attr_dev(div1, "class", "app-header-container svelte-16r6hxi");
    			add_location(div1, file, 6, 8, 111);
    			attr_dev(div2, "class", "app-header svelte-16r6hxi");
    			add_location(div2, file, 5, 4, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(div1, t1);
    			append_dev(div1, h1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a)),
    					listen_dev(h1, "click", /*click_handler*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => navigate("/");
    	$$self.$capture_state = () => ({ link, navigate });
    	return [click_handler];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.38.2 */

    const file$1 = "src\\components\\Footer.svelte";

    function create_fragment$3(ctx) {
    	let footer;
    	let p;
    	let t0;
    	let a0;
    	let t2;
    	let a1;
    	let t4;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			p = element("p");
    			t0 = text("Made with ❤️ by ");
    			a0 = element("a");
    			a0.textContent = "Androz2091";
    			t2 = text(". DDPE is an ");
    			a1 = element("a");
    			a1.textContent = "open source";
    			t4 = text(" software.");
    			attr_dev(a0, "href", "https://twitter.com/Androz2091");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$1, 2, 21, 32);
    			attr_dev(a1, "href", "https://github.com/Androz2091/discord-data-package-explorer");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 2, 105, 116);
    			attr_dev(p, "class", "svelte-1ekex2e");
    			add_location(p, file$1, 2, 2, 13);
    			attr_dev(footer, "class", "svelte-1ekex2e");
    			add_location(footer, file$1, 1, 1, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    			append_dev(p, t0);
    			append_dev(p, a0);
    			append_dev(p, t2);
    			append_dev(p, a1);
    			append_dev(p, t4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const storedData = localStorage.getItem('data') || null;

    let dataValue = storedData && JSON.parse(storedData);

    const loadTask = writable(null);
    const loadEstimatedTime = writable(null);
    const data = writable(dataValue);

    data.subscribe((value) => {
        if (!value) localStorage.removeItem('data');
        else if (!value.isDemo) localStorage.setItem('data', JSON.stringify(value));
    });

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    const generateAvatarURL = (avatarHash, id, discriminator) => {
        let avatarURL = 'https://cdn.discordapp.com/';
        if (avatarHash) avatarURL += `avatars/${id}/${avatarHash}.webp`;
        else avatarURL += `embed/avatars/${discriminator % 5}.png`;
        return avatarURL;
    };

    const getCreatedTimestamp = (id) => {
        const EPOCH = 1420070400000;
        return id / 4194304 + EPOCH;
    };

    const getFavoriteWords = (words) => {
        words = words.flat(3);
        
        let item,
            length = words.length,
            array = [],
            object = {};
        
        for (let index = 0; index < length; index++) {
            item = words[index];
            if (!item) continue;
        
            if (!object[item]) object[item] = 1;
            else ++object[item];
        }
        
        for (let p in object) array[array.length] = p;
        
        return array.sort((a, b) => object[b] - object[a]).map((word) => ({ word: word, count: object[word] })).slice(0, 5);
    };

    const getGitHubContributors = () => {
        return new Promise((resolve, reject) => {
            const cachedExpiresAt = localStorage.getItem('contributors_cache_expires_at');
            const cachedData = localStorage.getItem('contributors_cache');
            if (cachedExpiresAt && (cachedExpiresAt > Date.now()) && cachedData) return resolve(JSON.parse(cachedData));
            axios$1.get('https://api.github.com/repos/Androz2091/discord-data-package-explorer/contributors')
                .then((response) => {
                    const data = response.data.map((user) => ({ username: user.login, avatar: user.avatar_url, url: user.html_url }) );
                    localStorage.setItem('contributors_cache', JSON.stringify(data));
                    localStorage.setItem('contributors_cache_expires_at', Date.now() + 3600000);
                    resolve(data);
                }).catch(() => {
                    reject(cachedData || []);
                });
        });
    };

    const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    const demoUserObject = {
        id: 422820341791064085,
        username: 'Wumpus',
        discriminator: '0000',
        avatar: null
    };
        
    var generateDemoData = () => {

        const removeAnalytics = window.location.href.includes('noanalytics');

        return {
            isDemo: true,

            user: demoUserObject,

            topDMs: new Array(10).fill({}).map(() => ({
                messageCount: randomNumber(200, 600),
                userData: demoUserObject
            })).sort((a, b) => b.messageCount - a.messageCount),
            topChannels: new Array(10).fill({}).map(() => ({
                messageCount: randomNumber(200, 600),
                name: 'awesome',
                guildName: 'AndrozDev'
            })).sort((a, b) => b.messageCount - a.messageCount),
            guildCount: randomNumber(10, 200),
            dmChannelCount: randomNumber(30, 50),
            channelCount: randomNumber(50, 100),
            messageCount: randomNumber(300, 600),
            characterCount: randomNumber(4000, 10000),
            totalSpent: randomNumber(100, 200),
            hoursValues: new Array(24).fill(0).map(() => Math.floor(Math.random() * 300) + 1),
            favoriteWords: [
                {
                    word: 'Androz2091',
                    count: randomNumber(600, 1000)
                },
                {
                    word: 'DDPE',
                    count: randomNumber(200, 600)
                }
            ],
            payments: {
                total: 0,
                list: ''
            },

            ...(!removeAnalytics && {
                openCount: randomNumber(200, 300),
                averageOpenCountPerDay: randomNumber(3, 5),
                notificationCount: randomNumber(200, 400),
                joinVoiceChannelCount: randomNumber(40, 100), 
                joinCallCount: randomNumber(20, 30),
                addReactionCount: randomNumber(100, 200),
                messageEditedCount: randomNumber(50, 70),
                sentMessageCount: randomNumber(200, 600),
                averageMessageCountPerDay: randomNumber(20, 30),
                slashCommandUsedCount: randomNumber(10, 20)
            })
        };
    };

    function $(expr, con) {
    	return typeof expr === "string"? (con || document).querySelector(expr) : expr || null;
    }



    $.create = (tag, o) => {
    	var element = document.createElement(tag);

    	for (var i in o) {
    		var val = o[i];

    		if (i === "inside") {
    			$(val).appendChild(element);
    		}
    		else if (i === "around") {
    			var ref = $(val);
    			ref.parentNode.insertBefore(element, ref);
    			element.appendChild(ref);

    		} else if (i === "styles") {
    			if(typeof val === "object") {
    				Object.keys(val).map(prop => {
    					element.style[prop] = val[prop];
    				});
    			}
    		} else if (i in element ) {
    			element[i] = val;
    		}
    		else {
    			element.setAttribute(i, val);
    		}
    	}

    	return element;
    };

    function getOffset(element) {
    	let rect = element.getBoundingClientRect();
    	return {
    		// https://stackoverflow.com/a/7436602/6495043
    		// rect.top varies with scroll, so we add whatever has been
    		// scrolled to it to get absolute distance from actual page top
    		top: rect.top + (document.documentElement.scrollTop || document.body.scrollTop),
    		left: rect.left + (document.documentElement.scrollLeft || document.body.scrollLeft)
    	};
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    // an element's offsetParent property will return null whenever it, or any of its parents,
    // is hidden via the display style property.
    function isHidden(el) {
    	return (el.offsetParent === null);
    }

    function isElementInViewport(el) {
    	// Although straightforward: https://stackoverflow.com/a/7557433/6495043
    	var rect = el.getBoundingClientRect();

    	return (
    		rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    	);
    }

    function getElementContentWidth(element) {
    	var styles = window.getComputedStyle(element);
    	var padding = parseFloat(styles.paddingLeft) +
    		parseFloat(styles.paddingRight);

    	return element.clientWidth - padding;
    }





    function fire(target, type, properties) {
    	var evt = document.createEvent("HTMLEvents");

    	evt.initEvent(type, true, true );

    	for (var j in properties) {
    		evt[j] = properties[j];
    	}

    	return target.dispatchEvent(evt);
    }

    // https://css-tricks.com/snippets/javascript/loop-queryselectorall-matches/

    const BASE_MEASURES = {
    	margins: {
    		top: 10,
    		bottom: 10,
    		left: 20,
    		right: 20
    	},
    	paddings: {
    		top: 20,
    		bottom: 40,
    		left: 30,
    		right: 10
    	},

    	baseHeight: 240,
    	titleHeight: 20,
    	legendHeight: 30,

    	titleFontSize: 12,
    };

    function getTopOffset(m) {
    	return m.titleHeight + m.margins.top + m.paddings.top;
    }

    function getLeftOffset(m) {
    	return m.margins.left + m.paddings.left;
    }

    function getExtraHeight(m) {
    	let totalExtraHeight = m.margins.top + m.margins.bottom
    		+ m.paddings.top + m.paddings.bottom
    		+ m.titleHeight + m.legendHeight;
    	return totalExtraHeight;
    }

    function getExtraWidth(m) {
    	let totalExtraWidth = m.margins.left + m.margins.right
    		+ m.paddings.left + m.paddings.right;

    	return totalExtraWidth;
    }

    const INIT_CHART_UPDATE_TIMEOUT = 700;
    const CHART_POST_ANIMATE_TIMEOUT = 400;

    const AXIS_LEGEND_BAR_SIZE = 100;

    const BAR_CHART_SPACE_RATIO = 0.5;
    const MIN_BAR_PERCENT_HEIGHT = 0.00;

    const LINE_CHART_DOT_SIZE = 4;
    const DOT_OVERLAY_SIZE_INCR = 4;

    const PERCENTAGE_BAR_DEFAULT_HEIGHT = 20;
    const PERCENTAGE_BAR_DEFAULT_DEPTH = 2;

    // Fixed 5-color theme,
    // More colors are difficult to parse visually
    const HEATMAP_DISTRIBUTION_SIZE = 5;

    const HEATMAP_SQUARE_SIZE = 10;
    const HEATMAP_GUTTER_SIZE = 2;

    const DEFAULT_CHAR_WIDTH = 7;

    const TOOLTIP_POINTER_TRIANGLE_HEIGHT = 5;

    const DEFAULT_CHART_COLORS = ['light-blue', 'blue', 'violet', 'red', 'orange',
    	'yellow', 'green', 'light-green', 'purple', 'magenta', 'light-grey', 'dark-grey'];
    const HEATMAP_COLORS_GREEN = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];



    const DEFAULT_COLORS = {
    	bar: DEFAULT_CHART_COLORS,
    	line: DEFAULT_CHART_COLORS,
    	pie: DEFAULT_CHART_COLORS,
    	percentage: DEFAULT_CHART_COLORS,
    	heatmap: HEATMAP_COLORS_GREEN,
    	donut: DEFAULT_CHART_COLORS
    };

    // Universal constants
    const ANGLE_RATIO = Math.PI / 180;
    const FULL_ANGLE = 360;

    class SvgTip {
    	constructor({
    		parent = null,
    		colors = []
    	}) {
    		this.parent = parent;
    		this.colors = colors;
    		this.titleName = '';
    		this.titleValue = '';
    		this.listValues = [];
    		this.titleValueFirst = 0;

    		this.x = 0;
    		this.y = 0;

    		this.top = 0;
    		this.left = 0;

    		this.setup();
    	}

    	setup() {
    		this.makeTooltip();
    	}

    	refresh() {
    		this.fill();
    		this.calcPosition();
    	}

    	makeTooltip() {
    		this.container = $.create('div', {
    			inside: this.parent,
    			className: 'graph-svg-tip comparison',
    			innerHTML: `<span class="title"></span>
				<ul class="data-point-list"></ul>
				<div class="svg-pointer"></div>`
    		});
    		this.hideTip();

    		this.title = this.container.querySelector('.title');
    		this.dataPointList = this.container.querySelector('.data-point-list');

    		this.parent.addEventListener('mouseleave', () => {
    			this.hideTip();
    		});
    	}

    	fill() {
    		let title;
    		if(this.index) {
    			this.container.setAttribute('data-point-index', this.index);
    		}
    		if(this.titleValueFirst) {
    			title = `<strong>${this.titleValue}</strong>${this.titleName}`;
    		} else {
    			title = `${this.titleName}<strong>${this.titleValue}</strong>`;
    		}
    		this.title.innerHTML = title;
    		this.dataPointList.innerHTML = '';

    		this.listValues.map((set, i) => {
    			const color = this.colors[i] || 'black';
    			let value = set.formatted === 0 || set.formatted ? set.formatted : set.value;

    			let li = $.create('li', {
    				styles: {
    					'border-top': `3px solid ${color}`
    				},
    				innerHTML: `<strong style="display: block;">${ value === 0 || value ? value : '' }</strong>
					${set.title ? set.title : '' }`
    			});

    			this.dataPointList.appendChild(li);
    		});
    	}

    	calcPosition() {
    		let width = this.container.offsetWidth;

    		this.top = this.y - this.container.offsetHeight
    			- TOOLTIP_POINTER_TRIANGLE_HEIGHT;
    		this.left = this.x - width/2;
    		let maxLeft = this.parent.offsetWidth - width;

    		let pointer = this.container.querySelector('.svg-pointer');

    		if(this.left < 0) {
    			pointer.style.left = `calc(50% - ${-1 * this.left}px)`;
    			this.left = 0;
    		} else if(this.left > maxLeft) {
    			let delta = this.left - maxLeft;
    			let pointerOffset = `calc(50% + ${delta}px)`;
    			pointer.style.left = pointerOffset;

    			this.left = maxLeft;
    		} else {
    			pointer.style.left = `50%`;
    		}
    	}

    	setValues(x, y, title = {}, listValues = [], index = -1) {
    		this.titleName = title.name;
    		this.titleValue = title.value;
    		this.listValues = listValues;
    		this.x = x;
    		this.y = y;
    		this.titleValueFirst = title.valueFirst || 0;
    		this.index = index;
    		this.refresh();
    	}

    	hideTip() {
    		this.container.style.top = '0px';
    		this.container.style.left = '0px';
    		this.container.style.opacity = '0';
    	}

    	showTip() {
    		this.container.style.top = this.top + 'px';
    		this.container.style.left = this.left + 'px';
    		this.container.style.opacity = '1';
    	}
    }

    /**
     * Returns the value of a number upto 2 decimal places.
     * @param {Number} d Any number
     */
    function floatTwo(d) {
    	return parseFloat(d.toFixed(2));
    }

    /**
     * Returns whether or not two given arrays are equal.
     * @param {Array} arr1 First array
     * @param {Array} arr2 Second array
     */


    /**
     * Shuffles array in place. ES6 version
     * @param {Array} array An array containing the items.
     */


    /**
     * Fill an array with extra points
     * @param {Array} array Array
     * @param {Number} count number of filler elements
     * @param {Object} element element to fill with
     * @param {Boolean} start fill at start?
     */
    function fillArray(array, count, element, start=false) {
    	if(!element) {
    		element = start ? array[0] : array[array.length - 1];
    	}
    	let fillerArray = new Array(Math.abs(count)).fill(element);
    	array = start ? fillerArray.concat(array) : array.concat(fillerArray);
    	return array;
    }

    /**
     * Returns pixel width of string.
     * @param {String} string
     * @param {Number} charWidth Width of single char in pixels
     */
    function getStringWidth(string, charWidth) {
    	return (string+"").length * charWidth;
    }



    // https://stackoverflow.com/a/29325222


    function getPositionByAngle(angle, radius) {
    	return {
    		x: Math.sin(angle * ANGLE_RATIO) * radius,
    		y: Math.cos(angle * ANGLE_RATIO) * radius,
    	};
    }

    /**
     * Check if a number is valid for svg attributes
     * @param {object} candidate Candidate to test
     * @param {Boolean} nonNegative flag to treat negative number as invalid
     */
    function isValidNumber(candidate, nonNegative=false) {
    	if (Number.isNaN(candidate)) return false;
    	else if (candidate === undefined) return false;
    	else if (!Number.isFinite(candidate)) return false;
    	else if (nonNegative && candidate < 0) return false;
    	else return true;
    }

    /**
     * Round a number to the closes precision, max max precision 4
     * @param {Number} d Any Number
     */
    function round(d) {
    	// https://floating-point-gui.de/
    	// https://www.jacklmoore.com/notes/rounding-in-javascript/
    	return Number(Math.round(d + 'e4') + 'e-4');
    }

    /**
     * Creates a deep clone of an object
     * @param {Object} candidate Any Object
     */
     function deepClone(candidate) {
    	let cloned, value, key;
      
    	if (candidate instanceof Date) {
    	  return new Date(candidate.getTime());
    	}
      
    	if (typeof candidate !== "object" || candidate === null) {
    	  return candidate;
    	}
      
    	cloned = Array.isArray(candidate) ? [] : {};
      
    	for (key in candidate) {
    	  value = candidate[key];
      
    	  cloned[key] = deepClone(value);
    	}
      
    	return cloned;
      }

    function getBarHeightAndYAttr(yTop, zeroLine) {
    	let height, y;
    	if (yTop <= zeroLine) {
    		height = zeroLine - yTop;
    		y = yTop;
    	} else {
    		height = yTop - zeroLine;
    		y = zeroLine;
    	}

    	return [height, y];
    }

    function equilizeNoOfElements(array1, array2,
    	extraCount = array2.length - array1.length) {

    	// Doesn't work if either has zero elements.
    	if(extraCount > 0) {
    		array1 = fillArray(array1, extraCount);
    	} else {
    		array2 = fillArray(array2, extraCount);
    	}
    	return [array1, array2];
    }

    function truncateString(txt, len) {
    	if (!txt) {
    		return;
    	}
    	if (txt.length > len) {
    		return txt.slice(0, len-3) + '...';
    	} else {
    		return txt;
    	}
    }

    function shortenLargeNumber(label) {
    	let number;
    	if (typeof label === 'number') number = label;
    	else if (typeof label === 'string') {
    		number = Number(label);
    		if (Number.isNaN(number)) return label;
    	}

    	// Using absolute since log wont work for negative numbers
    	let p = Math.floor(Math.log10(Math.abs(number)));
    	if (p <= 2) return number; // Return as is for a 3 digit number of less
    	let	l = Math.floor(p / 3);
    	let shortened = (Math.pow(10, p - l * 3) * +(number / Math.pow(10, p)).toFixed(1));

    	// Correct for floating point error upto 2 decimal places
    	return Math.round(shortened*100)/100 + ' ' + ['', 'K', 'M', 'B', 'T'][l];
    }

    // cubic bezier curve calculation (from example by François Romain)
    function getSplineCurvePointsStr(xList, yList) {

    	let points=[];
    	for(let i=0;i<xList.length;i++){
    		points.push([xList[i], yList[i]]);
    	}

    	let smoothing = 0.2;
    	let line = (pointA, pointB) => {
    		let lengthX = pointB[0] - pointA[0];
    		let lengthY = pointB[1] - pointA[1];
    		return {
    			length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    			angle: Math.atan2(lengthY, lengthX)
    		};
    	};
        
    	let controlPoint = (current, previous, next, reverse) => {
    		let p = previous || current;
    		let n = next || current;
    		let o = line(p, n);
    		let angle = o.angle + (reverse ? Math.PI : 0);
    		let length = o.length * smoothing;
    		let x = current[0] + Math.cos(angle) * length;
    		let y = current[1] + Math.sin(angle) * length;
    		return [x, y];
    	};
        
    	let bezierCommand = (point, i, a) => {
    		let cps = controlPoint(a[i - 1], a[i - 2], point);
    		let cpe = controlPoint(point, a[i - 1], a[i + 1], true);
    		return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
    	};
        
    	let pointStr = (points, command) => {
    		return points.reduce((acc, point, i, a) => i === 0
    			? `${point[0]},${point[1]}`
    			: `${acc} ${command(point, i, a)}`, '');
    	};
        
    	return pointStr(points, bezierCommand);
    }

    const PRESET_COLOR_MAP = {
    	'light-blue': '#7cd6fd',
    	'blue': '#5e64ff',
    	'violet': '#743ee2',
    	'red': '#ff5858',
    	'orange': '#ffa00a',
    	'yellow': '#feef72',
    	'green': '#28a745',
    	'light-green': '#98d85b',
    	'purple': '#b554ff',
    	'magenta': '#ffa3ef',
    	'black': '#36114C',
    	'grey': '#bdd3e6',
    	'light-grey': '#f0f4f7',
    	'dark-grey': '#b8c2cc'
    };

    function limitColor(r){
    	if (r > 255) return 255;
    	else if (r < 0) return 0;
    	return r;
    }

    function lightenDarkenColor(color, amt) {
    	let col = getColor(color);
    	let usePound = false;
    	if (col[0] == "#") {
    		col = col.slice(1);
    		usePound = true;
    	}
    	let num = parseInt(col,16);
    	let r = limitColor((num >> 16) + amt);
    	let b = limitColor(((num >> 8) & 0x00FF) + amt);
    	let g = limitColor((num & 0x0000FF) + amt);
    	return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }

    function isValidColor(string) {
    	// https://stackoverflow.com/a/32685393
    	let HEX_RE = /(^\s*)(#)((?:[A-Fa-f0-9]{3}){1,2})$/i;
    	let RGB_RE = /(^\s*)(rgb|hsl)(a?)[(]\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*(?:,\s*([\d.]+)\s*)?[)]$/i;
    	return HEX_RE.test(string) || RGB_RE.test(string);
    }

    const getColor = (color) => {
    	// When RGB color, convert to hexadecimal (alpha value is omitted)
    	if((/rgb[a]{0,1}\([\d, ]+\)/gim).test(color)) {
    		return (/\D+(\d*)\D+(\d*)\D+(\d*)/gim).exec(color)
    			.map((x, i) => (i !== 0 ? Number(x).toString(16) : '#'))
    			.reduce((c, ch) => `${c}${ch}`);
    	}
    	return PRESET_COLOR_MAP[color] || color;
    };

    const AXIS_TICK_LENGTH = 6;
    const LABEL_MARGIN = 4;
    const LABEL_MAX_CHARS = 15;
    const FONT_SIZE = 10;
    const BASE_LINE_COLOR = '#dadada';
    const FONT_FILL = '#555b51';

    function $$1(expr, con) {
    	return typeof expr === "string"? (con || document).querySelector(expr) : expr || null;
    }

    function createSVG(tag, o) {
    	var element = document.createElementNS("http://www.w3.org/2000/svg", tag);

    	for (var i in o) {
    		var val = o[i];

    		if (i === "inside") {
    			$$1(val).appendChild(element);
    		}
    		else if (i === "around") {
    			var ref = $$1(val);
    			ref.parentNode.insertBefore(element, ref);
    			element.appendChild(ref);

    		} else if (i === "styles") {
    			if(typeof val === "object") {
    				Object.keys(val).map(prop => {
    					element.style[prop] = val[prop];
    				});
    			}
    		} else {
    			if(i === "className") { i = "class"; }
    			if(i === "innerHTML") {
    				element['textContent'] = val;
    			} else {
    				element.setAttribute(i, val);
    			}
    		}
    	}

    	return element;
    }

    function renderVerticalGradient(svgDefElem, gradientId) {
    	return createSVG('linearGradient', {
    		inside: svgDefElem,
    		id: gradientId,
    		x1: 0,
    		x2: 0,
    		y1: 0,
    		y2: 1
    	});
    }

    function setGradientStop(gradElem, offset, color, opacity) {
    	return createSVG('stop', {
    		'inside': gradElem,
    		'style': `stop-color: ${color}`,
    		'offset': offset,
    		'stop-opacity': opacity
    	});
    }

    function makeSVGContainer(parent, className, width, height) {
    	return createSVG('svg', {
    		className: className,
    		inside: parent,
    		width: width,
    		height: height
    	});
    }

    function makeSVGDefs(svgContainer) {
    	return createSVG('defs', {
    		inside: svgContainer,
    	});
    }

    function makeSVGGroup(className, transform='', parent=undefined) {
    	let args = {
    		className: className,
    		transform: transform
    	};
    	if(parent) args.inside = parent;
    	return createSVG('g', args);
    }



    function makePath(pathStr, className='', stroke='none', fill='none', strokeWidth=2) {
    	return createSVG('path', {
    		className: className,
    		d: pathStr,
    		styles: {
    			stroke: stroke,
    			fill: fill,
    			'stroke-width': strokeWidth
    		}
    	});
    }

    function makeArcPathStr(startPosition, endPosition, center, radius, clockWise=1, largeArc=0){
    	let [arcStartX, arcStartY] = [center.x + startPosition.x, center.y + startPosition.y];
    	let [arcEndX, arcEndY] = [center.x + endPosition.x, center.y + endPosition.y];
    	return `M${center.x} ${center.y}
		L${arcStartX} ${arcStartY}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${arcEndY} z`;
    }

    function makeCircleStr(startPosition, endPosition, center, radius, clockWise=1, largeArc=0){
    	let [arcStartX, arcStartY] = [center.x + startPosition.x, center.y + startPosition.y];
    	let [arcEndX, midArc, arcEndY] = [center.x + endPosition.x, center.y * 2, center.y + endPosition.y];
    	return `M${center.x} ${center.y}
		L${arcStartX} ${arcStartY}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${midArc} z
		L${arcStartX} ${midArc}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${arcEndY} z`;
    }

    function makeArcStrokePathStr(startPosition, endPosition, center, radius, clockWise=1, largeArc=0){
    	let [arcStartX, arcStartY] = [center.x + startPosition.x, center.y + startPosition.y];
    	let [arcEndX, arcEndY] = [center.x + endPosition.x, center.y + endPosition.y];

    	return `M${arcStartX} ${arcStartY}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${arcEndY}`;
    }

    function makeStrokeCircleStr(startPosition, endPosition, center, radius, clockWise=1, largeArc=0){
    	let [arcStartX, arcStartY] = [center.x + startPosition.x, center.y + startPosition.y];
    	let [arcEndX, midArc, arcEndY] = [center.x + endPosition.x, radius * 2 + arcStartY, center.y + startPosition.y];

    	return `M${arcStartX} ${arcStartY}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${midArc}
		M${arcStartX} ${midArc}
		A ${radius} ${radius} 0 ${largeArc} ${clockWise ? 1 : 0}
		${arcEndX} ${arcEndY}`;
    }

    function makeGradient(svgDefElem, color, lighter = false) {
    	let gradientId ='path-fill-gradient' + '-' + color + '-' +(lighter ? 'lighter' : 'default');
    	let gradientDef = renderVerticalGradient(svgDefElem, gradientId);
    	let opacities = [1, 0.6, 0.2];
    	if(lighter) {
    		opacities = [0.4, 0.2, 0];
    	}

    	setGradientStop(gradientDef, "0%", color, opacities[0]);
    	setGradientStop(gradientDef, "50%", color, opacities[1]);
    	setGradientStop(gradientDef, "100%", color, opacities[2]);

    	return gradientId;
    }

    function percentageBar(x, y, width, height,
    	depth=PERCENTAGE_BAR_DEFAULT_DEPTH, fill='none') {

    	let args = {
    		className: 'percentage-bar',
    		x: x,
    		y: y,
    		width: width,
    		height: height,
    		fill: fill,
    		styles: {
    			'stroke': lightenDarkenColor(fill, -25),
    			// Diabolically good: https://stackoverflow.com/a/9000859
    			// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
    			'stroke-dasharray': `0, ${height + width}, ${width}, ${height}`,
    			'stroke-width': depth
    		},
    	};

    	return createSVG("rect", args);
    }

    function heatSquare(className, x, y, size, radius, fill='none', data={}) {
    	let args = {
    		className: className,
    		x: x,
    		y: y,
    		width: size,
    		height: size,
    		rx: radius,
    		fill: fill
    	};

    	Object.keys(data).map(key => {
    		args[key] = data[key];
    	});

    	return createSVG("rect", args);
    }

    function legendBar(x, y, size, fill='none', label, truncate=false) {
    	label = truncate ? truncateString(label, LABEL_MAX_CHARS) : label;

    	let args = {
    		className: 'legend-bar',
    		x: 0,
    		y: 0,
    		width: size,
    		height: '2px',
    		fill: fill
    	};
    	let text = createSVG('text', {
    		className: 'legend-dataset-text',
    		x: 0,
    		y: 0,
    		dy: (FONT_SIZE * 2) + 'px',
    		'font-size': (FONT_SIZE * 1.2) + 'px',
    		'text-anchor': 'start',
    		fill: FONT_FILL,
    		innerHTML: label
    	});

    	let group = createSVG('g', {
    		transform: `translate(${x}, ${y})`
    	});
    	group.appendChild(createSVG("rect", args));
    	group.appendChild(text);

    	return group;
    }

    function legendDot(x, y, size, fill='none', label, truncate=false) {
    	label = truncate ? truncateString(label, LABEL_MAX_CHARS) : label;

    	let args = {
    		className: 'legend-dot',
    		cx: 0,
    		cy: 0,
    		r: size,
    		fill: fill
    	};
    	let text = createSVG('text', {
    		className: 'legend-dataset-text',
    		x: 0,
    		y: 0,
    		dx: (FONT_SIZE) + 'px',
    		dy: (FONT_SIZE/3) + 'px',
    		'font-size': (FONT_SIZE * 1.2) + 'px',
    		'text-anchor': 'start',
    		fill: FONT_FILL,
    		innerHTML: label
    	});

    	let group = createSVG('g', {
    		transform: `translate(${x}, ${y})`
    	});
    	group.appendChild(createSVG("circle", args));
    	group.appendChild(text);

    	return group;
    }

    function makeText(className, x, y, content, options = {}) {
    	let fontSize = options.fontSize || FONT_SIZE;
    	let dy = options.dy !== undefined ? options.dy : (fontSize / 2);
    	let fill = options.fill || FONT_FILL;
    	let textAnchor = options.textAnchor || 'start';
    	return createSVG('text', {
    		className: className,
    		x: x,
    		y: y,
    		dy: dy + 'px',
    		'font-size': fontSize + 'px',
    		fill: fill,
    		'text-anchor': textAnchor,
    		innerHTML: content
    	});
    }

    function makeVertLine(x, label, y1, y2, options={}) {
    	if(!options.stroke) options.stroke = BASE_LINE_COLOR;
    	let l = createSVG('line', {
    		className: 'line-vertical ' + options.className,
    		x1: 0,
    		x2: 0,
    		y1: y1,
    		y2: y2,
    		styles: {
    			stroke: options.stroke
    		}
    	});

    	let text = createSVG('text', {
    		x: 0,
    		y: y1 > y2 ? y1 + LABEL_MARGIN : y1 - LABEL_MARGIN - FONT_SIZE,
    		dy: FONT_SIZE + 'px',
    		'font-size': FONT_SIZE + 'px',
    		'text-anchor': 'middle',
    		innerHTML: label + ""
    	});

    	let line = createSVG('g', {
    		transform: `translate(${ x }, 0)`
    	});

    	line.appendChild(l);
    	line.appendChild(text);

    	return line;
    }

    function makeHoriLine(y, label, x1, x2, options={}) {
    	if(!options.stroke) options.stroke = BASE_LINE_COLOR;
    	if(!options.lineType) options.lineType = '';
    	if (options.shortenNumbers) label = shortenLargeNumber(label);

    	let className = 'line-horizontal ' + options.className +
    		(options.lineType === "dashed" ? "dashed": "");

    	let l = createSVG('line', {
    		className: className,
    		x1: x1,
    		x2: x2,
    		y1: 0,
    		y2: 0,
    		styles: {
    			stroke: options.stroke
    		}
    	});

    	let text = createSVG('text', {
    		x: x1 < x2 ? x1 - LABEL_MARGIN : x1 + LABEL_MARGIN,
    		y: 0,
    		dy: (FONT_SIZE / 2 - 2) + 'px',
    		'font-size': FONT_SIZE + 'px',
    		'text-anchor': x1 < x2 ? 'end' : 'start',
    		innerHTML: label+""
    	});

    	let line = createSVG('g', {
    		transform: `translate(0, ${y})`,
    		'stroke-opacity': 1
    	});

    	if(text === 0 || text === '0') {
    		line.style.stroke = "rgba(27, 31, 35, 0.6)";
    	}

    	line.appendChild(l);
    	line.appendChild(text);

    	return line;
    }

    function yLine(y, label, width, options={}) {
    	if (!isValidNumber(y)) y = 0;

    	if(!options.pos) options.pos = 'left';
    	if(!options.offset) options.offset = 0;
    	if(!options.mode) options.mode = 'span';
    	if(!options.stroke) options.stroke = BASE_LINE_COLOR;
    	if(!options.className) options.className = '';

    	let x1 = -1 * AXIS_TICK_LENGTH;
    	let x2 = options.mode === 'span' ? width + AXIS_TICK_LENGTH : 0;

    	if(options.mode === 'tick' && options.pos === 'right') {
    		x1 = width + AXIS_TICK_LENGTH;
    		x2 = width;
    	}

    	// let offset = options.pos === 'left' ? -1 * options.offset : options.offset;

    	x1 += options.offset;
    	x2 += options.offset;

    	return makeHoriLine(y, label, x1, x2, {
    		stroke: options.stroke,
    		className: options.className,
    		lineType: options.lineType,
    		shortenNumbers: options.shortenNumbers
    	});
    }

    function xLine(x, label, height, options={}) {
    	if (!isValidNumber(x)) x = 0;

    	if(!options.pos) options.pos = 'bottom';
    	if(!options.offset) options.offset = 0;
    	if(!options.mode) options.mode = 'span';
    	if(!options.stroke) options.stroke = BASE_LINE_COLOR;
    	if(!options.className) options.className = '';

    	// Draw X axis line in span/tick mode with optional label
    	//                        	y2(span)
    	// 						|
    	// 						|
    	//				x line	|
    	//						|
    	// 					   	|
    	// ---------------------+-- y2(tick)
    	//						|
    	//							y1

    	let y1 = height + AXIS_TICK_LENGTH;
    	let y2 = options.mode === 'span' ? -1 * AXIS_TICK_LENGTH : height;

    	if(options.mode === 'tick' && options.pos === 'top') {
    		// top axis ticks
    		y1 = -1 * AXIS_TICK_LENGTH;
    		y2 = 0;
    	}

    	return makeVertLine(x, label, y1, y2, {
    		stroke: options.stroke,
    		className: options.className,
    		lineType: options.lineType
    	});
    }

    function yMarker(y, label, width, options={}) {
    	if(!options.labelPos) options.labelPos = 'right';
    	let x = options.labelPos === 'left' ? LABEL_MARGIN
    		: width - getStringWidth(label, 5) - LABEL_MARGIN;

    	let labelSvg = createSVG('text', {
    		className: 'chart-label',
    		x: x,
    		y: 0,
    		dy: (FONT_SIZE / -2) + 'px',
    		'font-size': FONT_SIZE + 'px',
    		'text-anchor': 'start',
    		innerHTML: label+""
    	});

    	let line = makeHoriLine(y, '', 0, width, {
    		stroke: options.stroke || BASE_LINE_COLOR,
    		className: options.className || '',
    		lineType: options.lineType
    	});

    	line.appendChild(labelSvg);

    	return line;
    }

    function yRegion(y1, y2, width, label, options={}) {
    	// return a group
    	let height = y1 - y2;

    	let rect = createSVG('rect', {
    		className: `bar mini`, // remove class
    		styles: {
    			fill: `rgba(228, 234, 239, 0.49)`,
    			stroke: BASE_LINE_COLOR,
    			'stroke-dasharray': `${width}, ${height}`
    		},
    		// 'data-point-index': index,
    		x: 0,
    		y: 0,
    		width: width,
    		height: height
    	});

    	if(!options.labelPos) options.labelPos = 'right';
    	let x = options.labelPos === 'left' ? LABEL_MARGIN
    		: width - getStringWidth(label+"", 4.5) - LABEL_MARGIN;

    	let labelSvg = createSVG('text', {
    		className: 'chart-label',
    		x: x,
    		y: 0,
    		dy: (FONT_SIZE / -2) + 'px',
    		'font-size': FONT_SIZE + 'px',
    		'text-anchor': 'start',
    		innerHTML: label+""
    	});

    	let region = createSVG('g', {
    		transform: `translate(0, ${y2})`
    	});

    	region.appendChild(rect);
    	region.appendChild(labelSvg);

    	return region;
    }

    function datasetBar(x, yTop, width, color, label='', index=0, offset=0, meta={}) {
    	let [height, y] = getBarHeightAndYAttr(yTop, meta.zeroLine);
    	y -= offset;

    	if(height === 0) {
    		height = meta.minHeight;
    		y -= meta.minHeight;
    	}

    	// Preprocess numbers to avoid svg building errors
    	if (!isValidNumber(x)) x = 0;
    	if (!isValidNumber(y)) y = 0;
    	if (!isValidNumber(height, true)) height = 0;
    	if (!isValidNumber(width, true)) width = 0;

    	let rect = createSVG('rect', {
    		className: `bar mini`,
    		style: `fill: ${color}`,
    		'data-point-index': index,
    		x: x,
    		y: y,
    		width: width,
    		height: height
    	});

    	label += "";

    	if(!label && !label.length) {
    		return rect;
    	} else {
    		rect.setAttribute('y', 0);
    		rect.setAttribute('x', 0);
    		let text = createSVG('text', {
    			className: 'data-point-value',
    			x: width/2,
    			y: 0,
    			dy: (FONT_SIZE / 2 * -1) + 'px',
    			'font-size': FONT_SIZE + 'px',
    			'text-anchor': 'middle',
    			innerHTML: label
    		});

    		let group = createSVG('g', {
    			'data-point-index': index,
    			transform: `translate(${x}, ${y})`
    		});
    		group.appendChild(rect);
    		group.appendChild(text);

    		return group;
    	}
    }

    function datasetDot(x, y, radius, color, label='', index=0) {
    	let dot = createSVG('circle', {
    		style: `fill: ${color}`,
    		'data-point-index': index,
    		cx: x,
    		cy: y,
    		r: radius
    	});

    	label += "";

    	if(!label && !label.length) {
    		return dot;
    	} else {
    		dot.setAttribute('cy', 0);
    		dot.setAttribute('cx', 0);

    		let text = createSVG('text', {
    			className: 'data-point-value',
    			x: 0,
    			y: 0,
    			dy: (FONT_SIZE / 2 * -1 - radius) + 'px',
    			'font-size': FONT_SIZE + 'px',
    			'text-anchor': 'middle',
    			innerHTML: label
    		});

    		let group = createSVG('g', {
    			'data-point-index': index,
    			transform: `translate(${x}, ${y})`
    		});
    		group.appendChild(dot);
    		group.appendChild(text);

    		return group;
    	}
    }

    function getPaths(xList, yList, color, options={}, meta={}) {
    	let pointsList = yList.map((y, i) => (xList[i] + ',' + y));
    	let pointsStr = pointsList.join("L");

    	// Spline
    	if (options.spline)
    		pointsStr = getSplineCurvePointsStr(xList, yList);

    	let path = makePath("M"+pointsStr, 'line-graph-path', color);

    	// HeatLine
    	if(options.heatline) {
    		let gradient_id = makeGradient(meta.svgDefs, color);
    		path.style.stroke = `url(#${gradient_id})`;
    	}

    	let paths = {
    		path: path
    	};

    	// Region
    	if(options.regionFill) {
    		let gradient_id_region = makeGradient(meta.svgDefs, color, true);

    		let pathStr = "M" + `${xList[0]},${meta.zeroLine}L` + pointsStr + `L${xList.slice(-1)[0]},${meta.zeroLine}`;
    		paths.region = makePath(pathStr, `region-fill`, 'none', `url(#${gradient_id_region})`);
    	}

    	return paths;
    }

    let makeOverlay = {
    	'bar': (unit) => {
    		let transformValue;
    		if(unit.nodeName !== 'rect') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let overlay = unit.cloneNode();
    		overlay.style.fill = '#000000';
    		overlay.style.opacity = '0.4';

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    		return overlay;
    	},

    	'dot': (unit) => {
    		let transformValue;
    		if(unit.nodeName !== 'circle') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let overlay = unit.cloneNode();
    		let radius = unit.getAttribute('r');
    		let fill = unit.getAttribute('fill');
    		overlay.setAttribute('r', parseInt(radius) + DOT_OVERLAY_SIZE_INCR);
    		overlay.setAttribute('fill', fill);
    		overlay.style.opacity = '0.6';

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    		return overlay;
    	},

    	'heat_square': (unit) => {
    		let transformValue;
    		if(unit.nodeName !== 'circle') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let overlay = unit.cloneNode();
    		let radius = unit.getAttribute('r');
    		let fill = unit.getAttribute('fill');
    		overlay.setAttribute('r', parseInt(radius) + DOT_OVERLAY_SIZE_INCR);
    		overlay.setAttribute('fill', fill);
    		overlay.style.opacity = '0.6';

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    		return overlay;
    	}
    };

    let updateOverlay = {
    	'bar': (unit, overlay) => {
    		let transformValue;
    		if(unit.nodeName !== 'rect') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let attributes = ['x', 'y', 'width', 'height'];
    		Object.values(unit.attributes)
    			.filter(attr => attributes.includes(attr.name) && attr.specified)
    			.map(attr => {
    				overlay.setAttribute(attr.name, attr.nodeValue);
    			});

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    	},

    	'dot': (unit, overlay) => {
    		let transformValue;
    		if(unit.nodeName !== 'circle') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let attributes = ['cx', 'cy'];
    		Object.values(unit.attributes)
    			.filter(attr => attributes.includes(attr.name) && attr.specified)
    			.map(attr => {
    				overlay.setAttribute(attr.name, attr.nodeValue);
    			});

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    	},

    	'heat_square': (unit, overlay) => {
    		let transformValue;
    		if(unit.nodeName !== 'circle') {
    			transformValue = unit.getAttribute('transform');
    			unit = unit.childNodes[0];
    		}
    		let attributes = ['cx', 'cy'];
    		Object.values(unit.attributes)
    			.filter(attr => attributes.includes(attr.name) && attr.specified)
    			.map(attr => {
    				overlay.setAttribute(attr.name, attr.nodeValue);
    			});

    		if(transformValue) {
    			overlay.setAttribute('transform', transformValue);
    		}
    	},
    };

    const UNIT_ANIM_DUR = 350;
    const PATH_ANIM_DUR = 350;
    const MARKER_LINE_ANIM_DUR = UNIT_ANIM_DUR;
    const REPLACE_ALL_NEW_DUR = 250;

    const STD_EASING = 'easein';

    function translate(unit, oldCoord, newCoord, duration) {
    	let old = typeof oldCoord === 'string' ? oldCoord : oldCoord.join(', ');
    	return [
    		unit,
    		{transform: newCoord.join(', ')},
    		duration,
    		STD_EASING,
    		"translate",
    		{transform: old}
    	];
    }

    function translateVertLine(xLine, newX, oldX) {
    	return translate(xLine, [oldX, 0], [newX, 0], MARKER_LINE_ANIM_DUR);
    }

    function translateHoriLine(yLine, newY, oldY) {
    	return translate(yLine, [0, oldY], [0, newY], MARKER_LINE_ANIM_DUR);
    }

    function animateRegion(rectGroup, newY1, newY2, oldY2) {
    	let newHeight = newY1 - newY2;
    	let rect = rectGroup.childNodes[0];
    	let width = rect.getAttribute("width");
    	let rectAnim = [
    		rect,
    		{ height: newHeight, 'stroke-dasharray': `${width}, ${newHeight}` },
    		MARKER_LINE_ANIM_DUR,
    		STD_EASING
    	];

    	let groupAnim = translate(rectGroup, [0, oldY2], [0, newY2], MARKER_LINE_ANIM_DUR);
    	return [rectAnim, groupAnim];
    }

    function animateBar(bar, x, yTop, width, offset=0, meta={}) {
    	let [height, y] = getBarHeightAndYAttr(yTop, meta.zeroLine);
    	y -= offset;
    	if(bar.nodeName !== 'rect') {
    		let rect = bar.childNodes[0];
    		let rectAnim = [
    			rect,
    			{width: width, height: height},
    			UNIT_ANIM_DUR,
    			STD_EASING
    		];

    		let oldCoordStr = bar.getAttribute("transform").split("(")[1].slice(0, -1);
    		let groupAnim = translate(bar, oldCoordStr, [x, y], MARKER_LINE_ANIM_DUR);
    		return [rectAnim, groupAnim];
    	} else {
    		return [[bar, {width: width, height: height, x: x, y: y}, UNIT_ANIM_DUR, STD_EASING]];
    	}
    	// bar.animate({height: args.newHeight, y: yTop}, UNIT_ANIM_DUR, mina.easein);
    }

    function animateDot(dot, x, y) {
    	if(dot.nodeName !== 'circle') {
    		let oldCoordStr = dot.getAttribute("transform").split("(")[1].slice(0, -1);
    		let groupAnim = translate(dot, oldCoordStr, [x, y], MARKER_LINE_ANIM_DUR);
    		return [groupAnim];
    	} else {
    		return [[dot, {cx: x, cy: y}, UNIT_ANIM_DUR, STD_EASING]];
    	}
    	// dot.animate({cy: yTop}, UNIT_ANIM_DUR, mina.easein);
    }

    function animatePath(paths, newXList, newYList, zeroLine, spline) {
    	let pathComponents = [];
    	let pointsStr = newYList.map((y, i) => (newXList[i] + ',' + y)).join("L");

    	if (spline)
    		pointsStr = getSplineCurvePointsStr(newXList, newYList);

    	const animPath = [paths.path, {d:"M" + pointsStr}, PATH_ANIM_DUR, STD_EASING];
    	pathComponents.push(animPath);

    	if(paths.region) {
    		let regStartPt = `${newXList[0]},${zeroLine}L`;
    		let regEndPt = `L${newXList.slice(-1)[0]}, ${zeroLine}`;

    		const animRegion = [
    			paths.region,
    			{d:"M" + regStartPt + pointsStr + regEndPt},
    			PATH_ANIM_DUR,
    			STD_EASING
    		];
    		pathComponents.push(animRegion);
    	}

    	return pathComponents;
    }

    function animatePathStr(oldPath, pathStr) {
    	return [oldPath, {d: pathStr}, UNIT_ANIM_DUR, STD_EASING];
    }

    // Leveraging SMIL Animations

    const EASING = {
    	ease: "0.25 0.1 0.25 1",
    	linear: "0 0 1 1",
    	// easein: "0.42 0 1 1",
    	easein: "0.1 0.8 0.2 1",
    	easeout: "0 0 0.58 1",
    	easeinout: "0.42 0 0.58 1"
    };

    function animateSVGElement(element, props, dur, easingType="linear", type=undefined, oldValues={}) {

    	let animElement = element.cloneNode(true);
    	let newElement = element.cloneNode(true);

    	for(var attributeName in props) {
    		let animateElement;
    		if(attributeName === 'transform') {
    			animateElement = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    		} else {
    			animateElement = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    		}
    		let currentValue = oldValues[attributeName] || element.getAttribute(attributeName);
    		let value = props[attributeName];

    		let animAttr = {
    			attributeName: attributeName,
    			from: currentValue,
    			to: value,
    			begin: "0s",
    			dur: dur/1000 + "s",
    			values: currentValue + ";" + value,
    			keySplines: EASING[easingType],
    			keyTimes: "0;1",
    			calcMode: "spline",
    			fill: 'freeze'
    		};

    		if(type) {
    			animAttr["type"] = type;
    		}

    		for (var i in animAttr) {
    			animateElement.setAttribute(i, animAttr[i]);
    		}

    		animElement.appendChild(animateElement);

    		if(type) {
    			newElement.setAttribute(attributeName, `translate(${value})`);
    		} else {
    			newElement.setAttribute(attributeName, value);
    		}
    	}

    	return [animElement, newElement];
    }

    function transform(element, style) { // eslint-disable-line no-unused-vars
    	element.style.transform = style;
    	element.style.webkitTransform = style;
    	element.style.msTransform = style;
    	element.style.mozTransform = style;
    	element.style.oTransform = style;
    }

    function animateSVG(svgContainer, elements) {
    	let newElements = [];
    	let animElements = [];

    	elements.map(element => {
    		let unit = element[0];
    		let parent = unit.parentNode;

    		let animElement, newElement;

    		element[0] = unit;
    		[animElement, newElement] = animateSVGElement(...element);

    		newElements.push(newElement);
    		animElements.push([animElement, parent]);
    		
    		if (parent) {
    			parent.replaceChild(animElement, unit);
    		}
    	});

    	let animSvg = svgContainer.cloneNode(true);

    	animElements.map((animElement, i) => {
    		if (animElement[1]) {
    			animElement[1].replaceChild(newElements[i], animElement[0]);
    			elements[i][0] = newElements[i];
    		}
    	});

    	return animSvg;
    }

    function runSMILAnimation(parent, svgElement, elementsToAnimate) {
    	if(elementsToAnimate.length === 0) return;

    	let animSvgElement = animateSVG(svgElement, elementsToAnimate);
    	if(svgElement.parentNode == parent) {
    		parent.removeChild(svgElement);
    		parent.appendChild(animSvgElement);

    	}

    	// Replace the new svgElement (data has already been replaced)
    	setTimeout(() => {
    		if(animSvgElement.parentNode == parent) {
    			parent.removeChild(animSvgElement);
    			parent.appendChild(svgElement);
    		}
    	}, REPLACE_ALL_NEW_DUR);
    }

    const CSSTEXT = ".chart-container{position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif}.chart-container .axis,.chart-container .chart-label{fill:#555b51}.chart-container .axis line,.chart-container .chart-label line{stroke:#dadada}.chart-container .dataset-units circle{stroke:#fff;stroke-width:2}.chart-container .dataset-units path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container .dataset-path{stroke-width:2px}.chart-container .path-group path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container line.dashed{stroke-dasharray:5,3}.chart-container .axis-line .specific-value{text-anchor:start}.chart-container .axis-line .y-line{text-anchor:end}.chart-container .axis-line .x-line{text-anchor:middle}.chart-container .legend-dataset-text{fill:#6c7680;font-weight:600}.graph-svg-tip{position:absolute;z-index:99999;padding:10px;font-size:12px;color:#959da5;text-align:center;background:rgba(0,0,0,.8);border-radius:3px}.graph-svg-tip ul{padding-left:0;display:flex}.graph-svg-tip ol{padding-left:0;display:flex}.graph-svg-tip ul.data-point-list li{min-width:90px;flex:1;font-weight:600}.graph-svg-tip strong{color:#dfe2e5;font-weight:600}.graph-svg-tip .svg-pointer{position:absolute;height:5px;margin:0 0 0 -5px;content:' ';border:5px solid transparent;border-top-color:rgba(0,0,0,.8)}.graph-svg-tip.comparison{padding:0;text-align:left;pointer-events:none}.graph-svg-tip.comparison .title{display:block;padding:10px;margin:0;font-weight:600;line-height:1;pointer-events:none}.graph-svg-tip.comparison ul{margin:0;white-space:nowrap;list-style:none}.graph-svg-tip.comparison li{display:inline-block;padding:5px 10px}";

    function downloadFile(filename, data) {
    	var a = document.createElement('a');
    	a.style = "display: none";
    	var blob = new Blob(data, {type: "image/svg+xml; charset=utf-8"});
    	var url = window.URL.createObjectURL(blob);
    	a.href = url;
    	a.download = filename;
    	document.body.appendChild(a);
    	a.click();
    	setTimeout(function(){
    		document.body.removeChild(a);
    		window.URL.revokeObjectURL(url);
    	}, 300);
    }

    function prepareForExport(svg) {
    	let clone = svg.cloneNode(true);
    	clone.classList.add('chart-container');
    	clone.setAttribute('xmlns', "http://www.w3.org/2000/svg");
    	clone.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
    	let styleEl = $.create('style', {
    		'innerHTML': CSSTEXT
    	});
    	clone.insertBefore(styleEl, clone.firstChild);

    	let container = $.create('div');
    	container.appendChild(clone);

    	return container.innerHTML;
    }

    class BaseChart {
    	constructor(parent, options) {
    		// deepclone options to avoid making changes to orignal object
    		options = deepClone(options);

    		this.parent = typeof parent === 'string'
    			? document.querySelector(parent)
    			: parent;

    		if (!(this.parent instanceof HTMLElement)) {
    			throw new Error('No `parent` element to render on was provided.');
    		}

    		this.rawChartArgs = options;

    		this.title = options.title || '';
    		this.type = options.type || '';

    		this.realData = this.prepareData(options.data);
    		this.data = this.prepareFirstData(this.realData);

    		this.colors = this.validateColors(options.colors, this.type);

    		this.config = {
    			showTooltip: 1, // calculate
    			showLegend: 1, // calculate
    			isNavigable: options.isNavigable || 0,
    			animate: (typeof options.animate !== 'undefined') ? options.animate : 1,
    			truncateLegends: options.truncateLegends || 1
    		};

    		this.measures = JSON.parse(JSON.stringify(BASE_MEASURES));
    		let m = this.measures;
    		this.setMeasures(options);
    		if(!this.title.length) { m.titleHeight = 0; }
    		if(!this.config.showLegend) m.legendHeight = 0;
    		this.argHeight = options.height || m.baseHeight;

    		this.state = {};
    		this.options = {};

    		this.initTimeout = INIT_CHART_UPDATE_TIMEOUT;

    		if(this.config.isNavigable) {
    			this.overlays = [];
    		}

    		this.configure(options);
    	}

    	prepareData(data) {
    		return data;
    	}

    	prepareFirstData(data) {
    		return data;
    	}

    	validateColors(colors, type) {
    		const validColors = [];
    		colors = (colors || []).concat(DEFAULT_COLORS[type]);
    		colors.forEach((string) => {
    			const color = getColor(string);
    			if(!isValidColor(color)) {
    				console.warn('"' + string + '" is not a valid color.');
    			} else {
    				validColors.push(color);
    			}
    		});
    		return validColors;
    	}

    	setMeasures() {
    		// Override measures, including those for title and legend
    		// set config for legend and title
    	}

    	configure() {
    		let height = this.argHeight;
    		this.baseHeight = height;
    		this.height = height - getExtraHeight(this.measures);

    		// Bind window events
    		this.boundDrawFn = () => this.draw(true);
    		if (ResizeObserver) {
    			this.resizeObserver = new ResizeObserver(this.boundDrawFn);
    			this.resizeObserver.observe(this.parent);
    		}
    		window.addEventListener('resize', this.boundDrawFn);
    		window.addEventListener('orientationchange', this.boundDrawFn);
    	}

    	destroy() {
    		if (this.resizeObserver) this.resizeObserver.disconnect();
    		window.removeEventListener('resize', this.boundDrawFn);
    		window.removeEventListener('orientationchange', this.boundDrawFn);
    	}

    	// Has to be called manually
    	setup() {
    		this.makeContainer();
    		this.updateWidth();
    		this.makeTooltip();

    		this.draw(false, true);
    	}

    	makeContainer() {
    		// Chart needs a dedicated parent element
    		this.parent.innerHTML = '';

    		let args = {
    			inside: this.parent,
    			className: 'chart-container'
    		};

    		if(this.independentWidth) {
    			args.styles = { width: this.independentWidth + 'px' };
    		}

    		this.container = $.create('div', args);
    	}

    	makeTooltip() {
    		this.tip = new SvgTip({
    			parent: this.container,
    			colors: this.colors
    		});
    		this.bindTooltip();
    	}

    	bindTooltip() {}

    	draw(onlyWidthChange=false, init=false) {
    		if (onlyWidthChange && isHidden(this.parent)) {
    			// Don't update anything if the chart is hidden
    			return;
    		}
    		this.updateWidth();

    		this.calc(onlyWidthChange);
    		this.makeChartArea();
    		this.setupComponents();

    		this.components.forEach(c => c.setup(this.drawArea));
    		// this.components.forEach(c => c.make());
    		this.render(this.components, false);

    		if(init) {
    			this.data = this.realData;
    			setTimeout(() => {this.update(this.data);}, this.initTimeout);
    		}

    		this.renderLegend();

    		this.setupNavigation(init);
    	}

    	calc() {} // builds state

    	updateWidth() {
    		this.baseWidth = getElementContentWidth(this.parent);
    		this.width = this.baseWidth - getExtraWidth(this.measures);
    	}

    	makeChartArea() {
    		if(this.svg) {
    			this.container.removeChild(this.svg);
    		}
    		let m = this.measures;

    		this.svg = makeSVGContainer(
    			this.container,
    			'frappe-chart chart',
    			this.baseWidth,
    			this.baseHeight
    		);
    		this.svgDefs = makeSVGDefs(this.svg);

    		if(this.title.length) {
    			this.titleEL = makeText(
    				'title',
    				m.margins.left,
    				m.margins.top,
    				this.title,
    				{
    					fontSize: m.titleFontSize,
    					fill: '#666666',
    					dy: m.titleFontSize
    				}
    			);
    		}

    		let top = getTopOffset(m);
    		this.drawArea = makeSVGGroup(
    			this.type + '-chart chart-draw-area',
    			`translate(${getLeftOffset(m)}, ${top})`
    		);

    		if(this.config.showLegend) {
    			top += this.height + m.paddings.bottom;
    			this.legendArea = makeSVGGroup(
    				'chart-legend',
    				`translate(${getLeftOffset(m)}, ${top})`
    			);
    		}

    		if(this.title.length) { this.svg.appendChild(this.titleEL); }
    		this.svg.appendChild(this.drawArea);
    		if(this.config.showLegend) { this.svg.appendChild(this.legendArea); }

    		this.updateTipOffset(getLeftOffset(m), getTopOffset(m));
    	}

    	updateTipOffset(x, y) {
    		this.tip.offset = {
    			x: x,
    			y: y
    		};
    	}

    	setupComponents() { this.components = new Map(); }

    	update(data) {
    		if(!data) {
    			console.error('No data to update.');
    		}
    		this.data = this.prepareData(data);
    		this.calc(); // builds state
    		this.render(this.components, this.config.animate);
    		this.renderLegend();
    	}

    	render(components=this.components, animate=true) {
    		if(this.config.isNavigable) {
    			// Remove all existing overlays
    			this.overlays.map(o => o.parentNode.removeChild(o));
    			// ref.parentNode.insertBefore(element, ref);
    		}
    		let elementsToAnimate = [];
    		// Can decouple to this.refreshComponents() first to save animation timeout
    		components.forEach(c => {
    			elementsToAnimate = elementsToAnimate.concat(c.update(animate));
    		});
    		if(elementsToAnimate.length > 0) {
    			runSMILAnimation(this.container, this.svg, elementsToAnimate);
    			setTimeout(() => {
    				components.forEach(c => c.make());
    				this.updateNav();
    			}, CHART_POST_ANIMATE_TIMEOUT);
    		} else {
    			components.forEach(c => c.make());
    			this.updateNav();
    		}
    	}

    	updateNav() {
    		if(this.config.isNavigable) {
    			this.makeOverlay();
    			this.bindUnits();
    		}
    	}

    	renderLegend() {}

    	setupNavigation(init=false) {
    		if(!this.config.isNavigable) return;

    		if(init) {
    			this.bindOverlay();

    			this.keyActions = {
    				'13': this.onEnterKey.bind(this),
    				'37': this.onLeftArrow.bind(this),
    				'38': this.onUpArrow.bind(this),
    				'39': this.onRightArrow.bind(this),
    				'40': this.onDownArrow.bind(this),
    			};

    			document.addEventListener('keydown', (e) => {
    				if(isElementInViewport(this.container)) {
    					e = e || window.event;
    					if(this.keyActions[e.keyCode]) {
    						this.keyActions[e.keyCode]();
    					}
    				}
    			});
    		}
    	}

    	makeOverlay() {}
    	updateOverlay() {}
    	bindOverlay() {}
    	bindUnits() {}

    	onLeftArrow() {}
    	onRightArrow() {}
    	onUpArrow() {}
    	onDownArrow() {}
    	onEnterKey() {}

    	addDataPoint() {}
    	removeDataPoint() {}

    	getDataPoint() {}
    	setCurrentDataPoint() {}

    	updateDataset() {}

    	export() {
    		let chartSvg = prepareForExport(this.svg);
    		downloadFile(this.title || 'Chart', [chartSvg]);
    	}
    }

    class AggregationChart extends BaseChart {
    	constructor(parent, args) {
    		super(parent, args);
    	}

    	configure(args) {
    		super.configure(args);

    		this.config.formatTooltipY = (args.tooltipOptions || {}).formatTooltipY;
    		this.config.maxSlices = args.maxSlices || 20;
    		this.config.maxLegendPoints = args.maxLegendPoints || 20;
    	}

    	calc() {
    		let s = this.state;
    		let maxSlices = this.config.maxSlices;
    		s.sliceTotals = [];

    		let allTotals = this.data.labels.map((label, i) => {
    			let total = 0;
    			this.data.datasets.map(e => {
    				total += e.values[i];
    			});
    			return [total, label];
    		}).filter(d => { return d[0] >= 0; }); // keep only positive results

    		let totals = allTotals;
    		if(allTotals.length > maxSlices) {
    			// Prune and keep a grey area for rest as per maxSlices
    			allTotals.sort((a, b) => { return b[0] - a[0]; });

    			totals = allTotals.slice(0, maxSlices-1);
    			let remaining = allTotals.slice(maxSlices-1);

    			let sumOfRemaining = 0;
    			remaining.map(d => {sumOfRemaining += d[0];});
    			totals.push([sumOfRemaining, 'Rest']);
    			this.colors[maxSlices-1] = 'grey';
    		}

    		s.labels = [];
    		totals.map(d => {
    			s.sliceTotals.push(round(d[0]));
    			s.labels.push(d[1]);
    		});

    		s.grandTotal = s.sliceTotals.reduce((a, b) => a + b, 0);

    		this.center = {
    			x: this.width / 2,
    			y: this.height / 2
    		};
    	}

    	renderLegend() {
    		let s = this.state;
    		this.legendArea.textContent = '';
    		this.legendTotals = s.sliceTotals.slice(0, this.config.maxLegendPoints);

    		let count = 0;
    		let y = 0;
    		this.legendTotals.map((d, i) => {
    			let barWidth = 150;
    			let divisor = Math.floor(
    				(this.width - getExtraWidth(this.measures))/barWidth
    			);
    			if (this.legendTotals.length < divisor) {
    				barWidth = this.width/this.legendTotals.length;
    			}
    			if(count > divisor) {
    				count = 0;
    				y += 20;
    			}
    			let x = barWidth * count + 5;
    			let label = this.config.truncateLegends ? truncateString(s.labels[i], barWidth/10) : s.labels[i];
    			let formatted = this.config.formatTooltipY ? this.config.formatTooltipY(d) : d;
    			let dot = legendDot(
    				x,
    				y,
    				5,
    				this.colors[i],
    				`${label}: ${formatted}`,
    				false
    			);
    			this.legendArea.appendChild(dot);
    			count++;
    		});
    	}
    }

    // Playing around with dates

    const NO_OF_YEAR_MONTHS = 12;
    const NO_OF_DAYS_IN_WEEK = 7;

    const NO_OF_MILLIS = 1000;
    const SEC_IN_DAY = 86400;

    const MONTH_NAMES = ["January", "February", "March", "April", "May",
    	"June", "July", "August", "September", "October", "November", "December"];


    const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


    // https://stackoverflow.com/a/11252167/6495043
    function treatAsUtc(date) {
    	let result = new Date(date);
    	result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    	return result;
    }

    function getYyyyMmDd(date) {
    	let dd = date.getDate();
    	let mm = date.getMonth() + 1; // getMonth() is zero-based
    	return [
    		date.getFullYear(),
    		(mm>9 ? '' : '0') + mm,
    		(dd>9 ? '' : '0') + dd
    	].join('-');
    }

    function clone(date) {
    	return new Date(date.getTime());
    }





    // export function getMonthsBetween(startDate, endDate) {}

    function getWeeksBetween(startDate, endDate) {
    	let weekStartDate = setDayToSunday(startDate);
    	return Math.ceil(getDaysBetween(weekStartDate, endDate) / NO_OF_DAYS_IN_WEEK);
    }

    function getDaysBetween(startDate, endDate) {
    	let millisecondsPerDay = SEC_IN_DAY * NO_OF_MILLIS;
    	return (treatAsUtc(endDate) - treatAsUtc(startDate)) / millisecondsPerDay;
    }

    function areInSameMonth(startDate, endDate) {
    	return startDate.getMonth() === endDate.getMonth()
    		&& startDate.getFullYear() === endDate.getFullYear();
    }

    function getMonthName(i, short=false) {
    	let monthName = MONTH_NAMES[i];
    	return short ? monthName.slice(0, 3) : monthName;
    }

    function getLastDateInMonth (month, year) {
    	return new Date(year, month + 1, 0); // 0: last day in previous month
    }

    // mutates
    function setDayToSunday(date) {
    	let newDate = clone(date);
    	const day = newDate.getDay();
    	if(day !== 0) {
    		addDays(newDate, (-1) * day);
    	}
    	return newDate;
    }

    // mutates
    function addDays(date, numberOfDays) {
    	date.setDate(date.getDate() + numberOfDays);
    }

    class ChartComponent {
    	constructor({
    		layerClass = '',
    		layerTransform = '',
    		constants,

    		getData,
    		makeElements,
    		animateElements
    	}) {
    		this.layerTransform = layerTransform;
    		this.constants = constants;

    		this.makeElements = makeElements;
    		this.getData = getData;

    		this.animateElements = animateElements;

    		this.store = [];
    		this.labels = [];

    		this.layerClass = layerClass;
    		this.layerClass = typeof(this.layerClass) === 'function'
    			? this.layerClass() : this.layerClass;

    		this.refresh();
    	}

    	refresh(data) {
    		this.data = data || this.getData();
    	}

    	setup(parent) {
    		this.layer = makeSVGGroup(this.layerClass, this.layerTransform, parent);
    	}

    	make() {
    		this.render(this.data);
    		this.oldData = this.data;
    	}

    	render(data) {
    		this.store = this.makeElements(data);

    		this.layer.textContent = '';
    		this.store.forEach(element => {
    			this.layer.appendChild(element);
    		});
    		this.labels.forEach(element => {
    			this.layer.appendChild(element);
    		});
    	}

    	update(animate = true) {
    		this.refresh();
    		let animateElements = [];
    		if(animate) {
    			animateElements = this.animateElements(this.data) || [];
    		}
    		return animateElements;
    	}
    }

    let componentConfigs = {
    	donutSlices: {
    		layerClass: 'donut-slices',
    		makeElements(data) {
    			return data.sliceStrings.map((s, i) => {
    				let slice = makePath(s, 'donut-path', data.colors[i], 'none', data.strokeWidth);
    				slice.style.transition = 'transform .3s;';
    				return slice;
    			});
    		},

    		animateElements(newData) {
    			return this.store.map((slice, i) => animatePathStr(slice, newData.sliceStrings[i]));
    		},
    	},
    	pieSlices: {
    		layerClass: 'pie-slices',
    		makeElements(data) {
    			return data.sliceStrings.map((s, i) =>{
    				let slice = makePath(s, 'pie-path', 'none', data.colors[i]);
    				slice.style.transition = 'transform .3s;';
    				return slice;
    			});
    		},

    		animateElements(newData) {
    			return this.store.map((slice, i) =>
    				animatePathStr(slice, newData.sliceStrings[i])
    			);
    		}
    	},
    	percentageBars: {
    		layerClass: 'percentage-bars',
    		makeElements(data) {
    			return data.xPositions.map((x, i) =>{
    				let y = 0;
    				let bar = percentageBar(x, y, data.widths[i],
    					this.constants.barHeight, this.constants.barDepth, data.colors[i]);
    				return bar;
    			});
    		},

    		animateElements(newData) {
    			if(newData) return [];
    		}
    	},
    	yAxis: {
    		layerClass: 'y axis',
    		makeElements(data) {
    			return data.positions.map((position, i) =>
    				yLine(position, data.labels[i], this.constants.width,
    					{mode: this.constants.mode, pos: this.constants.pos, shortenNumbers: this.constants.shortenNumbers})
    			);
    		},

    		animateElements(newData) {
    			let newPos = newData.positions;
    			let newLabels = newData.labels;
    			let oldPos = this.oldData.positions;
    			let oldLabels = this.oldData.labels;

    			[oldPos, newPos] = equilizeNoOfElements(oldPos, newPos);
    			[oldLabels, newLabels] = equilizeNoOfElements(oldLabels, newLabels);

    			this.render({
    				positions: oldPos,
    				labels: newLabels
    			});

    			return this.store.map((line, i) => {
    				return translateHoriLine(
    					line, newPos[i], oldPos[i]
    				);
    			});
    		}
    	},

    	xAxis: {
    		layerClass: 'x axis',
    		makeElements(data) {
    			return data.positions.map((position, i) =>
    				xLine(position, data.calcLabels[i], this.constants.height,
    					{mode: this.constants.mode, pos: this.constants.pos})
    			);
    		},

    		animateElements(newData) {
    			let newPos = newData.positions;
    			let newLabels = newData.calcLabels;
    			let oldPos = this.oldData.positions;
    			let oldLabels = this.oldData.calcLabels;

    			[oldPos, newPos] = equilizeNoOfElements(oldPos, newPos);
    			[oldLabels, newLabels] = equilizeNoOfElements(oldLabels, newLabels);

    			this.render({
    				positions: oldPos,
    				calcLabels: newLabels
    			});

    			return this.store.map((line, i) => {
    				return translateVertLine(
    					line, newPos[i], oldPos[i]
    				);
    			});
    		}
    	},

    	yMarkers: {
    		layerClass: 'y-markers',
    		makeElements(data) {
    			return data.map(m =>
    				yMarker(m.position, m.label, this.constants.width,
    					{labelPos: m.options.labelPos, mode: 'span', lineType: 'dashed'})
    			);
    		},
    		animateElements(newData) {
    			[this.oldData, newData] = equilizeNoOfElements(this.oldData, newData);

    			let newPos = newData.map(d => d.position);
    			let newLabels = newData.map(d => d.label);
    			let newOptions = newData.map(d => d.options);

    			let oldPos = this.oldData.map(d => d.position);

    			this.render(oldPos.map((pos, i) => {
    				return {
    					position: oldPos[i],
    					label: newLabels[i],
    					options: newOptions[i]
    				};
    			}));

    			return this.store.map((line, i) => {
    				return translateHoriLine(
    					line, newPos[i], oldPos[i]
    				);
    			});
    		}
    	},

    	yRegions: {
    		layerClass: 'y-regions',
    		makeElements(data) {
    			return data.map(r =>
    				yRegion(r.startPos, r.endPos, this.constants.width,
    					r.label, {labelPos: r.options.labelPos})
    			);
    		},
    		animateElements(newData) {
    			[this.oldData, newData] = equilizeNoOfElements(this.oldData, newData);

    			let newPos = newData.map(d => d.endPos);
    			let newLabels = newData.map(d => d.label);
    			let newStarts = newData.map(d => d.startPos);
    			let newOptions = newData.map(d => d.options);

    			let oldPos = this.oldData.map(d => d.endPos);
    			let oldStarts = this.oldData.map(d => d.startPos);

    			this.render(oldPos.map((pos, i) => {
    				return {
    					startPos: oldStarts[i],
    					endPos: oldPos[i],
    					label: newLabels[i],
    					options: newOptions[i]
    				};
    			}));

    			let animateElements = [];

    			this.store.map((rectGroup, i) => {
    				animateElements = animateElements.concat(animateRegion(
    					rectGroup, newStarts[i], newPos[i], oldPos[i]
    				));
    			});

    			return animateElements;
    		}
    	},

    	heatDomain: {
    		layerClass: function() { return 'heat-domain domain-' + this.constants.index; },
    		makeElements(data) {
    			let {index, colWidth, rowHeight, squareSize, radius, xTranslate} = this.constants;
    			let monthNameHeight = -12;
    			let x = xTranslate, y = 0;

    			this.serializedSubDomains = [];

    			data.cols.map((week, weekNo) => {
    				if(weekNo === 1) {
    					this.labels.push(
    						makeText('domain-name', x, monthNameHeight, getMonthName(index, true).toUpperCase(),
    							{
    								fontSize: 9
    							}
    						)
    					);
    				}
    				week.map((day, i) => {
    					if(day.fill) {
    						let data = {
    							'data-date': day.yyyyMmDd,
    							'data-value': day.dataValue,
    							'data-day': i
    						};
    						let square = heatSquare('day', x, y, squareSize, radius, day.fill, data);
    						this.serializedSubDomains.push(square);
    					}
    					y += rowHeight;
    				});
    				y = 0;
    				x += colWidth;
    			});

    			return this.serializedSubDomains;
    		},

    		animateElements(newData) {
    			if(newData) return [];
    		}
    	},

    	barGraph: {
    		layerClass: function() { return 'dataset-units dataset-bars dataset-' + this.constants.index; },
    		makeElements(data) {
    			let c = this.constants;
    			this.unitType = 'bar';
    			this.units = data.yPositions.map((y, j) => {
    				return datasetBar(
    					data.xPositions[j],
    					y,
    					data.barWidth,
    					c.color,
    					data.labels[j],
    					j,
    					data.offsets[j],
    					{
    						zeroLine: data.zeroLine,
    						barsWidth: data.barsWidth,
    						minHeight: c.minHeight
    					}
    				);
    			});
    			return this.units;
    		},
    		animateElements(newData) {
    			let newXPos = newData.xPositions;
    			let newYPos = newData.yPositions;
    			let newOffsets = newData.offsets;
    			let newLabels = newData.labels;

    			let oldXPos = this.oldData.xPositions;
    			let oldYPos = this.oldData.yPositions;
    			let oldOffsets = this.oldData.offsets;
    			let oldLabels = this.oldData.labels;

    			[oldXPos, newXPos] = equilizeNoOfElements(oldXPos, newXPos);
    			[oldYPos, newYPos] = equilizeNoOfElements(oldYPos, newYPos);
    			[oldOffsets, newOffsets] = equilizeNoOfElements(oldOffsets, newOffsets);
    			[oldLabels, newLabels] = equilizeNoOfElements(oldLabels, newLabels);

    			this.render({
    				xPositions: oldXPos,
    				yPositions: oldYPos,
    				offsets: oldOffsets,
    				labels: newLabels,

    				zeroLine: this.oldData.zeroLine,
    				barsWidth: this.oldData.barsWidth,
    				barWidth: this.oldData.barWidth,
    			});

    			let animateElements = [];

    			this.store.map((bar, i) => {
    				animateElements = animateElements.concat(animateBar(
    					bar, newXPos[i], newYPos[i], newData.barWidth, newOffsets[i],
    					{zeroLine: newData.zeroLine}
    				));
    			});

    			return animateElements;
    		}
    	},

    	lineGraph: {
    		layerClass: function() { return 'dataset-units dataset-line dataset-' + this.constants.index; },
    		makeElements(data) {
    			let c = this.constants;
    			this.unitType = 'dot';
    			this.paths = {};
    			if(!c.hideLine) {
    				this.paths = getPaths(
    					data.xPositions,
    					data.yPositions,
    					c.color,
    					{
    						heatline: c.heatline,
    						regionFill: c.regionFill,
    						spline: c.spline
    					},
    					{
    						svgDefs: c.svgDefs,
    						zeroLine: data.zeroLine
    					}
    				);
    			}

    			this.units = [];
    			if(!c.hideDots) {
    				this.units = data.yPositions.map((y, j) => {
    					return datasetDot(
    						data.xPositions[j],
    						y,
    						data.radius,
    						c.color,
    						(c.valuesOverPoints ? data.values[j] : ''),
    						j
    					);
    				});
    			}

    			return Object.values(this.paths).concat(this.units);
    		},
    		animateElements(newData) {
    			let newXPos = newData.xPositions;
    			let newYPos = newData.yPositions;
    			let newValues = newData.values;

    			let oldXPos = this.oldData.xPositions;
    			let oldYPos = this.oldData.yPositions;
    			let oldValues = this.oldData.values;

    			[oldXPos, newXPos] = equilizeNoOfElements(oldXPos, newXPos);
    			[oldYPos, newYPos] = equilizeNoOfElements(oldYPos, newYPos);
    			[oldValues, newValues] = equilizeNoOfElements(oldValues, newValues);

    			this.render({
    				xPositions: oldXPos,
    				yPositions: oldYPos,
    				values: newValues,

    				zeroLine: this.oldData.zeroLine,
    				radius: this.oldData.radius,
    			});

    			let animateElements = [];

    			if(Object.keys(this.paths).length) {
    				animateElements = animateElements.concat(animatePath(
    					this.paths, newXPos, newYPos, newData.zeroLine, this.constants.spline));
    			}

    			if(this.units.length) {
    				this.units.map((dot, i) => {
    					animateElements = animateElements.concat(animateDot(
    						dot, newXPos[i], newYPos[i]));
    				});
    			}

    			return animateElements;
    		}
    	}
    };

    function getComponent(name, constants, getData) {
    	let keys = Object.keys(componentConfigs).filter(k => name.includes(k));
    	let config = componentConfigs[keys[0]];
    	Object.assign(config, {
    		constants: constants,
    		getData: getData
    	});
    	return new ChartComponent(config);
    }

    class PercentageChart extends AggregationChart {
    	constructor(parent, args) {
    		super(parent, args);
    		this.type = 'percentage';
    		this.setup();
    	}

    	setMeasures(options) {
    		let m = this.measures;
    		this.barOptions = options.barOptions || {};

    		let b = this.barOptions;
    		b.height = b.height || PERCENTAGE_BAR_DEFAULT_HEIGHT;
    		b.depth = b.depth || PERCENTAGE_BAR_DEFAULT_DEPTH;

    		m.paddings.right = 30;
    		m.legendHeight = 60;
    		m.baseHeight = (b.height + b.depth * 0.5) * 8;
    	}

    	setupComponents() {
    		let s = this.state;

    		let componentConfigs = [
    			[
    				'percentageBars',
    				{
    					barHeight: this.barOptions.height,
    					barDepth: this.barOptions.depth,
    				},
    				function() {
    					return {
    						xPositions: s.xPositions,
    						widths: s.widths,
    						colors: this.colors
    					};
    				}.bind(this)
    			]
    		];

    		this.components = new Map(componentConfigs
    			.map(args => {
    				let component = getComponent(...args);
    				return [args[0], component];
    			}));
    	}

    	calc() {
    		super.calc();
    		let s = this.state;

    		s.xPositions = [];
    		s.widths = [];

    		let xPos = 0;
    		s.sliceTotals.map((value) => {
    			let width = this.width * value / s.grandTotal;
    			s.widths.push(width);
    			s.xPositions.push(xPos);
    			xPos += width;
    		});
    	}

    	makeDataByIndex() { }

    	bindTooltip() {
    		let s = this.state;
    		this.container.addEventListener('mousemove', (e) => {
    			let bars = this.components.get('percentageBars').store;
    			let bar = e.target;
    			if(bars.includes(bar)) {

    				let i = bars.indexOf(bar);
    				let gOff = getOffset(this.container), pOff = getOffset(bar);

    				let x = pOff.left - gOff.left + parseInt(bar.getAttribute('width'))/2;
    				let y = pOff.top - gOff.top;
    				let title = (this.formattedLabels && this.formattedLabels.length>0
    					? this.formattedLabels[i] : this.state.labels[i]) + ': ';
    				let fraction = s.sliceTotals[i]/s.grandTotal;

    				this.tip.setValues(x, y, {name: title, value: (fraction*100).toFixed(1) + "%"});
    				this.tip.showTip();
    			}
    		});
    	}
    }

    class PieChart extends AggregationChart {
    	constructor(parent, args) {
    		super(parent, args);
    		this.type = 'pie';
    		this.initTimeout = 0;
    		this.init = 1;

    		this.setup();
    	}

    	configure(args) {
    		super.configure(args);
    		this.mouseMove = this.mouseMove.bind(this);
    		this.mouseLeave = this.mouseLeave.bind(this);

    		this.hoverRadio = args.hoverRadio || 0.1;
    		this.config.startAngle = args.startAngle || 0;

    		this.clockWise = args.clockWise || false;
    	}

    	calc() {
    		super.calc();
    		let s = this.state;
    		this.radius = (this.height > this.width ? this.center.x : this.center.y);

    		const { radius, clockWise } = this;

    		const prevSlicesProperties = s.slicesProperties || [];
    		s.sliceStrings = [];
    		s.slicesProperties = [];
    		let curAngle = 180 - this.config.startAngle;
    		s.sliceTotals.map((total, i) => {
    			const startAngle = curAngle;
    			const originDiffAngle = (total / s.grandTotal) * FULL_ANGLE;
    			const largeArc = originDiffAngle > 180 ? 1: 0;
    			const diffAngle = clockWise ? -originDiffAngle : originDiffAngle;
    			const endAngle = curAngle = curAngle + diffAngle;
    			const startPosition = getPositionByAngle(startAngle, radius);
    			const endPosition = getPositionByAngle(endAngle, radius);

    			const prevProperty = this.init && prevSlicesProperties[i];

    			let curStart,curEnd;
    			if(this.init) {
    				curStart = prevProperty ? prevProperty.startPosition : startPosition;
    				curEnd = prevProperty ? prevProperty.endPosition : startPosition;
    			} else {
    				curStart = startPosition;
    				curEnd = endPosition;
    			}
    			const curPath =
    				originDiffAngle === 360
    					? makeCircleStr(curStart, curEnd, this.center, this.radius, clockWise, largeArc)
    					: makeArcPathStr(curStart, curEnd, this.center, this.radius, clockWise, largeArc);

    			s.sliceStrings.push(curPath);
    			s.slicesProperties.push({
    				startPosition,
    				endPosition,
    				value: total,
    				total: s.grandTotal,
    				startAngle,
    				endAngle,
    				angle: diffAngle
    			});

    		});
    		this.init = 0;
    	}

    	setupComponents() {
    		let s = this.state;

    		let componentConfigs = [
    			[
    				'pieSlices',
    				{ },
    				function() {
    					return {
    						sliceStrings: s.sliceStrings,
    						colors: this.colors
    					};
    				}.bind(this)
    			]
    		];

    		this.components = new Map(componentConfigs
    			.map(args => {
    				let component = getComponent(...args);
    				return [args[0], component];
    			}));
    	}

    	calTranslateByAngle(property){
    		const{radius,hoverRadio} = this;
    		const position = getPositionByAngle(property.startAngle+(property.angle / 2),radius);
    		return `translate3d(${(position.x) * hoverRadio}px,${(position.y) * hoverRadio}px,0)`;
    	}

    	hoverSlice(path,i,flag,e){
    		if(!path) return;
    		const color = this.colors[i];
    		if(flag) {
    			transform(path, this.calTranslateByAngle(this.state.slicesProperties[i]));
    			path.style.fill = lightenDarkenColor(color, 50);
    			let g_off = getOffset(this.svg);
    			let x = e.pageX - g_off.left + 10;
    			let y = e.pageY - g_off.top - 10;
    			let title = (this.formatted_labels && this.formatted_labels.length > 0
    				? this.formatted_labels[i] : this.state.labels[i]) + ': ';
    			let percent = (this.state.sliceTotals[i] * 100 / this.state.grandTotal).toFixed(1);
    			this.tip.setValues(x, y, {name: title, value: percent + "%"});
    			this.tip.showTip();
    		} else {
    			transform(path,'translate3d(0,0,0)');
    			this.tip.hideTip();
    			path.style.fill = color;
    		}
    	}

    	bindTooltip() {
    		this.container.addEventListener('mousemove', this.mouseMove);
    		this.container.addEventListener('mouseleave', this.mouseLeave);
    	}

    	mouseMove(e){
    		const target = e.target;
    		let slices = this.components.get('pieSlices').store;
    		let prevIndex = this.curActiveSliceIndex;
    		let prevAcitve = this.curActiveSlice;
    		if(slices.includes(target)) {
    			let i = slices.indexOf(target);
    			this.hoverSlice(prevAcitve, prevIndex,false);
    			this.curActiveSlice = target;
    			this.curActiveSliceIndex = i;
    			this.hoverSlice(target, i, true, e);
    		} else {
    			this.mouseLeave();
    		}
    	}

    	mouseLeave(){
    		this.hoverSlice(this.curActiveSlice,this.curActiveSliceIndex,false);
    	}
    }

    function normalize(x) {
    	// Calculates mantissa and exponent of a number
    	// Returns normalized number and exponent
    	// https://stackoverflow.com/q/9383593/6495043

    	if(x===0) {
    		return [0, 0];
    	}
    	if(isNaN(x)) {
    		return {mantissa: -6755399441055744, exponent: 972};
    	}
    	var sig = x > 0 ? 1 : -1;
    	if(!isFinite(x)) {
    		return {mantissa: sig * 4503599627370496, exponent: 972};
    	}

    	x = Math.abs(x);
    	var exp = Math.floor(Math.log10(x));
    	var man = x/Math.pow(10, exp);

    	return [sig * man, exp];
    }

    function getChartRangeIntervals(max, min=0) {
    	let upperBound = Math.ceil(max);
    	let lowerBound = Math.floor(min);
    	let range = upperBound - lowerBound;

    	let noOfParts = range;
    	let partSize = 1;

    	// To avoid too many partitions
    	if(range > 5) {
    		if(range % 2 !== 0) {
    			upperBound++;
    			// Recalc range
    			range = upperBound - lowerBound;
    		}
    		noOfParts = range/2;
    		partSize = 2;
    	}

    	// Special case: 1 and 2
    	if(range <= 2) {
    		noOfParts = 4;
    		partSize = range/noOfParts;
    	}

    	// Special case: 0
    	if(range === 0) {
    		noOfParts = 5;
    		partSize = 1;
    	}

    	let intervals = [];
    	for(var i = 0; i <= noOfParts; i++){
    		intervals.push(lowerBound + partSize * i);
    	}
    	return intervals;
    }

    function getChartIntervals(maxValue, minValue=0) {
    	let [normalMaxValue, exponent] = normalize(maxValue);
    	let normalMinValue = minValue ? minValue/Math.pow(10, exponent): 0;

    	// Allow only 7 significant digits
    	normalMaxValue = normalMaxValue.toFixed(6);

    	let intervals = getChartRangeIntervals(normalMaxValue, normalMinValue);
    	intervals = intervals.map(value => value * Math.pow(10, exponent));
    	return intervals;
    }

    function calcChartIntervals(values, withMinimum=false) {
    	//*** Where the magic happens ***

    	// Calculates best-fit y intervals from given values
    	// and returns the interval array

    	let maxValue = Math.max(...values);
    	let minValue = Math.min(...values);

    	// Exponent to be used for pretty print
    	let exponent = 0, intervals = []; // eslint-disable-line no-unused-vars

    	function getPositiveFirstIntervals(maxValue, absMinValue) {
    		let intervals = getChartIntervals(maxValue);

    		let intervalSize = intervals[1] - intervals[0];

    		// Then unshift the negative values
    		let value = 0;
    		for(var i = 1; value < absMinValue; i++) {
    			value += intervalSize;
    			intervals.unshift((-1) * value);
    		}
    		return intervals;
    	}

    	// CASE I: Both non-negative

    	if(maxValue >= 0 && minValue >= 0) {
    		exponent = normalize(maxValue)[1];
    		if(!withMinimum) {
    			intervals = getChartIntervals(maxValue);
    		} else {
    			intervals = getChartIntervals(maxValue, minValue);
    		}
    	}

    	// CASE II: Only minValue negative

    	else if(maxValue > 0 && minValue < 0) {
    		// `withMinimum` irrelevant in this case,
    		// We'll be handling both sides of zero separately
    		// (both starting from zero)
    		// Because ceil() and floor() behave differently
    		// in those two regions

    		let absMinValue = Math.abs(minValue);

    		if(maxValue >= absMinValue) {
    			exponent = normalize(maxValue)[1];
    			intervals = getPositiveFirstIntervals(maxValue, absMinValue);
    		} else {
    			// Mirror: maxValue => absMinValue, then change sign
    			exponent = normalize(absMinValue)[1];
    			let posIntervals = getPositiveFirstIntervals(absMinValue, maxValue);
    			intervals = posIntervals.reverse().map(d => d * (-1));
    		}

    	}

    	// CASE III: Both non-positive

    	else if(maxValue <= 0 && minValue <= 0) {
    		// Mirrored Case I:
    		// Work with positives, then reverse the sign and array

    		let pseudoMaxValue = Math.abs(minValue);
    		let pseudoMinValue = Math.abs(maxValue);

    		exponent = normalize(pseudoMaxValue)[1];
    		if(!withMinimum) {
    			intervals = getChartIntervals(pseudoMaxValue);
    		} else {
    			intervals = getChartIntervals(pseudoMaxValue, pseudoMinValue);
    		}

    		intervals = intervals.reverse().map(d => d * (-1));
    	}

    	return intervals;
    }

    function getZeroIndex(yPts) {
    	let zeroIndex;
    	let interval = getIntervalSize(yPts);
    	if(yPts.indexOf(0) >= 0) {
    		// the range has a given zero
    		// zero-line on the chart
    		zeroIndex = yPts.indexOf(0);
    	} else if(yPts[0] > 0) {
    		// Minimum value is positive
    		// zero-line is off the chart: below
    		let min = yPts[0];
    		zeroIndex = (-1) * min / interval;
    	} else {
    		// Maximum value is negative
    		// zero-line is off the chart: above
    		let max = yPts[yPts.length - 1];
    		zeroIndex = (-1) * max / interval + (yPts.length - 1);
    	}
    	return zeroIndex;
    }



    function getIntervalSize(orderedArray) {
    	return orderedArray[1] - orderedArray[0];
    }

    function getValueRange(orderedArray) {
    	return orderedArray[orderedArray.length-1] - orderedArray[0];
    }

    function scale(val, yAxis) {
    	return floatTwo(yAxis.zeroLine - val * yAxis.scaleMultiplier);
    }





    function getClosestInArray(goal, arr, index = false) {
    	let closest = arr.reduce(function(prev, curr) {
    		return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    	}, []);

    	return index ? arr.indexOf(closest) : closest;
    }

    function calcDistribution(values, distributionSize) {
    	// Assume non-negative values,
    	// implying distribution minimum at zero

    	let dataMaxValue = Math.max(...values);

    	let distributionStep = 1 / (distributionSize - 1);
    	let distribution = [];

    	for(var i = 0; i < distributionSize; i++) {
    		let checkpoint = dataMaxValue * (distributionStep * i);
    		distribution.push(checkpoint);
    	}

    	return distribution;
    }

    function getMaxCheckpoint(value, distribution) {
    	return distribution.filter(d => d < value).length;
    }

    const COL_WIDTH = HEATMAP_SQUARE_SIZE + HEATMAP_GUTTER_SIZE;
    const ROW_HEIGHT = COL_WIDTH;
    // const DAY_INCR = 1;

    class Heatmap extends BaseChart {
    	constructor(parent, options) {
    		super(parent, options);
    		this.type = 'heatmap';

    		this.countLabel = options.countLabel || '';

    		let validStarts = ['Sunday', 'Monday'];
    		let startSubDomain = validStarts.includes(options.startSubDomain)
    			? options.startSubDomain : 'Sunday';
    		this.startSubDomainIndex = validStarts.indexOf(startSubDomain);

    		this.setup();
    	}

    	setMeasures(options) {
    		let m = this.measures;
    		this.discreteDomains = options.discreteDomains === 0 ? 0 : 1;

    		m.paddings.top = ROW_HEIGHT * 3;
    		m.paddings.bottom = 0;
    		m.legendHeight = ROW_HEIGHT * 2;
    		m.baseHeight = ROW_HEIGHT * NO_OF_DAYS_IN_WEEK
    			+ getExtraHeight(m);

    		let d = this.data;
    		let spacing = this.discreteDomains ? NO_OF_YEAR_MONTHS : 0;
    		this.independentWidth = (getWeeksBetween(d.start, d.end)
    			+ spacing) * COL_WIDTH + getExtraWidth(m);
    	}

    	updateWidth() {
    		let spacing = this.discreteDomains ? NO_OF_YEAR_MONTHS : 0;
    		let noOfWeeks = this.state.noOfWeeks ? this.state.noOfWeeks : 52;
    		this.baseWidth = (noOfWeeks + spacing) * COL_WIDTH
    			+ getExtraWidth(this.measures);
    	}

    	prepareData(data=this.data) {
    		if(data.start && data.end && data.start > data.end) {
    			throw new Error('Start date cannot be greater than end date.');
    		}

    		if(!data.start) {
    			data.start = new Date();
    			data.start.setFullYear( data.start.getFullYear() - 1 );
    		}
    		if(!data.end) { data.end = new Date(); }
    		data.dataPoints = data.dataPoints || {};

    		if(parseInt(Object.keys(data.dataPoints)[0]) > 100000) {
    			let points = {};
    			Object.keys(data.dataPoints).forEach(timestampSec$$1 => {
    				let date = new Date(timestampSec$$1 * NO_OF_MILLIS);
    				points[getYyyyMmDd(date)] = data.dataPoints[timestampSec$$1];
    			});
    			data.dataPoints = points;
    		}

    		return data;
    	}

    	calc() {
    		let s = this.state;

    		s.start = clone(this.data.start);
    		s.end = clone(this.data.end);

    		s.firstWeekStart = clone(s.start);
    		s.noOfWeeks = getWeeksBetween(s.start, s.end);
    		s.distribution = calcDistribution(
    			Object.values(this.data.dataPoints), HEATMAP_DISTRIBUTION_SIZE);

    		s.domainConfigs = this.getDomains();
    	}

    	setupComponents() {
    		let s = this.state;
    		let lessCol = this.discreteDomains ? 0 : 1;

    		let componentConfigs = s.domainConfigs.map((config, i) => [
    			'heatDomain',
    			{
    				index: config.index,
    				colWidth: COL_WIDTH,
    				rowHeight: ROW_HEIGHT,
    				squareSize: HEATMAP_SQUARE_SIZE,
    				radius: this.rawChartArgs.radius || 0,
    				xTranslate: s.domainConfigs
    					.filter((config, j) => j < i)
    					.map(config => config.cols.length - lessCol)
    					.reduce((a, b) => a + b, 0)
    					* COL_WIDTH
    			},
    			function() {
    				return s.domainConfigs[i];
    			}.bind(this)

    		]);

    		this.components = new Map(componentConfigs
    			.map((args, i) => {
    				let component = getComponent(...args);
    				return [args[0] + '-' + i, component];
    			})
    		);

    		let y = 0;
    		DAY_NAMES_SHORT.forEach((dayName, i) => {
    			if([1, 3, 5].includes(i)) {
    				let dayText = makeText('subdomain-name', -COL_WIDTH/2, y, dayName,
    					{
    						fontSize: HEATMAP_SQUARE_SIZE,
    						dy: 8,
    						textAnchor: 'end'
    					}
    				);
    				this.drawArea.appendChild(dayText);
    			}
    			y += ROW_HEIGHT;
    		});
    	}

    	update(data) {
    		if(!data) {
    			console.error('No data to update.');
    		}

    		this.data = this.prepareData(data);
    		this.draw();
    		this.bindTooltip();
    	}

    	bindTooltip() {
    		this.container.addEventListener('mousemove', (e) => {
    			this.components.forEach(comp => {
    				let daySquares = comp.store;
    				let daySquare = e.target;
    				if(daySquares.includes(daySquare)) {

    					let count = daySquare.getAttribute('data-value');
    					let dateParts = daySquare.getAttribute('data-date').split('-');

    					let month = getMonthName(parseInt(dateParts[1])-1, true);

    					let gOff = this.container.getBoundingClientRect(), pOff = daySquare.getBoundingClientRect();

    					let width = parseInt(e.target.getAttribute('width'));
    					let x = pOff.left - gOff.left + width/2;
    					let y = pOff.top - gOff.top;
    					let value = count + ' ' + this.countLabel;
    					let name = ' on ' + month + ' ' + dateParts[0] + ', ' + dateParts[2];

    					this.tip.setValues(x, y, {name: name, value: value, valueFirst: 1}, []);
    					this.tip.showTip();
    				}
    			});
    		});
    	}

    	renderLegend() {
    		this.legendArea.textContent = '';
    		let x = 0;
    		let y = ROW_HEIGHT;
    		let radius = this.rawChartArgs.radius || 0;

    		let lessText = makeText('subdomain-name', x, y, 'Less',
    			{
    				fontSize: HEATMAP_SQUARE_SIZE + 1,
    				dy: 9
    			}
    		);
    		x = (COL_WIDTH * 2) + COL_WIDTH/2;
    		this.legendArea.appendChild(lessText);

    		this.colors.slice(0, HEATMAP_DISTRIBUTION_SIZE).map((color, i) => {
    			const square = heatSquare('heatmap-legend-unit', x + (COL_WIDTH + 3) * i,
    				y, HEATMAP_SQUARE_SIZE, radius, color);
    			this.legendArea.appendChild(square);
    		});

    		let moreTextX = x + HEATMAP_DISTRIBUTION_SIZE * (COL_WIDTH + 3) + COL_WIDTH/4;
    		let moreText = makeText('subdomain-name', moreTextX, y, 'More',
    			{
    				fontSize: HEATMAP_SQUARE_SIZE + 1,
    				dy: 9
    			}
    		);
    		this.legendArea.appendChild(moreText);
    	}

    	getDomains() {
    		let s = this.state;
    		const [startMonth, startYear] = [s.start.getMonth(), s.start.getFullYear()];
    		const [endMonth, endYear] = [s.end.getMonth(), s.end.getFullYear()];

    		const noOfMonths = (endMonth - startMonth + 1) + (endYear - startYear) * 12;

    		let domainConfigs = [];

    		let startOfMonth = clone(s.start);
    		for(var i = 0; i < noOfMonths; i++) {
    			let endDate = s.end;
    			if(!areInSameMonth(startOfMonth, s.end)) {
    				let [month, year] = [startOfMonth.getMonth(), startOfMonth.getFullYear()];
    				endDate = getLastDateInMonth(month, year);
    			}
    			domainConfigs.push(this.getDomainConfig(startOfMonth, endDate));

    			addDays(endDate, 1);
    			startOfMonth = endDate;
    		}

    		return domainConfigs;
    	}

    	getDomainConfig(startDate, endDate='') {
    		let [month, year] = [startDate.getMonth(), startDate.getFullYear()];
    		let startOfWeek = setDayToSunday(startDate); // TODO: Monday as well
    		endDate = clone(endDate) || getLastDateInMonth(month, year);

    		let domainConfig = {
    			index: month,
    			cols: []
    		};

    		addDays(endDate, 1);
    		let noOfMonthWeeks = getWeeksBetween(startOfWeek, endDate);

    		let cols = [], col;
    		for(var i = 0; i < noOfMonthWeeks; i++) {
    			col = this.getCol(startOfWeek, month);
    			cols.push(col);

    			startOfWeek = new Date(col[NO_OF_DAYS_IN_WEEK - 1].yyyyMmDd);
    			addDays(startOfWeek, 1);
    		}

    		if(col[NO_OF_DAYS_IN_WEEK - 1].dataValue !== undefined) {
    			addDays(startOfWeek, 1);
    			cols.push(this.getCol(startOfWeek, month, true));
    		}

    		domainConfig.cols = cols;

    		return domainConfig;
    	}

    	getCol(startDate, month, empty = false) {
    		let s = this.state;

    		// startDate is the start of week
    		let currentDate = clone(startDate);
    		let col = [];

    		for(var i = 0; i < NO_OF_DAYS_IN_WEEK; i++, addDays(currentDate, 1)) {
    			let config = {};

    			// Non-generic adjustment for entire heatmap, needs state
    			let currentDateWithinData = currentDate >= s.start && currentDate <= s.end;

    			if(empty || currentDate.getMonth() !== month || !currentDateWithinData) {
    				config.yyyyMmDd = getYyyyMmDd(currentDate);
    			} else {
    				config = this.getSubDomainConfig(currentDate);
    			}
    			col.push(config);
    		}

    		return col;
    	}

    	getSubDomainConfig(date) {
    		let yyyyMmDd = getYyyyMmDd(date);
    		let dataValue = this.data.dataPoints[yyyyMmDd];
    		let config = {
    			yyyyMmDd: yyyyMmDd,
    			dataValue: dataValue || 0,
    			fill: this.colors[getMaxCheckpoint(dataValue, this.state.distribution)]
    		};
    		return config;
    	}
    }

    function dataPrep(data, type) {
    	data.labels = data.labels || [];

    	let datasetLength = data.labels.length;

    	// Datasets
    	let datasets = data.datasets;
    	let zeroArray = new Array(datasetLength).fill(0);
    	if(!datasets) {
    		// default
    		datasets = [{
    			values: zeroArray
    		}];
    	}

    	datasets.map(d=> {
    		// Set values
    		if(!d.values) {
    			d.values = zeroArray;
    		} else {
    			// Check for non values
    			let vals = d.values;
    			vals = vals.map(val => (!isNaN(val) ? val : 0));

    			// Trim or extend
    			if(vals.length > datasetLength) {
    				vals = vals.slice(0, datasetLength);
    			} else {
    				vals = fillArray(vals, datasetLength - vals.length, 0);
    			}
    			d.values = vals;
    		}

    		// Set type
    		if(!d.chartType ) {
    			d.chartType = type;
    		}

    	});

    	// Markers

    	// Regions
    	// data.yRegions = data.yRegions || [];
    	if(data.yRegions) {
    		data.yRegions.map(d => {
    			if(d.end < d.start) {
    				[d.start, d.end] = [d.end, d.start];
    			}
    		});
    	}

    	return data;
    }

    function zeroDataPrep(realData) {
    	let datasetLength = realData.labels.length;
    	let zeroArray = new Array(datasetLength).fill(0);

    	let zeroData = {
    		labels: realData.labels.slice(0, -1),
    		datasets: realData.datasets.map(d => {
    			return {
    				name: '',
    				values: zeroArray.slice(0, -1),
    				chartType: d.chartType
    			};
    		}),
    	};

    	if(realData.yMarkers) {
    		zeroData.yMarkers = [
    			{
    				value: 0,
    				label: ''
    			}
    		];
    	}

    	if(realData.yRegions) {
    		zeroData.yRegions = [
    			{
    				start: 0,
    				end: 0,
    				label: ''
    			}
    		];
    	}

    	return zeroData;
    }

    function getShortenedLabels(chartWidth, labels=[], isSeries=true) {
    	let allowedSpace = chartWidth / labels.length;
    	if(allowedSpace <= 0) allowedSpace = 1;
    	let allowedLetters = allowedSpace / DEFAULT_CHAR_WIDTH;

    	let seriesMultiple;
    	if(isSeries) {
    		// Find the maximum label length for spacing calculations
    		let maxLabelLength = Math.max(...labels.map(label => label.length));
    		seriesMultiple = Math.ceil(maxLabelLength/allowedLetters);
    	}

    	let calcLabels = labels.map((label, i) => {
    		label += "";
    		if(label.length > allowedLetters) {

    			if(!isSeries) {
    				if(allowedLetters-3 > 0) {
    					label = label.slice(0, allowedLetters-3) + " ...";
    				} else {
    					label = label.slice(0, allowedLetters) + '..';
    				}
    			} else {
    				if(i % seriesMultiple !== 0) {
    					label = "";
    				}
    			}
    		}
    		return label;
    	});

    	return calcLabels;
    }

    class AxisChart extends BaseChart {
    	constructor(parent, args) {
    		super(parent, args);

    		this.barOptions = args.barOptions || {};
    		this.lineOptions = args.lineOptions || {};

    		this.type = args.type || 'line';
    		this.init = 1;

    		this.setup();
    	}

    	setMeasures() {
    		if(this.data.datasets.length <= 1) {
    			this.config.showLegend = 0;
    			this.measures.paddings.bottom = 30;
    		}
    	}

    	configure(options) {
    		super.configure(options);

    		options.axisOptions = options.axisOptions || {};
    		options.tooltipOptions = options.tooltipOptions || {};

    		this.config.xAxisMode = options.axisOptions.xAxisMode || 'span';
    		this.config.yAxisMode = options.axisOptions.yAxisMode || 'span';
    		this.config.xIsSeries = options.axisOptions.xIsSeries || 0;
    		this.config.shortenYAxisNumbers = options.axisOptions.shortenYAxisNumbers || 0;

    		this.config.formatTooltipX = options.tooltipOptions.formatTooltipX;
    		this.config.formatTooltipY = options.tooltipOptions.formatTooltipY;

    		this.config.valuesOverPoints = options.valuesOverPoints;
    	}

    	prepareData(data=this.data) {
    		return dataPrep(data, this.type);
    	}

    	prepareFirstData(data=this.data) {
    		return zeroDataPrep(data);
    	}

    	calc(onlyWidthChange = false) {
    		this.calcXPositions();
    		if(!onlyWidthChange) {
    			this.calcYAxisParameters(this.getAllYValues(), this.type === 'line');
    		}
    		this.makeDataByIndex();
    	}

    	calcXPositions() {
    		let s = this.state;
    		let labels = this.data.labels;
    		s.datasetLength = labels.length;

    		s.unitWidth = this.width/(s.datasetLength);
    		// Default, as per bar, and mixed. Only line will be a special case
    		s.xOffset = s.unitWidth/2;

    		// // For a pure Line Chart
    		// s.unitWidth = this.width/(s.datasetLength - 1);
    		// s.xOffset = 0;

    		s.xAxis = {
    			labels: labels,
    			positions: labels.map((d, i) =>
    				floatTwo(s.xOffset + i * s.unitWidth)
    			)
    		};
    	}

    	calcYAxisParameters(dataValues, withMinimum = 'false') {
    		const yPts = calcChartIntervals(dataValues, withMinimum);
    		const scaleMultiplier = this.height / getValueRange(yPts);
    		const intervalHeight = getIntervalSize(yPts) * scaleMultiplier;
    		const zeroLine = this.height - (getZeroIndex(yPts) * intervalHeight);

    		this.state.yAxis = {
    			labels: yPts,
    			positions: yPts.map(d => zeroLine - d * scaleMultiplier),
    			scaleMultiplier: scaleMultiplier,
    			zeroLine: zeroLine,
    		};

    		// Dependent if above changes
    		this.calcDatasetPoints();
    		this.calcYExtremes();
    		this.calcYRegions();
    	}

    	calcDatasetPoints() {
    		let s = this.state;
    		let scaleAll = values => values.map(val => scale(val, s.yAxis));

    		s.datasets = this.data.datasets.map((d, i) => {
    			let values = d.values;
    			let cumulativeYs = d.cumulativeYs || [];
    			return {
    				name: d.name && d.name.replace(/<|>|&/g, (char) => char == '&' ? '&amp;' : char == '<' ? '&lt;' : '&gt;'),
    				index: i,
    				chartType: d.chartType,

    				values: values,
    				yPositions: scaleAll(values),

    				cumulativeYs: cumulativeYs,
    				cumulativeYPos: scaleAll(cumulativeYs),
    			};
    		});
    	}

    	calcYExtremes() {
    		let s = this.state;
    		if(this.barOptions.stacked) {
    			s.yExtremes = s.datasets[s.datasets.length - 1].cumulativeYPos;
    			return;
    		}
    		s.yExtremes = new Array(s.datasetLength).fill(9999);
    		s.datasets.map(d => {
    			d.yPositions.map((pos, j) => {
    				if(pos < s.yExtremes[j]) {
    					s.yExtremes[j] = pos;
    				}
    			});
    		});
    	}

    	calcYRegions() {
    		let s = this.state;
    		if(this.data.yMarkers) {
    			this.state.yMarkers = this.data.yMarkers.map(d => {
    				d.position = scale(d.value, s.yAxis);
    				if(!d.options) d.options = {};
    				// if(!d.label.includes(':')) {
    				// 	d.label += ': ' + d.value;
    				// }
    				return d;
    			});
    		}
    		if(this.data.yRegions) {
    			this.state.yRegions = this.data.yRegions.map(d => {
    				d.startPos = scale(d.start, s.yAxis);
    				d.endPos = scale(d.end, s.yAxis);
    				if(!d.options) d.options = {};
    				return d;
    			});
    		}
    	}

    	getAllYValues() {
    		let key = 'values';

    		if(this.barOptions.stacked) {
    			key = 'cumulativeYs';
    			let cumulative = new Array(this.state.datasetLength).fill(0);
    			this.data.datasets.map((d, i) => {
    				let values = this.data.datasets[i].values;
    				d[key] = cumulative = cumulative.map((c, i) => c + values[i]);
    			});
    		}

    		let allValueLists = this.data.datasets.map(d => d[key]);
    		if(this.data.yMarkers) {
    			allValueLists.push(this.data.yMarkers.map(d => d.value));
    		}
    		if(this.data.yRegions) {
    			this.data.yRegions.map(d => {
    				allValueLists.push([d.end, d.start]);
    			});
    		}

    		return [].concat(...allValueLists);
    	}

    	setupComponents() {
    		let componentConfigs = [
    			[
    				'yAxis',
    				{
    					mode: this.config.yAxisMode,
    					width: this.width,
    					shortenNumbers: this.config.shortenYAxisNumbers
    					// pos: 'right'
    				},
    				function() {
    					return this.state.yAxis;
    				}.bind(this)
    			],

    			[
    				'xAxis',
    				{
    					mode: this.config.xAxisMode,
    					height: this.height,
    					// pos: 'right'
    				},
    				function() {
    					let s = this.state;
    					s.xAxis.calcLabels = getShortenedLabels(this.width,
    						s.xAxis.labels, this.config.xIsSeries);

    					return s.xAxis;
    				}.bind(this)
    			],

    			[
    				'yRegions',
    				{
    					width: this.width,
    					pos: 'right'
    				},
    				function() {
    					return this.state.yRegions;
    				}.bind(this)
    			],
    		];

    		let barDatasets = this.state.datasets.filter(d => d.chartType === 'bar');
    		let lineDatasets = this.state.datasets.filter(d => d.chartType === 'line');

    		let barsConfigs = barDatasets.map(d => {
    			let index = d.index;
    			return [
    				'barGraph' + '-' + d.index,
    				{
    					index: index,
    					color: this.colors[index],
    					stacked: this.barOptions.stacked,

    					// same for all datasets
    					valuesOverPoints: this.config.valuesOverPoints,
    					minHeight: this.height * MIN_BAR_PERCENT_HEIGHT,
    				},
    				function() {
    					let s = this.state;
    					let d = s.datasets[index];
    					let stacked = this.barOptions.stacked;

    					let spaceRatio = this.barOptions.spaceRatio || BAR_CHART_SPACE_RATIO;
    					let barsWidth = s.unitWidth * (1 - spaceRatio);
    					let barWidth = barsWidth/(stacked ? 1 : barDatasets.length);

    					let xPositions = s.xAxis.positions.map(x => x - barsWidth/2);
    					if(!stacked) {
    						xPositions = xPositions.map(p => p + barWidth * index);
    					}

    					let labels = new Array(s.datasetLength).fill('');
    					if(this.config.valuesOverPoints) {
    						if(stacked && d.index === s.datasets.length - 1) {
    							labels = d.cumulativeYs;
    						} else {
    							labels = d.values;
    						}
    					}

    					let offsets = new Array(s.datasetLength).fill(0);
    					if(stacked) {
    						offsets = d.yPositions.map((y, j) => y - d.cumulativeYPos[j]);
    					}

    					return {
    						xPositions: xPositions,
    						yPositions: d.yPositions,
    						offsets: offsets,
    						// values: d.values,
    						labels: labels,

    						zeroLine: s.yAxis.zeroLine,
    						barsWidth: barsWidth,
    						barWidth: barWidth,
    					};
    				}.bind(this)
    			];
    		});

    		let lineConfigs = lineDatasets.map(d => {
    			let index = d.index;
    			return [
    				'lineGraph' + '-' + d.index,
    				{
    					index: index,
    					color: this.colors[index],
    					svgDefs: this.svgDefs,
    					heatline: this.lineOptions.heatline,
    					regionFill: this.lineOptions.regionFill,
    					spline: this.lineOptions.spline,
    					hideDots: this.lineOptions.hideDots,
    					hideLine: this.lineOptions.hideLine,

    					// same for all datasets
    					valuesOverPoints: this.config.valuesOverPoints,
    				},
    				function() {
    					let s = this.state;
    					let d = s.datasets[index];
    					let minLine = s.yAxis.positions[0] < s.yAxis.zeroLine
    						? s.yAxis.positions[0] : s.yAxis.zeroLine;

    					return {
    						xPositions: s.xAxis.positions,
    						yPositions: d.yPositions,

    						values: d.values,

    						zeroLine: minLine,
    						radius: this.lineOptions.dotSize || LINE_CHART_DOT_SIZE,
    					};
    				}.bind(this)
    			];
    		});

    		let markerConfigs = [
    			[
    				'yMarkers',
    				{
    					width: this.width,
    					pos: 'right'
    				},
    				function() {
    					return this.state.yMarkers;
    				}.bind(this)
    			]
    		];

    		componentConfigs = componentConfigs.concat(barsConfigs, lineConfigs, markerConfigs);

    		let optionals = ['yMarkers', 'yRegions'];
    		this.dataUnitComponents = [];

    		this.components = new Map(componentConfigs
    			.filter(args => !optionals.includes(args[0]) || this.state[args[0]])
    			.map(args => {
    				let component = getComponent(...args);
    				if(args[0].includes('lineGraph') || args[0].includes('barGraph')) {
    					this.dataUnitComponents.push(component);
    				}
    				return [args[0], component];
    			}));
    	}

    	makeDataByIndex() {
    		this.dataByIndex = {};

    		let s = this.state;
    		let formatX = this.config.formatTooltipX;
    		let formatY = this.config.formatTooltipY;
    		let titles = s.xAxis.labels;

    		titles.map((label, index) => {
    			let values = this.state.datasets.map((set, i) => {
    				let value = set.values[index];
    				return {
    					title: set.name,
    					value: value,
    					yPos: set.yPositions[index],
    					color: this.colors[i],
    					formatted: formatY ? formatY(value) : value,
    				};
    			});

    			this.dataByIndex[index] = {
    				label: label,
    				formattedLabel: formatX ? formatX(label) : label,
    				xPos: s.xAxis.positions[index],
    				values: values,
    				yExtreme: s.yExtremes[index],
    			};
    		});
    	}

    	bindTooltip() {
    		// NOTE: could be in tooltip itself, as it is a given functionality for its parent
    		this.container.addEventListener('mousemove', (e) => {
    			let m = this.measures;
    			let o = getOffset(this.container);
    			let relX = e.pageX - o.left - getLeftOffset(m);
    			let relY = e.pageY - o.top;

    			if(relY < this.height + getTopOffset(m)
    				&& relY >  getTopOffset(m)) {
    				this.mapTooltipXPosition(relX);
    			} else {
    				this.tip.hideTip();
    			}
    		});
    	}

    	mapTooltipXPosition(relX) {
    		let s = this.state;
    		if(!s.yExtremes) return;

    		let index = getClosestInArray(relX, s.xAxis.positions, true);
    		if (index >= 0) {
    			let dbi = this.dataByIndex[index];

    			this.tip.setValues(
    				dbi.xPos + this.tip.offset.x,
    				dbi.yExtreme + this.tip.offset.y,
    				{name: dbi.formattedLabel, value: ''},
    				dbi.values,
    				index
    			);

    			this.tip.showTip();
    		}
    	}

    	renderLegend() {
    		let s = this.data;
    		if(s.datasets.length > 1) {
    			this.legendArea.textContent = '';
    			s.datasets.map((d, i) => {
    				let barWidth = AXIS_LEGEND_BAR_SIZE;
    				// let rightEndPoint = this.baseWidth - this.measures.margins.left - this.measures.margins.right;
    				// let multiplier = s.datasets.length - i;
    				let rect = legendBar(
    					// rightEndPoint - multiplier * barWidth,	// To right align
    					barWidth * i,
    					'0',
    					barWidth,
    					this.colors[i],
    					d.name,
    					this.config.truncateLegends);
    				this.legendArea.appendChild(rect);
    			});
    		}
    	}



    	// Overlay
    	makeOverlay() {
    		if(this.init) {
    			this.init = 0;
    			return;
    		}
    		if(this.overlayGuides) {
    			this.overlayGuides.forEach(g => {
    				let o = g.overlay;
    				o.parentNode.removeChild(o);
    			});
    		}

    		this.overlayGuides = this.dataUnitComponents.map(c => {
    			return {
    				type: c.unitType,
    				overlay: undefined,
    				units: c.units,
    			};
    		});

    		if(this.state.currentIndex === undefined) {
    			this.state.currentIndex = this.state.datasetLength - 1;
    		}

    		// Render overlays
    		this.overlayGuides.map(d => {
    			let currentUnit = d.units[this.state.currentIndex];

    			d.overlay = makeOverlay[d.type](currentUnit);
    			this.drawArea.appendChild(d.overlay);
    		});
    	}

    	updateOverlayGuides() {
    		if(this.overlayGuides) {
    			this.overlayGuides.forEach(g => {
    				let o = g.overlay;
    				o.parentNode.removeChild(o);
    			});
    		}
    	}

    	bindOverlay() {
    		this.parent.addEventListener('data-select', () => {
    			this.updateOverlay();
    		});
    	}

    	bindUnits() {
    		this.dataUnitComponents.map(c => {
    			c.units.map(unit => {
    				unit.addEventListener('click', () => {
    					let index = unit.getAttribute('data-point-index');
    					this.setCurrentDataPoint(index);
    				});
    			});
    		});

    		// Note: Doesn't work as tooltip is absolutely positioned
    		this.tip.container.addEventListener('click', () => {
    			let index = this.tip.container.getAttribute('data-point-index');
    			this.setCurrentDataPoint(index);
    		});
    	}

    	updateOverlay() {
    		this.overlayGuides.map(d => {
    			let currentUnit = d.units[this.state.currentIndex];
    			updateOverlay[d.type](currentUnit, d.overlay);
    		});
    	}

    	onLeftArrow() {
    		this.setCurrentDataPoint(this.state.currentIndex - 1);
    	}

    	onRightArrow() {
    		this.setCurrentDataPoint(this.state.currentIndex + 1);
    	}

    	getDataPoint(index=this.state.currentIndex) {
    		let s = this.state;
    		let data_point = {
    			index: index,
    			label: s.xAxis.labels[index],
    			values: s.datasets.map(d => d.values[index])
    		};
    		return data_point;
    	}

    	setCurrentDataPoint(index) {
    		let s = this.state;
    		index = parseInt(index);
    		if(index < 0) index = 0;
    		if(index >= s.xAxis.labels.length) index = s.xAxis.labels.length - 1;
    		if(index === s.currentIndex) return;
    		s.currentIndex = index;
    		fire(this.parent, "data-select", this.getDataPoint());
    	}



    	// API
    	addDataPoint(label, datasetValues, index=this.state.datasetLength) {
    		super.addDataPoint(label, datasetValues, index);
    		this.data.labels.splice(index, 0, label);
    		this.data.datasets.map((d, i) => {
    			d.values.splice(index, 0, datasetValues[i]);
    		});
    		this.update(this.data);
    	}

    	removeDataPoint(index = this.state.datasetLength-1) {
    		if (this.data.labels.length <= 1) {
    			return;
    		}
    		super.removeDataPoint(index);
    		this.data.labels.splice(index, 1);
    		this.data.datasets.map(d => {
    			d.values.splice(index, 1);
    		});
    		this.update(this.data);
    	}

    	updateDataset(datasetValues, index=0) {
    		this.data.datasets[index].values = datasetValues;
    		this.update(this.data);
    	}
    	// addDataset(dataset, index) {}
    	// removeDataset(index = 0) {}

    	updateDatasets(datasets) {
    		this.data.datasets.map((d, i) => {
    			if(datasets[i]) {
    				d.values = datasets[i];
    			}
    		});
    		this.update(this.data);
    	}

    	// updateDataPoint(dataPoint, index = 0) {}
    	// addDataPoint(dataPoint, index = 0) {}
    	// removeDataPoint(index = 0) {}
    }

    class DonutChart extends AggregationChart {
    	constructor(parent, args) {
    		super(parent, args);
    		this.type = 'donut';
    		this.initTimeout = 0;
    		this.init = 1;

    		this.setup();
    	}

    	configure(args) {
    		super.configure(args);
    		this.mouseMove = this.mouseMove.bind(this);
    		this.mouseLeave = this.mouseLeave.bind(this);

    		this.hoverRadio = args.hoverRadio || 0.1;
    		this.config.startAngle = args.startAngle || 0;

    		this.clockWise = args.clockWise || false;
    		this.strokeWidth = args.strokeWidth || 30;
    	}

    	calc() {
    		super.calc();
    		let s = this.state;
    		this.radius =
    			this.height > this.width
    				? this.center.x - this.strokeWidth / 2
    				: this.center.y - this.strokeWidth / 2;

    		const { radius, clockWise } = this;

    		const prevSlicesProperties = s.slicesProperties || [];
    		s.sliceStrings = [];
    		s.slicesProperties = [];
    		let curAngle = 180 - this.config.startAngle;

    		s.sliceTotals.map((total, i) => {
    			const startAngle = curAngle;
    			const originDiffAngle = (total / s.grandTotal) * FULL_ANGLE;
    			const largeArc = originDiffAngle > 180 ? 1: 0;
    			const diffAngle = clockWise ? -originDiffAngle : originDiffAngle;
    			const endAngle = curAngle = curAngle + diffAngle;
    			const startPosition = getPositionByAngle(startAngle, radius);
    			const endPosition = getPositionByAngle(endAngle, radius);

    			const prevProperty = this.init && prevSlicesProperties[i];

    			let curStart,curEnd;
    			if(this.init) {
    				curStart = prevProperty ? prevProperty.startPosition : startPosition;
    				curEnd = prevProperty ? prevProperty.endPosition : startPosition;
    			} else {
    				curStart = startPosition;
    				curEnd = endPosition;
    			}
    			const curPath =
    				originDiffAngle === 360
    					? makeStrokeCircleStr(curStart, curEnd, this.center, this.radius, this.clockWise, largeArc)
    					: makeArcStrokePathStr(curStart, curEnd, this.center, this.radius, this.clockWise, largeArc);

    			s.sliceStrings.push(curPath);
    			s.slicesProperties.push({
    				startPosition,
    				endPosition,
    				value: total,
    				total: s.grandTotal,
    				startAngle,
    				endAngle,
    				angle: diffAngle
    			});

    		});
    		this.init = 0;
    	}

    	setupComponents() {
    		let s = this.state;

    		let componentConfigs = [
    			[
    				'donutSlices',
    				{ },
    				function() {
    					return {
    						sliceStrings: s.sliceStrings,
    						colors: this.colors,
    						strokeWidth: this.strokeWidth,
    					};
    				}.bind(this)
    			]
    		];

    		this.components = new Map(componentConfigs
    			.map(args => {
    				let component = getComponent(...args);
    				return [args[0], component];
    			}));
    	}

    	calTranslateByAngle(property){
    		const{ radius, hoverRadio } = this;
    		const position = getPositionByAngle(property.startAngle+(property.angle / 2),radius);
    		return `translate3d(${(position.x) * hoverRadio}px,${(position.y) * hoverRadio}px,0)`;
    	}

    	hoverSlice(path,i,flag,e){
    		if(!path) return;
    		const color = this.colors[i];
    		if(flag) {
    			transform(path, this.calTranslateByAngle(this.state.slicesProperties[i]));
    			path.style.stroke = lightenDarkenColor(color, 50);
    			let g_off = getOffset(this.svg);
    			let x = e.pageX - g_off.left + 10;
    			let y = e.pageY - g_off.top - 10;
    			let title = (this.formatted_labels && this.formatted_labels.length > 0
    				? this.formatted_labels[i] : this.state.labels[i]) + ': ';
    			let percent = (this.state.sliceTotals[i] * 100 / this.state.grandTotal).toFixed(1);
    			this.tip.setValues(x, y, {name: title, value: percent + "%"});
    			this.tip.showTip();
    		} else {
    			transform(path,'translate3d(0,0,0)');
    			this.tip.hideTip();
    			path.style.stroke = color;
    		}
    	}

    	bindTooltip() {
    		this.container.addEventListener('mousemove', this.mouseMove);
    		this.container.addEventListener('mouseleave', this.mouseLeave);
    	}

    	mouseMove(e){
    		const target = e.target;
    		let slices = this.components.get('donutSlices').store;
    		let prevIndex = this.curActiveSliceIndex;
    		let prevAcitve = this.curActiveSlice;
    		if(slices.includes(target)) {
    			let i = slices.indexOf(target);
    			this.hoverSlice(prevAcitve, prevIndex,false);
    			this.curActiveSlice = target;
    			this.curActiveSliceIndex = i;
    			this.hoverSlice(target, i, true, e);
    		} else {
    			this.mouseLeave();
    		}
    	}

    	mouseLeave(){
    		this.hoverSlice(this.curActiveSlice,this.curActiveSliceIndex,false);
    	}
    }

    // import MultiAxisChart from './charts/MultiAxisChart';
    const chartTypes = {
    	bar: AxisChart,
    	line: AxisChart,
    	// multiaxis: MultiAxisChart,
    	percentage: PercentageChart,
    	heatmap: Heatmap,
    	pie: PieChart,
    	donut: DonutChart,
    };

    function getChartByType(chartType = 'line', parent, options) {
    	if (chartType === 'axis-mixed') {
    		options.type = 'line';
    		return new AxisChart(parent, options);
    	}

    	if (!chartTypes[chartType]) {
    		console.error("Undefined chart type: " + chartType);
    		return;
    	}

    	return new chartTypes[chartType](parent, options);
    }

    class Chart {
    	constructor(parent, options) {
    		return getChartByType(options.type, parent, options);
    	}
    }

    /* node_modules\svelte-frappe-charts\src\components\base.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules\\svelte-frappe-charts\\src\\components\\base.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$2, 88, 0, 2056);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[18](div);

    			if (!mounted) {
    				dispose = listen_dev(div, "data-select", /*data_select_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[18](null);
    			mounted = false;
    			dispose();
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
    	validate_slots("Base", slots, []);

    	let { data = {
    		labels: [],
    		datasets: [{ values: [] }],
    		yMarkers: {},
    		yRegions: []
    	} } = $$props;

    	let { title = "" } = $$props;
    	let { type = "line" } = $$props;
    	let { height = 300 } = $$props;
    	let { animate = true } = $$props;
    	let { axisOptions = {} } = $$props;
    	let { barOptions = {} } = $$props;
    	let { lineOptions = {} } = $$props;
    	let { tooltipOptions = {} } = $$props;
    	let { colors = [] } = $$props;
    	let { valuesOverPoints = 0 } = $$props;
    	let { isNavigable = false } = $$props;
    	let { maxSlices = 3 } = $$props;

    	/**
     *  COMPONENT
     */
    	//  The Chart returned from frappe
    	let chart = null;

    	//  DOM node for frappe to latch onto
    	let chartRef;

    	//  Helper HOF for calling a fn only if chart exists
    	function ifChartThen(fn) {
    		return function ifChart(...args) {
    			if (chart) {
    				return fn(...args);
    			}
    		};
    	}

    	const addDataPoint = ifChartThen((label, valueFromEachDataset, index) => chart.addDataPoint(label, valueFromEachDataset, index));
    	const removeDataPoint = ifChartThen(index => chart.removeDataPoint(index));
    	const exportChart = ifChartThen(() => chart.export());

    	/**
     *  Handle initializing the chart when this Svelte component mounts
     */
    	onMount(() => {
    		chart = new Chart(chartRef,
    		{
    				data,
    				title,
    				type,
    				height,
    				animate,
    				colors,
    				axisOptions,
    				barOptions,
    				lineOptions,
    				tooltipOptions,
    				valuesOverPoints,
    				isNavigable,
    				maxSlices
    			});
    	});

    	//  Update the chart when incoming data changes
    	afterUpdate(() => chart.update(data));

    	//  Mark Chart references for garbage collection when component is unmounted
    	onDestroy(() => {
    		chart = null;
    	});

    	const writable_props = [
    		"data",
    		"title",
    		"type",
    		"height",
    		"animate",
    		"axisOptions",
    		"barOptions",
    		"lineOptions",
    		"tooltipOptions",
    		"colors",
    		"valuesOverPoints",
    		"isNavigable",
    		"maxSlices"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Base> was created with unknown prop '${key}'`);
    	});

    	function data_select_handler(event) {
    		bubble($$self, event);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			chartRef = $$value;
    			$$invalidate(0, chartRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("animate" in $$props) $$invalidate(5, animate = $$props.animate);
    		if ("axisOptions" in $$props) $$invalidate(6, axisOptions = $$props.axisOptions);
    		if ("barOptions" in $$props) $$invalidate(7, barOptions = $$props.barOptions);
    		if ("lineOptions" in $$props) $$invalidate(8, lineOptions = $$props.lineOptions);
    		if ("tooltipOptions" in $$props) $$invalidate(9, tooltipOptions = $$props.tooltipOptions);
    		if ("colors" in $$props) $$invalidate(10, colors = $$props.colors);
    		if ("valuesOverPoints" in $$props) $$invalidate(11, valuesOverPoints = $$props.valuesOverPoints);
    		if ("isNavigable" in $$props) $$invalidate(12, isNavigable = $$props.isNavigable);
    		if ("maxSlices" in $$props) $$invalidate(13, maxSlices = $$props.maxSlices);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		onDestroy,
    		Chart,
    		data,
    		title,
    		type,
    		height,
    		animate,
    		axisOptions,
    		barOptions,
    		lineOptions,
    		tooltipOptions,
    		colors,
    		valuesOverPoints,
    		isNavigable,
    		maxSlices,
    		chart,
    		chartRef,
    		ifChartThen,
    		addDataPoint,
    		removeDataPoint,
    		exportChart
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("height" in $$props) $$invalidate(4, height = $$props.height);
    		if ("animate" in $$props) $$invalidate(5, animate = $$props.animate);
    		if ("axisOptions" in $$props) $$invalidate(6, axisOptions = $$props.axisOptions);
    		if ("barOptions" in $$props) $$invalidate(7, barOptions = $$props.barOptions);
    		if ("lineOptions" in $$props) $$invalidate(8, lineOptions = $$props.lineOptions);
    		if ("tooltipOptions" in $$props) $$invalidate(9, tooltipOptions = $$props.tooltipOptions);
    		if ("colors" in $$props) $$invalidate(10, colors = $$props.colors);
    		if ("valuesOverPoints" in $$props) $$invalidate(11, valuesOverPoints = $$props.valuesOverPoints);
    		if ("isNavigable" in $$props) $$invalidate(12, isNavigable = $$props.isNavigable);
    		if ("maxSlices" in $$props) $$invalidate(13, maxSlices = $$props.maxSlices);
    		if ("chart" in $$props) chart = $$props.chart;
    		if ("chartRef" in $$props) $$invalidate(0, chartRef = $$props.chartRef);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		chartRef,
    		data,
    		title,
    		type,
    		height,
    		animate,
    		axisOptions,
    		barOptions,
    		lineOptions,
    		tooltipOptions,
    		colors,
    		valuesOverPoints,
    		isNavigable,
    		maxSlices,
    		addDataPoint,
    		removeDataPoint,
    		exportChart,
    		data_select_handler,
    		div_binding
    	];
    }

    class Base extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			data: 1,
    			title: 2,
    			type: 3,
    			height: 4,
    			animate: 5,
    			axisOptions: 6,
    			barOptions: 7,
    			lineOptions: 8,
    			tooltipOptions: 9,
    			colors: 10,
    			valuesOverPoints: 11,
    			isNavigable: 12,
    			maxSlices: 13,
    			addDataPoint: 14,
    			removeDataPoint: 15,
    			exportChart: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Base",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get data() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get axisOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set axisOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltipOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valuesOverPoints() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valuesOverPoints(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isNavigable() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isNavigable(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxSlices() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxSlices(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addDataPoint() {
    		return this.$$.ctx[14];
    	}

    	set addDataPoint(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeDataPoint() {
    		return this.$$.ctx[15];
    	}

    	set removeDataPoint(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get exportChart() {
    		return this.$$.ctx[16];
    	}

    	set exportChart(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Modal.svelte generated by Svelte v3.38.2 */

    const file$3 = "src\\components\\Modal.svelte";

    function create_fragment$5(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			add_location(main, file$3, 4, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			main.innerHTML = /*message*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*message*/ 1) main.innerHTML = /*message*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);
    	let { message } = $$props;
    	const writable_props = ["message"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	$$self.$capture_state = () => ({ message });

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { message: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Modal> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-tooltip\src\SvelteTooltip.svelte generated by Svelte v3.38.2 */

    const file$4 = "node_modules\\svelte-tooltip\\src\\SvelteTooltip.svelte";
    const get_custom_tip_slot_changes = dirty => ({});
    const get_custom_tip_slot_context = ctx => ({});

    // (85:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const custom_tip_slot_template = /*#slots*/ ctx[9]["custom-tip"];
    	const custom_tip_slot = create_slot(custom_tip_slot_template, ctx, /*$$scope*/ ctx[8], get_custom_tip_slot_context);

    	const block = {
    		c: function create() {
    			if (custom_tip_slot) custom_tip_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (custom_tip_slot) {
    				custom_tip_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (custom_tip_slot) {
    				if (custom_tip_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(custom_tip_slot, custom_tip_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_custom_tip_slot_changes, get_custom_tip_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custom_tip_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custom_tip_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (custom_tip_slot) custom_tip_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(85:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:4) {#if tip}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*tip*/ ctx[0]);
    			attr_dev(div, "class", "default-tip svelte-16glvw6");
    			attr_dev(div, "style", /*style*/ ctx[6]);
    			add_location(div, file$4, 83, 6, 1459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tip*/ 1) set_data_dev(t, /*tip*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(83:4) {#if tip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let span;
    	let t;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tip*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(span, "class", "tooltip-slot svelte-16glvw6");
    			add_location(span, file$4, 72, 2, 1281);
    			attr_dev(div0, "class", "tooltip svelte-16glvw6");
    			toggle_class(div0, "active", /*active*/ ctx[5]);
    			toggle_class(div0, "left", /*left*/ ctx[4]);
    			toggle_class(div0, "right", /*right*/ ctx[2]);
    			toggle_class(div0, "bottom", /*bottom*/ ctx[3]);
    			toggle_class(div0, "top", /*top*/ ctx[1]);
    			add_location(div0, file$4, 75, 2, 1334);
    			attr_dev(div1, "class", "tooltip-wrapper svelte-16glvw6");
    			add_location(div1, file$4, 71, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}

    			if (dirty & /*active*/ 32) {
    				toggle_class(div0, "active", /*active*/ ctx[5]);
    			}

    			if (dirty & /*left*/ 16) {
    				toggle_class(div0, "left", /*left*/ ctx[4]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(div0, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*bottom*/ 8) {
    				toggle_class(div0, "bottom", /*bottom*/ ctx[3]);
    			}

    			if (dirty & /*top*/ 2) {
    				toggle_class(div0, "top", /*top*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvelteTooltip", slots, ['default','custom-tip']);
    	let { tip = "" } = $$props;
    	let { top = false } = $$props;
    	let { right = false } = $$props;
    	let { bottom = false } = $$props;
    	let { left = false } = $$props;
    	let { active = false } = $$props;
    	let { color = "#757575" } = $$props;
    	let style = `background-color: ${color};`;
    	const writable_props = ["tip", "top", "right", "bottom", "left", "active", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvelteTooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tip" in $$props) $$invalidate(0, tip = $$props.tip);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("active" in $$props) $$invalidate(5, active = $$props.active);
    		if ("color" in $$props) $$invalidate(7, color = $$props.color);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		tip,
    		top,
    		right,
    		bottom,
    		left,
    		active,
    		color,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("tip" in $$props) $$invalidate(0, tip = $$props.tip);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("active" in $$props) $$invalidate(5, active = $$props.active);
    		if ("color" in $$props) $$invalidate(7, color = $$props.color);
    		if ("style" in $$props) $$invalidate(6, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tip, top, right, bottom, left, active, style, color, $$scope, slots];
    }

    class SvelteTooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			tip: 0,
    			top: 1,
    			right: 2,
    			bottom: 3,
    			left: 4,
    			active: 5,
    			color: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvelteTooltip",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get tip() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tip(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<SvelteTooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<SvelteTooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    const createToast = () => {
      const { subscribe, update } = writable([]);
      let count = 0;
      let defaults = {};
      const push = (msg, opts = {}) => {
        const entry = { id: ++count, msg: msg, ...defaults, ...opts, theme: { ...defaults.theme, ...opts.theme } };
        update(n => entry.reversed ? [...n, entry] : [entry, ...n]);
        return count
      };
      const pop = id => {
        update(n => id ? n.filter(i => i.id !== id) : n.splice(1));
      };
      const set = (id, obj) => {
        update(n => {
          const idx = n.findIndex(i => i.id === id);
          if (idx > -1) {
            n[idx] = { ...n[idx], ...obj };
          }
          return n
        });
      };
      const _opts = (obj = {}) => {
        defaults = { ...defaults, ...obj, theme: { ...defaults.theme, ...obj.theme } };
        return defaults
      };
      return { subscribe, push, pop, set, _opts }
    };

    const toast = createToast();

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* node_modules\@zerodevx\svelte-toast\src\ToastItem.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules\\@zerodevx\\svelte-toast\\src\\ToastItem.svelte";

    // (80:2) {#if item.dismissable}
    function create_if_block$2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "✕";
    			attr_dev(div, "class", "_toastBtn svelte-vfz6wa");
    			attr_dev(div, "role", "button");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file$5, 80, 2, 1871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(80:2) {#if item.dismissable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*item*/ ctx[0].msg + "";
    	let t0;
    	let t1;
    	let t2;
    	let progress_1;
    	let if_block = /*item*/ ctx[0].dismissable && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			progress_1 = element("progress");
    			attr_dev(div0, "class", "_toastMsg svelte-vfz6wa");
    			add_location(div0, file$5, 77, 2, 1803);
    			attr_dev(progress_1, "class", "_toastBar svelte-vfz6wa");
    			progress_1.value = /*$progress*/ ctx[1];
    			add_location(progress_1, file$5, 83, 2, 1977);
    			attr_dev(div1, "class", "_toastItem svelte-vfz6wa");
    			add_location(div1, file$5, 76, 0, 1776);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, progress_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].msg + "")) set_data_dev(t0, t0_value);

    			if (/*item*/ ctx[0].dismissable) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$progress*/ 2) {
    				prop_dev(progress_1, "value", /*$progress*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $progress;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ToastItem", slots, []);
    	let { item } = $$props;
    	const progress = tweened(item.initial, { duration: item.duration, easing: identity });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(1, $progress = value));
    	let prevProgress = item.initial;
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToastItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toast.pop(item.id);

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		tweened,
    		linear: identity,
    		toast,
    		item,
    		progress,
    		prevProgress,
    		$progress
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("prevProgress" in $$props) $$invalidate(3, prevProgress = $$props.prevProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prevProgress, item*/ 9) {
    			 if (prevProgress !== item.progress) {
    				if (item.progress === 1 || item.progress === 0) {
    					progress.set(item.progress).then(() => toast.pop(item.id));
    				} else {
    					progress.set(item.progress);
    				}

    				$$invalidate(3, prevProgress = item.progress);
    			}
    		}
    	};

    	return [item, $progress, progress, prevProgress, click_handler];
    }

    class ToastItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToastItem",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<ToastItem> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<ToastItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<ToastItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@zerodevx\svelte-toast\src\SvelteToast.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$6 = "node_modules\\@zerodevx\\svelte-toast\\src\\SvelteToast.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (39:2) {#each $toast as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let toastitem;
    	let t;
    	let li_style_value;
    	let li_intro;
    	let li_outro;
    	let rect;
    	let stop_animation = noop;
    	let current;

    	toastitem = new ToastItem({
    			props: { item: /*item*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			create_component(toastitem.$$.fragment);
    			t = space();
    			attr_dev(li, "style", li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme));
    			add_location(li, file$6, 39, 2, 830);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(toastitem, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const toastitem_changes = {};
    			if (dirty & /*$toast*/ 1) toastitem_changes.item = /*item*/ ctx[4];
    			toastitem.$set(toastitem_changes);

    			if (!current || dirty & /*$toast*/ 1 && li_style_value !== (li_style_value = /*getCss*/ ctx[1](/*item*/ ctx[4].theme))) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		r: function measure() {
    			rect = li.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(li);
    			stop_animation();
    			add_transform(li, rect);
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(li, rect, flip, { duration: 200 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toastitem.$$.fragment, local);

    			add_render_callback(() => {
    				if (li_outro) li_outro.end(1);
    				if (!li_intro) li_intro = create_in_transition(li, fly, /*item*/ ctx[4].intro);
    				li_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toastitem.$$.fragment, local);
    			if (li_intro) li_intro.invalidate();
    			li_outro = create_out_transition(li, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(toastitem);
    			if (detaching && li_outro) li_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:2) {#each $toast as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$toast*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-ivwmun");
    			add_location(ul, file$6, 37, 0, 788);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*getCss, $toast*/ 3) {
    				each_value = /*$toast*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $toast;
    	validate_store(toast, "toast");
    	component_subscribe($$self, toast, $$value => $$invalidate(0, $toast = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SvelteToast", slots, []);
    	let { options = {} } = $$props;

    	const defaults = {
    		duration: 4000,
    		dismissable: true,
    		initial: 1,
    		progress: 0,
    		reversed: false,
    		intro: { x: 256 },
    		theme: {}
    	};

    	toast._opts(defaults);
    	const getCss = theme => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, "");
    	const writable_props = ["options"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SvelteToast> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		flip,
    		toast,
    		ToastItem,
    		options,
    		defaults,
    		getCss,
    		$toast
    	});

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options*/ 4) {
    			 toast._opts(options);
    		}
    	};

    	return [$toast, getCss, options];
    }

    class SvelteToast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SvelteToast",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get options() {
    		throw new Error("<SvelteToast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<SvelteToast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ProfileCard.svelte generated by Svelte v3.38.2 */

    const file$7 = "src\\components\\ProfileCard.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t1;
    	let small;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(/*name*/ ctx[0]);
    			small = element("small");
    			t2 = text("#");
    			t3 = text(/*discriminator*/ ctx[1]);
    			if (img.src !== (img_src_value = /*avatar*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar");
    			attr_dev(img, "class", "svelte-ju485w");
    			add_location(img, file$7, 10, 8, 202);
    			attr_dev(div0, "class", "avatar svelte-ju485w");
    			add_location(div0, file$7, 9, 4, 173);
    			attr_dev(small, "class", "text-muted");
    			add_location(small, file$7, 13, 16, 276);
    			attr_dev(h1, "class", "svelte-ju485w");
    			add_location(h1, file$7, 12, 4, 255);
    			attr_dev(div1, "class", "user-profile svelte-ju485w");
    			add_location(div1, file$7, 8, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(h1, small);
    			append_dev(small, t2);
    			append_dev(small, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*avatar*/ 4 && img.src !== (img_src_value = /*avatar*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			if (dirty & /*discriminator*/ 2) set_data_dev(t3, /*discriminator*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProfileCard", slots, []);
    	let defaultAvatar = "/default-avatar.png";
    	let { name } = $$props;
    	let { discriminator } = $$props;
    	let { avatar } = $$props;
    	const writable_props = ["name", "discriminator", "avatar"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProfileCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("discriminator" in $$props) $$invalidate(1, discriminator = $$props.discriminator);
    		if ("avatar" in $$props) $$invalidate(2, avatar = $$props.avatar);
    	};

    	$$self.$capture_state = () => ({
    		defaultAvatar,
    		name,
    		discriminator,
    		avatar
    	});

    	$$self.$inject_state = $$props => {
    		if ("defaultAvatar" in $$props) defaultAvatar = $$props.defaultAvatar;
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("discriminator" in $$props) $$invalidate(1, discriminator = $$props.discriminator);
    		if ("avatar" in $$props) $$invalidate(2, avatar = $$props.avatar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, discriminator, avatar];
    }

    class ProfileCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { name: 0, discriminator: 1, avatar: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProfileCard",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<ProfileCard> was created without expected prop 'name'");
    		}

    		if (/*discriminator*/ ctx[1] === undefined && !("discriminator" in props)) {
    			console.warn("<ProfileCard> was created without expected prop 'discriminator'");
    		}

    		if (/*avatar*/ ctx[2] === undefined && !("avatar" in props)) {
    			console.warn("<ProfileCard> was created without expected prop 'avatar'");
    		}
    	}

    	get name() {
    		throw new Error("<ProfileCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ProfileCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get discriminator() {
    		throw new Error("<ProfileCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set discriminator(value) {
    		throw new Error("<ProfileCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatar() {
    		throw new Error("<ProfileCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatar(value) {
    		throw new Error("<ProfileCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Card.svelte generated by Svelte v3.38.2 */

    const file$8 = "src\\components\\Card.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "card " + /*name*/ ctx[0] + " svelte-gbf052");
    			add_location(div, file$8, 4, 0, 41);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*name*/ 1 && div_class_value !== (div_class_value = "card " + /*name*/ ctx[0] + " svelte-gbf052")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, $$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Card> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\FunFact.svelte generated by Svelte v3.38.2 */

    const file$9 = "src\\components\\FunFact.svelte";
    const get_explanation_slot_changes = dirty => ({});
    const get_explanation_slot_context = ctx => ({});
    const get_content_slot_changes = dirty => ({});
    const get_content_slot_context = ctx => ({});
    const get_svg_slot_changes = dirty => ({});
    const get_svg_slot_context = ctx => ({});

    // (17:25)              
    function fallback_block_2(ctx) {
    	let svg_1;
    	let path;

    	const block = {
    		c: function create() {
    			svg_1 = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", /*strokeLinecap*/ ctx[2]);
    			attr_dev(path, "stroke-linejoin", /*strokeLinejoin*/ ctx[3]);
    			attr_dev(path, "stroke-width", /*strokeWidth*/ ctx[1]);
    			attr_dev(path, "d", /*svg*/ ctx[0]);
    			add_location(path, file$9, 17, 106, 645);
    			attr_dev(svg_1, "fill", "none");
    			attr_dev(svg_1, "stroke", "currentColor");
    			attr_dev(svg_1, "viewBox", "0 0 24 24");
    			attr_dev(svg_1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg_1, "class", "svelte-1gisn4m");
    			add_location(svg_1, file$9, 17, 12, 551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg_1, anchor);
    			append_dev(svg_1, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*strokeLinecap*/ 4) {
    				attr_dev(path, "stroke-linecap", /*strokeLinecap*/ ctx[2]);
    			}

    			if (dirty & /*strokeLinejoin*/ 8) {
    				attr_dev(path, "stroke-linejoin", /*strokeLinejoin*/ ctx[3]);
    			}

    			if (dirty & /*strokeWidth*/ 2) {
    				attr_dev(path, "stroke-width", /*strokeWidth*/ ctx[1]);
    			}

    			if (dirty & /*svg*/ 1) {
    				attr_dev(path, "d", /*svg*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(17:25)              ",
    		ctx
    	});

    	return block;
    }

    // (20:29)              
    function fallback_block_1(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			set_style(h3, "margin-left", "10px");
    			add_location(h3, file$9, 20, 12, 826);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			h3.innerHTML = /*htmlContent*/ ctx[7];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(20:29)              ",
    		ctx
    	});

    	return block;
    }

    // (27:36) 
    function create_if_block_1$1(ctx) {
    	let small;

    	const block = {
    		c: function create() {
    			small = element("small");
    			small.textContent = "This data is not available as you changed your Discord privacy settings";
    			add_location(small, file$9, 27, 12, 1068);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(27:36) ",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#if explanation && count}
    function create_if_block$3(ctx) {
    	let small;
    	let t;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t = text(/*explanation*/ ctx[6]);
    			add_location(small, file$9, 25, 12, 988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*explanation*/ 64) set_data_dev(t, /*explanation*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(25:8) {#if explanation && count}",
    		ctx
    	});

    	return block;
    }

    // (24:29)          
    function fallback_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*explanation*/ ctx[6] && /*count*/ ctx[4]) return create_if_block$3;
    		if (!/*count*/ ctx[4] && /*content*/ ctx[5]) return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(24:29)          ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let current;
    	const svg_slot_template = /*#slots*/ ctx[9].svg;
    	const svg_slot = create_slot(svg_slot_template, ctx, /*$$scope*/ ctx[8], get_svg_slot_context);
    	const svg_slot_or_fallback = svg_slot || fallback_block_2(ctx);
    	const content_slot_template = /*#slots*/ ctx[9].content;
    	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[8], get_content_slot_context);
    	const content_slot_or_fallback = content_slot || fallback_block_1(ctx);
    	const explanation_slot_template = /*#slots*/ ctx[9].explanation;
    	const explanation_slot = create_slot(explanation_slot_template, ctx, /*$$scope*/ ctx[8], get_explanation_slot_context);
    	const explanation_slot_or_fallback = explanation_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (svg_slot_or_fallback) svg_slot_or_fallback.c();
    			t0 = space();
    			if (content_slot_or_fallback) content_slot_or_fallback.c();
    			t1 = space();
    			if (explanation_slot_or_fallback) explanation_slot_or_fallback.c();
    			attr_dev(div0, "class", "fun-fact svelte-1gisn4m");
    			add_location(div0, file$9, 15, 4, 490);
    			add_location(div1, file$9, 14, 0, 480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (svg_slot_or_fallback) {
    				svg_slot_or_fallback.m(div0, null);
    			}

    			append_dev(div0, t0);

    			if (content_slot_or_fallback) {
    				content_slot_or_fallback.m(div0, null);
    			}

    			append_dev(div1, t1);

    			if (explanation_slot_or_fallback) {
    				explanation_slot_or_fallback.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (svg_slot) {
    				if (svg_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(svg_slot, svg_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_svg_slot_changes, get_svg_slot_context);
    				}
    			} else {
    				if (svg_slot_or_fallback && svg_slot_or_fallback.p && dirty & /*strokeLinecap, strokeLinejoin, strokeWidth, svg*/ 15) {
    					svg_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (content_slot) {
    				if (content_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(content_slot, content_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_content_slot_changes, get_content_slot_context);
    				}
    			}

    			if (explanation_slot) {
    				if (explanation_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(explanation_slot, explanation_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_explanation_slot_changes, get_explanation_slot_context);
    				}
    			} else {
    				if (explanation_slot_or_fallback && explanation_slot_or_fallback.p && dirty & /*explanation, count, content*/ 112) {
    					explanation_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(svg_slot_or_fallback, local);
    			transition_in(content_slot_or_fallback, local);
    			transition_in(explanation_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(svg_slot_or_fallback, local);
    			transition_out(content_slot_or_fallback, local);
    			transition_out(explanation_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (svg_slot_or_fallback) svg_slot_or_fallback.d(detaching);
    			if (content_slot_or_fallback) content_slot_or_fallback.d(detaching);
    			if (explanation_slot_or_fallback) explanation_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FunFact", slots, ['svg','content','explanation']);
    	let { svg } = $$props;
    	let { strokeWidth = 2 } = $$props;
    	let { strokeLinecap = "round" } = $$props;
    	let { strokeLinejoin = "round" } = $$props;
    	let { count = null } = $$props;
    	let { content = null } = $$props;
    	let { explanation = null } = $$props;

    	const htmlContent = content
    	? content.includes("%")
    		? content.split("%")[0] + "<span class=\"text-discord\">" + (count ? count.toLocaleString("en-US") : "N/A") + "</span>" + content.split("%")[1]
    		: content
    	: null;

    	const writable_props = [
    		"svg",
    		"strokeWidth",
    		"strokeLinecap",
    		"strokeLinejoin",
    		"count",
    		"content",
    		"explanation"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FunFact> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("svg" in $$props) $$invalidate(0, svg = $$props.svg);
    		if ("strokeWidth" in $$props) $$invalidate(1, strokeWidth = $$props.strokeWidth);
    		if ("strokeLinecap" in $$props) $$invalidate(2, strokeLinecap = $$props.strokeLinecap);
    		if ("strokeLinejoin" in $$props) $$invalidate(3, strokeLinejoin = $$props.strokeLinejoin);
    		if ("count" in $$props) $$invalidate(4, count = $$props.count);
    		if ("content" in $$props) $$invalidate(5, content = $$props.content);
    		if ("explanation" in $$props) $$invalidate(6, explanation = $$props.explanation);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		svg,
    		strokeWidth,
    		strokeLinecap,
    		strokeLinejoin,
    		count,
    		content,
    		explanation,
    		htmlContent
    	});

    	$$self.$inject_state = $$props => {
    		if ("svg" in $$props) $$invalidate(0, svg = $$props.svg);
    		if ("strokeWidth" in $$props) $$invalidate(1, strokeWidth = $$props.strokeWidth);
    		if ("strokeLinecap" in $$props) $$invalidate(2, strokeLinecap = $$props.strokeLinecap);
    		if ("strokeLinejoin" in $$props) $$invalidate(3, strokeLinejoin = $$props.strokeLinejoin);
    		if ("count" in $$props) $$invalidate(4, count = $$props.count);
    		if ("content" in $$props) $$invalidate(5, content = $$props.content);
    		if ("explanation" in $$props) $$invalidate(6, explanation = $$props.explanation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		svg,
    		strokeWidth,
    		strokeLinecap,
    		strokeLinejoin,
    		count,
    		content,
    		explanation,
    		htmlContent,
    		$$scope,
    		slots
    	];
    }

    class FunFact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			svg: 0,
    			strokeWidth: 1,
    			strokeLinecap: 2,
    			strokeLinejoin: 3,
    			count: 4,
    			content: 5,
    			explanation: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FunFact",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*svg*/ ctx[0] === undefined && !("svg" in props)) {
    			console.warn("<FunFact> was created without expected prop 'svg'");
    		}
    	}

    	get svg() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeWidth() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeWidth(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeLinecap() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeLinecap(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeLinejoin() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeLinejoin(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get explanation() {
    		throw new Error("<FunFact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set explanation(value) {
    		throw new Error("<FunFact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Leaderboard.svelte generated by Svelte v3.38.2 */

    const file$a = "src\\components\\Leaderboard.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let h1;
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*description*/ ctx[1]);
    			t3 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			add_location(h1, file$a, 6, 4, 80);
    			add_location(p, file$a, 7, 4, 101);
    			add_location(div0, file$a, 8, 4, 126);
    			add_location(div1, file$a, 5, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			append_dev(p, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (!current || dirty & /*description*/ 2) set_data_dev(t2, /*description*/ ctx[1]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Leaderboard", slots, ['default']);
    	let { title } = $$props;
    	let { description } = $$props;
    	const writable_props = ["title", "description"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Leaderboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ title, description });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, description, $$scope, slots];
    }

    class Leaderboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { title: 0, description: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Leaderboard",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Leaderboard> was created without expected prop 'title'");
    		}

    		if (/*description*/ ctx[1] === undefined && !("description" in props)) {
    			console.warn("<Leaderboard> was created without expected prop 'description'");
    		}
    	}

    	get title() {
    		throw new Error("<Leaderboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Leaderboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Leaderboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Leaderboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\LeaderboardItem.svelte generated by Svelte v3.38.2 */

    const file$b = "src\\components\\LeaderboardItem.svelte";

    // (16:8) {:else}
    function create_else_block$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "top-avatar svelte-13op9zv");
    			if (img.src !== (img_src_value = /*avatarURL*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar");
    			add_location(img, file$b, 16, 12, 1658);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*avatarURL*/ 16 && img.src !== (img_src_value = /*avatarURL*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if channel}
    function create_if_block$4(ctx) {
    	let svg;
    	let path;
    	let path_stroke_width_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "square");
    			attr_dev(path, "stroke-linejoin", "square");
    			attr_dev(path, "stroke-width", path_stroke_width_value = 1);
    			attr_dev(path, "d", "M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z");
    			add_location(path, file$b, 14, 125, 561);
    			attr_dev(svg, "class", "top-avatar svelte-13op9zv");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$b, 14, 12, 448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:8) {#if channel}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t0_value = /*position*/ ctx[3] + 1 + "";
    	let t0;
    	let div0_class_value;
    	let t1;
    	let t2;
    	let h30;
    	let t3;
    	let t4;
    	let small0;

    	let t5_value = (/*channel*/ ctx[6]
    	? /*guild*/ ctx[2]
    	: `#${/*discriminator*/ ctx[1]}`) + "";

    	let t5;
    	let t6;
    	let div2;
    	let h31;
    	let t7;
    	let t8;
    	let small1;

    	function select_block_type(ctx, dirty) {
    		if (/*channel*/ ctx[6]) return create_if_block$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			h30 = element("h3");
    			t3 = text(/*name*/ ctx[0]);
    			t4 = space();
    			small0 = element("small");
    			t5 = text(t5_value);
    			t6 = space();
    			div2 = element("div");
    			h31 = element("h3");
    			t7 = text(/*count*/ ctx[5]);
    			t8 = space();
    			small1 = element("small");
    			small1.textContent = "messages";

    			attr_dev(div0, "class", div0_class_value = "top-bubble " + (/*position*/ ctx[3] === 0
    			? "first"
    			: /*position*/ ctx[3] === 1
    				? "second"
    				: /*position*/ ctx[3] === 2 ? "third" : "") + " svelte-13op9zv");

    			add_location(div0, file$b, 12, 8, 278);
    			attr_dev(small0, "class", "text-muted channel svelte-13op9zv");
    			add_location(small0, file$b, 18, 36, 1766);
    			attr_dev(h30, "class", "top-name svelte-13op9zv");
    			add_location(h30, file$b, 18, 8, 1738);
    			attr_dev(div1, "class", "top-whois svelte-13op9zv");
    			add_location(div1, file$b, 11, 4, 246);
    			add_location(small1, file$b, 21, 20, 1915);
    			add_location(h31, file$b, 21, 8, 1903);
    			attr_dev(div2, "class", "top-messages svelte-13op9zv");
    			add_location(div2, file$b, 20, 4, 1868);
    			attr_dev(div3, "class", "top-item svelte-13op9zv");
    			add_location(div3, file$b, 10, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			if_block.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, h30);
    			append_dev(h30, t3);
    			append_dev(h30, t4);
    			append_dev(h30, small0);
    			append_dev(small0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, h31);
    			append_dev(h31, t7);
    			append_dev(h31, t8);
    			append_dev(h31, small1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*position*/ 8 && t0_value !== (t0_value = /*position*/ ctx[3] + 1 + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*position*/ 8 && div0_class_value !== (div0_class_value = "top-bubble " + (/*position*/ ctx[3] === 0
    			? "first"
    			: /*position*/ ctx[3] === 1
    				? "second"
    				: /*position*/ ctx[3] === 2 ? "third" : "") + " svelte-13op9zv")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t3, /*name*/ ctx[0]);

    			if (dirty & /*channel, guild, discriminator*/ 70 && t5_value !== (t5_value = (/*channel*/ ctx[6]
    			? /*guild*/ ctx[2]
    			: `#${/*discriminator*/ ctx[1]}`) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*count*/ 32) set_data_dev(t7, /*count*/ ctx[5]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LeaderboardItem", slots, []);
    	let { name } = $$props;
    	let { discriminator = null } = $$props;
    	let { guild = null } = $$props;
    	let { position } = $$props;
    	let { avatarURL = null } = $$props;
    	let { count } = $$props;
    	let { channel = false } = $$props;
    	const writable_props = ["name", "discriminator", "guild", "position", "avatarURL", "count", "channel"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LeaderboardItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("discriminator" in $$props) $$invalidate(1, discriminator = $$props.discriminator);
    		if ("guild" in $$props) $$invalidate(2, guild = $$props.guild);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("avatarURL" in $$props) $$invalidate(4, avatarURL = $$props.avatarURL);
    		if ("count" in $$props) $$invalidate(5, count = $$props.count);
    		if ("channel" in $$props) $$invalidate(6, channel = $$props.channel);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		discriminator,
    		guild,
    		position,
    		avatarURL,
    		count,
    		channel
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("discriminator" in $$props) $$invalidate(1, discriminator = $$props.discriminator);
    		if ("guild" in $$props) $$invalidate(2, guild = $$props.guild);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("avatarURL" in $$props) $$invalidate(4, avatarURL = $$props.avatarURL);
    		if ("count" in $$props) $$invalidate(5, count = $$props.count);
    		if ("channel" in $$props) $$invalidate(6, channel = $$props.channel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, discriminator, guild, position, avatarURL, count, channel];
    }

    class LeaderboardItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			name: 0,
    			discriminator: 1,
    			guild: 2,
    			position: 3,
    			avatarURL: 4,
    			count: 5,
    			channel: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LeaderboardItem",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<LeaderboardItem> was created without expected prop 'name'");
    		}

    		if (/*position*/ ctx[3] === undefined && !("position" in props)) {
    			console.warn("<LeaderboardItem> was created without expected prop 'position'");
    		}

    		if (/*count*/ ctx[5] === undefined && !("count" in props)) {
    			console.warn("<LeaderboardItem> was created without expected prop 'count'");
    		}
    	}

    	get name() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get discriminator() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set discriminator(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get guild() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set guild(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatarURL() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatarURL(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get channel() {
    		throw new Error("<LeaderboardItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set channel(value) {
    		throw new Error("<LeaderboardItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\views\Stats.svelte generated by Svelte v3.38.2 */
    const file$c = "src\\views\\Stats.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (53:8) {#if $data}
    function create_if_block$5(ctx) {
    	let div;
    	let card0;
    	let t0;
    	let card1;
    	let t1;
    	let card2;
    	let t2;
    	let card3;
    	let t3;
    	let card4;
    	let t4;
    	let card5;
    	let t5;
    	let card6;
    	let t6;
    	let card7;
    	let current;

    	card0 = new Card({
    			props: {
    				name: "profile",
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card1 = new Card({
    			props: {
    				name: "first",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card2 = new Card({
    			props: {
    				name: "second",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card3 = new Card({
    			props: {
    				name: "hours",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card4 = new Card({
    			props: {
    				name: "third",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card5 = new Card({
    			props: {
    				name: "top-users",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card6 = new Card({
    			props: {
    				name: "top-channels",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card7 = new Card({
    			props: {
    				name: "about",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(card0.$$.fragment);
    			t0 = space();
    			create_component(card1.$$.fragment);
    			t1 = space();
    			create_component(card2.$$.fragment);
    			t2 = space();
    			create_component(card3.$$.fragment);
    			t3 = space();
    			create_component(card4.$$.fragment);
    			t4 = space();
    			create_component(card5.$$.fragment);
    			t5 = space();
    			create_component(card6.$$.fragment);
    			t6 = space();
    			create_component(card7.$$.fragment);
    			attr_dev(div, "class", "cards svelte-lrlcg0");
    			add_location(div, file$c, 53, 12, 2013);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card0, div, null);
    			append_dev(div, t0);
    			mount_component(card1, div, null);
    			append_dev(div, t1);
    			mount_component(card2, div, null);
    			append_dev(div, t2);
    			mount_component(card3, div, null);
    			append_dev(div, t3);
    			mount_component(card4, div, null);
    			append_dev(div, t4);
    			mount_component(card5, div, null);
    			append_dev(div, t5);
    			mount_component(card6, div, null);
    			append_dev(div, t6);
    			mount_component(card7, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card0_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card0_changes.$$scope = { dirty, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);
    			const card2_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card2_changes.$$scope = { dirty, ctx };
    			}

    			card2.$set(card2_changes);
    			const card3_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card3_changes.$$scope = { dirty, ctx };
    			}

    			card3.$set(card3_changes);
    			const card4_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card4_changes.$$scope = { dirty, ctx };
    			}

    			card4.$set(card4_changes);
    			const card5_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card5_changes.$$scope = { dirty, ctx };
    			}

    			card5.$set(card5_changes);
    			const card6_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				card6_changes.$$scope = { dirty, ctx };
    			}

    			card6.$set(card6_changes);
    			const card7_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				card7_changes.$$scope = { dirty, ctx };
    			}

    			card7.$set(card7_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(card3.$$.fragment, local);
    			transition_in(card4.$$.fragment, local);
    			transition_in(card5.$$.fragment, local);
    			transition_in(card6.$$.fragment, local);
    			transition_in(card7.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(card3.$$.fragment, local);
    			transition_out(card4.$$.fragment, local);
    			transition_out(card5.$$.fragment, local);
    			transition_out(card6.$$.fragment, local);
    			transition_out(card7.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card0);
    			destroy_component(card1);
    			destroy_component(card2);
    			destroy_component(card3);
    			destroy_component(card4);
    			destroy_component(card5);
    			destroy_component(card6);
    			destroy_component(card7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(53:8) {#if $data}",
    		ctx
    	});

    	return block;
    }

    // (55:16) <Card name="profile">
    function create_default_slot_16(ctx) {
    	let profilecard;
    	let current;

    	profilecard = new ProfileCard({
    			props: {
    				name: /*$data*/ ctx[0].user.username,
    				discriminator: /*$data*/ ctx[0].user.discriminator.toString().padStart(4, "0"),
    				avatar: generateAvatarURL(/*$data*/ ctx[0].user.avatar_hash, /*$data*/ ctx[0].user.id, /*$data*/ ctx[0].user.discriminator)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(profilecard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(profilecard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const profilecard_changes = {};
    			if (dirty & /*$data*/ 1) profilecard_changes.name = /*$data*/ ctx[0].user.username;
    			if (dirty & /*$data*/ 1) profilecard_changes.discriminator = /*$data*/ ctx[0].user.discriminator.toString().padStart(4, "0");
    			if (dirty & /*$data*/ 1) profilecard_changes.avatar = generateAvatarURL(/*$data*/ ctx[0].user.avatar_hash, /*$data*/ ctx[0].user.id, /*$data*/ ctx[0].user.discriminator);
    			profilecard.$set(profilecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profilecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profilecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(profilecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(55:16) <Card name=\\\"profile\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:16) <Card name="first">
    function create_default_slot_15(ctx) {
    	let funfact0;
    	let t0;
    	let funfact1;
    	let t1;
    	let funfact2;
    	let current;

    	funfact0 = new FunFact({
    			props: {
    				svg: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    				content: "You talked to % distinct users",
    				count: /*$data*/ ctx[0].dmChannelCount,
    				explanation: "Well, you know a lot of people!"
    			},
    			$$inline: true
    		});

    	funfact1 = new FunFact({
    			props: {
    				svg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    				content: "You sent % messages on Discord",
    				count: /*$data*/ ctx[0].sentMessageCount,
    				explanation: "That's about " + (/*$data*/ ctx[0].averageMessageCountPerDay && /*$data*/ ctx[0].averageMessageCountPerDay.toLocaleString("en-US")) + " messages per day!"
    			},
    			$$inline: true
    		});

    	funfact2 = new FunFact({
    			props: {
    				svg: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    				content: "You opened Discord % times",
    				count: /*$data*/ ctx[0].openCount,
    				explanation: "You are opening Discord ~" + (/*$data*/ ctx[0].averageOpenCountPerDay && /*$data*/ ctx[0].averageOpenCountPerDay.toLocaleString("en-US")) + " times per day!"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(funfact0.$$.fragment);
    			t0 = space();
    			create_component(funfact1.$$.fragment);
    			t1 = space();
    			create_component(funfact2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(funfact0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(funfact1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(funfact2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const funfact0_changes = {};
    			if (dirty & /*$data*/ 1) funfact0_changes.count = /*$data*/ ctx[0].dmChannelCount;
    			funfact0.$set(funfact0_changes);
    			const funfact1_changes = {};
    			if (dirty & /*$data*/ 1) funfact1_changes.count = /*$data*/ ctx[0].sentMessageCount;
    			if (dirty & /*$data*/ 1) funfact1_changes.explanation = "That's about " + (/*$data*/ ctx[0].averageMessageCountPerDay && /*$data*/ ctx[0].averageMessageCountPerDay.toLocaleString("en-US")) + " messages per day!";
    			funfact1.$set(funfact1_changes);
    			const funfact2_changes = {};
    			if (dirty & /*$data*/ 1) funfact2_changes.count = /*$data*/ ctx[0].openCount;
    			if (dirty & /*$data*/ 1) funfact2_changes.explanation = "You are opening Discord ~" + (/*$data*/ ctx[0].averageOpenCountPerDay && /*$data*/ ctx[0].averageOpenCountPerDay.toLocaleString("en-US")) + " times per day!";
    			funfact2.$set(funfact2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(funfact0.$$.fragment, local);
    			transition_in(funfact1.$$.fragment, local);
    			transition_in(funfact2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(funfact0.$$.fragment, local);
    			transition_out(funfact1.$$.fragment, local);
    			transition_out(funfact2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(funfact0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(funfact1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(funfact2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(62:16) <Card name=\\\"first\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:24) 
    function create_content_slot_1(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let span;
    	let t1;
    	let t2_value = parseInt(/*$data*/ ctx[0].payments.total).toLocaleString("en-US") + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text("You spent\n                            ");
    			span = element("span");
    			t1 = text("$");
    			t2 = text(t2_value);
    			t3 = text("\n                            on Discord");
    			attr_dev(span, "class", "text-discord");
    			add_location(span, file$c, 88, 28, 4269);
    			attr_dev(h3, "class", "svelte-lrlcg0");
    			add_location(h3, file$c, 86, 24, 4198);
    			attr_dev(div, "slot", "content");
    			add_location(div, file$c, 85, 24, 4152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(h3, t3);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*$data*/ ctx[0].payments.list.length
    						? /*showModal*/ ctx[1](`<h3 style="text-align: center">${/*$data*/ ctx[0].payments.list}</h3>`)
    						: undefined)) (/*$data*/ ctx[0].payments.list.length
    						? /*showModal*/ ctx[1](`<h3 style="text-align: center">${/*$data*/ ctx[0].payments.list}</h3>`)
    						: undefined).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$data*/ 1 && t2_value !== (t2_value = parseInt(/*$data*/ ctx[0].payments.total).toLocaleString("en-US") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot_1.name,
    		type: "slot",
    		source: "(86:24) ",
    		ctx
    	});

    	return block;
    }

    // (103:55) <SvelteTooltip tip="Used {$data.favoriteWords[0].count.toLocaleString('en-US')} times" bottom color="#000000">
    function create_default_slot_14(ctx) {
    	let span;
    	let t_value = /*$data*/ ctx[0].favoriteWords[0].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "text-discord");
    			add_location(span, file$c, 102, 165, 5403);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1 && t_value !== (t_value = /*$data*/ ctx[0].favoriteWords[0].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(103:55) <SvelteTooltip tip=\\\"Used {$data.favoriteWords[0].count.toLocaleString('en-US')} times\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (104:55) <SvelteTooltip tip="Used {$data.favoriteWords[1].count.toLocaleString('en-US')} times" bottom color="#000000">
    function create_default_slot_13(ctx) {
    	let span;
    	let t_value = /*$data*/ ctx[0].favoriteWords[1].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "text-discord");
    			add_location(span, file$c, 103, 165, 5650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1 && t_value !== (t_value = /*$data*/ ctx[0].favoriteWords[1].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(104:55) <SvelteTooltip tip=\\\"Used {$data.favoriteWords[1].count.toLocaleString('en-US')} times\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (105:55) <SvelteTooltip tip="Used {$data.favoriteWords[2].count.toLocaleString('en-US')} times" bottom color="#000000">
    function create_default_slot_12(ctx) {
    	let span;
    	let t_value = /*$data*/ ctx[0].favoriteWords[2].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "text-discord");
    			add_location(span, file$c, 104, 165, 5897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1 && t_value !== (t_value = /*$data*/ ctx[0].favoriteWords[2].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(105:55) <SvelteTooltip tip=\\\"Used {$data.favoriteWords[2].count.toLocaleString('en-US')} times\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (106:55) <SvelteTooltip tip="Used {$data.favoriteWords[3].count.toLocaleString('en-US')} times" bottom color="#000000">
    function create_default_slot_11(ctx) {
    	let span;
    	let t_value = /*$data*/ ctx[0].favoriteWords[3].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "text-discord");
    			add_location(span, file$c, 105, 165, 6144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1 && t_value !== (t_value = /*$data*/ ctx[0].favoriteWords[3].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(106:55) <SvelteTooltip tip=\\\"Used {$data.favoriteWords[3].count.toLocaleString('en-US')} times\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (107:55) <SvelteTooltip tip="Used {$data.favoriteWords[4].count.toLocaleString('en-US')} times" bottom color="#000000">
    function create_default_slot_10(ctx) {
    	let t_value = /*$data*/ ctx[0].favoriteWords[4].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1 && t_value !== (t_value = /*$data*/ ctx[0].favoriteWords[4].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(107:55) <SvelteTooltip tip=\\\"Used {$data.favoriteWords[4].count.toLocaleString('en-US')} times\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (102:24) 
    function create_content_slot(ctx) {
    	let h3;
    	let t0;
    	let span0;
    	let sveltetooltip0;
    	let t1;
    	let span1;
    	let sveltetooltip1;
    	let t2;
    	let span2;
    	let sveltetooltip2;
    	let t3;
    	let span3;
    	let sveltetooltip3;
    	let t4;
    	let span4;
    	let sveltetooltip4;
    	let current;

    	sveltetooltip0 = new SvelteTooltip({
    			props: {
    				tip: "Used " + /*$data*/ ctx[0].favoriteWords[0].count.toLocaleString("en-US") + " times",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sveltetooltip1 = new SvelteTooltip({
    			props: {
    				tip: "Used " + /*$data*/ ctx[0].favoriteWords[1].count.toLocaleString("en-US") + " times",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sveltetooltip2 = new SvelteTooltip({
    			props: {
    				tip: "Used " + /*$data*/ ctx[0].favoriteWords[2].count.toLocaleString("en-US") + " times",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sveltetooltip3 = new SvelteTooltip({
    			props: {
    				tip: "Used " + /*$data*/ ctx[0].favoriteWords[3].count.toLocaleString("en-US") + " times",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sveltetooltip4 = new SvelteTooltip({
    			props: {
    				tip: "Used " + /*$data*/ ctx[0].favoriteWords[4].count.toLocaleString("en-US") + " times",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Your top 5 favorite words are\n                            ");
    			span0 = element("span");
    			create_component(sveltetooltip0.$$.fragment);
    			t1 = text(", \n                            ");
    			span1 = element("span");
    			create_component(sveltetooltip1.$$.fragment);
    			t2 = text(", \n                            ");
    			span2 = element("span");
    			create_component(sveltetooltip2.$$.fragment);
    			t3 = text(", \n                            ");
    			span3 = element("span");
    			create_component(sveltetooltip3.$$.fragment);
    			t4 = text(" and\n                            ");
    			span4 = element("span");
    			create_component(sveltetooltip4.$$.fragment);
    			attr_dev(span0, "class", "text-discord");
    			add_location(span0, file$c, 102, 28, 5266);
    			attr_dev(span1, "class", "text-discord");
    			add_location(span1, file$c, 103, 28, 5513);
    			attr_dev(span2, "class", "text-discord");
    			add_location(span2, file$c, 104, 28, 5760);
    			attr_dev(span3, "class", "text-discord");
    			add_location(span3, file$c, 105, 28, 6007);
    			attr_dev(span4, "class", "text-discord");
    			add_location(span4, file$c, 106, 28, 6256);
    			attr_dev(h3, "slot", "content");
    			attr_dev(h3, "class", "svelte-lrlcg0");
    			add_location(h3, file$c, 101, 24, 5189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, span0);
    			mount_component(sveltetooltip0, span0, null);
    			append_dev(h3, t1);
    			append_dev(h3, span1);
    			mount_component(sveltetooltip1, span1, null);
    			append_dev(h3, t2);
    			append_dev(h3, span2);
    			mount_component(sveltetooltip2, span2, null);
    			append_dev(h3, t3);
    			append_dev(h3, span3);
    			mount_component(sveltetooltip3, span3, null);
    			append_dev(h3, t4);
    			append_dev(h3, span4);
    			mount_component(sveltetooltip4, span4, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sveltetooltip0_changes = {};
    			if (dirty & /*$data*/ 1) sveltetooltip0_changes.tip = "Used " + /*$data*/ ctx[0].favoriteWords[0].count.toLocaleString("en-US") + " times";

    			if (dirty & /*$$scope, $data*/ 8193) {
    				sveltetooltip0_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip0.$set(sveltetooltip0_changes);
    			const sveltetooltip1_changes = {};
    			if (dirty & /*$data*/ 1) sveltetooltip1_changes.tip = "Used " + /*$data*/ ctx[0].favoriteWords[1].count.toLocaleString("en-US") + " times";

    			if (dirty & /*$$scope, $data*/ 8193) {
    				sveltetooltip1_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip1.$set(sveltetooltip1_changes);
    			const sveltetooltip2_changes = {};
    			if (dirty & /*$data*/ 1) sveltetooltip2_changes.tip = "Used " + /*$data*/ ctx[0].favoriteWords[2].count.toLocaleString("en-US") + " times";

    			if (dirty & /*$$scope, $data*/ 8193) {
    				sveltetooltip2_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip2.$set(sveltetooltip2_changes);
    			const sveltetooltip3_changes = {};
    			if (dirty & /*$data*/ 1) sveltetooltip3_changes.tip = "Used " + /*$data*/ ctx[0].favoriteWords[3].count.toLocaleString("en-US") + " times";

    			if (dirty & /*$$scope, $data*/ 8193) {
    				sveltetooltip3_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip3.$set(sveltetooltip3_changes);
    			const sveltetooltip4_changes = {};
    			if (dirty & /*$data*/ 1) sveltetooltip4_changes.tip = "Used " + /*$data*/ ctx[0].favoriteWords[4].count.toLocaleString("en-US") + " times";

    			if (dirty & /*$$scope, $data*/ 8193) {
    				sveltetooltip4_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip4.$set(sveltetooltip4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sveltetooltip0.$$.fragment, local);
    			transition_in(sveltetooltip1.$$.fragment, local);
    			transition_in(sveltetooltip2.$$.fragment, local);
    			transition_in(sveltetooltip3.$$.fragment, local);
    			transition_in(sveltetooltip4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sveltetooltip0.$$.fragment, local);
    			transition_out(sveltetooltip1.$$.fragment, local);
    			transition_out(sveltetooltip2.$$.fragment, local);
    			transition_out(sveltetooltip3.$$.fragment, local);
    			transition_out(sveltetooltip4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			destroy_component(sveltetooltip0);
    			destroy_component(sveltetooltip1);
    			destroy_component(sveltetooltip2);
    			destroy_component(sveltetooltip3);
    			destroy_component(sveltetooltip4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot.name,
    		type: "slot",
    		source: "(102:24) ",
    		ctx
    	});

    	return block;
    }

    // (82:16) <Card name="second">
    function create_default_slot_9(ctx) {
    	let funfact0;
    	let t0;
    	let funfact1;
    	let t1;
    	let funfact2;
    	let t2;
    	let funfact3;
    	let current;

    	funfact0 = new FunFact({
    			props: {
    				svg: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    				$$slots: { content: [create_content_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	funfact1 = new FunFact({
    			props: {
    				svg: "M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207",
    				content: "You sent % characters through Discord",
    				count: /*$data*/ ctx[0].characterCount
    			},
    			$$inline: true
    		});

    	funfact2 = new FunFact({
    			props: {
    				svg: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    				$$slots: { content: [create_content_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	funfact3 = new FunFact({
    			props: {
    				svg: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    				content: "You clicked on % Discord notifications",
    				count: /*$data*/ ctx[0].notificationCount,
    				explanation: "If I were you I would set my status to DND right now..."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(funfact0.$$.fragment);
    			t0 = space();
    			create_component(funfact1.$$.fragment);
    			t1 = space();
    			create_component(funfact2.$$.fragment);
    			t2 = space();
    			create_component(funfact3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(funfact0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(funfact1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(funfact2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(funfact3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const funfact0_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				funfact0_changes.$$scope = { dirty, ctx };
    			}

    			funfact0.$set(funfact0_changes);
    			const funfact1_changes = {};
    			if (dirty & /*$data*/ 1) funfact1_changes.count = /*$data*/ ctx[0].characterCount;
    			funfact1.$set(funfact1_changes);
    			const funfact2_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				funfact2_changes.$$scope = { dirty, ctx };
    			}

    			funfact2.$set(funfact2_changes);
    			const funfact3_changes = {};
    			if (dirty & /*$data*/ 1) funfact3_changes.count = /*$data*/ ctx[0].notificationCount;
    			funfact3.$set(funfact3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(funfact0.$$.fragment, local);
    			transition_in(funfact1.$$.fragment, local);
    			transition_in(funfact2.$$.fragment, local);
    			transition_in(funfact3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(funfact0.$$.fragment, local);
    			transition_out(funfact1.$$.fragment, local);
    			transition_out(funfact2.$$.fragment, local);
    			transition_out(funfact3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(funfact0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(funfact1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(funfact2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(funfact3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(82:16) <Card name=\\\"second\\\">",
    		ctx
    	});

    	return block;
    }

    // (117:16) <Card name="hours">
    function create_default_slot_8(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t2_value = /*hoursLabels*/ ctx[2][/*$data*/ ctx[0].hoursValues.indexOf(Math.max(.../*$data*/ ctx[0].hoursValues))] + "";
    	let t2;
    	let t3;
    	let t4;
    	let chart;
    	let current;

    	chart = new Base({
    			props: {
    				data: {
    					labels: /*hoursLabels*/ ctx[2],
    					datasets: [
    						{
    							name: "Messages",
    							values: /*$data*/ ctx[0].hoursValues
    						}
    					]
    				},
    				axisOptions: { xAxisMode: "tick" },
    				type: "bar"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Your Discord Hours";
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = text(" is definitely your favorite hour to chat with your friends!");
    			t4 = space();
    			create_component(chart.$$.fragment);
    			add_location(h1, file$c, 117, 20, 7086);
    			add_location(p, file$c, 118, 20, 7134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			mount_component(chart, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$data*/ 1) && t2_value !== (t2_value = /*hoursLabels*/ ctx[2][/*$data*/ ctx[0].hoursValues.indexOf(Math.max(.../*$data*/ ctx[0].hoursValues))] + "")) set_data_dev(t2, t2_value);
    			const chart_changes = {};

    			if (dirty & /*$data*/ 1) chart_changes.data = {
    				labels: /*hoursLabels*/ ctx[2],
    				datasets: [
    					{
    						name: "Messages",
    						values: /*$data*/ ctx[0].hoursValues
    					}
    				]
    			};

    			chart.$set(chart_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t4);
    			destroy_component(chart, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(117:16) <Card name=\\\"hours\\\">",
    		ctx
    	});

    	return block;
    }

    // (132:16) <Card name="third">
    function create_default_slot_7(ctx) {
    	let funfact0;
    	let t0;
    	let funfact1;
    	let t1;
    	let funfact2;
    	let t2;
    	let funfact3;
    	let t3;
    	let funfact4;
    	let t4;
    	let funfact5;
    	let current;

    	funfact0 = new FunFact({
    			props: {
    				svg: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    				content: "You joined % voice channels",
    				count: /*$data*/ ctx[0].joinVoiceChannelCount
    			},
    			$$inline: true
    		});

    	funfact1 = new FunFact({
    			props: {
    				svg: "M21 3l-6 6m0 0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z",
    				content: "You accepted % calls in DMs",
    				count: /*$data*/ ctx[0].joinCallCount
    			},
    			$$inline: true
    		});

    	funfact2 = new FunFact({
    			props: {
    				svg: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    				content: "You added % reactions on messages",
    				count: /*$data*/ ctx[0].addReactionCount
    			},
    			$$inline: true
    		});

    	funfact3 = new FunFact({
    			props: {
    				svg: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    				content: "You edited % of your messages",
    				count: /*$data*/ ctx[0].messageEditedCount
    			},
    			$$inline: true
    		});

    	funfact4 = new FunFact({
    			props: {
    				svg: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
    				content: "You used % Slash Commands",
    				count: /*$data*/ ctx[0].slashCommandUsedCount
    			},
    			$$inline: true
    		});

    	funfact5 = new FunFact({
    			props: {
    				svg: "M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z",
    				strokeWidth: 1,
    				strokeLinecap: "square",
    				strokeLinejoin: "square",
    				content: "You have spoken in % different text channels",
    				count: /*$data*/ ctx[0].channelCount,
    				explanation: "That's ~" + Math.round(/*$data*/ ctx[0].channelCount / /*$data*/ ctx[0].guildCount) + " per guild!"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(funfact0.$$.fragment);
    			t0 = space();
    			create_component(funfact1.$$.fragment);
    			t1 = space();
    			create_component(funfact2.$$.fragment);
    			t2 = space();
    			create_component(funfact3.$$.fragment);
    			t3 = space();
    			create_component(funfact4.$$.fragment);
    			t4 = space();
    			create_component(funfact5.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(funfact0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(funfact1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(funfact2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(funfact3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(funfact4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(funfact5, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const funfact0_changes = {};
    			if (dirty & /*$data*/ 1) funfact0_changes.count = /*$data*/ ctx[0].joinVoiceChannelCount;
    			funfact0.$set(funfact0_changes);
    			const funfact1_changes = {};
    			if (dirty & /*$data*/ 1) funfact1_changes.count = /*$data*/ ctx[0].joinCallCount;
    			funfact1.$set(funfact1_changes);
    			const funfact2_changes = {};
    			if (dirty & /*$data*/ 1) funfact2_changes.count = /*$data*/ ctx[0].addReactionCount;
    			funfact2.$set(funfact2_changes);
    			const funfact3_changes = {};
    			if (dirty & /*$data*/ 1) funfact3_changes.count = /*$data*/ ctx[0].messageEditedCount;
    			funfact3.$set(funfact3_changes);
    			const funfact4_changes = {};
    			if (dirty & /*$data*/ 1) funfact4_changes.count = /*$data*/ ctx[0].slashCommandUsedCount;
    			funfact4.$set(funfact4_changes);
    			const funfact5_changes = {};
    			if (dirty & /*$data*/ 1) funfact5_changes.count = /*$data*/ ctx[0].channelCount;
    			if (dirty & /*$data*/ 1) funfact5_changes.explanation = "That's ~" + Math.round(/*$data*/ ctx[0].channelCount / /*$data*/ ctx[0].guildCount) + " per guild!";
    			funfact5.$set(funfact5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(funfact0.$$.fragment, local);
    			transition_in(funfact1.$$.fragment, local);
    			transition_in(funfact2.$$.fragment, local);
    			transition_in(funfact3.$$.fragment, local);
    			transition_in(funfact4.$$.fragment, local);
    			transition_in(funfact5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(funfact0.$$.fragment, local);
    			transition_out(funfact1.$$.fragment, local);
    			transition_out(funfact2.$$.fragment, local);
    			transition_out(funfact3.$$.fragment, local);
    			transition_out(funfact4.$$.fragment, local);
    			transition_out(funfact5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(funfact0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(funfact1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(funfact2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(funfact3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(funfact4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(funfact5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(132:16) <Card name=\\\"third\\\">",
    		ctx
    	});

    	return block;
    }

    // (170:24) {#each $data.topDMs as channel, i}
    function create_each_block_2(ctx) {
    	let leaderboarditem;
    	let current;

    	leaderboarditem = new LeaderboardItem({
    			props: {
    				position: /*i*/ ctx[11],
    				avatarURL: generateAvatarURL(/*channel*/ ctx[9].userData.avatar, /*channel*/ ctx[9].userData.id, /*channel*/ ctx[9].userData.discriminator),
    				name: /*channel*/ ctx[9].userData.username,
    				discriminator: /*channel*/ ctx[9].userData.discriminator,
    				count: /*channel*/ ctx[9].messageCount.toLocaleString("en-US")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(leaderboarditem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leaderboarditem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leaderboarditem_changes = {};
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.avatarURL = generateAvatarURL(/*channel*/ ctx[9].userData.avatar, /*channel*/ ctx[9].userData.id, /*channel*/ ctx[9].userData.discriminator);
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.name = /*channel*/ ctx[9].userData.username;
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.discriminator = /*channel*/ ctx[9].userData.discriminator;
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.count = /*channel*/ ctx[9].messageCount.toLocaleString("en-US");
    			leaderboarditem.$set(leaderboarditem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leaderboarditem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leaderboarditem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leaderboarditem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(170:24) {#each $data.topDMs as channel, i}",
    		ctx
    	});

    	return block;
    }

    // (169:20) <Leaderboard title="Top Users" description="The users you chat the most with!">
    function create_default_slot_6(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*$data*/ ctx[0].topDMs;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*generateAvatarURL, $data*/ 1) {
    				each_value_2 = /*$data*/ ctx[0].topDMs;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(169:20) <Leaderboard title=\\\"Top Users\\\" description=\\\"The users you chat the most with!\\\">",
    		ctx
    	});

    	return block;
    }

    // (168:16) <Card name="top-users">
    function create_default_slot_5(ctx) {
    	let leaderboard;
    	let current;

    	leaderboard = new Leaderboard({
    			props: {
    				title: "Top Users",
    				description: "The users you chat the most with!",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(leaderboard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leaderboard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leaderboard_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				leaderboard_changes.$$scope = { dirty, ctx };
    			}

    			leaderboard.$set(leaderboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leaderboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leaderboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leaderboard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(168:16) <Card name=\\\"top-users\\\">",
    		ctx
    	});

    	return block;
    }

    // (183:24) {#each $data.topChannels as channel, i}
    function create_each_block_1(ctx) {
    	let leaderboarditem;
    	let current;

    	leaderboarditem = new LeaderboardItem({
    			props: {
    				position: /*i*/ ctx[11],
    				name: /*channel*/ ctx[9].name,
    				guild: /*channel*/ ctx[9].guildName,
    				count: /*channel*/ ctx[9].messageCount,
    				channel: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(leaderboarditem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leaderboarditem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leaderboarditem_changes = {};
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.name = /*channel*/ ctx[9].name;
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.guild = /*channel*/ ctx[9].guildName;
    			if (dirty & /*$data*/ 1) leaderboarditem_changes.count = /*channel*/ ctx[9].messageCount;
    			leaderboarditem.$set(leaderboarditem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leaderboarditem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leaderboarditem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leaderboarditem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(183:24) {#each $data.topChannels as channel, i}",
    		ctx
    	});

    	return block;
    }

    // (182:20) <Leaderboard title="Top Channels" description="The channels you chat the most in!">
    function create_default_slot_4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*$data*/ ctx[0].topChannels;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 1) {
    				each_value_1 = /*$data*/ ctx[0].topChannels;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(182:20) <Leaderboard title=\\\"Top Channels\\\" description=\\\"The channels you chat the most in!\\\">",
    		ctx
    	});

    	return block;
    }

    // (181:16) <Card name="top-channels">
    function create_default_slot_3(ctx) {
    	let leaderboard;
    	let current;

    	leaderboard = new Leaderboard({
    			props: {
    				title: "Top Channels",
    				description: "The channels you chat the most in!",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(leaderboard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leaderboard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leaderboard_changes = {};

    			if (dirty & /*$$scope, $data*/ 8193) {
    				leaderboard_changes.$$scope = { dirty, ctx };
    			}

    			leaderboard.$set(leaderboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leaderboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leaderboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leaderboard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(181:16) <Card name=\\\"top-channels\\\">",
    		ctx
    	});

    	return block;
    }

    // (213:24) {:catch users}
    function create_catch_block(ctx) {
    	let sveltetooltip;
    	let current;

    	sveltetooltip = new SvelteTooltip({
    			props: {
    				tip: "Androz2091",
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sveltetooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sveltetooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sveltetooltip_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				sveltetooltip_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip.$set(sveltetooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sveltetooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sveltetooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sveltetooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(213:24) {:catch users}",
    		ctx
    	});

    	return block;
    }

    // (214:28) <SvelteTooltip tip="Androz2091" bottom color="#000000">
    function create_default_slot_2(ctx) {
    	let a;
    	let div;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			attr_dev(div, "class", "contributors-item svelte-lrlcg0");
    			set_style(div, "background-image", "url('https://avatars.githubusercontent.com/u/42497995?s=460&u=86b6310688c5e05140c6d12902d878cacdcf93db&v=4')");
    			add_location(div, file$c, 215, 36, 14015);
    			attr_dev(a, "href", "https://github.com/Androz2091");
    			add_location(a, file$c, 214, 32, 13938);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(214:28) <SvelteTooltip tip=\\\"Androz2091\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (205:24) {:then users}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*users*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getGitHubContributors*/ 0) {
    				each_value = /*users*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(205:24) {:then users}",
    		ctx
    	});

    	return block;
    }

    // (207:32) <SvelteTooltip tip="{user.username}" bottom color="#000000">
    function create_default_slot_1(ctx) {
    	let a;
    	let div;
    	let a_href_value;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			t = space();
    			attr_dev(div, "class", "contributors-item svelte-lrlcg0");
    			set_style(div, "background-image", "url('" + /*user*/ ctx[6].avatar + "')");
    			add_location(div, file$c, 208, 40, 13571);
    			attr_dev(a, "href", a_href_value = /*user*/ ctx[6].url);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$c, 207, 36, 13493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div);
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(207:32) <SvelteTooltip tip=\\\"{user.username}\\\" bottom color=\\\"#000000\\\">",
    		ctx
    	});

    	return block;
    }

    // (206:28) {#each users as user}
    function create_each_block$1(ctx) {
    	let sveltetooltip;
    	let current;

    	sveltetooltip = new SvelteTooltip({
    			props: {
    				tip: /*user*/ ctx[6].username,
    				bottom: true,
    				color: "#000000",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sveltetooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sveltetooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sveltetooltip_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				sveltetooltip_changes.$$scope = { dirty, ctx };
    			}

    			sveltetooltip.$set(sveltetooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sveltetooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sveltetooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sveltetooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(206:28) {#each users as user}",
    		ctx
    	});

    	return block;
    }

    // (203:56)                              <p>Loading...</p>                         {:then users}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$c, 203, 28, 13258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(203:56)                              <p>Loading...</p>                         {:then users}",
    		ctx
    	});

    	return block;
    }

    // (195:16) <Card name="about">
    function create_default_slot(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let a;
    	let t4;
    	let p1;
    	let t6;
    	let div1;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5,
    		error: 5,
    		blocks: [,,,]
    	};

    	handle_promise(promise = getGitHubContributors(), info);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "About this project";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Discord Data Package Explorer is a free, ad-free and ");
    			a = element("a");
    			a.textContent = "open source";
    			t4 = text(" website made with Svelte.\n                        ");
    			p1 = element("p");
    			p1.textContent = "These are all the developers who contributed to the creation of DDPE!";
    			t6 = space();
    			div1 = element("div");
    			info.block.c();
    			add_location(h2, file$c, 196, 24, 12689);
    			attr_dev(a, "href", "https://github.com/Androz2091/discord-data-package-explorer");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "text-discord");
    			set_style(a, "text-decoration", "none");
    			add_location(a, file$c, 197, 80, 12797);
    			add_location(p0, file$c, 197, 24, 12741);
    			add_location(p1, file$c, 198, 24, 13001);
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$c, 195, 20, 12631);
    			attr_dev(div1, "class", "contributors svelte-lrlcg0");
    			add_location(div1, file$c, 201, 20, 13146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, a);
    			append_dev(p0, t4);
    			append_dev(div0, p1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(195:16) <Card name=\\\"about\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let if_block = /*$data*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "statistics svelte-lrlcg0");
    			add_location(div, file$c, 51, 4, 1940);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$data*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$data*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, blur, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, blur, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(0, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Stats", slots, []);
    	let timeout;

    	onMount(() => {
    		if (window.location.href.includes("/demo")) {
    			const demoData = generateDemoData();
    			data.set(demoData);
    		} else if ($data) {
    			toast.push("Your data has been loaded!", {
    				theme: {
    					"--toastBackground": "#48BB78",
    					"--toastProgressBackground": "#2F855A"
    				}
    			});

    			timeout = setTimeout(
    				() => {
    					showModal("<div style=\"text-align: center\">Like what you see?<br><a href=\"https://androz2091.fr/discord\" target=\"_blank\">Support us by saying hello and sharing your stats in our Discord server!<a></div>");
    				},
    				10000
    			);
    		} else navigate("/");
    	});

    	onDestroy(() => timeout && clearTimeout(timeout));
    	const { open } = getContext("simple-modal");

    	const showModal = message => {
    		open(Modal, { message });
    	};

    	const hoursLabels = new Array(24).fill(0).map((v, i) => i == 0
    	? "12am"
    	: i < 12 ? `${i}am` : i == 12 ? "12pm" : `${i - 12}pm`);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stats> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		blur,
    		data,
    		generateAvatarURL,
    		getGitHubContributors,
    		generateDemoData,
    		Chart: Base,
    		Modal,
    		getContext,
    		onMount,
    		onDestroy,
    		SvelteTooltip,
    		toast,
    		navigate,
    		ProfileCard,
    		Card,
    		FunFact,
    		Leaderboard,
    		LeaderboardItem,
    		timeout,
    		open,
    		showModal,
    		hoursLabels,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeout" in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$data, showModal, hoursLabels];
    }

    class Stats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stats",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    // DEFLATE is a complex format; to read this code, you should probably check the RFC first:
    // https://tools.ietf.org/html/rfc1951
    // You may also wish to take a look at the guide I made about this program:
    // https://gist.github.com/101arrowz/253f31eb5abc3d9275ab943003ffecad
    // Some of the following code is similar to that of UZIP.js:
    // https://github.com/photopea/UZIP.js
    // However, the vast majority of the codebase has diverged from UZIP.js to increase performance and reduce bundle size.
    // Sometimes 0 will appear where -1 would be more appropriate. This is because using a uint
    // is better for memory in most engines (I *think*).
    var ch2 = {};
    var wk = (function (c, id, msg, transfer, cb) {
        var w = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([c], { type: 'text/javascript' }))));
        w.onerror = function (e) { return cb(e.error, null); };
        w.onmessage = function (e) { return cb(null, e.data); };
        w.postMessage(msg, transfer);
        return w;
    });

    // aliases for shorter compressed code (most minifers don't do this)
    var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
    // fixed length extra bits
    var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
    // fixed distance extra bits
    // see fleb note
    var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
    // code length index map
    var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    // get base, reverse index map from extra bits
    var freb = function (eb, start) {
        var b = new u16(31);
        for (var i = 0; i < 31; ++i) {
            b[i] = start += 1 << eb[i - 1];
        }
        // numbers here are at max 18 bits
        var r = new u32(b[30]);
        for (var i = 1; i < 30; ++i) {
            for (var j = b[i]; j < b[i + 1]; ++j) {
                r[j] = ((j - b[i]) << 5) | i;
            }
        }
        return [b, r];
    };
    var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
    // we can ignore the fact that the other numbers are wrong; they never happen anyway
    fl[28] = 258, revfl[258] = 28;
    var _b = freb(fdeb, 0), fd = _b[0];
    // map of value to reverse (assuming 16 bits)
    var rev = new u16(32768);
    for (var i = 0; i < 32768; ++i) {
        // reverse table algorithm from SO
        var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
        x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
        x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
        rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
    }
    // create huffman tree from u8 "map": index -> code length for code index
    // mb (max bits) must be at most 15
    // TODO: optimize/split up?
    var hMap = (function (cd, mb, r) {
        var s = cd.length;
        // index
        var i = 0;
        // u16 "map": index -> # of codes with bit length = index
        var l = new u16(mb);
        // length of cd must be 288 (total # of codes)
        for (; i < s; ++i)
            ++l[cd[i] - 1];
        // u16 "map": index -> minimum code for bit length = index
        var le = new u16(mb);
        for (i = 0; i < mb; ++i) {
            le[i] = (le[i - 1] + l[i - 1]) << 1;
        }
        var co;
        if (r) {
            // u16 "map": index -> number of actual bits, symbol for code
            co = new u16(1 << mb);
            // bits to remove for reverser
            var rvb = 15 - mb;
            for (i = 0; i < s; ++i) {
                // ignore 0 lengths
                if (cd[i]) {
                    // num encoding both symbol and bits read
                    var sv = (i << 4) | cd[i];
                    // free bits
                    var r_1 = mb - cd[i];
                    // start value
                    var v = le[cd[i] - 1]++ << r_1;
                    // m is end value
                    for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                        // every 16 bit value starting with the code yields the same result
                        co[rev[v] >>> rvb] = sv;
                    }
                }
            }
        }
        else {
            co = new u16(s);
            for (i = 0; i < s; ++i) {
                if (cd[i]) {
                    co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
                }
            }
        }
        return co;
    });
    // fixed length tree
    var flt = new u8(288);
    for (var i = 0; i < 144; ++i)
        flt[i] = 8;
    for (var i = 144; i < 256; ++i)
        flt[i] = 9;
    for (var i = 256; i < 280; ++i)
        flt[i] = 7;
    for (var i = 280; i < 288; ++i)
        flt[i] = 8;
    // fixed distance tree
    var fdt = new u8(32);
    for (var i = 0; i < 32; ++i)
        fdt[i] = 5;
    // fixed length map
    var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
    // fixed distance map
    var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
    // find max of array
    var max = function (a) {
        var m = a[0];
        for (var i = 1; i < a.length; ++i) {
            if (a[i] > m)
                m = a[i];
        }
        return m;
    };
    // read d, starting at bit p and mask with m
    var bits = function (d, p, m) {
        var o = (p / 8) | 0;
        return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
    };
    // read d, starting at bit p continuing for at least 16 bits
    var bits16 = function (d, p) {
        var o = (p / 8) | 0;
        return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
    };
    // get end of byte
    var shft = function (p) { return ((p / 8) | 0) + (p & 7 && 1); };
    // typed array slice - allows garbage collector to free original reference,
    // while being more compatible than .slice
    var slc = function (v, s, e) {
        if (s == null || s < 0)
            s = 0;
        if (e == null || e > v.length)
            e = v.length;
        // can't use .constructor in case user-supplied
        var n = new (v instanceof u16 ? u16 : v instanceof u32 ? u32 : u8)(e - s);
        n.set(v.subarray(s, e));
        return n;
    };
    // expands raw DEFLATE data
    var inflt = function (dat, buf, st) {
        // source length
        var sl = dat.length;
        if (!sl || (st && !st.l && sl < 5))
            return buf || new u8(0);
        // have to estimate size
        var noBuf = !buf || st;
        // no state
        var noSt = !st || st.i;
        if (!st)
            st = {};
        // Assumes roughly 33% compression ratio average
        if (!buf)
            buf = new u8(sl * 3);
        // ensure buffer can fit at least l elements
        var cbuf = function (l) {
            var bl = buf.length;
            // need to increase size to fit
            if (l > bl) {
                // Double or set to necessary, whichever is greater
                var nbuf = new u8(Math.max(bl * 2, l));
                nbuf.set(buf);
                buf = nbuf;
            }
        };
        //  last chunk         bitpos           bytes
        var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
        // total bits
        var tbts = sl * 8;
        do {
            if (!lm) {
                // BFINAL - this is only 1 when last chunk is next
                st.f = final = bits(dat, pos, 1);
                // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
                var type = bits(dat, pos + 1, 3);
                pos += 3;
                if (!type) {
                    // go to end of byte boundary
                    var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                    if (t > sl) {
                        if (noSt)
                            throw 'unexpected EOF';
                        break;
                    }
                    // ensure size
                    if (noBuf)
                        cbuf(bt + l);
                    // Copy over uncompressed data
                    buf.set(dat.subarray(s, t), bt);
                    // Get new bitpos, update byte count
                    st.b = bt += l, st.p = pos = t * 8;
                    continue;
                }
                else if (type == 1)
                    lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
                else if (type == 2) {
                    //  literal                            lengths
                    var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                    var tl = hLit + bits(dat, pos + 5, 31) + 1;
                    pos += 14;
                    // length+distance tree
                    var ldt = new u8(tl);
                    // code length tree
                    var clt = new u8(19);
                    for (var i = 0; i < hcLen; ++i) {
                        // use index map to get real code
                        clt[clim[i]] = bits(dat, pos + i * 3, 7);
                    }
                    pos += hcLen * 3;
                    // code lengths bits
                    var clb = max(clt), clbmsk = (1 << clb) - 1;
                    // code lengths map
                    var clm = hMap(clt, clb, 1);
                    for (var i = 0; i < tl;) {
                        var r = clm[bits(dat, pos, clbmsk)];
                        // bits read
                        pos += r & 15;
                        // symbol
                        var s = r >>> 4;
                        // code length to copy
                        if (s < 16) {
                            ldt[i++] = s;
                        }
                        else {
                            //  copy   count
                            var c = 0, n = 0;
                            if (s == 16)
                                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                            else if (s == 17)
                                n = 3 + bits(dat, pos, 7), pos += 3;
                            else if (s == 18)
                                n = 11 + bits(dat, pos, 127), pos += 7;
                            while (n--)
                                ldt[i++] = c;
                        }
                    }
                    //    length tree                 distance tree
                    var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                    // max length bits
                    lbt = max(lt);
                    // max dist bits
                    dbt = max(dt);
                    lm = hMap(lt, lbt, 1);
                    dm = hMap(dt, dbt, 1);
                }
                else
                    throw 'invalid block type';
                if (pos > tbts) {
                    if (noSt)
                        throw 'unexpected EOF';
                    break;
                }
            }
            // Make sure the buffer can hold this + the largest possible addition
            // Maximum chunk size (practically, theoretically infinite) is 2^17;
            if (noBuf)
                cbuf(bt + 131072);
            var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
            var lpos = pos;
            for (;; lpos = pos) {
                // bits read, code
                var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
                pos += c & 15;
                if (pos > tbts) {
                    if (noSt)
                        throw 'unexpected EOF';
                    break;
                }
                if (!c)
                    throw 'invalid length/literal';
                if (sym < 256)
                    buf[bt++] = sym;
                else if (sym == 256) {
                    lpos = pos, lm = null;
                    break;
                }
                else {
                    var add = sym - 254;
                    // no extra bits needed if less
                    if (sym > 264) {
                        // index
                        var i = sym - 257, b = fleb[i];
                        add = bits(dat, pos, (1 << b) - 1) + fl[i];
                        pos += b;
                    }
                    // dist
                    var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                    if (!d)
                        throw 'invalid distance';
                    pos += d & 15;
                    var dt = fd[dsym];
                    if (dsym > 3) {
                        var b = fdeb[dsym];
                        dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                    }
                    if (pos > tbts) {
                        if (noSt)
                            throw 'unexpected EOF';
                        break;
                    }
                    if (noBuf)
                        cbuf(bt + 131072);
                    var end = bt + add;
                    for (; bt < end; bt += 4) {
                        buf[bt] = buf[bt - dt];
                        buf[bt + 1] = buf[bt + 1 - dt];
                        buf[bt + 2] = buf[bt + 2 - dt];
                        buf[bt + 3] = buf[bt + 3 - dt];
                    }
                    bt = end;
                }
            }
            st.l = lm, st.p = lpos, st.b = bt;
            if (lm)
                final = 1, st.m = lbt, st.d = dm, st.n = dbt;
        } while (!final);
        return bt == buf.length ? buf : slc(buf, 0, bt);
    };
    // empty
    var et = /*#__PURE__*/ new u8(0);
    // Walmart object spread
    var mrg = function (a, b) {
        var o = {};
        for (var k in a)
            o[k] = a[k];
        for (var k in b)
            o[k] = b[k];
        return o;
    };
    // worker clone
    // This is possibly the craziest part of the entire codebase, despite how simple it may seem.
    // The only parameter to this function is a closure that returns an array of variables outside of the function scope.
    // We're going to try to figure out the variable names used in the closure as strings because that is crucial for workerization.
    // We will return an object mapping of true variable name to value (basically, the current scope as a JS object).
    // The reason we can't just use the original variable names is minifiers mangling the toplevel scope.
    // This took me three weeks to figure out how to do.
    var wcln = function (fn, fnStr, td) {
        var dt = fn();
        var st = fn.toString();
        var ks = st.slice(st.indexOf('[') + 1, st.lastIndexOf(']')).replace(/ /g, '').split(',');
        for (var i = 0; i < dt.length; ++i) {
            var v = dt[i], k = ks[i];
            if (typeof v == 'function') {
                fnStr += ';' + k + '=';
                var st_1 = v.toString();
                if (v.prototype) {
                    // for global objects
                    if (st_1.indexOf('[native code]') != -1) {
                        var spInd = st_1.indexOf(' ', 8) + 1;
                        fnStr += st_1.slice(spInd, st_1.indexOf('(', spInd));
                    }
                    else {
                        fnStr += st_1;
                        for (var t in v.prototype)
                            fnStr += ';' + k + '.prototype.' + t + '=' + v.prototype[t].toString();
                    }
                }
                else
                    fnStr += st_1;
            }
            else
                td[k] = v;
        }
        return [fnStr, td];
    };
    var ch = [];
    // clone bufs
    var cbfs = function (v) {
        var tl = [];
        for (var k in v) {
            if (v[k] instanceof u8 || v[k] instanceof u16 || v[k] instanceof u32)
                tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
        return tl;
    };
    // use a worker to execute code
    var wrkr = function (fns, init, id, cb) {
        var _a;
        if (!ch[id]) {
            var fnStr = '', td_1 = {}, m = fns.length - 1;
            for (var i = 0; i < m; ++i)
                _a = wcln(fns[i], fnStr, td_1), fnStr = _a[0], td_1 = _a[1];
            ch[id] = wcln(fns[m], fnStr, td_1);
        }
        var td = mrg({}, ch[id][1]);
        return wk(ch[id][0] + ';onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=' + init.toString() + '}', id, td, cbfs(td), cb);
    };
    // base async inflate fn
    var bInflt = function () { return [u8, u16, u32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, hMap, max, bits, bits16, shft, slc, inflt, inflateSync, pbf, gu8]; };
    // post buf
    var pbf = function (msg) { return postMessage(msg, [msg.buffer]); };
    // get u8
    var gu8 = function (o) { return o && o.size && new u8(o.size); };
    // auto stream
    var astrm = function (strm) {
        strm.ondata = function (dat, final) { return postMessage([dat, final], [dat.buffer]); };
        return function (ev) { return strm.push(ev.data[0], ev.data[1]); };
    };
    // async stream attach
    var astrmify = function (fns, strm, opts, init, id) {
        var t;
        var w = wrkr(fns, init, id, function (err, dat) {
            if (err)
                w.terminate(), strm.ondata.call(strm, err);
            else {
                if (dat[1])
                    w.terminate();
                strm.ondata.call(strm, err, dat[0], dat[1]);
            }
        });
        w.postMessage(opts);
        strm.push = function (d, f) {
            if (t)
                throw 'stream finished';
            if (!strm.ondata)
                throw 'no stream handler';
            w.postMessage([d, t = f], [d.buffer]);
        };
        strm.terminate = function () { w.terminate(); };
    };
    // read 2 bytes
    var b2 = function (d, b) { return d[b] | (d[b + 1] << 8); };
    // read 4 bytes
    var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
    var b8 = function (d, b) { return b4(d, b) + (b4(d, b + 4) * 4294967296); };
    /**
     * Streaming DEFLATE decompression
     */
    var Inflate = /*#__PURE__*/ (function () {
        /**
         * Creates an inflation stream
         * @param cb The callback to call whenever data is inflated
         */
        function Inflate(cb) {
            this.s = {};
            this.p = new u8(0);
            this.ondata = cb;
        }
        Inflate.prototype.e = function (c) {
            if (this.d)
                throw 'stream finished';
            if (!this.ondata)
                throw 'no stream handler';
            var l = this.p.length;
            var n = new u8(l + c.length);
            n.set(this.p), n.set(c, l), this.p = n;
        };
        Inflate.prototype.c = function (final) {
            this.d = this.s.i = final || false;
            var bts = this.s.b;
            var dt = inflt(this.p, this.o, this.s);
            this.ondata(slc(dt, bts, this.s.b), this.d);
            this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
            this.p = slc(this.p, (this.s.p / 8) | 0), this.s.p &= 7;
        };
        /**
         * Pushes a chunk to be inflated
         * @param chunk The chunk to push
         * @param final Whether this is the final chunk
         */
        Inflate.prototype.push = function (chunk, final) {
            this.e(chunk), this.c(final);
        };
        return Inflate;
    }());
    /**
     * Asynchronous streaming DEFLATE decompression
     */
    var AsyncInflate = /*#__PURE__*/ (function () {
        /**
         * Creates an asynchronous inflation stream
         * @param cb The callback to call whenever data is deflated
         */
        function AsyncInflate(cb) {
            this.ondata = cb;
            astrmify([
                bInflt,
                function () { return [astrm, Inflate]; }
            ], this, 0, function () {
                var strm = new Inflate();
                onmessage = astrm(strm);
            }, 7);
        }
        return AsyncInflate;
    }());
    /**
     * Expands DEFLATE data with no wrapper
     * @param data The data to decompress
     * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
     * @returns The decompressed version of the data
     */
    function inflateSync(data, out) {
        return inflt(data, out);
    }
    // text decoder
    var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
    // text decoder stream
    var tds = 0;
    try {
        td.decode(et, { stream: true });
        tds = 1;
    }
    catch (e) { }
    // decode UTF8
    var dutf8 = function (d) {
        for (var r = '', i = 0;;) {
            var c = d[i++];
            var eb = (c > 127) + (c > 223) + (c > 239);
            if (i + eb > d.length)
                return [r, slc(d, i - 1)];
            if (!eb)
                r += String.fromCharCode(c);
            else if (eb == 3) {
                c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63)) - 65536,
                    r += String.fromCharCode(55296 | (c >> 10), 56320 | (c & 1023));
            }
            else if (eb & 1)
                r += String.fromCharCode((c & 31) << 6 | (d[i++] & 63));
            else
                r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63));
        }
    };
    /**
     * Streaming UTF-8 decoding
     */
    var DecodeUTF8 = /*#__PURE__*/ (function () {
        /**
         * Creates a UTF-8 decoding stream
         * @param cb The callback to call whenever data is decoded
         */
        function DecodeUTF8(cb) {
            this.ondata = cb;
            if (tds)
                this.t = new TextDecoder();
            else
                this.p = et;
        }
        /**
         * Pushes a chunk to be decoded from UTF-8 binary
         * @param chunk The chunk to push
         * @param final Whether this is the last chunk
         */
        DecodeUTF8.prototype.push = function (chunk, final) {
            if (!this.ondata)
                throw 'no callback';
            final = !!final;
            if (this.t) {
                this.ondata(this.t.decode(chunk, { stream: true }), final);
                if (final) {
                    if (this.t.decode().length)
                        throw 'invalid utf-8 data';
                    this.t = null;
                }
                return;
            }
            if (!this.p)
                throw 'stream finished';
            var dat = new u8(this.p.length + chunk.length);
            dat.set(this.p);
            dat.set(chunk, this.p.length);
            var _a = dutf8(dat), ch = _a[0], np = _a[1];
            if (final) {
                if (np.length)
                    throw 'invalid utf-8 data';
                this.p = null;
            }
            else
                this.p = np;
            this.ondata(ch, final);
        };
        return DecodeUTF8;
    }());
    /**
     * Converts a Uint8Array to a string
     * @param dat The data to decode to string
     * @param latin1 Whether or not to interpret the data as Latin-1. This should
     *               not need to be true unless encoding to binary string.
     * @returns The original UTF-8/Latin-1 string
     */
    function strFromU8(dat, latin1) {
        if (latin1) {
            var r = '';
            for (var i = 0; i < dat.length; i += 16384)
                r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
            return r;
        }
        else if (td)
            return td.decode(dat);
        else {
            var _a = dutf8(dat), out = _a[0], ext = _a[1];
            if (ext.length)
                throw 'invalid utf-8 data';
            return out;
        }
    }
    // read zip64 extra field
    var z64e = function (d, b) {
        for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
            ;
        return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
    };
    /**
     * Streaming pass-through decompression for ZIP archives
     */
    var UnzipPassThrough = /*#__PURE__*/ (function () {
        function UnzipPassThrough() {
        }
        UnzipPassThrough.prototype.push = function (data, final) {
            this.ondata(null, data, final);
        };
        UnzipPassThrough.compression = 0;
        return UnzipPassThrough;
    }());
    /**
     * Asynchronous streaming DEFLATE decompression for ZIP archives
     */
    var AsyncUnzipInflate = /*#__PURE__*/ (function () {
        /**
         * Creates a DEFLATE decompression that can be used in ZIP archives
         */
        function AsyncUnzipInflate(_, sz) {
            var _this_1 = this;
            if (sz < 320000) {
                this.i = new Inflate(function (dat, final) {
                    _this_1.ondata(null, dat, final);
                });
            }
            else {
                this.i = new AsyncInflate(function (err, dat, final) {
                    _this_1.ondata(err, dat, final);
                });
                this.terminate = this.i.terminate;
            }
        }
        AsyncUnzipInflate.prototype.push = function (data, final) {
            if (this.i.terminate)
                data = slc(data, 0);
            this.i.push(data, final);
        };
        AsyncUnzipInflate.compression = 8;
        return AsyncUnzipInflate;
    }());
    /**
     * A ZIP archive decompression stream that emits files as they are discovered
     */
    var Unzip = /*#__PURE__*/ (function () {
        /**
         * Creates a ZIP decompression stream
         * @param cb The callback to call whenever a file in the ZIP archive is found
         */
        function Unzip(cb) {
            this.onfile = cb;
            this.k = [];
            this.o = {
                0: UnzipPassThrough
            };
            this.p = et;
        }
        /**
         * Pushes a chunk to be unzipped
         * @param chunk The chunk to push
         * @param final Whether this is the last chunk
         */
        Unzip.prototype.push = function (chunk, final) {
            var _this_1 = this;
            if (!this.onfile)
                throw 'no callback';
            if (!this.p)
                throw 'stream finished';
            if (this.c > 0) {
                var len = Math.min(this.c, chunk.length);
                var toAdd = chunk.subarray(0, len);
                this.c -= len;
                if (this.d)
                    this.d.push(toAdd, !this.c);
                else
                    this.k[0].push(toAdd);
                chunk = chunk.subarray(len);
                if (chunk.length)
                    return this.push(chunk, final);
            }
            else {
                var f = 0, i = 0, is = void 0, buf = void 0;
                if (!this.p.length)
                    buf = chunk;
                else if (!chunk.length)
                    buf = this.p;
                else {
                    buf = new u8(this.p.length + chunk.length);
                    buf.set(this.p), buf.set(chunk, this.p.length);
                }
                var l = buf.length, oc = this.c, add = oc && this.d;
                var _loop_2 = function () {
                    var _a;
                    var sig = b4(buf, i);
                    if (sig == 0x4034B50) {
                        f = 1, is = i;
                        this_1.d = null;
                        this_1.c = 0;
                        var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
                        if (l > i + 30 + fnl + es) {
                            var chks_2 = [];
                            this_1.k.unshift(chks_2);
                            f = 2;
                            var sc_1 = b4(buf, i + 18), su_1 = b4(buf, i + 22);
                            var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                            if (sc_1 == 4294967295) {
                                _a = dd ? [-2] : z64e(buf, i), sc_1 = _a[0], su_1 = _a[1];
                            }
                            else if (dd)
                                sc_1 = -1;
                            i += es;
                            this_1.c = sc_1;
                            var d_1;
                            var file_1 = {
                                name: fn_1,
                                compression: cmp_1,
                                start: function () {
                                    if (!file_1.ondata)
                                        throw 'no callback';
                                    if (!sc_1)
                                        file_1.ondata(null, et, true);
                                    else {
                                        var ctr = _this_1.o[cmp_1];
                                        if (!ctr)
                                            throw 'unknown compression type ' + cmp_1;
                                        d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                                        d_1.ondata = function (err, dat, final) { file_1.ondata(err, dat, final); };
                                        for (var _i = 0, chks_3 = chks_2; _i < chks_3.length; _i++) {
                                            var dat = chks_3[_i];
                                            d_1.push(dat, false);
                                        }
                                        if (_this_1.k[0] == chks_2 && _this_1.c)
                                            _this_1.d = d_1;
                                        else
                                            d_1.push(et, true);
                                    }
                                },
                                terminate: function () {
                                    if (d_1 && d_1.terminate)
                                        d_1.terminate();
                                }
                            };
                            if (sc_1 >= 0)
                                file_1.size = sc_1, file_1.originalSize = su_1;
                            this_1.onfile(file_1);
                        }
                        return "break";
                    }
                    else if (oc) {
                        if (sig == 0x8074B50) {
                            is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                            return "break";
                        }
                        else if (sig == 0x2014B50) {
                            is = i -= 4, f = 3, this_1.c = 0;
                            return "break";
                        }
                    }
                };
                var this_1 = this;
                for (; i < l - 4; ++i) {
                    var state_1 = _loop_2();
                    if (state_1 === "break")
                        break;
                }
                this.p = et;
                if (oc < 0) {
                    var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 0x8074B50 && 4)) : buf.subarray(0, i);
                    if (add)
                        add.push(dat, !!f);
                    else
                        this.k[+(f == 2)].push(dat);
                }
                if (f & 2)
                    return this.push(buf.subarray(i), final);
                this.p = buf.subarray(i);
            }
            if (final) {
                if (this.c)
                    throw 'invalid zip file';
                this.p = null;
            }
        };
        /**
         * Registers a decoder with the stream, allowing for files compressed with
         * the compression type provided to be expanded correctly
         * @param decoder The decoder constructor
         */
        Unzip.prototype.register = function (decoder) {
            this.o[decoder.compression] = decoder;
        };
        return Unzip;
    }());

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var papaparse_min = createCommonjsModule(function (module, exports) {
    /* @license
    Papa Parse
    v5.3.1
    https://github.com/mholt/PapaParse
    License: MIT
    */
    !function(e,t){module.exports=t();}(commonjsGlobal,function s(){var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var i=(t=t||{}).dynamicTyping||!1;M(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!M(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var r=function(){if(!b.WORKERS_SUPPORTED)return !1;var e=(i=f.URL||f.webkitURL||null,r=s.toString(),b.BLOB_URL||(b.BLOB_URL=i.createObjectURL(new Blob(["(",r,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var i,r;return t.onmessage=_,t.id=h++,a[t.id]=t}();return r.userStep=t.step,r.userChunk=t.chunk,r.userComplete=t.complete,r.userError=t.error,t.step=M(t.step),t.chunk=M(t.chunk),t.complete=M(t.complete),t.error=M(t.error),delete t.worker,void r.postMessage({input:e,config:t,workerId:r.id})}var n=null;"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&M(e.read)&&M(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,m=",",y="\r\n",s='"',a=s+s,i=!1,r=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return -1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines);"string"==typeof t.newline&&(y=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns;}void 0!==t.escapeChar&&(a=t.escapeChar+s);"boolean"==typeof t.escapeFormulae&&(o=t.escapeFormulae);}();var h=new RegExp(j(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,i);if("object"==typeof e[0])return u(r||Object.keys(e[0]),e,i)}else if("object"==typeof e)return "string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e,t,i){var r="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(r+=m),r+=v(e[a],a);0<t.length&&(r+=y);}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c]);}u=""===d.join("").trim();}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(r+=m);var g=n&&s?e[p]:p;r+=v(t[o][g],p);}o<t.length-1&&(!i||0<h&&!f)&&(r+=y);}}return r}function v(e,t){if(null==e)return "";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);!0===o&&"string"==typeof e&&null!==e.match(/^[=+\-@].*$/)&&(e="'"+e);var i=e.toString().replace(h,a),r="boolean"==typeof n&&n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return !0;return !1}(i,b.BAD_DELIMITERS)||-1<i.indexOf(m)||" "===i.charAt(0)||" "===i.charAt(i.length-1);return r?s+i+s:i}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=i,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return !0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)});}),e(),this;function e(){if(0!==h.length){var e,t,i,r,n=h[0];if(M(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(M(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config));}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){M(a)&&a(e,n.file,n.inputElem),u();},b.parse(n.file,n.instanceConfig);}else M(o.complete)&&o.complete();}function u(){h.splice(0,1),e();}};}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t;}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&M(this._config.beforeFirstChunk)){var i=this._config.beforeFirstChunk(e);void 0!==i&&(e=i);}this.isFirstChunk=!1,this._halted=!1;var r=this._partialLine+e;this._partialLine="";var n=this._handle.parse(r,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=r.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(M(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0;}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!M(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0;},this._sendError=function(e){M(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1});};}function l(e){var r;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded();}:function(){this._readChunk();},this.stream=function(e){this._input=e,this._nextChunk();},this._readChunk=function(){if(this._finished)this._chunkLoaded();else {if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),n||(r.onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)r.setRequestHeader(t,e[t]);}if(this._config.chunkSize){var i=this._start+this._config.chunkSize-1;r.setRequestHeader("Range","bytes="+this._start+"-"+i);}try{r.send(this._config.downloadRequestBody);}catch(e){this._chunkError(e.message);}n&&0===r.status&&this._chunkError();}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:r.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return -1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(r),this.parseChunk(r.responseText)));},this._chunkError=function(e){var t=r.statusText||e;this._sendError(new Error(t));};}function c(e){var r,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((r=new FileReader).onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)):r=new FileReaderSync,this._nextChunk();},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk();},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t);}var i=r.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:i}});},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result);},this._chunkError=function(){this._sendError(r.error);};}function p(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=i.substring(0,t),i=i.substring(t)):(e=i,i=""),this._finished=!i,this.parseChunk(e)}};}function g(e){u.call(this,e=e||{});var t=[],i=!0,r=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause();},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume();},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError);},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=!0);},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=!0;},this._streamData=v(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()));}catch(e){this._streamError(e);}},this),this._streamError=v(function(e){this._streamCleanUp(),this._sendError(e);},this),this._streamEnd=v(function(){this._streamCleanUp(),r=!0,this._streamData("");},this),this._streamCleanUp=v(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError);},this);}function i(m){var a,o,h,r=Math.pow(2,53),n=-r,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,u=/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,t=this,i=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(M(m.step)){var p=m.step;m.step=function(e){if(c=e,_())g();else {if(g(),0===c.data.length)return;i+=e.data.length,m.preview&&i>m.preview?o.abort():(c.data=c.data[0],p(c,t));}};}function y(e){return "greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){if(c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),m.skipEmptyLines)for(var e=0;e<c.data.length;e++)y(c.data[e])&&c.data.splice(e--,1);return _()&&function(){if(!c)return;function e(e,t){M(m.transformHeader)&&(e=m.transformHeader(e,t)),l.push(e);}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1);}else c.data.forEach(e);}(),function(){if(!c||!m.header&&!m.dynamicTyping&&!m.transform)return c;function e(e,t){var i,r=m.header?{}:[];for(i=0;i<e.length;i++){var n=i,s=e[i];m.header&&(n=i>=l.length?"__parsed_extra":l[i]),m.transform&&(s=m.transform(s,n)),s=v(n,s),"__parsed_extra"===n?(r[n]=r[n]||[],r[n].push(s)):r[n]=s;}return m.header&&(i>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+i,f+t):i<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+i,f+t)),r}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);m.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return m.header&&0===l.length}function v(e,t){return i=e,m.dynamicTypingFunction&&void 0===m.dynamicTyping[i]&&(m.dynamicTyping[i]=m.dynamicTypingFunction(i)),!0===(m.dynamicTyping[i]||m.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<r)return !0}return !1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var i;}function k(e,t,i,r){var n={type:e,code:t,message:i};void 0!==r&&(n.row=r),c.errors.push(n);}this.parse=function(e,t,i){var r=m.quoteChar||'"';if(m.newline||(m.newline=function(e,t){e=e.substring(0,1048576);var i=new RegExp(j(t)+"([^]*?)"+j(t),"gm"),r=(e=e.replace(i,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<r[0].length;if(1===r.length||s)return "\n";for(var a=0,o=0;o<r.length;o++)"\n"===r[o][0]&&a++;return a>=r.length/2?"\r\n":"\r"}(e,r)),h=!1,m.delimiter)M(m.delimiter)&&(m.delimiter=m.delimiter(e),c.meta.delimiter=m.delimiter);else {var n=function(e,t,i,r,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:r,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(i&&y(p.data[g]))c++;else {var _=p.data[g].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_;}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l);}return {successful:!!(m.delimiter=s),bestDelimiter:s}}(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess);n.successful?m.delimiter=n.bestDelimiter:(h=!0,m.delimiter=b.DefaultDelimiter),c.meta.delimiter=m.delimiter;}var s=w(m);return m.preview&&m.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,i),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=M(m.chunk)?"":a.substring(o.getCharIndex());},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3);},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,M(m.complete)&&m.complete(c),a="";};}function j(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(e){var S,O=(e=e||{}).delimiter,x=e.newline,I=e.comments,T=e.step,D=e.preview,A=e.fastMode,L=S=void 0===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(L=e.escapeChar),("string"!=typeof O||-1<b.BAD_DELIMITERS.indexOf(O))&&(O=","),I===O)throw new Error("Comment character same as delimiter");!0===I?I="#":("string"!=typeof I||-1<b.BAD_DELIMITERS.indexOf(I))&&(I=!1),"\n"!==x&&"\r"!==x&&"\r\n"!==x&&(x="\n");var F=0,z=!1;this.parse=function(r,t,i){if("string"!=typeof r)throw new Error("Input must be a string");var n=r.length,e=O.length,s=x.length,a=I.length,o=M(T),h=[],u=[],f=[],d=F=0;if(!r)return C();if(A||!1!==A&&-1===r.indexOf(S)){for(var l=r.split(x),c=0;c<l.length;c++){if(f=l[c],F+=f.length,c!==l.length-1)F+=x.length;else if(i)return C();if(!I||f.substring(0,a)!==I){if(o){if(h=[],k(f.split(O)),R(),z)return C()}else k(f.split(O));if(D&&D<=c)return h=h.slice(0,D),C(!0)}}return C()}for(var p=r.indexOf(O,F),g=r.indexOf(x,F),_=new RegExp(j(L)+j(S),"g"),m=r.indexOf(S,F);;)if(r[F]!==S)if(I&&0===f.length&&r.substring(F,F+a)===I){if(-1===g)return C();F=g+s,g=r.indexOf(x,F),p=r.indexOf(O,F);}else if(-1!==p&&(p<g||-1===g))f.push(r.substring(F,p)),F=p+e,p=r.indexOf(O,F);else {if(-1===g)break;if(f.push(r.substring(F,g)),w(g+s),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0)}else for(m=F,F++;;){if(-1===(m=r.indexOf(S,m+1)))return i||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:F}),E();if(m===n-1)return E(r.substring(F,m).replace(_,S));if(S!==L||r[m+1]!==L){if(S===L||0===m||r[m-1]!==L){-1!==p&&p<m+1&&(p=r.indexOf(O,m+1)),-1!==g&&g<m+1&&(g=r.indexOf(x,m+1));var y=b(-1===g?p:Math.min(p,g));if(r[m+1+y]===O){f.push(r.substring(F,m).replace(_,S)),r[F=m+1+y+e]!==S&&(m=r.indexOf(S,F)),p=r.indexOf(O,F),g=r.indexOf(x,F);break}var v=b(g);if(r.substring(m+1+v,m+1+v+s)===x){if(f.push(r.substring(F,m).replace(_,S)),w(m+1+v+s),p=r.indexOf(O,F),m=r.indexOf(S,F),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:F}),m++;}}else m++;}return E();function k(e){h.push(e),d=F;}function b(e){var t=0;if(-1!==e){var i=r.substring(m+1,e);i&&""===i.trim()&&(t=i.length);}return t}function E(e){return i||(void 0===e&&(e=r.substring(F)),f.push(e),F=n,k(f),o&&R()),C()}function w(e){F=e,k(f),f=[],g=r.indexOf(x,F);}function C(e){return {data:h,errors:u,meta:{delimiter:O,linebreak:x,aborted:z,truncated:!!e,cursor:d+(t||0)}}}function R(){T(C()),h=[],u=[];}},this.abort=function(){z=!0;},this.getCharIndex=function(){return F};}function _(e){var t=e.data,i=a[t.workerId],r=!1;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=!0,m(t.workerId,{data:[],errors:[],meta:{aborted:!0}});},pause:y,resume:y};if(M(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results;}else M(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results);}t.finished&&!r&&m(t.workerId,t.results);}function m(e,t){var i=a[e];M(i.userComplete)&&i.userComplete(t),i.terminate(),delete a[e];}function y(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var i in e)t[i]=w(e[i]);return t}function v(e,t){return function(){e.apply(t,arguments);}}function M(e){return "function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var i=b.parse(t.input,t.config);i&&f.postMessage({workerId:b.WORKER_ID,results:i,finished:!0});}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(u.prototype)).constructor=g,b});
    });

    var eventsEnabled = [
    	"joinVoiceChannel",
    	"notificationClicked",
    	"appOpened",
    	"joinCall",
    	"addReaction",
    	"messageEdited",
    	"sendMessage",
    	"slashCommandUsed"
    ];
    var eventList = [
    	"permissionsRequested",
    	"channelUpdated",
    	"createGuildViewed",
    	"registerViewed",
    	"joinVoiceChannel",
    	"videoStreamEnded",
    	"spotifyListenAlongStarted",
    	"changeLogVideoInteracted",
    	"mktgApplicationStep",
    	"emailOpened",
    	"premiumGuildSubscriptionCanceled",
    	"screenshareFinished",
    	"videoLayoutToggled",
    	"afViewed",
    	"spotifyListenAlongEnded",
    	"experimentGuildTriggered",
    	"changeLogOpened",
    	"sendMessage",
    	"closeTutorial",
    	"guildViewed",
    	"afExited",
    	"ringCall",
    	"ackMessages",
    	"voiceConnectionSuccess",
    	"friendAddViewed",
    	"webhookCreated",
    	"micTestingStarted",
    	"guildMemberUpdated",
    	"searchOpened",
    	"voiceDisconnect",
    	"searchStarted",
    	"openPopout",
    	"keyboardModeToggled",
    	"promotionViewed",
    	"appUiViewed",
    	"authorizedAppConnected",
    	"guildInsightsGuildGridViewed",
    	"giftCodeCopied",
    	"startSpeaking",
    	"readyPayloadReceived",
    	"changeLogCtaClicked",
    	"sessionStart",
    	"inviteAppOpened",
    	"accountLinkStep",
    	"searchResultViewed",
    	"applicationClosed",
    	"jump",
    	"mainNavigationMenu",
    	"updateUserSettings",
    	"footerNavigation",
    	"subscriptionCanceled",
    	"mailingListContactUpdateFailed",
    	"storeDirectoryViewed",
    	"userFingerprinted",
    	"userAttributionReceived",
    	"paymentFlowCompleted",
    	"activityUpdated",
    	"paymentSourceAdded",
    	"premiumMarketingPageViewed",
    	"oauth2AuthorizeViewed",
    	"streamReportProblem",
    	"guildRoleUpdated",
    	"externalDynamicLinkReceived",
    	"channelOpened",
    	"guildOutageViewed",
    	"friendsListViewed",
    	"guildWelcomeScreenSettingsUpdated",
    	"appLandingViewed",
    	"storeListingUpdated",
    	"storeListingViewed",
    	"loginSuccessful",
    	"changeLogClosed",
    	"subscriptionPaymentSourceAdded",
    	"paymentSucceeded",
    	"disableTotp",
    	"customStatusUpdated",
    	"micTestingStopped",
    	"applicationCommandSelected",
    	"skuUpdated",
    	"dmListViewed",
    	"guildSettingsUpdated",
    	"nuoTransition",
    	"expressionPickerTabClicked",
    	"paymentFailed",
    	"applicationCommandUsed",
    	"userPremiumGuildSubscriptionSlotCreated",
    	"voiceProcessing",
    	"devPortalAuthUrlCopied",
    	"launchGame",
    	"sessionEnd",
    	"appExceptionThrown",
    	"dataRequestInitiated",
    	"inviteOpened",
    	"mktgPageViewed",
    	"copyInstantInvite",
    	"screenshareFailed",
    	"giftCodeRevoked",
    	"inviteAppInvoked",
    	"deleteEmoji",
    	"giftCodeResolved",
    	"storeListingMediaScrolled",
    	"joinCall",
    	"giftCodeSent",
    	"botAbused",
    	"removeChannelRecipient",
    	"presskitDownload",
    	"appModulesUpdated",
    	"channelNoticeClosed",
    	"chatInputComponentViewed",
    	"userAccountUpdated",
    	"guildTemplateLinkUpdated",
    	"searchResultSelected",
    	"experimentUserTriggered",
    	"leaveGuild",
    	"mediaSessionJoined",
    	"guildTemplateSelected",
    	"memberListViewed",
    	"applicationCreated",
    	"streamWarningTriggered",
    	"storeListingExited",
    	"guildTemplateResolved",
    	"guildDiscoveryExited",
    	"appCrashed",
    	"stopRingingCall",
    	"transactionCompleted",
    	"hardwareDetected",
    	"claimAccount",
    	"devPortalRpVizUsed",
    	"authorizeLoginLocation",
    	"subscriptionPeriodScheduled",
    	"localSettingsUpdated",
    	"userSettingsKeybindUpdated",
    	"downloadApp",
    	"loginViewed",
    	"instantInviteShared",
    	"channelNoticeViewed",
    	"mktgHypesquadFormOpened",
    	"skuEntitlementCreated",
    	"premiumUpgradeStarted",
    	"notificationClicked",
    	"createGuild",
    	"messageAttachmentUpdated",
    	"emailSent",
    	"appExternalViewClosed",
    	"channelDeleted",
    	"guildBotAdded",
    	"libraryViewed",
    	"verifyAccount",
    	"appOpened",
    	"connectedAccountInitiated",
    	"devPortalPageViewed",
    	"spotifyButtonClicked",
    	"userAvatarUpdated",
    	"startListening",
    	"paymentFlowFailed",
    	"paymentFlowOpened",
    	"updateRelationship",
    	"deepLinkReceived",
    	"startCall",
    	"privacyControlUpdated",
    	"premiumGuildSubscriptionCreated",
    	"paymentFlowStarted",
    	"quickswitcherOpened",
    	"applicationUpdated",
    	"connectedAccountViewed",
    	"streamerModeToggle",
    	"settingsPaneViewed",
    	"addReaction",
    	"inviteViewed",
    	"updateNote",
    	"permissionsAcked",
    	"gameNewsOpened",
    	"updateStreamerModeSettings",
    	"guildTemplateLinkSent",
    	"oauth2AuthorizeAccepted",
    	"acceptedInstantInvite",
    	"leaveVoiceChannel",
    	"searchResultExpanded",
    	"premiumGuildSubscriptionRemoved",
    	"removeReaction",
    	"paymentFlowStep",
    	"loginAttempted",
    	"enableTotp",
    	"applicationCommandBrowserOpened",
    	"expressionPickerOpened",
    	"appNoticeViewed",
    	"expressionPickerCategorySelected",
    	"afGuildVisited",
    	"resolveInvite",
    	"storeDirectoryHeroViewed",
    	"serverSetupCtaClicked",
    	"subscriptionRemoved",
    	"videoStreamStarted",
    	"storeDirectoryExited",
    	"joinGuildViewed",
    	"replyStarted",
    	"quickswitcherResultSelected",
    	"inviteSent",
    	"dataRequestCompleted",
    	"androidHardwareSurvey",
    	"inviteSuggestionOpened",
    	"webhookDeleted",
    	"userPremiumGuildSubscriptionSlotCanceled",
    	"guildWelcomeScreenOptionSelected",
    	"giftCodeCreated",
    	"afLoaded",
    	"guildJoined",
    	"subscriptionPlanUpdated",
    	"premiumPromotionOpened",
    	"analyticsDataQueried",
    	"premiumMarketingPageExited",
    	"slashCommandUsed",
    	"hoverMenuOpened",
    	"noiseCancellationLinkClicked",
    	"friendRequestFailed",
    	"botTokenCompromised",
    	"addChannelRecipient",
    	"updateConnectedAccount",
    	"quickswitcherClosed",
    	"channelAutocompleteOpen",
    	"channelAutocompleteSelected",
    	"hypesquadSubscriptionUpdated",
    	"messageEditUpArrow",
    	"callReportProblem",
    	"browserHandoffSucceeded",
    	"clickLandingCta",
    	"searchClosed",
    	"mediaDeviceChanged",
    	"deleteGuild",
    	"videoInputToggled",
    	"newLoginLocation",
    	"createChannel",
    	"modalDismissed",
    	"notificationSettingsUpdated",
    	"channelPermissionsOverwriteUpdated",
    	"captchaServed",
    	"createInstantInvite",
    	"channelNoticeCtaClicked",
    	"pinMessage",
    	"viewAsRolesSelected",
    	"inboxChannelAcked",
    	"guildInsightsSettingsCtaClicked",
    	"externalPaymentSucceeded",
    	"skuEntitlementUpdated",
    	"storeDirectoryCardInteracted",
    	"messageEdited",
    	"searchResultSortChanged",
    	"guildSettingsDiscoveryViewed",
    	"userPremiumGuildSubscriptionSlotRemoved",
    	"keyboardShortcutUsed",
    	"applicationDeleted",
    	"paymentException",
    	"guildDiscoveryGuildSelected",
    	"captchaSolved",
    	"register",
    	"guildDiscoveryViewed",
    	"userPhoneUpdated",
    	"openModal",
    	"createEmoji",
    	"inboxChannelClicked"
    ];
    var eventsData = {
    	eventsEnabled: eventsEnabled,
    	eventList: eventList
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    /**
     * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
     */
    /**
     * Lower case as a function.
     */
    function lowerCase(str) {
        return str.toLowerCase();
    }

    // Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
    var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];
    // Remove all non-word characters.
    var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;
    /**
     * Normalize the string into something other libraries can manipulate easier.
     */
    function noCase(input, options) {
        if (options === void 0) { options = {}; }
        var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
        var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
        var start = 0;
        var end = result.length;
        // Trim the delimiter from around the output string.
        while (result.charAt(start) === "\0")
            start++;
        while (result.charAt(end - 1) === "\0")
            end--;
        // Transform each token independently.
        return result.slice(start, end).split("\0").map(transform).join(delimiter);
    }
    /**
     * Replace `re` in the input string with the replacement value.
     */
    function replace(input, re, value) {
        if (re instanceof RegExp)
            return input.replace(re, value);
        return re.reduce(function (input, re) { return input.replace(re, value); }, input);
    }

    function dotCase(input, options) {
        if (options === void 0) { options = {}; }
        return noCase(input, __assign({ delimiter: "." }, options));
    }

    function snakeCase(input, options) {
        if (options === void 0) { options = {}; }
        return dotCase(input, __assign({ delimiter: "_" }, options));
    }

    /**
     * Fetch a user on Discord.
     * This is necessary because sometimes we only have the user ID in the files.
     * @param userID The ID of the user to fetch
     */
    const fetchUser = async (userID) => {
        const res = await axios$1(`https://diswho.androz2091.fr/user/${userID}`).catch(() => {});
        if (!res || !res.data) return {
            username: 'Unknown',
            discriminator: '0000',
            avatar: null
        };
        return res.data;
    };

    /**
     * Parse the mention to return a user ID
     */
    const parseMention = (mention) => {
        const mentionRegex = /^<@!?(\d+)>$/;
        return mentionRegex.test(mention) ? mention.match(mentionRegex)[1] : null;
    };

    /**
     * Parse a messages CSV into an object
     * @param input
     */
    const parseCSV = (input) => {
        return papaparse_min.parse(input, {
            header: true,
            newline: ',\r'
        })
            .data
            .filter((m) => m.Contents)
            .map((m) => ({
                id: m.ID,
                timestamp: m.Timestamp,
                length: m.Contents.length,
                words: m.Contents.split(' ')
                // content: m.Contents,
                // attachments: m.Attachments
            }));
    };

    const perDay = (value, userID) => {
        return parseInt(value / ((Date.now() - getCreatedTimestamp(userID)) / 24 / 60 / 60 / 1000));
    };

    const readAnalyticsFile = (file) => {
        return new Promise((resolve) => {
            if (!file) resolve({});
            const eventsOccurrences = {};
            for (let eventName of eventsData.eventsEnabled) eventsOccurrences[eventName] = 0;
            const decoder = new DecodeUTF8();
            let startAt = Date.now();
            let bytesRead = 0;
            file.ondata = (_err, data, final) => {
                bytesRead += data.length;
                loadTask.set(`Loading user statistics... ${Math.ceil(bytesRead / file.originalSize * 100)}%`);
                const remainingBytes = file.originalSize-bytesRead;
                const timeToReadByte = (Date.now()-startAt) / bytesRead;
                const remainingTime = parseInt(remainingBytes * timeToReadByte / 1000);
                loadEstimatedTime.set(`Estimated time: ${remainingTime+1} second${remainingTime+1 === 1 ? '' : 's'}`);
                decoder.push(data, final);
            };
            let prevChkEnd = '';
            decoder.ondata = (str, final) => {
                str = prevChkEnd + str;
                for (let event of Object.keys(eventsOccurrences)) {
                    const eventName = snakeCase(event);
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        const ind = str.indexOf(eventName);
                        if (ind == -1) break;
                        str = str.slice(ind + eventName.length);
                        eventsOccurrences[event]++;
                    }
                    prevChkEnd = str.slice(-eventName.length);
                }
                if (final) {
                    resolve({
                        openCount: eventsOccurrences.appOpened,
                        notificationCount: eventsOccurrences.notificationClicked,
                        joinVoiceChannelCount: eventsOccurrences.joinVoiceChannel,
                        joinCallCount: eventsOccurrences.joinCall,
                        addReactionCount: eventsOccurrences.addReaction,
                        messageEditedCount: eventsOccurrences.messageEdited,
                        sendMessageCount: eventsOccurrences.sendMessage,
                        slashCommandUsedCount: eventsOccurrences.slashCommandUsed
                    });
                }
            };
            file.start();
        });
    };

    /**
     * Extract the data from the package file.
     * @param files The files in the package
     * @returns The extracted data
     */
    const extractData = async (files) => {

        const extractedData = {
            user: null,

            topDMs: [],
            topChannels: [],
            guildCount: 0,
            dmChannelCount: 0,
            channelCount: 0,
            messageCount: 0,
            characterCount: 0,
            totalSpent: 0,
            hoursValues: [],
            favoriteWords: null,
            payments: {
                total: 0,
                list: ''
            }
        };

        const getFile = (name) => files.find((file) => file.name === name);
        // Read a file from its name
        const readFile = (name) => {
            return new Promise((resolve) => {
                const file = getFile(name);
                if (!file) return resolve(null);
                const fileContent = [];
                const decoder = new DecodeUTF8();
                file.ondata = (err, data, final) => {
                    decoder.push(data, final);
                };
                decoder.ondata = (str, final) => {
                    fileContent.push(str);
                    if (final) resolve(fileContent.join(''));
                };
                file.start();
            });
        };

        // Parse and load current user informations
        console.log('[debug] Loading user info...');
        loadTask.set('Loading user information...');

        extractedData.user = JSON.parse(await readFile('account/user.json'));
        loadTask.set('Fetching user information...');
        const fetchedUser = await fetchUser(extractedData.user.id);
        extractedData.user.username = fetchedUser.username;
        extractedData.user.discriminator = fetchedUser.discriminator;
        extractedData.user.avatar_hash = fetchedUser.avatar;

        const confirmedPayments = extractedData.user.payments.filter((p) => p.status === 1);
        if (confirmedPayments.length) {
            extractedData.payments.total += confirmedPayments.map((p) => p.amount / 100).reduce((p, c) => p + c);
            extractedData.payments.list += confirmedPayments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((p) => `${p.description} ($${p.amount / 100})`).join('<br>');
        }
        console.log('[debug] User info loaded.');

        // Parse and load channels
        console.log('[debug] Loading channels...');
        loadTask.set('Loading user messages...');

        const messagesIndex = JSON.parse(await readFile('messages/index.json'));

        const messagesPathRegex = /messages\/c?([0-9]{16,32})\/$/;
        const channelsIDsFile = files.filter((file) => messagesPathRegex.test(file.name));

        // Packages before 06-12-2021 does not have the leading "c" before the channel ID
        const isOldPackage = channelsIDsFile[0].name.match(/messages\/(c)?([0-9]{16,32})\/$/)[1] === undefined;
        const channelsIDs = channelsIDsFile.map((file) => file.name.match(messagesPathRegex)[1]);

        console.log(`[debug] Old package: ${isOldPackage}`);

        const channels = [];
        let messagesRead = 0;

        await Promise.all(channelsIDs.map((channelID) => {
            return new Promise((resolve) => {

                const channelDataPath = `messages/${isOldPackage ? '' : 'c'}${channelID}/channel.json`;
                const channelMessagesPath = `messages/${isOldPackage ? '' : 'c'}${channelID}/messages.csv`;

                Promise.all([
                    readFile(channelDataPath),
                    readFile(channelMessagesPath)
                ]).then(([ rawData, rawMessages ]) => {

                    if (!rawData || !rawMessages) {
                        console.log(`[debug] Files of channel ${channelID} can't be read. Data is ${!!rawData} and messages are ${!!rawMessages}. (path=${channelDataPath})`);
                        return resolve();
                    } else messagesRead++;

                    const data = JSON.parse(rawData);
                    const messages = parseCSV(rawMessages);
                    const name = messagesIndex[data.id];
                    const isDM = data.recipients && data.recipients.length === 2;
                    const dmUserID = isDM ? data.recipients.find((userID) => userID !== extractedData.user.id) : undefined;
                    channels.push({
                        data,
                        messages,
                        name,
                        isDM,
                        dmUserID
                    });

                    resolve();
                });

            });
        }));

        if (messagesRead === 0) throw new Error('invalid_package_missing_messages');

        loadTask.set('Calculating statistics...');

        extractedData.channelCount = channels.filter(c => !c.isDM).length;
        extractedData.dmChannelCount = channels.length - extractedData.channelCount;
        extractedData.topChannels = channels.filter(c => c.data && c.data.guild).sort((a, b) => b.messages.length - a.messages.length).slice(0, 50).map((channel) => ({
            name: channel.name,
            messageCount: channel.messages.length,
            guildName: channel.data.guild.name
        }));
        extractedData.characterCount = channels.map((channel) => channel.messages).flat().map((message) => message.length).reduce((p, c) => p + c);

        for (let i = 0; i < 24; i++) {
            extractedData.hoursValues.push(channels.map((c) => c.messages).flat().filter((m) => new Date(m.timestamp).getHours() === i).length);
        }

        console.log(`[debug] ${channels.length} channels loaded.`);

        console.log('[debug] Loading guilds...');
        loadTask.set('Loading joined servers...');

        const guildIndex = JSON.parse(await readFile('servers/index.json'));
        extractedData.guildCount = Object.keys(guildIndex).length;

        console.log(`[debug] ${extractedData.guildCount} guilds loaded`);

        const words = channels.map((channel) => channel.messages).flat().map((message) => message.words).flat().filter((w) => w.length > 5);
        extractedData.favoriteWords = getFavoriteWords(words);
        for (let wordData of extractedData.favoriteWords) {
            const userID = parseMention(wordData.word);
            if (userID) {
                const userData = await fetchUser(userID);
                extractedData.favoriteWords[extractedData.favoriteWords.findIndex((wd) => wd.word === wordData.word)] = {
                    word: `@${userData.username}`,
                    count: wordData.count
                };
            }
        }

        console.log('[debug] Fetching top DMs...');
        loadTask.set('Loading user activity...');
        
        extractedData.topDMs = channels
            .filter((channel) => channel.isDM)
            .sort((a, b) => b.messages.length - a.messages.length)
            .slice(0, 50)
            .map((channel) => ({
                id: channel.data.id,
                dmUserID: channel.dmUserID,
                messageCount: channel.messages.length,
                userData: null
            }));
        await Promise.all(extractedData.topDMs.map((channel) => {
            return new Promise((resolve) => {
                fetchUser(channel.dmUserID).then((userData) => {
                    const channelIndex = extractedData.topDMs.findIndex((c) => c.id === channel.id);
                    extractedData.topDMs[channelIndex].userData = userData;
                    resolve();
                });
            });
        }));

        console.log(`[debug] ${extractedData.topDMs.length} top DMs loaded.`);

        loadTask.set('Calculating statistics...');
        console.log('[debug] Fetching activity...');

        const statistics = await readAnalyticsFile(files.find((file) => /activity\/analytics\/events-[0-9]{4}-[0-9]{5}-of-[0-9]{5}\.json/.test(file.name)));
        extractedData.openCount = statistics.openCount;
        extractedData.averageOpenCountPerDay = extractedData.openCount && perDay(statistics.openCount, extractedData.user.id);
        extractedData.notificationCount = statistics.notificationCount;
        extractedData.joinVoiceChannelCount = statistics.joinVoiceChannelCount; 
        extractedData.joinCallCount = statistics.joinCallCount;
        extractedData.addReactionCount = statistics.addReactionCount;
        extractedData.messageEditedCount = statistics.messageEditedCount;
        extractedData.sentMessageCount = statistics.sendMessageCount;
        extractedData.averageMessageCountPerDay = extractedData.sentMessageCount && perDay(extractedData.sentMessageCount, extractedData.user.id);
        extractedData.slashCommandUsedCount = statistics.slashCommandUsedCount;

        console.log('[debug] Activity fetched...');

        loadTask.set('Calculating statistics...');

        console.log(extractedData);

        return extractedData;
    };

    /* src\views\Loader.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$d = "src\\views\\Loader.svelte";

    // (121:24) {:else}
    function create_else_block$3(ctx) {
    	let t0;
    	let strong;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Click ");
    			strong = element("strong");
    			strong.textContent = "here";
    			t2 = text(" to select your Discord data");
    			add_location(strong, file$d, 121, 34, 7616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, strong, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(strong);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(121:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (119:40) 
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			set_style(p, "color", "red");
    			add_location(p, file$d, 119, 28, 7509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			p.innerHTML = /*error*/ ctx[1];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 2) p.innerHTML = /*error*/ ctx[1];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(119:40) ",
    		ctx
    	});

    	return block;
    }

    // (114:24) {#if loading}
    function create_if_block$6(ctx) {
    	let t0_value = (/*$loadTask*/ ctx[2] || "Loading your package file...") + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*$loadEstimatedTime*/ ctx[3] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$loadTask*/ 4 && t0_value !== (t0_value = (/*$loadTask*/ ctx[2] || "Loading your package file...") + "")) set_data_dev(t0, t0_value);

    			if (/*$loadEstimatedTime*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(114:24) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (116:28) {#if $loadEstimatedTime}
    function create_if_block_1$2(ctx) {
    	let small;
    	let t;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t = text(/*$loadEstimatedTime*/ ctx[3]);
    			set_style(small, "display", "block");
    			set_style(small, "margin-top", "4px");
    			add_location(small, file$d, 116, 32, 7329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$loadEstimatedTime*/ 8) set_data_dev(t, /*$loadEstimatedTime*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(116:28) {#if $loadEstimatedTime}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div4;
    	let div3;
    	let p0;
    	let a0;
    	let link_action;
    	let t1;
    	let t2;
    	let p1;
    	let a1;
    	let small0;
    	let t4;
    	let br;
    	let t5;
    	let span0;
    	let link_action_1;
    	let t7;
    	let div0;
    	let small1;
    	let t9;
    	let label;
    	let svg;
    	let path;
    	let t10;
    	let span1;
    	let t11;
    	let div1;
    	let a2;
    	let button;
    	let t13;
    	let div2;
    	let t14;
    	let a3;
    	let link_action_2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[0]) return create_if_block$6;
    		if (/*error*/ ctx[1]) return create_if_block_2;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			p0 = element("p");
    			a0 = element("a");
    			a0.textContent = "DDPE";
    			t1 = text(" is a site that generates stats from your Discord Data Package. It is your device that processes the data, nothing is sent to any server!");
    			t2 = space();
    			p1 = element("p");
    			a1 = element("a");
    			small0 = element("small");
    			small0.textContent = "1";
    			t4 = text("\n                    Get my Discord JSON data 👆\n                    ");
    			br = element("br");
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "(click on this button)";
    			t7 = space();
    			div0 = element("div");
    			small1 = element("small");
    			small1.textContent = "2";
    			t9 = space();
    			label = element("label");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t10 = space();
    			span1 = element("span");
    			if_block.c();
    			t11 = space();
    			div1 = element("div");
    			a2 = element("a");
    			button = element("button");
    			button.textContent = "Need help? Chat with us on Discord!";
    			t13 = space();
    			div2 = element("div");
    			t14 = text("no package yet? ");
    			a3 = element("a");
    			a3.textContent = "demo";
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$d, 99, 46, 3868);
    			attr_dev(p0, "class", "app-loader-description svelte-1l0qc0f");
    			add_location(p0, file$d, 99, 12, 3834);
    			attr_dev(small0, "class", "app-loader-tag tag svelte-1l0qc0f");
    			add_location(small0, file$d, 102, 20, 4141);
    			add_location(br, file$d, 104, 20, 4253);
    			add_location(span0, file$d, 105, 20, 4278);
    			attr_dev(a1, "class", "app-loader-tuto svelte-1l0qc0f");
    			attr_dev(a1, "href", "/help");
    			add_location(a1, file$d, 101, 16, 4071);
    			add_location(p1, file$d, 100, 12, 4051);
    			attr_dev(small1, "class", "app-loader-tag tag svelte-1l0qc0f");
    			add_location(small1, file$d, 109, 16, 4534);
    			attr_dev(path, "data-v-9d8e2fa4", "");
    			attr_dev(path, "d", "M29.5 0.652008C25.0436 0.652008 20.5671 2.36576 17.1679 5.81576C14.4136 8.61109 12.8123 12.1254 12.2894 15.7607C5.37305 16.6594 0.0200195 22.6337 0.0200195 29.892C0.0200195 37.7705 6.32733 44.172 14.09 44.172H21.46C21.5488 44.1733 21.6369 44.1566 21.7193 44.123C21.8017 44.0894 21.8767 44.0395 21.9399 43.9763C22.0032 43.913 22.0534 43.8376 22.0876 43.7545C22.1219 43.6713 22.1396 43.5821 22.1396 43.492C22.1396 43.4019 22.1219 43.3127 22.0876 43.2295C22.0534 43.1464 22.0032 43.071 21.9399 43.0077C21.8767 42.9445 21.8017 42.8946 21.7193 42.861C21.6369 42.8274 21.5488 42.8107 21.46 42.812H14.09C7.0516 42.812 1.36002 37.0355 1.36002 29.892C1.36002 23.1472 6.43112 17.6122 12.9175 17.0145C13.0706 17.001 13.2145 16.9345 13.325 16.8262C13.4355 16.7179 13.506 16.5743 13.5247 16.4195C13.928 12.8934 15.4639 9.47896 18.1309 6.77201C21.273 3.58315 25.383 2.01201 29.5 2.01201C33.617 2.01201 37.7052 3.58215 40.8481 6.77201C44.4813 10.4594 46.0212 15.486 45.4544 20.287C45.4425 20.3832 45.4509 20.4808 45.4792 20.5734C45.5075 20.666 45.555 20.7513 45.6184 20.8238C45.6818 20.8962 45.7598 20.954 45.8471 20.9934C45.9343 21.0328 46.0289 21.0528 46.1244 21.052H46.92C52.8705 21.052 57.64 25.8927 57.64 31.932C57.64 37.9713 52.8705 42.812 46.92 42.812H37.54C37.4512 42.8107 37.3631 42.8274 37.2807 42.861C37.1983 42.8946 37.1233 42.9445 37.0601 43.0077C36.9969 43.071 36.9467 43.1464 36.9124 43.2295C36.8781 43.3127 36.8605 43.4019 36.8605 43.492C36.8605 43.5821 36.8781 43.6713 36.9124 43.7545C36.9467 43.8376 36.9969 43.913 37.0601 43.9763C37.1233 44.0395 37.1983 44.0894 37.2807 44.123C37.3631 44.1566 37.4512 44.1733 37.54 44.172H46.92C53.5897 44.172 58.98 38.7012 58.98 31.932C58.98 25.1628 53.5897 19.692 46.92 19.692H46.7944C47.1723 14.7203 45.554 9.61428 41.8113 5.81576C38.4131 2.36678 33.9565 0.652008 29.5 0.652008ZM29.437 23.772C29.2789 23.7856 29.1417 23.8585 29.0393 23.942L21.6693 30.742C21.4092 30.9862 21.385 31.457 21.6277 31.7195C21.8699 31.982 22.3337 31.9878 22.5908 31.7406L28.83 25.9819V47.5718C28.83 47.9474 29.13 48.2518 29.5 48.2518C29.8701 48.2518 30.17 47.9474 30.17 47.5718V25.9819L36.4094 31.7406C36.6665 31.9879 37.1303 31.9821 37.3725 31.7195C37.6147 31.457 37.6062 31.0233 37.331 30.742L29.961 23.942C29.7746 23.8029 29.5957 23.7581 29.4375 23.772H29.437Z");
    			attr_dev(path, "fill-opacity", "0.39");
    			add_location(path, file$d, 111, 115, 4730);
    			attr_dev(svg, "width", "59");
    			attr_dev(svg, "height", "49");
    			attr_dev(svg, "viewBox", "0 0 59 49");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$d, 111, 20, 4635);
    			attr_dev(span1, "class", "app-loader-upload-info svelte-1l0qc0f");
    			add_location(span1, file$d, 112, 20, 7094);
    			attr_dev(label, "for", "upload");
    			attr_dev(label, "class", "svelte-1l0qc0f");
    			add_location(label, file$d, 110, 16, 4594);
    			attr_dev(div0, "class", "app-loader-upload svelte-1l0qc0f");
    			set_style(div0, "cursor", /*loading*/ ctx[0] ? "" : "pointer");
    			add_location(div0, file$d, 108, 12, 4364);
    			attr_dev(button, "class", "app-discord-btn svelte-1l0qc0f");
    			add_location(button, file$d, 127, 72, 7878);
    			attr_dev(a2, "href", "https://androz2091.fr/discord");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$d, 127, 16, 7822);
    			attr_dev(div1, "class", "app-discord svelte-1l0qc0f");
    			add_location(div1, file$d, 126, 12, 7780);
    			attr_dev(a3, "href", "/stats/demo");
    			add_location(a3, file$d, 130, 32, 8045);
    			attr_dev(div2, "class", "app-demo svelte-1l0qc0f");
    			add_location(div2, file$d, 129, 12, 7990);
    			attr_dev(div3, "class", "app-loader-boxes svelte-1l0qc0f");
    			add_location(div3, file$d, 98, 8, 3791);
    			attr_dev(div4, "class", "app-loader svelte-1l0qc0f");
    			add_location(div4, file$d, 97, 4, 3758);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, p0);
    			append_dev(p0, a0);
    			append_dev(p0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, p1);
    			append_dev(p1, a1);
    			append_dev(a1, small0);
    			append_dev(a1, t4);
    			append_dev(a1, br);
    			append_dev(a1, t5);
    			append_dev(a1, span0);
    			append_dev(div3, t7);
    			append_dev(div3, div0);
    			append_dev(div0, small1);
    			append_dev(div0, t9);
    			append_dev(div0, label);
    			append_dev(label, svg);
    			append_dev(svg, path);
    			append_dev(label, t10);
    			append_dev(label, span1);
    			if_block.m(span1, null);
    			append_dev(div3, t11);
    			append_dev(div3, div1);
    			append_dev(div1, a2);
    			append_dev(a2, button);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, t14);
    			append_dev(div2, a3);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link_action = link.call(null, a0)),
    					action_destroyer(link_action_1 = link.call(null, a1)),
    					listen_dev(div0, "click", /*filePopup*/ ctx[5], false, false, false),
    					listen_dev(div0, "drop", /*handleDrop*/ ctx[4], false, false, false),
    					listen_dev(div0, "dragover", handleDragOver, false, false, false),
    					action_destroyer(link_action_2 = link.call(null, a3))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			}

    			if (dirty & /*loading*/ 1) {
    				set_style(div0, "cursor", /*loading*/ ctx[0] ? "" : "pointer");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleDragOver(event) {
    	event.preventDefault();
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $loadTask;
    	let $loadEstimatedTime;
    	validate_store(loadTask, "loadTask");
    	component_subscribe($$self, loadTask, $$value => $$invalidate(2, $loadTask = $$value));
    	validate_store(loadEstimatedTime, "loadEstimatedTime");
    	component_subscribe($$self, loadEstimatedTime, $$value => $$invalidate(3, $loadEstimatedTime = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Loader", slots, []);
    	let loading = false;
    	let error = false;

    	async function handleFile(file) {
    		$$invalidate(0, loading = true);
    		const uz = new Unzip();
    		uz.register(AsyncUnzipInflate);
    		const files = [];
    		uz.onfile = f => files.push(f);

    		if (!file.stream) {
    			$$invalidate(0, loading = false);
    			$$invalidate(1, error = "This browser is not supported. Try using Google Chrome instead.");
    			return;
    		}

    		const reader = file.stream().getReader();

    		while (true) {
    			const { done, value } = await reader.read();

    			if (done) {
    				uz.push(new Uint8Array(0), true);
    				break;
    			}

    			for (let i = 0; i < value.length; i += 65536) {
    				uz.push(value.subarray(i, i + 65536));
    			}
    		}

    		/**
     * If the package is valid and have
     * all the required files files.
     */
    		const validPackage = (() => {
    			const requiredFiles = [
    				"README.txt",
    				"account/user.json",
    				"messages/index.json",
    				"servers/index.json"
    			];

    			for (const requiredFile of requiredFiles) {
    				if (!files.some(file => file.name === requiredFile)) {
    					return false;
    				}
    			}

    			return true;
    		})();

    		if (!validPackage) {
    			$$invalidate(1, error = "Your package seems to be corrupted. Click or drop your package file here to retry");
    			$$invalidate(0, loading = false);
    			return;
    		}

    		const extractStartAt = Date.now();

    		extractData(files).then(extractedData => {
    			$$invalidate(0, loading = false);
    			data.set(extractedData);
    			loadTask.set(null);
    			loadEstimatedTime.set(null);
    			console.log(`[debug] Data extracted in ${(Date.now() - extractStartAt) / 1000} seconds.`);
    			navigate("/stats");
    		}).catch(err => {
    			if (err.message === "invalid_package_missing_messages") {
    				$$invalidate(1, error = "Some data is missing in your package, therefore it can not be read. <br> It is a bug on Discord side (06-10-21), and will be fixed in the next few days. <br> Join <a href=\"https://androz2091.fr/discord\">our Discord</a> to get more information.");
    				$$invalidate(0, loading = false);
    			} else {
    				$$invalidate(1, error = "Something went wrong... Click or drop your package file here to retry");
    				$$invalidate(0, loading = false);
    				alert(err.stack);
    			}
    		});
    	}

    	/** @see https://developer.mozilla.org/en-US/docs/Web/API/Document/drop_event */
    	function handleDrop(event) {
    		event.preventDefault();

    		if (event.dataTransfer.items[0].getAsFile() !== null) {
    			handleFile(event.dataTransfer.items[0].getAsFile());
    		} else {
    			$$invalidate(1, error = "Error trying to handle the dropped file. Try clicking instead.");
    		}
    	}

    	function filePopup(event) {
    		if (event.target.classList.value.includes("help") || loading) return;
    		const input = document.createElement("input");
    		input.setAttribute("type", "file");
    		input.setAttribute("accept", ".zip");
    		input.addEventListener("change", e => handleFile(e.target.files[0]));
    		input.addEventListener("error", () => $$invalidate(1, error = true));
    		input.click();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Loader> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		link,
    		Unzip,
    		AsyncUnzipInflate,
    		navigate,
    		loadTask,
    		loadEstimatedTime,
    		data,
    		extractData,
    		loading,
    		error,
    		handleFile,
    		handleDragOver,
    		handleDrop,
    		filePopup,
    		$loadTask,
    		$loadEstimatedTime
    	});

    	$$self.$inject_state = $$props => {
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loading, error, $loadTask, $loadEstimatedTime, handleDrop, filePopup];
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loader",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\views\Help.svelte generated by Svelte v3.38.2 */

    const file$e = "src\\views\\Help.svelte";

    function create_fragment$g(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let video;
    	let source;
    	let source_src_value;
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Here is a short TikTok video ✨ to show you how to request your Discord Data Package! Note that this is also possible on mobile device using the iOS and Android Discord apps!";
    			t1 = space();
    			div1 = element("div");
    			video = element("video");
    			source = element("source");
    			t2 = text("\n        \n            Sorry, your browser doesn't support embedded videos.");
    			add_location(div0, file$e, 1, 4, 23);
    			if (source.src !== (source_src_value = "help-tiktok.mp4")) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "video/webm");
    			add_location(source, file$e, 8, 12, 358);
    			video.controls = true;
    			attr_dev(video, "width", "250");
    			add_location(video, file$e, 6, 8, 316);
    			attr_dev(div1, "class", "tiktok-player svelte-1efa7po");
    			add_location(div1, file$e, 4, 4, 226);
    			attr_dev(div2, "class", "help svelte-1efa7po");
    			add_location(div2, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, video);
    			append_dev(video, source);
    			append_dev(video, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Help", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Help> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Help extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Help",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* node_modules\svelte-simple-modal\src\Modal.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1$1 } = globals;
    const file$f = "node_modules\\svelte-simple-modal\\src\\Modal.svelte";

    // (254:0) {#if Component}
    function create_if_block$7(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let t;
    	let div0;
    	let switch_instance;
    	let div1_transition;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*state*/ ctx[0].closeButton && create_if_block_1$3(ctx);
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*Component*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div0, "class", "content svelte-fnsfcv");
    			attr_dev(div0, "style", /*cssContent*/ ctx[13]);
    			add_location(div0, file$f, 281, 8, 6858);
    			attr_dev(div1, "class", "window svelte-fnsfcv");
    			attr_dev(div1, "role", "dialog");
    			attr_dev(div1, "aria-modal", "true");
    			attr_dev(div1, "style", /*cssWindow*/ ctx[12]);
    			add_location(div1, file$f, 262, 6, 6233);
    			attr_dev(div2, "class", "window-wrap svelte-fnsfcv");
    			attr_dev(div2, "style", /*cssWindowWrap*/ ctx[11]);
    			add_location(div2, file$f, 261, 4, 6162);
    			attr_dev(div3, "class", "bg svelte-fnsfcv");
    			attr_dev(div3, "style", /*cssBg*/ ctx[10]);
    			add_location(div3, file$f, 254, 2, 5996);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			if (switch_instance) {
    				mount_component(switch_instance, div0, null);
    			}

    			/*div1_binding*/ ctx[37](div1);
    			/*div2_binding*/ ctx[38](div2);
    			/*div3_binding*/ ctx[39](div3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div1,
    						"introstart",
    						function () {
    							if (is_function(/*onOpen*/ ctx[6])) /*onOpen*/ ctx[6].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div1,
    						"outrostart",
    						function () {
    							if (is_function(/*onClose*/ ctx[7])) /*onClose*/ ctx[7].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div1,
    						"introend",
    						function () {
    							if (is_function(/*onOpened*/ ctx[8])) /*onOpened*/ ctx[8].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div1,
    						"outroend",
    						function () {
    							if (is_function(/*onClosed*/ ctx[9])) /*onClosed*/ ctx[9].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(div3, "click", /*handleOuterClick*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*state*/ ctx[0].closeButton) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*state*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const switch_instance_changes = (dirty[0] & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*Component*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div0, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if (!current || dirty[0] & /*cssContent*/ 8192) {
    				attr_dev(div0, "style", /*cssContent*/ ctx[13]);
    			}

    			if (!current || dirty[0] & /*cssWindow*/ 4096) {
    				attr_dev(div1, "style", /*cssWindow*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*cssWindowWrap*/ 2048) {
    				attr_dev(div2, "style", /*cssWindowWrap*/ ctx[11]);
    			}

    			if (!current || dirty[0] & /*cssBg*/ 1024) {
    				attr_dev(div3, "style", /*cssBg*/ ctx[10]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[16], /*state*/ ctx[0].transitionWindowProps, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[15], /*state*/ ctx[0].transitionBgProps, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[16], /*state*/ ctx[0].transitionWindowProps, false);
    			div1_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[15], /*state*/ ctx[0].transitionBgProps, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			if (switch_instance) destroy_component(switch_instance);
    			/*div1_binding*/ ctx[37](null);
    			if (detaching && div1_transition) div1_transition.end();
    			/*div2_binding*/ ctx[38](null);
    			/*div3_binding*/ ctx[39](null);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(254:0) {#if Component}",
    		ctx
    	});

    	return block;
    }

    // (275:8) {#if state.closeButton}
    function create_if_block_1$3(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*state*/ 1) show_if = !!/*isFunction*/ ctx[17](/*state*/ ctx[0].closeButton);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, [-1]);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(275:8) {#if state.closeButton}",
    		ctx
    	});

    	return block;
    }

    // (278:10) {:else}
    function create_else_block$4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "close svelte-fnsfcv");
    			attr_dev(button, "style", /*cssCloseButton*/ ctx[14]);
    			add_location(button, file$f, 278, 12, 6755);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*close*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cssCloseButton*/ 16384) {
    				attr_dev(button, "style", /*cssCloseButton*/ ctx[14]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(278:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (276:10) {#if isFunction(state.closeButton)}
    function create_if_block_2$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*state*/ ctx[0].closeButton;

    	function switch_props(ctx) {
    		return {
    			props: { onClose: /*close*/ ctx[18] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*state*/ ctx[0].closeButton)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(276:10) {#if isFunction(state.closeButton)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*Component*/ ctx[1] && create_if_block$7(ctx);
    	const default_slot_template = /*#slots*/ ctx[36].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[35], null);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*Component*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*Component*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[35], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let cssBg;
    	let cssWindowWrap;
    	let cssWindow;
    	let cssContent;
    	let cssCloseButton;
    	let currentTransitionBg;
    	let currentTransitionWindow;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	const baseSetContext = setContext;
    	let { key = "simple-modal" } = $$props;
    	let { closeButton = true } = $$props;
    	let { closeOnEsc = true } = $$props;
    	let { closeOnOuterClick = true } = $$props;
    	let { styleBg = { top: 0, left: 0 } } = $$props;
    	let { styleWindowWrap = {} } = $$props;
    	let { styleWindow = {} } = $$props;
    	let { styleContent = {} } = $$props;
    	let { styleCloseButton = {} } = $$props;
    	let { setContext: setContext$1 = baseSetContext } = $$props;
    	let { transitionBg = fade } = $$props;
    	let { transitionBgProps = { duration: 250 } } = $$props;
    	let { transitionWindow = transitionBg } = $$props;
    	let { transitionWindowProps = transitionBgProps } = $$props;

    	const defaultState = {
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindowWrap,
    		styleWindow,
    		styleContent,
    		styleCloseButton,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps
    	};

    	let state = { ...defaultState };
    	let Component = null;
    	let props = null;
    	let background;
    	let wrap;
    	let modalWindow;
    	const camelCaseToDash = str => str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
    	const toCssString = props => Object.keys(props).reduce((str, key) => `${str}; ${camelCaseToDash(key)}: ${props[key]}`, "");
    	const isFunction = f => !!(f && f.constructor && f.call && f.apply);

    	const toVoid = () => {
    		
    	};

    	let onOpen = toVoid;
    	let onClose = toVoid;
    	let onOpened = toVoid;
    	let onClosed = toVoid;

    	const open = (NewComponent, newProps = {}, options = {}, callback = {}) => {
    		$$invalidate(1, Component = NewComponent);
    		$$invalidate(2, props = newProps);
    		$$invalidate(0, state = { ...defaultState, ...options });

    		($$invalidate(6, onOpen = event => {
    			if (callback.onOpen) callback.onOpen(event);
    			dispatch("opening");
    		}), $$invalidate(7, onClose = event => {
    			if (callback.onClose) callback.onClose(event);
    			dispatch("closing");
    		}), $$invalidate(8, onOpened = event => {
    			if (callback.onOpened) callback.onOpened(event);
    			dispatch("opened");
    		}));

    		$$invalidate(9, onClosed = event => {
    			if (callback.onClosed) callback.onClosed(event);
    			dispatch("closed");
    		});
    	};

    	const close = (callback = {}) => {
    		$$invalidate(7, onClose = callback.onClose || onClose);
    		$$invalidate(9, onClosed = callback.onClosed || onClosed);
    		$$invalidate(1, Component = null);
    		$$invalidate(2, props = null);
    	};

    	const handleKeydown = event => {
    		if (state.closeOnEsc && Component && event.key === "Escape") {
    			event.preventDefault();
    			close();
    		}

    		if (Component && event.key === "Tab") {
    			// trap focus
    			const nodes = modalWindow.querySelectorAll("*");

    			const tabbable = Array.from(nodes).filter(node => node.tabIndex >= 0);
    			let index = tabbable.indexOf(document.activeElement);
    			if (index === -1 && event.shiftKey) index = 0;
    			index += tabbable.length + (event.shiftKey ? -1 : 1);
    			index %= tabbable.length;
    			tabbable[index].focus();
    			event.preventDefault();
    		}
    	};

    	const handleOuterClick = event => {
    		if (state.closeOnOuterClick && (event.target === background || event.target === wrap)) {
    			event.preventDefault();
    			close();
    		}
    	};

    	setContext$1(key, { open, close });

    	const writable_props = [
    		"key",
    		"closeButton",
    		"closeOnEsc",
    		"closeOnOuterClick",
    		"styleBg",
    		"styleWindowWrap",
    		"styleWindow",
    		"styleContent",
    		"styleCloseButton",
    		"setContext",
    		"transitionBg",
    		"transitionBgProps",
    		"transitionWindow",
    		"transitionWindowProps"
    	];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modalWindow = $$value;
    			$$invalidate(5, modalWindow);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			wrap = $$value;
    			$$invalidate(4, wrap);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			background = $$value;
    			$$invalidate(3, background);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("key" in $$props) $$invalidate(21, key = $$props.key);
    		if ("closeButton" in $$props) $$invalidate(22, closeButton = $$props.closeButton);
    		if ("closeOnEsc" in $$props) $$invalidate(23, closeOnEsc = $$props.closeOnEsc);
    		if ("closeOnOuterClick" in $$props) $$invalidate(24, closeOnOuterClick = $$props.closeOnOuterClick);
    		if ("styleBg" in $$props) $$invalidate(25, styleBg = $$props.styleBg);
    		if ("styleWindowWrap" in $$props) $$invalidate(26, styleWindowWrap = $$props.styleWindowWrap);
    		if ("styleWindow" in $$props) $$invalidate(27, styleWindow = $$props.styleWindow);
    		if ("styleContent" in $$props) $$invalidate(28, styleContent = $$props.styleContent);
    		if ("styleCloseButton" in $$props) $$invalidate(29, styleCloseButton = $$props.styleCloseButton);
    		if ("setContext" in $$props) $$invalidate(30, setContext$1 = $$props.setContext);
    		if ("transitionBg" in $$props) $$invalidate(31, transitionBg = $$props.transitionBg);
    		if ("transitionBgProps" in $$props) $$invalidate(32, transitionBgProps = $$props.transitionBgProps);
    		if ("transitionWindow" in $$props) $$invalidate(33, transitionWindow = $$props.transitionWindow);
    		if ("transitionWindowProps" in $$props) $$invalidate(34, transitionWindowProps = $$props.transitionWindowProps);
    		if ("$$scope" in $$props) $$invalidate(35, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		svelte,
    		fade,
    		createEventDispatcher,
    		dispatch,
    		baseSetContext,
    		key,
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindowWrap,
    		styleWindow,
    		styleContent,
    		styleCloseButton,
    		setContext: setContext$1,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps,
    		defaultState,
    		state,
    		Component,
    		props,
    		background,
    		wrap,
    		modalWindow,
    		camelCaseToDash,
    		toCssString,
    		isFunction,
    		toVoid,
    		onOpen,
    		onClose,
    		onOpened,
    		onClosed,
    		open,
    		close,
    		handleKeydown,
    		handleOuterClick,
    		cssBg,
    		cssWindowWrap,
    		cssWindow,
    		cssContent,
    		cssCloseButton,
    		currentTransitionBg,
    		currentTransitionWindow
    	});

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(21, key = $$props.key);
    		if ("closeButton" in $$props) $$invalidate(22, closeButton = $$props.closeButton);
    		if ("closeOnEsc" in $$props) $$invalidate(23, closeOnEsc = $$props.closeOnEsc);
    		if ("closeOnOuterClick" in $$props) $$invalidate(24, closeOnOuterClick = $$props.closeOnOuterClick);
    		if ("styleBg" in $$props) $$invalidate(25, styleBg = $$props.styleBg);
    		if ("styleWindowWrap" in $$props) $$invalidate(26, styleWindowWrap = $$props.styleWindowWrap);
    		if ("styleWindow" in $$props) $$invalidate(27, styleWindow = $$props.styleWindow);
    		if ("styleContent" in $$props) $$invalidate(28, styleContent = $$props.styleContent);
    		if ("styleCloseButton" in $$props) $$invalidate(29, styleCloseButton = $$props.styleCloseButton);
    		if ("setContext" in $$props) $$invalidate(30, setContext$1 = $$props.setContext);
    		if ("transitionBg" in $$props) $$invalidate(31, transitionBg = $$props.transitionBg);
    		if ("transitionBgProps" in $$props) $$invalidate(32, transitionBgProps = $$props.transitionBgProps);
    		if ("transitionWindow" in $$props) $$invalidate(33, transitionWindow = $$props.transitionWindow);
    		if ("transitionWindowProps" in $$props) $$invalidate(34, transitionWindowProps = $$props.transitionWindowProps);
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("Component" in $$props) $$invalidate(1, Component = $$props.Component);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("background" in $$props) $$invalidate(3, background = $$props.background);
    		if ("wrap" in $$props) $$invalidate(4, wrap = $$props.wrap);
    		if ("modalWindow" in $$props) $$invalidate(5, modalWindow = $$props.modalWindow);
    		if ("onOpen" in $$props) $$invalidate(6, onOpen = $$props.onOpen);
    		if ("onClose" in $$props) $$invalidate(7, onClose = $$props.onClose);
    		if ("onOpened" in $$props) $$invalidate(8, onOpened = $$props.onOpened);
    		if ("onClosed" in $$props) $$invalidate(9, onClosed = $$props.onClosed);
    		if ("cssBg" in $$props) $$invalidate(10, cssBg = $$props.cssBg);
    		if ("cssWindowWrap" in $$props) $$invalidate(11, cssWindowWrap = $$props.cssWindowWrap);
    		if ("cssWindow" in $$props) $$invalidate(12, cssWindow = $$props.cssWindow);
    		if ("cssContent" in $$props) $$invalidate(13, cssContent = $$props.cssContent);
    		if ("cssCloseButton" in $$props) $$invalidate(14, cssCloseButton = $$props.cssCloseButton);
    		if ("currentTransitionBg" in $$props) $$invalidate(15, currentTransitionBg = $$props.currentTransitionBg);
    		if ("currentTransitionWindow" in $$props) $$invalidate(16, currentTransitionWindow = $$props.currentTransitionWindow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(10, cssBg = toCssString(state.styleBg));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(11, cssWindowWrap = toCssString(state.styleWindowWrap));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(12, cssWindow = toCssString(state.styleWindow));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(13, cssContent = toCssString(state.styleContent));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(14, cssCloseButton = toCssString(state.styleCloseButton));
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(15, currentTransitionBg = state.transitionBg);
    		}

    		if ($$self.$$.dirty[0] & /*state*/ 1) {
    			 $$invalidate(16, currentTransitionWindow = state.transitionWindow);
    		}
    	};

    	return [
    		state,
    		Component,
    		props,
    		background,
    		wrap,
    		modalWindow,
    		onOpen,
    		onClose,
    		onOpened,
    		onClosed,
    		cssBg,
    		cssWindowWrap,
    		cssWindow,
    		cssContent,
    		cssCloseButton,
    		currentTransitionBg,
    		currentTransitionWindow,
    		isFunction,
    		close,
    		handleKeydown,
    		handleOuterClick,
    		key,
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindowWrap,
    		styleWindow,
    		styleContent,
    		styleCloseButton,
    		setContext$1,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps,
    		$$scope,
    		slots,
    		div1_binding,
    		div2_binding,
    		div3_binding
    	];
    }

    class Modal$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$h,
    			create_fragment$h,
    			safe_not_equal,
    			{
    				key: 21,
    				closeButton: 22,
    				closeOnEsc: 23,
    				closeOnOuterClick: 24,
    				styleBg: 25,
    				styleWindowWrap: 26,
    				styleWindow: 27,
    				styleContent: 28,
    				styleCloseButton: 29,
    				setContext: 30,
    				transitionBg: 31,
    				transitionBgProps: 32,
    				transitionWindow: 33,
    				transitionWindowProps: 34
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get key() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeButton() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeButton(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnEsc() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnEsc(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnOuterClick() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnOuterClick(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleBg() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleBg(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleWindowWrap() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleWindowWrap(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleWindow() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleWindow(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleContent() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleContent(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styleCloseButton() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styleCloseButton(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setContext() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setContext(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionBg() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionBg(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionBgProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionBgProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionWindow() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionWindow(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionWindowProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionWindowProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file$g = "src\\App.svelte";

    // (31:2) <Router>
    function create_default_slot_1$1(ctx) {
    	let header;
    	let t0;
    	let div;
    	let route0;
    	let t1;
    	let route1;
    	let t2;
    	let route2;
    	let t3;
    	let route3;
    	let t4;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });

    	route0 = new Route({
    			props: { path: "/stats", component: Stats },
    			$$inline: true
    		});

    	route1 = new Route({
    			props: { path: "/stats/demo", component: Stats },
    			$$inline: true
    		});

    	route2 = new Route({
    			props: { path: "/help", component: Help },
    			$$inline: true
    		});

    	route3 = new Route({
    			props: { path: "/*", component: Loader },
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			t3 = space();
    			create_component(route3.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    			add_location(div, file$g, 32, 3, 717);
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(route0, div, null);
    			append_dev(div, t1);
    			mount_component(route1, div, null);
    			append_dev(div, t2);
    			mount_component(route2, div, null);
    			append_dev(div, t3);
    			mount_component(route3, div, null);
    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    			destroy_component(route3);
    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(31:2) <Router>",
    		ctx
    	});

    	return block;
    }

    // (26:1) <Modal   styleContent={{ 'background-color': '#18191c', color: 'white' }}   closeOnOuterClick={false}   closeOnEsc={false}  >
    function create_default_slot$1(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(26:1) <Modal   styleContent={{ 'background-color': '#18191c', color: 'white' }}   closeOnOuterClick={false}   closeOnEsc={false}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let t0;
    	let main;
    	let sveltetoast;
    	let t1;
    	let modal;
    	let current;

    	sveltetoast = new SvelteToast({
    			props: { options: /*options*/ ctx[0] },
    			$$inline: true
    		});

    	modal = new Modal$1({
    			props: {
    				styleContent: {
    					"background-color": "#18191c",
    					color: "white"
    				},
    				closeOnOuterClick: false,
    				closeOnEsc: false,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = space();
    			main = element("main");
    			create_component(sveltetoast.$$.fragment);
    			t1 = space();
    			create_component(modal.$$.fragment);
    			document.title = "Discord Data Package Explorer";
    			attr_dev(main, "class", "app svelte-focipt");
    			add_location(main, file$g, 23, 0, 516);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(sveltetoast, main, null);
    			append_dev(main, t1);
    			mount_component(modal, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sveltetoast.$$.fragment, local);
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sveltetoast.$$.fragment, local);
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(sveltetoast);
    			destroy_component(modal);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const options = { duration: 10000 };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Route,
    		Header,
    		Footer,
    		Stats,
    		Loader,
    		Help,
    		Modal: Modal$1,
    		SvelteToast,
    		options
    	});

    	return [options];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
