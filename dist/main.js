var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FontHelpers;
(function (FontHelpers) {
    function getCssStyle(family, variant) {
        var style = { fontFamily: family };
        if (variant.indexOf("italic") >= 0) {
            style.fontStyle = "italic";
        }
        var numeric = variant.replace(/[^\d]/g, "");
        if (numeric.length) {
            style.fontWeight = numeric.toString();
        }
        return style;
    }
    FontHelpers.getCssStyle = getCssStyle;
    function getDescription(family, variant) {
        var url;
        url = family.files[variant || "regular"];
        if (!url) {
            url = family.files[0];
        }
        return {
            family: family.family,
            category: family.category,
            variant: variant,
            url: url
        };
    }
    FontHelpers.getDescription = getDescription;
})(FontHelpers || (FontHelpers = {}));
function logtap(message, stream) {
    return stream.tap(function (t) { return console.log(message, t); });
}
function newid() {
    return (new Date().getTime() + Math.random()).toString(36);
}
var TypedChannel;
(function (TypedChannel) {
    var ChannelTopic = (function () {
        function ChannelTopic(channel, type) {
            this.channel = channel;
            this.type = type;
        }
        ChannelTopic.prototype.subscribe = function (observer) {
            this.observe().subscribe(observer);
        };
        ChannelTopic.prototype.dispatch = function (data) {
            this.channel.onNext({
                type: this.type,
                data: _.clone(data)
            });
        };
        ChannelTopic.prototype.observe = function () {
            var _this = this;
            return this.channel.filter(function (m) { return m.type === _this.type; });
        };
        return ChannelTopic;
    }());
    TypedChannel.ChannelTopic = ChannelTopic;
    var Channel = (function () {
        function Channel(subject, type) {
            this.subject = subject || new Rx.Subject();
            this.type = type;
        }
        Channel.prototype.subscribe = function (onNext) {
            return this.subject.subscribe(onNext);
        };
        Channel.prototype.topic = function (type) {
            return new ChannelTopic(this.subject, this.type ? this.type + '.' + type : type);
        };
        Channel.prototype.mergeTyped = function () {
            var topics = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                topics[_i - 0] = arguments[_i];
            }
            var types = topics.map(function (t) { return t.type; });
            return this.subject.filter(function (m) { return types.indexOf(m.type) >= 0; });
        };
        Channel.prototype.merge = function () {
            var topics = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                topics[_i - 0] = arguments[_i];
            }
            var types = topics.map(function (t) { return t.type; });
            return this.subject.filter(function (m) { return types.indexOf(m.type) >= 0; });
        };
        return Channel;
    }());
    TypedChannel.Channel = Channel;
})(TypedChannel || (TypedChannel = {}));
var ObservableEvent = (function () {
    function ObservableEvent() {
        this._subscribers = [];
    }
    /**
     * Subscribe for notification. Returns unsubscribe function.
     */
    ObservableEvent.prototype.subscribe = function (callback) {
        var _this = this;
        if (this._subscribers.indexOf(callback) < 0) {
            this._subscribers.push(callback);
        }
        return function () {
            var index = _this._subscribers.indexOf(callback, 0);
            if (index > -1) {
                _this._subscribers.splice(index, 1);
            }
        };
    };
    /**
     * Subscribe for one notification.
     */
    ObservableEvent.prototype.subscribeOne = function (callback) {
        var unsub = this.subscribe(function (t) {
            unsub();
            callback(t);
        });
    };
    ObservableEvent.prototype.notify = function (eventArg) {
        for (var _i = 0, _a = this._subscribers; _i < _a.length; _i++) {
            var subscriber = _a[_i];
            subscriber.call(this, eventArg);
        }
    };
    /**
     * Removes all subscribers.
     */
    ObservableEvent.prototype.clear = function () {
        this._subscribers.length = 0;
    };
    return ObservableEvent;
}());
var BootScript;
(function (BootScript) {
    function dropdown(args) {
        return h("div.dropdown", [
            h("button.btn.btn-default.dropdown-toggle", {
                "attrs": {
                    id: args.id,
                    type: "button",
                    "data-toggle": "dropdown",
                    className: "btn btn-default dropdown-toggle"
                },
            }, [
                args.content,
                h("span.caret")
            ]),
            h("ul.dropdown-menu", {}, args.items.map(function (item) {
                return h("li", {
                    on: {
                        click: function (ev) { return item.onClick && item.onClick(); }
                    }
                }, [
                    h('a', {}, [item.content])
                ]);
            }))
        ]);
    }
    BootScript.dropdown = dropdown;
})(BootScript || (BootScript = {}));
var PaperHelpers;
(function (PaperHelpers) {
    var log = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (PaperHelpers.shouldLogInfo) {
            console.log.apply(console, params);
        }
    };
    PaperHelpers.importOpenTypePath = function (openPath) {
        return new paper.CompoundPath(openPath.toPathData());
        // let svg = openPath.toSVG(4);
        // return <paper.Path>paper.project.importSVG(svg);
    };
    PaperHelpers.tracePathItem = function (path, pointsPerPath) {
        if (path.className === 'CompoundPath') {
            return this.traceCompoundPath(path, pointsPerPath);
        }
        else {
            return this.tracePath(path, pointsPerPath);
        }
    };
    PaperHelpers.traceCompoundPath = function (path, pointsPerPath) {
        var _this = this;
        if (!path.children.length) {
            return null;
        }
        var paths = path.children.map(function (p) {
            return _this.tracePath(p, pointsPerPath);
        });
        return new paper.CompoundPath({
            children: paths,
            clockwise: path.clockwise
        });
    };
    PaperHelpers.tracePathAsPoints = function (path, numPoints) {
        var pathLength = path.length;
        var offsetIncr = pathLength / numPoints;
        var points = [];
        var i = 0;
        var offset = 0;
        while (i++ < numPoints) {
            var point = path.getPointAt(Math.min(offset, pathLength));
            points.push(point);
            offset += offsetIncr;
        }
        return points;
    };
    PaperHelpers.tracePath = function (path, numPoints) {
        var points = PaperHelpers.tracePathAsPoints(path, numPoints);
        return new paper.Path({
            segments: points,
            closed: true,
            clockwise: path.clockwise
        });
    };
    PaperHelpers.dualBoundsPathProjection = function (topPath, bottomPath) {
        var topPathLength = topPath.length;
        var bottomPathLength = bottomPath.length;
        return function (unitPoint) {
            var topPoint = topPath.getPointAt(unitPoint.x * topPathLength);
            var bottomPoint = bottomPath.getPointAt(unitPoint.x * bottomPathLength);
            if (topPoint == null || bottomPoint == null) {
                throw "could not get projected point for unit point " + unitPoint.toString();
            }
            return topPoint.add(bottomPoint.subtract(topPoint).multiply(unitPoint.y));
        };
    };
    PaperHelpers.resetMarkers = function () {
        if (PaperHelpers.markerGroup) {
            PaperHelpers.markerGroup.remove();
        }
        PaperHelpers.markerGroup = new paper.Group();
        PaperHelpers.markerGroup.opacity = 0.2;
    };
    PaperHelpers.markerLine = function (a, b) {
        var line = paper.Path.Line(a, b);
        line.strokeColor = 'green';
        //line.dashArray = [5, 5];
        PaperHelpers.markerGroup.addChild(line);
        return line;
    };
    PaperHelpers.marker = function (point, label) {
        //let marker = paper.Shape.Circle(point, 10);
        var marker = new paper.PointText(point);
        marker.fontSize = 36;
        marker.content = label;
        marker.strokeColor = "red";
        marker.bringToFront();
        //PaperHelpers.markerGroup.addChild(marker);
        return marker;
    };
    PaperHelpers.simplify = function (path, tolerance) {
        if (path.className === 'CompoundPath') {
            for (var _i = 0, _a = path.children; _i < _a.length; _i++) {
                var p = _a[_i];
                PaperHelpers.simplify(p, tolerance);
            }
        }
        else {
            path.simplify(tolerance);
        }
    };
    /**
     * Find self or nearest ancestor satisfying the predicate.
     */
    PaperHelpers.findSelfOrAncestor = function (item, predicate) {
        if (predicate(item)) {
            return item;
        }
        return PaperHelpers.findAncestor(item, predicate);
    };
    /**
     * Find nearest ancestor satisfying the predicate.
     */
    PaperHelpers.findAncestor = function (item, predicate) {
        if (!item) {
            return null;
        }
        var prior;
        var checking = item.parent;
        while (checking && checking !== prior) {
            if (predicate(checking)) {
                return checking;
            }
            prior = checking;
            checking = checking.parent;
        }
        return null;
    };
    /**
     * The corners of the rect, clockwise starting from topLeft
     */
    PaperHelpers.corners = function (rect) {
        return [rect.topLeft, rect.topRight, rect.bottomRight, rect.bottomLeft];
    };
    /**
     * the midpoint between two points
     */
    PaperHelpers.midpoint = function (a, b) {
        return b.subtract(a).divide(2).add(a);
    };
    PaperHelpers.cloneSegment = function (segment) {
        return new paper.Segment(segment.point, segment.handleIn, segment.handleOut);
    };
    /**
     * Make an item draggable, adding related events.
     */
    PaperHelpers.addSmartDrag = function (item) {
        item.isSmartDraggable = true;
        item.on(paper.EventType.mouseDrag, function (ev) {
            log("smartDrag.onMouseDrag", item, ev);
            if (ev.smartDragItem) {
                console.warn("Will not assign smartDragItem: value was already " + ev.smartDragItem);
            }
            else {
                ev.smartDragItem = item;
            }
            if (!item.isSmartDragging) {
                item.isSmartDragging = true;
                log("emitting smartDrag.smartDragStart");
                item.emit(PaperHelpers.EventType.smartDragStart, ev);
            }
            item.position = item.position.add(ev.delta);
            log("emitting smartDrag.smartDragMove");
            item.emit(PaperHelpers.EventType.smartDragMove, ev);
            ev.stop();
        });
        item.on(paper.EventType.mouseUp, function (ev) {
            log("smartDrag.onMouseUp", item, ev);
            if (ev.smartDragItem) {
                console.warn("Will not assign smartDragItem: value was already " + ev.smartDragItem);
            }
            else {
                ev.smartDragItem = item;
            }
            if (item.isSmartDragging) {
                item.isSmartDragging = false;
                log("emitting smartDrag.smartDragEnd");
                item.emit(PaperHelpers.EventType.smartDragEnd, ev);
            }
            else {
                log("emitting smartDrag.clickWithoutDrag");
                item.emit(PaperHelpers.EventType.clickWithoutDrag, ev);
            }
            ev.stop();
        });
    };
    PaperHelpers.EventType = {
        /**
         * Drag action has started.
         */
        smartDragStart: "smartDragStart",
        /**
         * Dragged item has moved.
         */
        smartDragMove: "smartDragMove",
        /**
         * Drag action has ended.
         */
        smartDragEnd: "smartDragEnd",
        /**
         * The normal click event will fire even at the end of a drag.
         * This click event does not.
         */
        clickWithoutDrag: "clickWithoutDrag"
    };
})(PaperHelpers || (PaperHelpers = {}));
var PaperNotify;
(function (PaperNotify) {
    (function (ChangeFlag) {
        // Anything affecting the appearance of an item, including GEOMETRY,
        // STROKE, STYLE and ATTRIBUTE (except for the invisible ones: locked, name)
        ChangeFlag[ChangeFlag["APPEARANCE"] = 1] = "APPEARANCE";
        // A change in the item's children
        ChangeFlag[ChangeFlag["CHILDREN"] = 2] = "CHILDREN";
        // A change of the item's place in the scene graph (removed, inserted,
        // moved).
        ChangeFlag[ChangeFlag["INSERTION"] = 4] = "INSERTION";
        // Item geometry (path, bounds)
        ChangeFlag[ChangeFlag["GEOMETRY"] = 8] = "GEOMETRY";
        // Only segment(s) have changed, and affected curves have already been
        // notified. This is to implement an optimization in _changed() calls.
        ChangeFlag[ChangeFlag["SEGMENTS"] = 16] = "SEGMENTS";
        // Stroke geometry (excluding color)
        ChangeFlag[ChangeFlag["STROKE"] = 32] = "STROKE";
        // Fill style or stroke color / dash
        ChangeFlag[ChangeFlag["STYLE"] = 64] = "STYLE";
        // Item attributes: visible, blendMode, locked, name, opacity, clipMask ...
        ChangeFlag[ChangeFlag["ATTRIBUTE"] = 128] = "ATTRIBUTE";
        // Text content
        ChangeFlag[ChangeFlag["CONTENT"] = 256] = "CONTENT";
        // Raster pixels
        ChangeFlag[ChangeFlag["PIXELS"] = 512] = "PIXELS";
        // Clipping in one of the child items
        ChangeFlag[ChangeFlag["CLIPPING"] = 1024] = "CLIPPING";
        // The view has been transformed
        ChangeFlag[ChangeFlag["VIEW"] = 2048] = "VIEW";
    })(PaperNotify.ChangeFlag || (PaperNotify.ChangeFlag = {}));
    var ChangeFlag = PaperNotify.ChangeFlag;
    // Shortcuts to often used ChangeFlag values including APPEARANCE
    (function (Changes) {
        // CHILDREN also changes GEOMETRY, since removing children from groups
        // changes bounds.
        Changes[Changes["CHILDREN"] = 11] = "CHILDREN";
        // Changing the insertion can change the appearance through parent's matrix.
        Changes[Changes["INSERTION"] = 5] = "INSERTION";
        Changes[Changes["GEOMETRY"] = 9] = "GEOMETRY";
        Changes[Changes["SEGMENTS"] = 25] = "SEGMENTS";
        Changes[Changes["STROKE"] = 97] = "STROKE";
        Changes[Changes["STYLE"] = 65] = "STYLE";
        Changes[Changes["ATTRIBUTE"] = 129] = "ATTRIBUTE";
        Changes[Changes["CONTENT"] = 265] = "CONTENT";
        Changes[Changes["PIXELS"] = 513] = "PIXELS";
        Changes[Changes["VIEW"] = 2049] = "VIEW";
    })(PaperNotify.Changes || (PaperNotify.Changes = {}));
    var Changes = PaperNotify.Changes;
    ;
    function initialize() {
        // Inject Item.subscribe
        var itemProto = paper.Item.prototype;
        itemProto.subscribe = function (handler) {
            var _this = this;
            if (!this._subscribers) {
                this._subscribers = [];
            }
            if (this._subscribers.indexOf(handler) < 0) {
                this._subscribers.push(handler);
            }
            return function () {
                var index = _this._subscribers.indexOf(handler, 0);
                if (index > -1) {
                    _this._subscribers.splice(index, 1);
                }
            };
        };
        // Wrap Item.remove
        var itemRemove = itemProto.remove;
        itemProto.remove = function () {
            itemRemove.apply(this, arguments);
            this._subscribers = null;
        };
        // Wrap Project._changed
        var projectProto = paper.Project.prototype;
        var projectChanged = projectProto._changed;
        projectProto._changed = function (flags, item) {
            projectChanged.apply(this, arguments);
            if (item) {
                var subs = item._subscribers;
                if (subs) {
                    for (var _i = 0, subs_1 = subs; _i < subs_1.length; _i++) {
                        var s = subs_1[_i];
                        s.call(item, flags);
                    }
                }
            }
        };
    }
    PaperNotify.initialize = initialize;
    function describe(flags) {
        var flagList = [];
        _.forOwn(ChangeFlag, function (value, key) {
            if ((typeof value) === "number" && (value & flags)) {
                flagList.push(key);
            }
        });
        return flagList.join(' | ');
    }
    PaperNotify.describe = describe;
    function observe(item, flags) {
        var unsub;
        return Rx.Observable.fromEventPattern(function (addHandler) {
            unsub = item.subscribe(function (f) {
                if (f & flags) {
                    addHandler(f);
                }
            });
        }, function (removeHandler) {
            if (unsub) {
                unsub();
            }
        });
    }
    PaperNotify.observe = observe;
})(PaperNotify || (PaperNotify = {}));
PaperNotify.initialize();
var paper;
(function (paper) {
    paper.EventType = {
        frame: "frame",
        mouseDown: "mousedown",
        mouseUp: "mouseup",
        mouseDrag: "mousedrag",
        click: "click",
        doubleClick: "doubleclick",
        mouseMove: "mousemove",
        mouseEnter: "mouseenter",
        mouseLeave: "mouseleave"
    };
})(paper || (paper = {}));
// class OldTopic<T> {
//     private _channel: IChannelDefinition<Object>;
//     private _name: string;
//     constructor(channel: IChannelDefinition<Object>, topic: string) {
//         this._channel = channel;
//         this._name = topic;
//     }
//     observe(): Rx.Observable<T> {
//         return <Rx.Observable<T>>this._channel.observe(this._name);
//     }
//     publish(data: T) {
//         this._channel.publish(this._name, data);
//     }
//     subscribe(callback: ICallback<T>): ISubscriptionDefinition<T> {
//         return this._channel.subscribe(this._name, callback);
//     }
//     protected subtopic(name): ChannelTopic<T> {
//         return new ChannelTopic<T>(this._channel, this._name + '.' + name);
//     }
//     protected subtopicOf<U extends T>(name): ChannelTopic<U> {
//         return new ChannelTopic<U>(this._channel, this._name + '.' + name);
//     }
// }
postal.observe = function (options) {
    var self = this;
    var channel = options.channel;
    var topic = options.topic;
    return Rx.Observable.fromEventPattern(function addHandler(h) {
        return self.subscribe({
            channel: channel,
            topic: topic,
            callback: h,
        });
    }, function delHandler(_, sub) {
        sub.unsubscribe();
    });
};
// add observe to ChannelDefinition
postal.ChannelDefinition.prototype.observe = function (topic) {
    var self = this;
    return Rx.Observable.fromEventPattern(function addHandler(h) {
        return self.bus.subscribe({
            channel: self.channel,
            topic: topic,
            callback: h,
        });
    }, function delHandler(_, sub) {
        sub.unsubscribe();
    });
};
var rh = React.createElement;
var Component = (function () {
    function Component() {
    }
    return Component;
}());
var ReactiveDom = (function () {
    function ReactiveDom() {
    }
    /**
     * Render a reactive component within container.
     */
    ReactiveDom.renderStream = function (dom$, container) {
        var id = container.id;
        var current = container;
        var sink = new Rx.Subject();
        dom$.subscribe(function (dom) {
            if (!dom)
                return;
            //console.log('rendering dom', dom); /////////////////////
            // retain ID
            var patched = patch(current, dom);
            if (id && !patched.elm.id) {
                patched.elm.id = id;
            }
            current = patched;
            sink.onNext(current);
        });
        return sink;
    };
    /**
     * Render a reactive component within container.
     */
    ReactiveDom.renderComponent = function (component, container) {
        var current = container;
        var sink = new Rx.Subject();
        component.dom$.subscribe(function (dom) {
            if (!dom)
                return;
            current = patch(current, dom);
            sink.onNext(current);
        });
        return sink;
    };
    /**
     * Render within container whenever source changes.
     */
    ReactiveDom.liveRender = function (container, source, render) {
        var current = container;
        var sink = new Rx.Subject();
        source.subscribe(function (data) {
            var node = render(data);
            if (!node)
                return;
            current = patch(current, node);
            sink.onNext(current);
        });
        return sink;
    };
    return ReactiveDom;
}());
// const AmaticUrl = 'http://fonts.gstatic.com/s/amaticsc/v8/IDnkRTPGcrSVo50UyYNK7y3USBnSvpkopQaUR-2r7iU.ttf';
// const Roboto100 = 'http://fonts.gstatic.com/s/roboto/v15/7MygqTe2zs9YkP0adA9QQQ.ttf';
// const Roboto500 = 'fonts/Roboto-500.ttf';
// const Roboto900 = "http://fonts.gstatic.com/s/roboto/v15/H1vB34nOKWXqzKotq25pcg.ttf";
// const OpenSansRegular = "fonts/OpenSans/OpenSans-Regular.ttf";
// const OpenSansExtraBold = "fonts/OpenSans/OpenSans-ExtraBold.ttf";
// const AquafinaScript = 'fonts/AguafinaScript-Regular/AguafinaScript-Regular.ttf'
// const Norican = "http://fonts.gstatic.com/s/norican/v4/SHnSqhYAWG5sZTWcPzEHig.ttf";
var AppController = (function () {
    function AppController(store, sketchEditor, selectedItemEditor) {
        var actions = store.actions, events = store.events;
        actions.subscribe(function (x) { return console.log(x); });
        events.subscribe(function (x) { return console.log(x); });
        var workspaceController;
        events.app.fontLoaded.observe().first().subscribe(function (m) {
            workspaceController = new WorkspaceController(store, m.data);
            events.app.retainedStateLoadAttemptComplete.subscribe(function (m) {
                if (!m.data) {
                    // no autosave data loaded
                    actions.sketch.create.dispatch();
                    actions.textBlock.add.dispatch({ text: "FIDDLESTICKS", textColor: "lightblue", fontSize: 128 });
                }
                // Auto-save in one line: gotta love it.
                events.app.retainedStateChanged.observe().debounce(800).subscribe(function (state) {
                    actions.app.saveRetainedState.dispatch();
                });
            });
            actions.app.loadRetainedState.dispatch();
        });
        events.sketch.loaded.subscribe(function (ev) {
            return $("#mainCanvas").css("background-color", ev.data.backgroundColor);
        });
        events.sketch.attrChanged.subscribe(function (ev) {
            return $("#mainCanvas").css("background-color", ev.data.backgroundColor);
        });
    }
    return AppController;
}());
var Actions = (function (_super) {
    __extends(Actions, _super);
    function Actions() {
        _super.apply(this, arguments);
        this.app = {
            /**
             * Instructs Store to load retained state from local storage, if it exists.
             */
            loadRetainedState: this.topic("app.loadRetainedState"),
            /**
             * Instructs Store to save retained state to local storage.
             */
            saveRetainedState: this.topic("app.saveRetainedState"),
            loadFont: this.topic("app.loadFont")
        };
        this.designer = {
            zoomToFit: this.topic("designer.zoomToFit")
        };
        this.sketch = {
            create: this.topic("sketch.create"),
            attrUpdate: this.topic("sketch.attrupdate"),
            setEditingItem: this.topic("sketch.setEditingItem"),
            setSelection: this.topic("sketch.setselection"),
        };
        this.textBlock = {
            add: this.topic("textblock.add"),
            updateAttr: this.topic("textblock.updateAttr"),
            updateArrange: this.topic("textblock.updateArrange"),
            remove: this.topic("textblock.remove")
        };
    }
    return Actions;
}(TypedChannel.Channel));
var Events = (function (_super) {
    __extends(Events, _super);
    function Events() {
        _super.apply(this, arguments);
        this.app = {
            resourcesReady: this.topic("app.resourcesReady"),
            retainedStateLoadAttemptComplete: this.topic("app.retainedStateLoadAttemptComplete"),
            retainedStateChanged: this.topic("app.retainedStateChanged"),
            fontLoaded: this.topic("app.fontLoaded")
        };
        this.designer = {
            zoomToFitRequested: this.topic("designer.zoomToFitRequested")
        };
        this.sketch = {
            loaded: this.topic("sketch.loaded"),
            attrChanged: this.topic("sketch.attrChanged"),
            editingItemChanged: this.topic("sketch.editingItemChanged"),
            selectionChanged: this.topic("sketch.selectionChanged"),
            saveLocalRequested: this.topic("sketch.savelocal.saveLocalRequested")
        };
        this.textblock = {
            added: this.topic("textblock.added"),
            attrChanged: this.topic("textblock.attrchanged"),
            arrangeChanged: this.topic("textblock.arrangechanged"),
            removed: this.topic("textblock.removed"),
            loaded: this.topic("textblock.loaded"),
        };
    }
    return Events;
}(TypedChannel.Channel));
var Channels = (function () {
    function Channels() {
        this.actions = new Actions();
        this.events = new Events();
    }
    return Channels;
}());
var FontFamiliesLoader = (function () {
    function FontFamiliesLoader() {
    }
    FontFamiliesLoader.prototype.loadListLocal = function (callback) {
        $.ajax({
            url: "fonts/google-fonts.json",
            dataType: 'json',
            cache: true,
            success: function (response) {
                callback(response.items);
            },
            error: function (xhr, status, err) {
                console.error("google-fonts.json", status, err.toString());
            }
        });
    };
    FontFamiliesLoader.prototype.loadListRemote = function (callback) {
        var url = 'https://www.googleapis.com/webfonts/v1/webfonts?';
        var key = 'key=AIzaSyBHjV6_j4YEFpfehXOtATLoDDFdZbjYCFA';
        var sort = "popularity";
        var opt = 'sort=' + sort + '&';
        var req = url + opt + key;
        $.ajax({
            url: req,
            dataType: 'json',
            cache: true,
            success: function (response) {
                callback(response.items);
            },
            error: function (xhr, status, err) {
                console.error(url, status, err.toString());
            }
        });
    };
    FontFamiliesLoader.prototype.loadForPreview = function (families) {
        for (var _i = 0, _a = _.chunk(families, 10); _i < _a.length; _i++) {
            var chunk = _a[_i];
            WebFont.load({
                classes: false,
                google: {
                    families: chunk,
                    text: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                }
            });
        }
    };
    return FontFamiliesLoader;
}());
var ParsedFonts = (function () {
    function ParsedFonts(fontLoaded) {
        this.fonts = {};
        this._fontLoaded = fontLoaded;
    }
    ParsedFonts.prototype.get = function (fontUrl, onReady) {
        var _this = this;
        if (onReady === void 0) { onReady = null; }
        var font = this.fonts[fontUrl];
        if (font) {
            onReady && onReady(fontUrl, font);
            return;
        }
        opentype.load(fontUrl, function (err, font) {
            if (err) {
                console.error(err);
            }
            else {
                _this.fonts[fontUrl] = font;
                onReady && onReady(fontUrl, font);
                _this._fontLoaded(fontUrl, font);
            }
        });
    };
    return ParsedFonts;
}());
/**
 * The singleton Store controls all application state.
 * No parts outside of the Store modify application state.
 * Communication with the Store is done through message Channels:
 *   - Actions channel to send into the Store,
 *   - Events channel to receive notification from the Store.
 * Only the Store can receive action messages.
 * Only the Store can send event messages.
 * The Store cannot send actions or listen to events (to avoid loops).
 * Messages are to be treated as immutable.
 * All mentions of the Store can be assumed to mean, of course,
 *   "The Store and its sub-components."
 */
var Store = (function () {
    function Store() {
        var _this = this;
        this.state = {
            retained: {
                sketch: this.createSketch()
            },
            disposable: {}
        };
        this.resources = {
            fontFamilies: {},
            parsedFonts: new ParsedFonts(function (url, font) {
                return _this.events.app.fontLoaded.dispatch(font);
            })
        };
        this.actions = new Actions();
        this.events = new Events();
        this.setupSubscriptions();
        this.loadResources();
    }
    Store.prototype.setupSubscriptions = function () {
        var _this = this;
        var actions = this.actions, events = this.events;
        // ----- App -----
        actions.app.loadRetainedState.observe()
            .pausableBuffered(events.app.resourcesReady.observe().map(function (m) { return m.data; }))
            .subscribe(function (m) {
            var success = false;
            if (!localStorage || !localStorage.getItem) {
                // not supported
                return;
            }
            var saved = localStorage.getItem(Store.AUTOSAVE_KEY);
            if (saved) {
                var loaded = JSON.parse(saved);
                if (loaded && loaded.sketch && loaded.sketch.textBlocks) {
                    // data seems legit
                    _this.state.retained = loaded;
                    _this.state.retained.sketch.loading = true;
                    events.sketch.loaded.dispatch(_this.state.retained.sketch);
                    for (var _i = 0, _a = _this.state.retained.sketch.textBlocks; _i < _a.length; _i++) {
                        var tb = _a[_i];
                        events.textblock.loaded.dispatch(tb);
                    }
                    events.designer.zoomToFitRequested.dispatch();
                    _this.state.retained.sketch.loading = false;
                    success = true;
                }
            }
            events.app.retainedStateLoadAttemptComplete.dispatch(success);
        });
        actions.app.saveRetainedState.subscribe(function (m) {
            if (!localStorage || !localStorage.getItem) {
                // not supported
                return;
            }
            localStorage.setItem(Store.AUTOSAVE_KEY, JSON.stringify(_this.state.retained));
        });
        actions.app.loadFont.subscribe(function (m) {
            return _this.resources.parsedFonts.get(m.data);
        });
        // ----- Designer -----
        actions.designer.zoomToFit.subscribe(function (m) {
            events.designer.zoomToFitRequested.dispatch(null);
        });
        // ----- Sketch -----
        actions.sketch.create
            .subscribe(function (m) {
            _this.state.retained.sketch = _this.createSketch();
            var patch = m.data || {};
            patch.backgroundColor = patch.backgroundColor || '#f6f3eb';
            _this.assign(_this.state.retained.sketch, patch);
            events.sketch.loaded.dispatch(_this.state.retained.sketch);
            events.designer.zoomToFitRequested.dispatch();
            _this.resources.parsedFonts.get(_this.state.retained.sketch.defaultFontDesc.url);
            _this.state.disposable.editingItem = null;
            _this.state.disposable.selection = null;
            _this.changedRetainedState();
        });
        actions.sketch.attrUpdate
            .subscribe(function (ev) {
            _this.assign(_this.state.retained.sketch, ev.data);
            events.sketch.attrChanged.dispatch(_this.state.retained.sketch);
            _this.changedRetainedState();
        });
        actions.sketch.setEditingItem.subscribe(function (m) {
            var item = _this.getBlock(m.data.itemId);
            _this.state.disposable.editingItem = {
                itemId: m.data.itemId,
                itemType: "TextBlock",
                item: item,
                clientX: m.data.clientX,
                clientY: m.data.clientY
            };
            events.sketch.editingItemChanged.dispatch(_this.state.disposable.editingItem);
        });
        actions.sketch.setSelection.subscribe(function (m) {
            if (m.data.itemType && m.data.itemType !== "TextBlock") {
                throw "Unhandled type " + m.type;
            }
            if ((m.data && m.data.itemId)
                === (_this.state.disposable.selection && _this.state.disposable.selection.itemId)) {
                // nothing to do
                return;
            }
            _this.state.disposable.selection = {
                itemId: m.data.itemId,
                itemType: m.data.itemType,
                priorSelectionItemId: _this.state.disposable.selection
                    && _this.state.disposable.selection.itemId
            };
            events.sketch.selectionChanged.dispatch(_this.state.disposable.selection);
        });
        // ----- TextBlock -----
        actions.textBlock.add
            .subscribe(function (ev) {
            var patch = ev.data;
            if (!patch.text || !patch.text.length) {
                return;
            }
            var block = { _id: newid() };
            _this.assign(block, patch);
            if (!block.fontSize) {
                block.fontSize = 128;
            }
            if (!block.textColor) {
                block.textColor = "gray";
            }
            if (block.fontDesc) {
                _this.state.retained.sketch.defaultFontDesc = block.fontDesc;
            }
            else {
                block.fontDesc = _this.state.retained.sketch.defaultFontDesc;
            }
            _this.state.retained.sketch.textBlocks.push(block);
            events.textblock.added.dispatch(block);
            _this.changedRetainedState();
        });
        actions.textBlock.updateAttr
            .subscribe(function (ev) {
            var block = _this.getBlock(ev.data._id);
            if (block) {
                var patch_1 = {
                    text: ev.data.text,
                    backgroundColor: ev.data.backgroundColor,
                    textColor: ev.data.textColor,
                    fontDesc: ev.data.fontDesc,
                    fontSize: ev.data.fontSize
                };
                _this.assign(block, patch_1);
                if (block.fontDesc) {
                    _this.state.retained.sketch.defaultFontDesc = block.fontDesc;
                }
                events.textblock.attrChanged.dispatch(block);
                _this.changedRetainedState();
            }
        });
        actions.textBlock.remove
            .subscribe(function (ev) {
            var didDelete = false;
            _.remove(_this.state.retained.sketch.textBlocks, function (tb) {
                if (tb._id === ev.data._id) {
                    didDelete = true;
                    return true;
                }
            });
            if (didDelete) {
                events.textblock.removed.dispatch({ _id: ev.data._id });
                if (_this.state.disposable.editingItem.itemId == ev.data._id) {
                    _this.state.disposable.editingItem = {};
                    events.sketch.editingItemChanged.dispatch(_this.state.disposable.editingItem);
                }
                _this.changedRetainedState();
            }
        });
        actions.textBlock.updateArrange
            .subscribe(function (ev) {
            var block = _this.getBlock(ev.data._id);
            if (block) {
                block.position = ev.data.position;
                block.outline = ev.data.outline;
                events.textblock.arrangeChanged.dispatch(block);
                _this.changedRetainedState();
            }
        });
    };
    Store.prototype.loadResources = function () {
        var _this = this;
        var loader = new FontFamiliesLoader();
        loader.loadListLocal(function (families) {
            var dict = _this.resources.fontFamilies;
            for (var _i = 0, families_1 = families; _i < families_1.length; _i++) {
                var familyGroup = families_1[_i];
                dict[familyGroup.family] = familyGroup;
            }
            // load fonts into browser for preview
            loader.loadForPreview(families.map(function (f) { return f.family; }));
            _this.resources.parsedFonts.get(Store.ROBOTO_500_LOCAL);
            _this.events.app.resourcesReady.dispatch(true);
        });
    };
    Store.prototype.changedRetainedState = function () {
        this.events.app.retainedStateChanged.dispatch(this.state.retained);
    };
    Store.prototype.assign = function (dest, source) {
        _.merge(dest, source);
    };
    Store.prototype.createSketch = function () {
        return {
            defaultFontDesc: {
                family: "Roboto",
                variant: null,
                category: null,
                url: Store.ROBOTO_500_LOCAL
            },
            textBlocks: []
        };
    };
    Store.prototype.getBlock = function (id) {
        return _.find(this.state.retained.sketch.textBlocks, function (tb) { return tb._id === id; });
    };
    Store.ROBOTO_500_LOCAL = 'fonts/Roboto-500.ttf';
    Store.AUTOSAVE_KEY = "Fiddlesticks.retainedState";
    Store.DEFAULT_FONT_NAME = "Roboto";
    return Store;
}());
var ColorPicker = (function () {
    function ColorPicker() {
    }
    ColorPicker.setup = function (elem, onChange) {
        var sel = $(elem);
        $(elem).spectrum({
            showInput: true,
            allowEmpty: true,
            preferredFormat: "hex",
            showButtons: false,
            showAlpha: true,
            showPalette: true,
            showSelectionPalette: true,
            palette: [
                ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
                ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
                ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
                ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
                ["#c00", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
                ["#900", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
                ["#600", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"]
            ],
            localStorageKey: "sketchtext",
            change: onChange
        });
    };
    ;
    ColorPicker.set = function (elem, value) {
        $(elem).spectrum("set", value);
    };
    ColorPicker.destroy = function (elem) {
        $(elem).spectrum("destroy");
    };
    return ColorPicker;
}());
var FontPicker = (function (_super) {
    __extends(FontPicker, _super);
    function FontPicker(props) {
        _super.call(this, props);
        this.previewFontSize = "28px";
        this.state = {};
        if (this.props.selection) {
            this.state.familyObject = this.props.store.resources.fontFamilies[this.props.selection.family];
            this.state.variant = this.props.selection.variant;
        }
    }
    FontPicker.prototype.render = function () {
        var _this = this;
        var familyOptionRender = function (option) {
            var fontFamily = option.value;
            return rh("div", {
                style: {
                    fontFamily: fontFamily,
                    fontSize: _this.previewFontSize
                }
            }, [fontFamily]);
        };
        var variantOptionRender = function (option) {
            var fontVariant = option.value;
            var style = FontHelpers.getCssStyle(_this.state.familyObject.family, fontVariant);
            style.fontSize = _this.previewFontSize;
            return rh("div", { style: style }, [(_this.state.familyObject.family + " " + option.value)]);
        };
        return rh("div", {
            className: "font-picker"
        }, [
            rh(ReactSelect, {
                name: "font-family",
                key: "font-family",
                className: "font-family",
                value: this.state.familyObject && this.state.familyObject.family,
                clearable: false,
                options: this.getFamilyOptions(),
                optionRenderer: familyOptionRender,
                valueRenderer: familyOptionRender,
                onChange: function (f) {
                    var familyObject = _this.props.store.resources.fontFamilies[f];
                    var variant = _.last(familyObject.variants
                        .filter(function (v) { return v.indexOf("italic") < 0; }));
                    _this.setState({
                        familyObject: familyObject,
                        variant: variant
                    }, function () { return _this.sendSelectionChanged(); });
                }
            }),
            // only show for multiple variants
            this.state.familyObject && this.state.familyObject.variants.length > 1 &&
                rh(ReactSelect, {
                    name: "font-variant",
                    key: "font-variant",
                    className: "font-variant",
                    clearable: false,
                    value: this.state.variant,
                    options: this.state.familyObject && this.state.familyObject.variants.map(function (v) {
                        return { value: v, label: v };
                    }),
                    optionRenderer: variantOptionRender,
                    valueRenderer: variantOptionRender,
                    onChange: function (value) {
                        _this.setState({
                            familyObject: _this.state.familyObject,
                            variant: value
                        }, function () { return _this.sendSelectionChanged(); });
                    }
                }),
        ]);
    };
    FontPicker.prototype.sendSelectionChanged = function () {
        this.props.selectionChanged(FontHelpers.getDescription(this.state.familyObject, this.state.variant));
    };
    FontPicker.prototype.getFamilyOptions = function () {
        var options = _.values(this.props.store.resources.fontFamilies)
            .map(function (fontFamily) { return { value: fontFamily.family, label: fontFamily.family }; });
        return options;
    };
    return FontPicker;
}(React.Component));
var SelectedItemEditor = (function () {
    function SelectedItemEditor(container, store) {
        var dom$ = store.events.mergeTyped(store.events.sketch.editingItemChanged, store.events.sketch.loaded).map(function (i) {
            if (!i.data || !i.data.itemId) {
                return h('div#editorOverlay', {
                    style: {
                        display: "none"
                    }
                });
            }
            if (i.data.itemType !== 'TextBlock') {
                return;
            }
            var block = i.data.item;
            return h('div#editorOverlay', {
                style: {
                    left: i.data.clientX + "px",
                    top: i.data.clientY + "px",
                    "z-index": 1
                }
            }, [
                new TextBlockEditor(store).render(block)
            ]);
        });
        ReactiveDom.renderStream(dom$, container);
    }
    return SelectedItemEditor;
}());
var SketchEditor = (function (_super) {
    __extends(SketchEditor, _super);
    function SketchEditor(container, store) {
        var _this = this;
        _super.call(this);
        this._store = store;
        var sketchDom$ = store.events.merge(store.events.sketch.loaded, store.events.sketch.attrChanged)
            .map(function (m) { return _this.render(store.state.retained.sketch); });
        ReactiveDom.renderStream(sketchDom$, container);
    }
    SketchEditor.prototype.render = function (sketch) {
        var _this = this;
        return h("div", [
            h("label", "Add text: "),
            h("input.add-text", {
                on: {
                    keypress: function (ev) {
                        if (ev.which === 13 || ev.keyCode === 13) {
                            var text = ev.target && ev.target.value;
                            if (text.length) {
                                _this._store.actions.textBlock.add.dispatch({ text: text });
                                ev.target.value = '';
                            }
                        }
                    }
                },
                attrs: {
                    type: "text",
                },
                props: {
                    placeholder: "Press [Enter] to add"
                },
                style: {}
            }),
            // h("div.font-picker-container",
            //     {
            //         hook: {
            //             insert: (vnode) => {
            //                 const props: FontPickerProps = {
            //                     store: this._store,
            //                     selection: sketch.defaultFontDesc,
            //                     selectionChanged: (defaultFontDesc) => {
            //                         this._store.actions.sketch.attrUpdate.dispatch({ defaultFontDesc });
            //                     }
            //                 };
            //                 ReactDOM.render(rh(FontPicker, props), vnode.elm);
            //             },
            //         }
            //     }
            // ),            
            h("label", "Background: "),
            h("input.background-color", {
                props: {
                    type: "text",
                    value: sketch.backgroundColor
                },
                hook: {
                    insert: function (vnode) {
                        return ColorPicker.setup(vnode.elm, function (color) {
                            _this._store.actions.sketch.attrUpdate.dispatch({ backgroundColor: color && color.toHexString() });
                        });
                    },
                    update: function (oldVnode, vnode) {
                        ColorPicker.set(vnode.elm, sketch.backgroundColor);
                    },
                    destroy: function (vnode) { return ColorPicker.destroy(vnode.elm); }
                }
            }),
            BootScript.dropdown({
                id: "sketchMenu",
                content: "Fiddle",
                items: [
                    {
                        content: "New",
                        attrs: {
                            title: "Create new sketch"
                        },
                        onClick: function () { return _this._store.actions.sketch.create.dispatch(); }
                    },
                    {
                        content: "Zoom to fit",
                        attrs: {
                            title: "Fit sketch contents in view"
                        },
                        onClick: function () { return _this._store.actions.designer.zoomToFit.dispatch(); }
                    }
                ]
            })
        ]);
    };
    return SketchEditor;
}(Component));
var TextBlockEditor = (function (_super) {
    __extends(TextBlockEditor, _super);
    function TextBlockEditor(store) {
        _super.call(this);
        this.store = store;
    }
    TextBlockEditor.prototype.render = function (textBlock) {
        var _this = this;
        var update = function (tb) {
            tb._id = textBlock._id;
            _this.store.actions.textBlock.updateAttr.dispatch(tb);
        };
        return h("div.text-block-editor", {}, [
            h("textarea", {
                attrs: {},
                props: {
                    value: textBlock.text
                },
                on: {
                    keyup: function (e) { return update({ text: e.target.value }); },
                    change: function (e) { return update({ text: e.target.value }); }
                }
            }),
            h("div", {}, [
                h("div.font-color-icon.fore", {}, "A"),
                h("input.text-color", {
                    attrs: {
                        type: "text"
                    },
                    props: {
                        title: "Text color",
                        value: textBlock.textColor
                    },
                    hook: {
                        insert: function (vnode) {
                            return ColorPicker.setup(vnode.elm, function (color) { return update({ textColor: color && color.toHexString() }); });
                        },
                        destroy: function (vnode) { return ColorPicker.destroy(vnode.elm); }
                    }
                })
            ]),
            h("div", {}, [
                h("div.font-color-icon.back", {}, "A"),
                h("input.background-color", {
                    attrs: {
                        type: "text"
                    },
                    props: {
                        title: "Background color",
                        value: textBlock.backgroundColor
                    },
                    hook: {
                        insert: function (vnode) {
                            return ColorPicker.setup(vnode.elm, function (color) { return update({ backgroundColor: color && color.toHexString() }); });
                        },
                        destroy: function (vnode) { return ColorPicker.destroy(vnode.elm); }
                    }
                })
            ]),
            h("button.delete-textblock.btn.btn-danger", {
                type: "button",
                props: {
                    title: "Delete"
                },
                on: {
                    click: function (e) { return _this.store.actions.textBlock.remove.dispatch(textBlock); }
                }
            }, [
                h("span.glyphicon.glyphicon-trash")
            ]),
            h("div.font-picker-container", {
                hook: {
                    insert: function (vnode) {
                        var props = {
                            store: _this.store,
                            selection: textBlock.fontDesc,
                            selectionChanged: function (fontDesc) {
                                update({ fontDesc: fontDesc });
                            }
                        };
                        ReactDOM.render(rh(FontPicker, props), vnode.elm);
                    },
                }
            }),
            h("div.end-controls", {}, [])
        ]);
    };
    return TextBlockEditor;
}(Component));
var WorkspaceController = (function () {
    function WorkspaceController(store, fallbackFont) {
        var _this = this;
        this.defaultSize = new paper.Size(50000, 40000);
        this.defaultScale = 0.02;
        this._textBlockItems = {};
        this._store = store;
        this.fallbackFont = fallbackFont;
        paper.settings.handleSize = 1;
        this.canvas = document.getElementById('mainCanvas');
        paper.setup(this.canvas);
        this.project = paper.project;
        this.viewZoom = new ViewZoom(this.project);
        var clearSelection = function (ev) {
            store.actions.sketch.setSelection.dispatch({});
        };
        paper.view.on(paper.EventType.click, clearSelection);
        paper.view.on(PaperHelpers.EventType.smartDragStart, clearSelection);
        store.events.sketch.loaded.subscribe(function (ev) {
            _this._sketch = ev.data;
            _this.project.clear();
            _this.project.deselectAll();
            _this._textBlockItems = {};
        });
        store.events.mergeTyped(store.events.textblock.added, store.events.textblock.loaded).subscribe(function (ev) { return _this.addBlock(ev.data); });
        store.events.textblock.attrChanged
            .observe()
            .throttle(WorkspaceController.TEXT_CHANGE_RENDER_THROTTLE_MS)
            .subscribe(function (m) {
            var item = _this._textBlockItems[m.data._id];
            if (item) {
                var textBlock = m.data;
                item.text = textBlock.text;
                if (textBlock.fontDesc && textBlock.fontDesc.url) {
                    // push in font when ready
                    store.resources.parsedFonts.get(textBlock.fontDesc.url, function (url, font) { return item.font = font; });
                }
                item.customStyle = {
                    fontSize: textBlock.fontSize,
                    fillColor: textBlock.textColor,
                    backgroundColor: textBlock.backgroundColor
                };
            }
        });
        store.events.textblock.removed.subscribe(function (m) {
            var item = _this._textBlockItems[m.data._id];
            if (item) {
                item.remove();
                delete _this._textBlockItems[m.data._id];
            }
        });
        store.events.sketch.selectionChanged.subscribe(function (m) {
            if (!m.data || !m.data.itemId) {
                _this.project.deselectAll();
                store.events.sketch.editingItemChanged.dispatch({});
                return;
            }
            var item = m.data.itemId && _this._textBlockItems[m.data.itemId];
            if (item && !item.selected) {
                _this.project.deselectAll();
                store.events.sketch.editingItemChanged.dispatch({});
                item.selected = true;
            }
        });
        store.events.designer.zoomToFitRequested.subscribe(function () {
            _this.zoomToFit();
        });
    }
    WorkspaceController.prototype.zoomToFit = function () {
        var bounds;
        _.forOwn(this._textBlockItems, function (item) {
            bounds = bounds
                ? bounds.unite(item.bounds)
                : item.bounds;
        });
        if (!bounds) {
            bounds = new paper.Rectangle(new paper.Point(0, 0), this.defaultSize.multiply(this.defaultScale));
        }
        this.viewZoom.zoomTo(bounds.scale(1.05));
    };
    WorkspaceController.prototype.addBlock = function (textBlock) {
        var _this = this;
        if (!textBlock) {
            return;
        }
        if (!textBlock._id) {
            console.error('received block without id', textBlock);
        }
        var item = this._textBlockItems[textBlock._id];
        if (item) {
            console.error("Received addBlock for block that is already loaded");
            return;
        }
        var bounds;
        if (textBlock.outline) {
            var loadSegment = function (record) {
                var point = record[0];
                if (point instanceof Array) {
                    return new paper.Segment(new paper.Point(record[0]), record[1] && new paper.Point(record[1]), record[2] && new paper.Point(record[2]));
                }
                // Single-point segments are stored as number[2]
                return new paper.Segment(new paper.Point(record));
            };
            bounds = {
                upper: textBlock.outline.top.segments.map(loadSegment),
                lower: textBlock.outline.bottom.segments.map(loadSegment)
            };
        }
        item = new TextWarp(this.fallbackFont, textBlock.text, bounds, textBlock.fontSize, {
            fontSize: textBlock.fontSize,
            fillColor: textBlock.textColor || "red",
            backgroundColor: textBlock.backgroundColor
        });
        if (textBlock.fontDesc && textBlock.fontDesc.url) {
            // push in font when ready
            this._store.resources.parsedFonts.get(textBlock.fontDesc.url, function (url, font) { return item.font = font; });
        }
        if (!textBlock.outline && textBlock.position) {
            item.position = new paper.Point(textBlock.position);
        }
        var sendEditAction = function () {
            var editorAt = _this.project.view.projectToView(PaperHelpers.midpoint(item.bounds.topLeft, item.bounds.center));
            _this._store.actions.sketch.setEditingItem.dispatch({
                itemId: textBlock._id,
                itemType: "TextBlock",
                clientX: editorAt.x,
                clientY: editorAt.y
            });
        };
        item.on(PaperHelpers.EventType.clickWithoutDrag, function (ev) {
            item.bringToFront();
            if (item.selected) {
                sendEditAction();
            }
            else {
                // select item
                _this._store.actions.sketch.setSelection.dispatch({ itemId: textBlock._id, itemType: "TextBlock" });
            }
        });
        item.on(PaperHelpers.EventType.smartDragStart, function (ev) {
            item.bringToFront();
            if (!item.selected) {
                _this._store.actions.sketch.setSelection.dispatch({ itemId: textBlock._id, itemType: "TextBlock" });
            }
        });
        item.on(PaperHelpers.EventType.smartDragEnd, function (ev) {
            var block = _this.getBlockArrangement(item);
            block._id = textBlock._id;
            _this._store.actions.textBlock.updateArrange.dispatch(block);
        });
        var itemChange$ = PaperNotify.observe(item, PaperNotify.ChangeFlag.GEOMETRY);
        itemChange$
            .debounce(WorkspaceController.BLOCK_BOUNDS_CHANGE_THROTTLE_MS)
            .subscribe(function () {
            var block = _this.getBlockArrangement(item);
            block._id = textBlock._id;
            _this._store.actions.textBlock.updateArrange.dispatch(block);
        });
        item.data = textBlock._id;
        if (!textBlock.position) {
            item.position = this.project.view.bounds.point.add(new paper.Point(item.bounds.width / 2, item.bounds.height / 2)
                .add(50));
        }
        this._textBlockItems[textBlock._id] = item;
        if (!this._store.state.retained.sketch.loading
            && this._store.state.retained.sketch.textBlocks.length <= 1) {
            // open editor for newly added block
            sendEditAction();
        }
    };
    WorkspaceController.prototype.getBlockArrangement = function (item) {
        // export returns an array with item type and serialized object:
        //   ["Path", PathRecord]
        var top = item.upper.exportJSON({ asString: false })[1];
        var bottom = item.lower.exportJSON({ asString: false })[1];
        return {
            position: [item.position.x, item.position.y],
            outline: { top: top, bottom: bottom }
        };
    };
    WorkspaceController.TEXT_CHANGE_RENDER_THROTTLE_MS = 500;
    WorkspaceController.BLOCK_BOUNDS_CHANGE_THROTTLE_MS = 500;
    return WorkspaceController;
}());
var PerspectiveTransform = (function () {
    function PerspectiveTransform(source, dest) {
        this.source = source;
        this.dest = dest;
        this.matrix = PerspectiveTransform.createMatrix(source, dest);
    }
    // Given a 4x4 perspective transformation matrix, and a 2D point (a 2x1 vector),
    // applies the transformation matrix by converting the point to homogeneous
    // coordinates at z=0, post-multiplying, and then applying a perspective divide.
    PerspectiveTransform.prototype.transformPoint = function (point) {
        var p3 = PerspectiveTransform.multiply(this.matrix, [point.x, point.y, 0, 1]);
        var result = new paper.Point(p3[0] / p3[3], p3[1] / p3[3]);
        return result;
    };
    PerspectiveTransform.createMatrix = function (source, target) {
        var sourcePoints = [
            [source.a.x, source.a.y],
            [source.b.x, source.b.y],
            [source.c.x, source.c.y],
            [source.d.x, source.d.y]];
        var targetPoints = [
            [target.a.x, target.a.y],
            [target.b.x, target.b.y],
            [target.c.x, target.c.y],
            [target.d.x, target.d.y]];
        for (var a = [], b = [], i = 0, n = sourcePoints.length; i < n; ++i) {
            var s = sourcePoints[i], t = targetPoints[i];
            a.push([s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]]), b.push(t[0]);
            a.push([0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]]), b.push(t[1]);
        }
        var X = solve(a, b, true);
        return [
            X[0], X[3], 0, X[6],
            X[1], X[4], 0, X[7],
            0, 0, 1, 0,
            X[2], X[5], 0, 1
        ].map(function (x) {
            return Math.round(x * 100000) / 100000;
        });
    };
    // Post-multiply a 4x4 matrix in column-major order by a 4x1 column vector:
    // [ m0 m4 m8  m12 ]   [ v0 ]   [ x ]
    // [ m1 m5 m9  m13 ] * [ v1 ] = [ y ]
    // [ m2 m6 m10 m14 ]   [ v2 ]   [ z ]
    // [ m3 m7 m11 m15 ]   [ v3 ]   [ w ]
    PerspectiveTransform.multiply = function (matrix, vector) {
        return [
            matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12] * vector[3],
            matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13] * vector[3],
            matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14] * vector[3],
            matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15] * vector[3]
        ];
    };
    return PerspectiveTransform;
}());
var Quad = (function () {
    function Quad(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    Quad.fromRectangle = function (rect) {
        return new Quad(rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight);
    };
    Quad.fromCoords = function (coords) {
        return new Quad(new paper.Point(coords[0], coords[1]), new paper.Point(coords[2], coords[3]), new paper.Point(coords[4], coords[5]), new paper.Point(coords[6], coords[7]));
    };
    Quad.prototype.asCoords = function () {
        return [
            this.a.x, this.a.y,
            this.b.x, this.b.y,
            this.c.x, this.c.y,
            this.d.x, this.d.y
        ];
    };
    return Quad;
}());
var DualBoundsPathWarp = (function (_super) {
    __extends(DualBoundsPathWarp, _super);
    function DualBoundsPathWarp(source, bounds, customStyle) {
        var _this = this;
        _super.call(this);
        // -- build children --
        this._source = source;
        this._source.visible = false;
        if (bounds) {
            this._upper = new StretchPath(bounds.upper);
            this._lower = new StretchPath(bounds.lower);
        }
        else {
            this._upper = new StretchPath([
                new paper.Segment(source.bounds.topLeft),
                new paper.Segment(source.bounds.topRight)
            ]);
            this._lower = new StretchPath([
                new paper.Segment(source.bounds.bottomLeft),
                new paper.Segment(source.bounds.bottomRight)
            ]);
        }
        this.controlBoundsOpacity = 0.75;
        this._upper.visible = this.selected;
        this._lower.visible = this.selected;
        this._outline = new paper.Path({ closed: true });
        this.updateOutlineShape();
        this._warped = new paper.CompoundPath(source.pathData);
        this.updateWarped();
        // -- add children --
        this.addChildren([this._outline, this._warped, this._upper, this._lower]);
        // -- assign style --
        this.customStyle = customStyle || {
            strokeColor: "lightgray"
        };
        PaperHelpers.addSmartDrag(this);
        // -- set up observers --
        var handlePathChange = function (path) {
            _this.updateOutlineShape();
            _this.updateWarped();
            _this._changed(PaperNotify.ChangeFlag.GEOMETRY);
        };
        this._upper.pathChanged.subscribe(handlePathChange);
        this._lower.pathChanged.subscribe(handlePathChange);
        this.subscribe(function (flags) {
            if (flags & PaperNotify.ChangeFlag.ATTRIBUTE) {
                if (_this._upper.visible !== _this.selected) {
                    _this._upper.visible = _this.selected;
                    _this._lower.visible = _this.selected;
                }
            }
        });
    }
    Object.defineProperty(DualBoundsPathWarp.prototype, "upper", {
        get: function () {
            return this._upper.path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DualBoundsPathWarp.prototype, "lower", {
        get: function () {
            return this._lower.path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DualBoundsPathWarp.prototype, "source", {
        get: function () {
            return this._source.clone();
        },
        set: function (value) {
            this._source = value;
            this.updateWarped();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DualBoundsPathWarp.prototype, "customStyle", {
        get: function () {
            return this._customStyle;
        },
        set: function (value) {
            this._customStyle = value;
            this._warped.style = value;
            if (value.backgroundColor) {
                this._outline.fillColor = value.backgroundColor;
                this._outline.opacity = 1;
            }
            else {
                this._outline.fillColor = "white";
                this._outline.opacity = 0;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DualBoundsPathWarp.prototype, "controlBoundsOpacity", {
        set: function (value) {
            this._upper.opacity = this._lower.opacity = value;
        },
        enumerable: true,
        configurable: true
    });
    DualBoundsPathWarp.prototype.updateWarped = function () {
        var orthOrigin = this._source.bounds.topLeft;
        var orthWidth = this._source.bounds.width;
        var orthHeight = this._source.bounds.height;
        var projection = PaperHelpers.dualBoundsPathProjection(this._upper.path, this._lower.path);
        var transform = new PathTransform(function (point) {
            if (!point) {
                return point;
            }
            var relative = point.subtract(orthOrigin);
            var unit = new paper.Point(relative.x / orthWidth, relative.y / orthHeight);
            var projected = projection(unit);
            return projected;
        });
        var newPaths = this._source.children
            .map(function (item) {
            var path = item;
            var xPoints = PaperHelpers.tracePathAsPoints(path, DualBoundsPathWarp.POINTS_PER_PATH)
                .map(function (p) { return transform.transformPoint(p); });
            var xPath = new paper.Path({
                segments: xPoints,
                closed: true,
                clockwise: path.clockwise
            });
            //xPath.simplify();
            return xPath;
        });
        this._warped.removeChildren();
        this._warped.addChildren(newPaths);
    };
    DualBoundsPathWarp.prototype.updateOutlineShape = function () {
        var lower = new paper.Path(this._lower.path.segments);
        lower.reverse();
        this._outline.segments = this._upper.path.segments.concat(lower.segments);
        lower.remove();
    };
    DualBoundsPathWarp.POINTS_PER_PATH = 200;
    return DualBoundsPathWarp;
}(paper.Group));
var PathHandle = (function (_super) {
    __extends(PathHandle, _super);
    function PathHandle(attach) {
        var _this = this;
        _super.call(this);
        this._curveSplit = new ObservableEvent();
        var position;
        var path;
        if (attach instanceof paper.Segment) {
            this._segment = attach;
            position = this._segment.point;
            path = this._segment.path;
        }
        else if (attach instanceof paper.Curve) {
            this._curve = attach;
            position = this._curve.getPointAt(this._curve.length * 0.5);
            path = this._curve.path;
        }
        else {
            throw "attach must be Segment or Curve";
        }
        this._marker = paper.Shape.Circle(position, PathHandle.MARKER_RADIUS);
        this._marker.strokeColor = "blue";
        this._marker.fillColor = "white";
        this.addChild(this._marker);
        if (this._segment) {
            this.styleAsSegment();
        }
        else {
            this.styleAsCurve();
        }
        PaperHelpers.addSmartDrag(this);
        this.on(PaperHelpers.EventType.smartDragStart, function (ev) {
            if (_this._curve) {
                // split the curve, pupate to segment handle
                _this._curveChangeUnsub();
                _this._segment = new paper.Segment(_this.center);
                var curveIdx = _this._curve.index;
                _this._curve.path.insert(curveIdx + 1, _this._segment);
                _this._curve = null;
                _this.styleAsSegment();
                _this.curveSplit.notify(curveIdx);
            }
        });
        this.on(PaperHelpers.EventType.smartDragMove, function (ev) {
            if (_this._segment) {
                _this._segment.point = _this.center;
                if (_this._smoothed) {
                    _this._segment.smooth();
                }
            }
        });
        this.on(PaperHelpers.EventType.clickWithoutDrag, function (ev) {
            if (_this._segment) {
                _this.smoothed = !_this.smoothed;
            }
        });
        this._curveChangeUnsub = path.subscribe(function (flags) {
            if (_this._curve && !_this._segment
                && (flags & PaperNotify.ChangeFlag.SEGMENTS)) {
                _this.center = _this._curve.getPointAt(_this._curve.length * 0.5);
            }
        });
    }
    Object.defineProperty(PathHandle.prototype, "smoothed", {
        get: function () {
            return this._smoothed;
        },
        set: function (value) {
            this._smoothed = value;
            if (value) {
                this._segment.smooth();
            }
            else {
                this._segment.handleIn = null;
                this._segment.handleOut = null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathHandle.prototype, "curveSplit", {
        get: function () {
            return this._curveSplit;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathHandle.prototype, "center", {
        get: function () {
            return this.position;
        },
        set: function (point) {
            this.position = point;
        },
        enumerable: true,
        configurable: true
    });
    PathHandle.prototype.styleAsSegment = function () {
        this._marker.opacity = 0.8;
    };
    PathHandle.prototype.styleAsCurve = function () {
        this._marker.opacity = 0.3;
    };
    PathHandle.MARKER_RADIUS = 8;
    PathHandle.DRAG_THRESHOLD = 3;
    return PathHandle;
}(paper.Group));
var PathSection = (function () {
    function PathSection(path, offset, length) {
        this.path = path;
        this.offset = offset;
        this.length = length;
    }
    PathSection.prototype.getPointAt = function (offset) {
        return this.path.getPointAt(offset + this.offset);
    };
    return PathSection;
}());
var PathTransform = (function () {
    function PathTransform(pointTransform) {
        this.pointTransform = pointTransform;
    }
    PathTransform.prototype.transformPoint = function (point) {
        return this.pointTransform(point);
    };
    PathTransform.prototype.transformPathItem = function (path) {
        if (path.className === 'CompoundPath') {
            this.transformCompoundPath(path);
        }
        else {
            this.transformPath(path);
        }
    };
    PathTransform.prototype.transformCompoundPath = function (path) {
        for (var _i = 0, _a = path.children; _i < _a.length; _i++) {
            var p = _a[_i];
            this.transformPath(p);
        }
    };
    PathTransform.prototype.transformPath = function (path) {
        for (var _i = 0, _a = path.segments; _i < _a.length; _i++) {
            var segment = _a[_i];
            var origPoint = segment.point;
            var newPoint = this.transformPoint(segment.point);
            origPoint.x = newPoint.x;
            origPoint.y = newPoint.y;
        }
    };
    return PathTransform;
}());
var StretchPath = (function (_super) {
    __extends(StretchPath, _super);
    function StretchPath(segments, style) {
        _super.call(this);
        this._pathChanged = new ObservableEvent();
        this._path = new paper.Path(segments);
        this.addChild(this._path);
        if (style) {
            this._path.style = style;
        }
        else {
            this._path.strokeColor = "lightgray";
            this._path.strokeWidth = 6;
        }
        for (var _i = 0, _a = this._path.segments; _i < _a.length; _i++) {
            var s = _a[_i];
            this.addSegmentHandle(s);
        }
        for (var _b = 0, _c = this._path.curves; _b < _c.length; _b++) {
            var c = _c[_b];
            this.addCurveHandle(c);
        }
    }
    Object.defineProperty(StretchPath.prototype, "path", {
        get: function () {
            return this._path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StretchPath.prototype, "pathChanged", {
        get: function () {
            return this._pathChanged;
        },
        enumerable: true,
        configurable: true
    });
    StretchPath.prototype.addSegmentHandle = function (segment) {
        this.addHandle(new PathHandle(segment));
    };
    StretchPath.prototype.addCurveHandle = function (curve) {
        var _this = this;
        var handle = new PathHandle(curve);
        handle.curveSplit.subscribeOne(function (curveIdx) {
            _this.addCurveHandle(_this._path.curves[curveIdx]);
            _this.addCurveHandle(_this._path.curves[curveIdx + 1]);
        });
        this.addHandle(handle);
    };
    StretchPath.prototype.addHandle = function (handle) {
        var _this = this;
        handle.visible = this.visible;
        handle.on(PaperHelpers.EventType.smartDragMove, function (ev) {
            _this._pathChanged.notify(_this._path);
        });
        handle.on(PaperHelpers.EventType.clickWithoutDrag, function (ev) {
            _this._pathChanged.notify(_this._path);
        });
        this.addChild(handle);
    };
    return StretchPath;
}(paper.Group));
/**
 * Measures offsets of text glyphs.
 */
var TextRuler = (function () {
    function TextRuler() {
    }
    TextRuler.prototype.createPointText = function (text) {
        var pointText = new paper.PointText();
        pointText.content = text;
        pointText.justification = "center";
        if (this.fontFamily) {
            pointText.fontFamily = this.fontFamily;
        }
        if (this.fontWeight) {
            pointText.fontWeight = this.fontWeight;
        }
        if (this.fontSize) {
            pointText.fontSize = this.fontSize;
        }
        return pointText;
    };
    TextRuler.prototype.getTextOffsets = function (text) {
        // Measure glyphs in pairs to capture white space.
        // Pairs are characters i and i+1.
        var glyphPairs = [];
        for (var i = 0; i < text.length; i++) {
            glyphPairs[i] = this.createPointText(text.substring(i, i + 1));
        }
        // For each character, find center offset.
        var xOffsets = [0];
        for (var i = 1; i < text.length; i++) {
            // Measure three characters at a time to get the appropriate 
            //   space before and after the glyph.
            var triadText = this.createPointText(text.substring(i - 1, i + 1));
            triadText.remove();
            // Subtract out half of prior glyph pair 
            //   and half of current glyph pair.
            // Must be right, because it works.
            var offsetWidth = triadText.bounds.width
                - glyphPairs[i - 1].bounds.width / 2
                - glyphPairs[i].bounds.width / 2;
            // Add offset width to prior offset. 
            xOffsets[i] = xOffsets[i - 1] + offsetWidth;
        }
        for (var _i = 0, glyphPairs_1 = glyphPairs; _i < glyphPairs_1.length; _i++) {
            var glyphPair = glyphPairs_1[_i];
            glyphPair.remove();
        }
        return xOffsets;
    };
    return TextRuler;
}());
var TextWarp = (function (_super) {
    __extends(TextWarp, _super);
    function TextWarp(font, text, bounds, fontSize, style) {
        if (!fontSize) {
            fontSize = TextWarp.DEFAULT_FONT_SIZE;
        }
        var pathData = TextWarp.getPathData(font, text, fontSize);
        var path = new paper.CompoundPath(pathData);
        _super.call(this, path, bounds, style);
        this._font = font;
        this._text = text;
    }
    Object.defineProperty(TextWarp.prototype, "text", {
        get: function () {
            return this._text;
        },
        set: function (value) {
            this._text = value;
            this.updateTextPath();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWarp.prototype, "fontSize", {
        get: function () {
            return this._fontSize;
        },
        set: function (value) {
            if (!value) {
                return;
            }
            this._fontSize = value;
            this.updateTextPath();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextWarp.prototype, "font", {
        set: function (value) {
            if (value !== this._font) {
                this._font = value;
                this.updateTextPath();
            }
        },
        enumerable: true,
        configurable: true
    });
    TextWarp.prototype.updateTextPath = function () {
        var pathData = TextWarp.getPathData(this._font, this._text, this._fontSize);
        this.source = new paper.CompoundPath(pathData);
    };
    TextWarp.getPathData = function (font, text, fontSize) {
        var openTypePath = font.getPath(text, 0, 0, Number(fontSize) || TextWarp.DEFAULT_FONT_SIZE);
        return openTypePath.toPathData();
    };
    TextWarp.DEFAULT_FONT_SIZE = 64;
    return TextWarp;
}(DualBoundsPathWarp));
var ViewZoom = (function () {
    function ViewZoom(project) {
        var _this = this;
        this.factor = 1.25;
        this.project = project;
        var view = this.project.view;
        $(view.element).mousewheel(function (event) {
            var mousePosition = new paper.Point(event.offsetX, event.offsetY);
            _this.changeZoomCentered(event.deltaY, mousePosition);
        });
        view.on("mousedrag", function (ev) {
            if (!_this._viewCenterStart) {
                _this._viewCenterStart = view.center;
                // Have to use native mouse offset, because ev.delta 
                //  changes as the view is scrolled.
                _this._mouseNativeStart = new paper.Point(ev.event.offsetX, ev.event.offsetY);
                view.emit(PaperHelpers.EventType.smartDragStart, ev);
            }
            else {
                var nativeDelta = new paper.Point(ev.event.offsetX - _this._mouseNativeStart.x, ev.event.offsetY - _this._mouseNativeStart.y);
                // Move into view coordinates to subract delta,
                //  then back into project coords.
                view.center = view.viewToProject(view.projectToView(_this._viewCenterStart)
                    .subtract(nativeDelta));
                view.emit(PaperHelpers.EventType.smartDragMove, ev);
            }
        });
        view.on("mouseup", function (ev) {
            if (_this._mouseNativeStart) {
                _this._mouseNativeStart = null;
                _this._viewCenterStart = null;
                view.emit(PaperHelpers.EventType.smartDragEnd, ev);
            }
        });
    }
    Object.defineProperty(ViewZoom.prototype, "zoom", {
        get: function () {
            return this.project.view.zoom;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewZoom.prototype, "zoomRange", {
        get: function () {
            return [this._minZoom, this._maxZoom];
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Set zoom level.
     * @returns zoom level that was set, or null if it was not changed
     */
    ViewZoom.prototype.setZoomConstrained = function (zoom) {
        if (this._minZoom) {
            zoom = Math.max(zoom, this._minZoom);
        }
        if (this._maxZoom) {
            zoom = Math.min(zoom, this._maxZoom);
        }
        var view = this.project.view;
        if (zoom != view.zoom) {
            view.zoom = zoom;
            return zoom;
        }
        return null;
    };
    ViewZoom.prototype.setZoomRange = function (range) {
        var view = this.project.view;
        var aSize = range.shift();
        var bSize = range.shift();
        var a = aSize && Math.min(view.bounds.height / aSize.height, view.bounds.width / aSize.width);
        var b = bSize && Math.min(view.bounds.height / bSize.height, view.bounds.width / bSize.width);
        var min = Math.min(a, b);
        if (min) {
            this._minZoom = min;
        }
        var max = Math.max(a, b);
        if (max) {
            this._maxZoom = max;
        }
        return [this._minZoom, this._maxZoom];
    };
    ViewZoom.prototype.changeZoomCentered = function (delta, mousePos) {
        if (!delta) {
            return;
        }
        var view = this.project.view;
        var oldZoom = view.zoom;
        var oldCenter = view.center;
        var viewPos = view.viewToProject(mousePos);
        var newZoom = delta > 0
            ? view.zoom * this.factor
            : view.zoom / this.factor;
        newZoom = this.setZoomConstrained(newZoom);
        if (!newZoom) {
            return;
        }
        var zoomScale = oldZoom / newZoom;
        var centerAdjust = viewPos.subtract(oldCenter);
        var offset = viewPos.subtract(centerAdjust.multiply(zoomScale))
            .subtract(oldCenter);
        view.center = view.center.add(offset);
    };
    ;
    ViewZoom.prototype.zoomTo = function (rect) {
        var view = this.project.view;
        view.center = rect.center;
        view.zoom = Math.min(view.viewSize.height / rect.height, view.viewSize.width / rect.width);
    };
    return ViewZoom;
}());
function bootstrap() {
    var store = new Store();
    var sketchEditor = new SketchEditor(document.getElementById('designer'), store);
    var selectedItemEditor = new SelectedItemEditor(document.getElementById("editorOverlay"), store);
    var appController = new AppController(store, sketchEditor, selectedItemEditor);
}
bootstrap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9fX2ZyYW1ld29yay9Gb250SGVscGVycy50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9IZWxwZXJzLnRzIiwiLi4vc3JjL19fZnJhbWV3b3JrL1R5cGVkQ2hhbm5lbC50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9jb2xsZWN0aW9ucy50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9ldmVudHMudHMiLCIuLi9zcmMvX19mcmFtZXdvcmsvYm9vdHNjcmlwdC9ib290c2NyaXB0LnRzIiwiLi4vc3JjL19fZnJhbWV3b3JrL3BhcGVyL1BhcGVySGVscGVycy50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9wYXBlci9QYXBlck5vdGlmeS50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9wYXBlci9wYXBlci1leHQudHMiLCIuLi9zcmMvX19mcmFtZXdvcmsvcG9zdGFsL1RvcGljLnRzIiwiLi4vc3JjL19fZnJhbWV3b3JrL3Bvc3RhbC9wb3N0YWwtb2JzZXJ2ZS50cyIsIi4uL3NyYy9fX2ZyYW1ld29yay9yZWFjdC9SZWFjdEhlbHBlcnMudHMiLCIuLi9zcmMvX19mcmFtZXdvcmsvdmRvbS9Db21wb25lbnQudHMiLCIuLi9zcmMvX19mcmFtZXdvcmsvdmRvbS9SZWFjdGl2ZURvbS50cyIsIi4uL3NyYy9fY29tbW9uL0FwcENvbnRyb2xsZXIudHMiLCIuLi9zcmMvX2NvbW1vbi9DaGFubmVscy50cyIsIi4uL3NyYy9fY29tbW9uL0ZvbnRGYW1pbGllc0xvYWRlci50cyIsIi4uL3NyYy9fY29tbW9uL1BhcnNlZEZvbnRzLnRzIiwiLi4vc3JjL19jb21tb24vU3RvcmUudHMiLCIuLi9zcmMvX2NvbW1vbi9jb25zdGFudHMudHMiLCIuLi9zcmMvX2NvbW1vbi9tb2RlbHMudHMiLCIuLi9zcmMvZGVzaWduZXIvQ29sb3JQaWNrZXIudHMiLCIuLi9zcmMvZGVzaWduZXIvRm9udFBpY2tlci50cyIsIi4uL3NyYy9kZXNpZ25lci9TZWxlY3RlZEl0ZW1FZGl0b3IudHMiLCIuLi9zcmMvZGVzaWduZXIvU2tldGNoRWRpdG9yLnRzIiwiLi4vc3JjL2Rlc2lnbmVyL1RleHRCbG9ja0VkaXRvci50cyIsIi4uL3NyYy9kZXNpZ25lci9Xb3Jrc3BhY2VDb250cm9sbGVyLnRzIiwiLi4vc3JjL21hdGgvUGVyc3BlY3RpdmVUcmFuc2Zvcm0udHMiLCIuLi9zcmMvd29ya3NwYWNlL0R1YWxCb3VuZHNQYXRoV2FycC50cyIsIi4uL3NyYy93b3Jrc3BhY2UvUGF0aEhhbmRsZS50cyIsIi4uL3NyYy93b3Jrc3BhY2UvUGF0aFNlY3Rpb24udHMiLCIuLi9zcmMvd29ya3NwYWNlL1BhdGhUcmFuc2Zvcm0udHMiLCIuLi9zcmMvd29ya3NwYWNlL1N0cmV0Y2hQYXRoLnRzIiwiLi4vc3JjL3dvcmtzcGFjZS9UZXh0UnVsZXIudHMiLCIuLi9zcmMvd29ya3NwYWNlL1RleHRXYXJwLnRzIiwiLi4vc3JjL3dvcmtzcGFjZS9WaWV3Wm9vbS50cyIsIi4uL3NyYy93b3Jrc3BhY2UvaW50ZXJmYWNlcy50cyIsIi4uL3NyYy96X2FwcC9ib290c3RyYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxJQUFVLFdBQVcsQ0FrQ3BCO0FBbENELFdBQVUsV0FBVyxFQUFDLENBQUM7SUFRbkIscUJBQTRCLE1BQWMsRUFBRSxPQUFlO1FBQ3ZELElBQUksS0FBSyxHQUFpQixFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUNqRCxFQUFFLENBQUEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDL0IsS0FBSyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FB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LENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLENBQUMsRUFBSyxDQUFDLEVBQUUsQ0FBQyxFQUFLLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUssQ0FBQztTQUN0QixDQUFDLEdBQUcsQ0FBQyxVQUFTLENBQUM7WUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDJFQUEyRTtJQUMzRSxxQ0FBcUM7SUFDckMscUNBQXFDO0lBQ3JDLHFDQUFxQztJQUNyQyxxQ0FBcUM7SUFDOUIsNkJBQVEsR0FBZixVQUFnQixNQUFNLEVBQUUsTUFBTTtRQUMxQixNQUFNLENBQUM7WUFDSCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcs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QUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBcElELElBb0lDO0FFbklEO0lBRUksSUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUUxQixJQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xGLElBQU0sa0JBQWtCLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRW5HLElBQU0sYUFBYSxHQUFHLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUVyRixDQUFDO0FBRUQsU0FBUyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxubmFtZXNwYWNlIEZvbnRIZWxwZXJzIHtcclxuICAgIFxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBWYXJpYW50U3R5bGUge1xyXG4gICAgICAgIGZvbnRGYW1pbHk/OiBzdHJpbmc7XHJcbiAgICAgICAgZm9udFdlaWdodD86IHN0cmluZztcclxuICAgICAgICBmb250U3R5bGU/OiBzdHJpbmc7ICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldENzc1N0eWxlKGZhbWlseTogc3RyaW5nLCB2YXJpYW50OiBzdHJpbmcpe1xyXG4gICAgICAgIGxldCBzdHlsZSA9IDxWYXJpYW50U3R5bGU+eyBmb250RmFtaWx5OiBmYW1pbHkgfTtcclxuICAgICAgICBpZih2YXJpYW50LmluZGV4T2YoXCJpdGFsaWNcIikgPj0gMCl7XHJcbiAgICAgICAgICAgIHN0eWxlLmZvbnRTdHlsZSA9IFwiaXRhbGljXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBudW1lcmljID0gdmFyaWFudC5yZXBsYWNlKC9bXlxcZF0vZywgXCJcIik7XHJcbiAgICAgICAgaWYobnVtZXJpYy5sZW5ndGgpe1xyXG4gICAgICAgICAgICBzdHlsZS5mb250V2VpZ2h0ID0gbnVtZXJpYy50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3R5bGU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBnZXREZXNjcmlwdGlvbihmYW1pbHk6IEZvbnRGYW1pbHksIHZhcmlhbnQ/OiBzdHJpbmcpOiBGb250RGVzY3JpcHRpb24ge1xyXG4gICAgICAgIGxldCB1cmw6IHN0cmluZztcclxuICAgICAgICB1cmwgPSBmYW1pbHkuZmlsZXNbdmFyaWFudCB8fCBcInJlZ3VsYXJcIl07XHJcbiAgICAgICAgaWYoIXVybCl7XHJcbiAgICAgICAgICAgIHVybCA9IGZhbWlseS5maWxlc1swXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZmFtaWx5OiBmYW1pbHkuZmFtaWx5LFxyXG4gICAgICAgICAgICBjYXRlZ29yeTogZmFtaWx5LmNhdGVnb3J5LFxyXG4gICAgICAgICAgICB2YXJpYW50OiB2YXJpYW50LFxyXG4gICAgICAgICAgICB1cmxcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxufSIsIlxyXG5mdW5jdGlvbiBsb2d0YXA8VD4obWVzc2FnZTogc3RyaW5nLCBzdHJlYW06IFJ4Lk9ic2VydmFibGU8VD4pOiBSeC5PYnNlcnZhYmxlPFQ+e1xyXG4gICAgcmV0dXJuIHN0cmVhbS50YXAodCA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCB0KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld2lkKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gKG5ldyBEYXRlKCkuZ2V0VGltZSgpK01hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDM2KTtcclxufVxyXG4iLCJcclxubmFtZXNwYWNlIFR5cGVkQ2hhbm5lbCB7XHJcblxyXG4gICAgLy8gLS0tIENvcmUgdHlwZXMgLS0tXHJcblxyXG4gICAgdHlwZSBTZXJpYWxpemFibGUgPSBPYmplY3QgfCBBcnJheTxhbnk+IHwgbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IERhdGUgfCB2b2lkO1xyXG5cclxuICAgIHR5cGUgVmFsdWUgPSBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgRGF0ZTtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2U8VERhdGEgZXh0ZW5kcyBTZXJpYWxpemFibGU+IHtcclxuICAgICAgICB0eXBlOiBzdHJpbmc7XHJcbiAgICAgICAgZGF0YT86IFREYXRhO1xyXG4gICAgICAgIG1ldGE/OiBPYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgdHlwZSBJU3ViamVjdDxUPiA9IFJ4Lk9ic2VydmVyPFQ+ICYgUnguT2JzZXJ2YWJsZTxUPjtcclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2hhbm5lbFRvcGljPFREYXRhIGV4dGVuZHMgU2VyaWFsaXphYmxlPiB7XHJcbiAgICAgICAgdHlwZTogc3RyaW5nO1xyXG4gICAgICAgIGNoYW5uZWw6IElTdWJqZWN0PE1lc3NhZ2U8VERhdGE+PjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoY2hhbm5lbDogSVN1YmplY3Q8TWVzc2FnZTxURGF0YT4+LCB0eXBlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1YnNjcmliZShvYnNlcnZlcjogKG1lc3NhZ2U6IE1lc3NhZ2U8VERhdGE+KSA9PiB2b2lkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZSgpLnN1YnNjcmliZShvYnNlcnZlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwYXRjaChkYXRhPzogVERhdGEpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFubmVsLm9uTmV4dCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBfLmNsb25lKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb2JzZXJ2ZSgpOiBSeC5PYnNlcnZhYmxlPE1lc3NhZ2U8VERhdGE+PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNoYW5uZWwuZmlsdGVyKG0gPT4gbS50eXBlID09PSB0aGlzLnR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2hhbm5lbCB7XHJcbiAgICAgICAgdHlwZTogc3RyaW5nO1xyXG4gICAgICAgIHByaXZhdGUgc3ViamVjdDogSVN1YmplY3Q8TWVzc2FnZTxTZXJpYWxpemFibGU+PjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Ioc3ViamVjdD86IElTdWJqZWN0PE1lc3NhZ2U8U2VyaWFsaXphYmxlPj4sIHR5cGU/OiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5zdWJqZWN0ID0gc3ViamVjdCB8fCBuZXcgUnguU3ViamVjdDxNZXNzYWdlPFNlcmlhbGl6YWJsZT4+KCk7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJzY3JpYmUob25OZXh0PzogKHZhbHVlOiBNZXNzYWdlPFNlcmlhbGl6YWJsZT4pID0+IHZvaWQpOiBSeC5JRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YmplY3Quc3Vic2NyaWJlKG9uTmV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b3BpYzxURGF0YSBleHRlbmRzIFNlcmlhbGl6YWJsZT4odHlwZTogc3RyaW5nKSA6IENoYW5uZWxUb3BpYzxURGF0YT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENoYW5uZWxUb3BpYzxURGF0YT4odGhpcy5zdWJqZWN0IGFzIElTdWJqZWN0PE1lc3NhZ2U8VERhdGE+PixcclxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA/IHRoaXMudHlwZSArICcuJyArIHR5cGUgOiB0eXBlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVyZ2VUeXBlZDxURGF0YSBleHRlbmRzIFNlcmlhbGl6YWJsZT4oLi4udG9waWNzOiBDaGFubmVsVG9waWM8VERhdGE+W10pIFxyXG4gICAgICAgICAgICA6IFJ4Lk9ic2VydmFibGU8TWVzc2FnZTxURGF0YT4+IHtcclxuICAgICAgICAgICAgY29uc3QgdHlwZXMgPSB0b3BpY3MubWFwKHQgPT4gdC50eXBlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3ViamVjdC5maWx0ZXIobSA9PiB0eXBlcy5pbmRleE9mKG0udHlwZSkgPj0gMCApIGFzIFJ4Lk9ic2VydmFibGU8TWVzc2FnZTxURGF0YT4+O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBtZXJnZSguLi50b3BpY3M6IENoYW5uZWxUb3BpYzxTZXJpYWxpemFibGU+W10pIFxyXG4gICAgICAgICAgICA6IFJ4Lk9ic2VydmFibGU8TWVzc2FnZTxTZXJpYWxpemFibGU+PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGVzID0gdG9waWNzLm1hcCh0ID0+IHQudHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YmplY3QuZmlsdGVyKG0gPT4gdHlwZXMuaW5kZXhPZihtLnR5cGUpID49IDAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIlxyXG50eXBlIERpY3Rpb25hcnk8VD4gPSBfLkRpY3Rpb25hcnk8VD47XHJcbiIsIlxyXG5jbGFzcyBPYnNlcnZhYmxlRXZlbnQ8VD4ge1xyXG4gICAgXHJcbiAgICBwcml2YXRlIF9zdWJzY3JpYmVyczogKChldmVudEFyZzogVCkgPT4gdm9pZClbXSA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3Vic2NyaWJlIGZvciBub3RpZmljYXRpb24uIFJldHVybnMgdW5zdWJzY3JpYmUgZnVuY3Rpb24uXHJcbiAgICAgKi8gICAgXHJcbiAgICBzdWJzY3JpYmUoY2FsbGJhY2s6IChldmVudEFyZzogVCkgPT4gdm9pZCk6ICgoKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgaWYodGhpcy5fc3Vic2NyaWJlcnMuaW5kZXhPZihjYWxsYmFjaykgPCAwKXtcclxuICAgICAgICAgICAgdGhpcy5fc3Vic2NyaWJlcnMucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHRoaXMuX3N1YnNjcmliZXJzLmluZGV4T2YoY2FsbGJhY2ssIDApO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBTdWJzY3JpYmUgZm9yIG9uZSBub3RpZmljYXRpb24uXHJcbiAgICAgKi9cclxuICAgIHN1YnNjcmliZU9uZShjYWxsYmFjazogKGV2ZW50QXJnOiBUKSA9PiB2b2lkKXtcclxuICAgICAgICBsZXQgdW5zdWIgPSB0aGlzLnN1YnNjcmliZSh0ID0+IHtcclxuICAgICAgICAgICAgdW5zdWIoKTtcclxuICAgICAgICAgICAgY2FsbGJhY2sodCk7ICAgICAgICAgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5vdGlmeShldmVudEFyZzogVCl7XHJcbiAgICAgICAgZm9yKGxldCBzdWJzY3JpYmVyIG9mIHRoaXMuX3N1YnNjcmliZXJzKXtcclxuICAgICAgICAgICAgc3Vic2NyaWJlci5jYWxsKHRoaXMsIGV2ZW50QXJnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhbGwgc3Vic2NyaWJlcnMuXHJcbiAgICAgKi9cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XHJcbiAgICB9XHJcbn0iLCJcclxubmFtZXNwYWNlIEJvb3RTY3JpcHQge1xyXG5cclxuICAgIGludGVyZmFjZSBNZW51SXRlbSB7XHJcbiAgICAgICAgY29udGVudDogYW55LFxyXG4gICAgICAgIGF0dHJzPzogT2JqZWN0LFxyXG4gICAgICAgIG9uQ2xpY2s/OiAoKSA9PiB2b2lkXHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGRyb3Bkb3duKFxyXG4gICAgICAgIGFyZ3M6IHtcclxuICAgICAgICAgICAgaWQ6IHN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudDogYW55LFxyXG4gICAgICAgICAgICBpdGVtczogTWVudUl0ZW1bXVxyXG4gICAgICAgIH0pOiBWTm9kZSB7XHJcblxyXG4gICAgICAgIHJldHVybiBoKFwiZGl2LmRyb3Bkb3duXCIsIFtcclxuICAgICAgICAgICAgaChcImJ1dHRvbi5idG4uYnRuLWRlZmF1bHQuZHJvcGRvd24tdG9nZ2xlXCIsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRyc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBhcmdzLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJ1dHRvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGEtdG9nZ2xlXCI6IFwiZHJvcGRvd25cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0biBidG4tZGVmYXVsdCBkcm9wZG93bi10b2dnbGVcIlxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuY29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICBoKFwic3Bhbi5jYXJldFwiKVxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgIGgoXCJ1bC5kcm9wZG93bi1tZW51XCIsXHJcbiAgICAgICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgICAgIGFyZ3MuaXRlbXMubWFwKGl0ZW0gPT5cclxuICAgICAgICAgICAgICAgICAgICBoKFwibGlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGljazogKGV2KSA9PiBpdGVtLm9uQ2xpY2sgJiYgaXRlbS5vbkNsaWNrKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnYScsIHt9LCBbaXRlbS5jb250ZW50XSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIH1cclxufVxyXG4iLCJcclxuaW50ZXJmYWNlIENvbnNvbGUge1xyXG4gICAgbG9nKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSk6IHZvaWQ7XHJcbiAgICBsb2coLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKTogdm9pZDtcclxufVxyXG5cclxubmFtZXNwYWNlIFBhcGVySGVscGVycyB7XHJcblxyXG4gICAgZXhwb3J0IHZhciBzaG91bGRMb2dJbmZvOiBib29sZWFuO1xyXG5cclxuICAgIGNvbnN0IGxvZyA9IGZ1bmN0aW9uKC4uLnBhcmFtczogYW55W10pe1xyXG4gICAgICAgIGlmKHNob3VsZExvZ0luZm8pe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyguLi5wYXJhbXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0gXHJcblxyXG4gICAgZXhwb3J0IGNvbnN0IGltcG9ydE9wZW5UeXBlUGF0aCA9IGZ1bmN0aW9uKG9wZW5QYXRoOiBvcGVudHlwZS5QYXRoKTogcGFwZXIuQ29tcG91bmRQYXRoIHtcclxuICAgICAgICByZXR1cm4gbmV3IHBhcGVyLkNvbXBvdW5kUGF0aChvcGVuUGF0aC50b1BhdGhEYXRhKCkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGxldCBzdmcgPSBvcGVuUGF0aC50b1NWRyg0KTtcclxuICAgICAgICAvLyByZXR1cm4gPHBhcGVyLlBhdGg+cGFwZXIucHJvamVjdC5pbXBvcnRTVkcoc3ZnKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY29uc3QgdHJhY2VQYXRoSXRlbSA9IGZ1bmN0aW9uKHBhdGg6IHBhcGVyLlBhdGhJdGVtLCBwb2ludHNQZXJQYXRoOiBudW1iZXIpOiBwYXBlci5QYXRoSXRlbSB7XHJcbiAgICAgICAgaWYgKHBhdGguY2xhc3NOYW1lID09PSAnQ29tcG91bmRQYXRoJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFjZUNvbXBvdW5kUGF0aCg8cGFwZXIuQ29tcG91bmRQYXRoPnBhdGgsIHBvaW50c1BlclBhdGgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYWNlUGF0aCg8cGFwZXIuUGF0aD5wYXRoLCBwb2ludHNQZXJQYXRoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNvbnN0IHRyYWNlQ29tcG91bmRQYXRoID0gZnVuY3Rpb24ocGF0aDogcGFwZXIuQ29tcG91bmRQYXRoLCBwb2ludHNQZXJQYXRoOiBudW1iZXIpOiBwYXBlci5Db21wb3VuZFBhdGgge1xyXG4gICAgICAgIGlmICghcGF0aC5jaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBwYXRocyA9IHBhdGguY2hpbGRyZW4ubWFwKHAgPT5cclxuICAgICAgICAgICAgdGhpcy50cmFjZVBhdGgoPHBhcGVyLlBhdGg+cCwgcG9pbnRzUGVyUGF0aCkpO1xyXG4gICAgICAgIHJldHVybiBuZXcgcGFwZXIuQ29tcG91bmRQYXRoKHtcclxuICAgICAgICAgICAgY2hpbGRyZW46IHBhdGhzLFxyXG4gICAgICAgICAgICBjbG9ja3dpc2U6IHBhdGguY2xvY2t3aXNlXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY29uc3QgdHJhY2VQYXRoQXNQb2ludHMgPSBmdW5jdGlvbihwYXRoOiBwYXBlci5QYXRoLCBudW1Qb2ludHM6IG51bWJlcik6IHBhcGVyLlBvaW50W10ge1xyXG4gICAgICAgIGxldCBwYXRoTGVuZ3RoID0gcGF0aC5sZW5ndGg7XHJcbiAgICAgICAgbGV0IG9mZnNldEluY3IgPSBwYXRoTGVuZ3RoIC8gbnVtUG9pbnRzO1xyXG4gICAgICAgIGxldCBwb2ludHMgPSBbXTtcclxuICAgICAgICBsZXQgaSA9IDA7XHJcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XHJcblxyXG4gICAgICAgIHdoaWxlIChpKysgPCBudW1Qb2ludHMpIHtcclxuICAgICAgICAgICAgbGV0IHBvaW50ID0gcGF0aC5nZXRQb2ludEF0KE1hdGgubWluKG9mZnNldCwgcGF0aExlbmd0aCkpO1xyXG4gICAgICAgICAgICBwb2ludHMucHVzaChwb2ludCk7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSBvZmZzZXRJbmNyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBvaW50cztcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY29uc3QgdHJhY2VQYXRoID0gZnVuY3Rpb24ocGF0aDogcGFwZXIuUGF0aCwgbnVtUG9pbnRzOiBudW1iZXIpOiBwYXBlci5QYXRoIHtcclxuICAgICAgICBsZXQgcG9pbnRzID0gUGFwZXJIZWxwZXJzLnRyYWNlUGF0aEFzUG9pbnRzKHBhdGgsIG51bVBvaW50cyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBwYXBlci5QYXRoKHtcclxuICAgICAgICAgICAgc2VnbWVudHM6IHBvaW50cyxcclxuICAgICAgICAgICAgY2xvc2VkOiB0cnVlLFxyXG4gICAgICAgICAgICBjbG9ja3dpc2U6IHBhdGguY2xvY2t3aXNlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNvbnN0IGR1YWxCb3VuZHNQYXRoUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHRvcFBhdGg6IHBhcGVyLkN1cnZlbGlrZSwgYm90dG9tUGF0aDogcGFwZXIuQ3VydmVsaWtlKVxyXG4gICAgICAgIDogKHVuaXRQb2ludDogcGFwZXIuUG9pbnQpID0+IHBhcGVyLlBvaW50IHtcclxuICAgICAgICBjb25zdCB0b3BQYXRoTGVuZ3RoID0gdG9wUGF0aC5sZW5ndGg7XHJcbiAgICAgICAgY29uc3QgYm90dG9tUGF0aExlbmd0aCA9IGJvdHRvbVBhdGgubGVuZ3RoO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih1bml0UG9pbnQ6IHBhcGVyLlBvaW50KTogcGFwZXIuUG9pbnQge1xyXG4gICAgICAgICAgICBsZXQgdG9wUG9pbnQgPSB0b3BQYXRoLmdldFBvaW50QXQodW5pdFBvaW50LnggKiB0b3BQYXRoTGVuZ3RoKTtcclxuICAgICAgICAgICAgbGV0IGJvdHRvbVBvaW50ID0gYm90dG9tUGF0aC5nZXRQb2ludEF0KHVuaXRQb2ludC54ICogYm90dG9tUGF0aExlbmd0aCk7XHJcbiAgICAgICAgICAgIGlmICh0b3BQb2ludCA9PSBudWxsIHx8IGJvdHRvbVBvaW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiY291bGQgbm90IGdldCBwcm9qZWN0ZWQgcG9pbnQgZm9yIHVuaXQgcG9pbnQgXCIgKyB1bml0UG9pbnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG9wUG9pbnQuYWRkKGJvdHRvbVBvaW50LnN1YnRyYWN0KHRvcFBvaW50KS5tdWx0aXBseSh1bml0UG9pbnQueSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgbGV0IG1hcmtlckdyb3VwOiBwYXBlci5Hcm91cDtcclxuXHJcbiAgICBleHBvcnQgY29uc3QgcmVzZXRNYXJrZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKFBhcGVySGVscGVycy5tYXJrZXJHcm91cCkge1xyXG4gICAgICAgICAgICBQYXBlckhlbHBlcnMubWFya2VyR3JvdXAucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1hcmtlckdyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XHJcbiAgICAgICAgbWFya2VyR3JvdXAub3BhY2l0eSA9IDAuMjtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNvbnN0IG1hcmtlckxpbmUgPSBmdW5jdGlvbihhOiBwYXBlci5Qb2ludCwgYjogcGFwZXIuUG9pbnQpOiBwYXBlci5JdGVtIHtcclxuICAgICAgICBsZXQgbGluZSA9IHBhcGVyLlBhdGguTGluZShhLCBiKTtcclxuICAgICAgICBsaW5lLnN0cm9rZUNvbG9yID0gJ2dyZWVuJztcclxuICAgICAgICAvL2xpbmUuZGFzaEFycmF5ID0gWzUsIDVdO1xyXG4gICAgICAgIFBhcGVySGVscGVycy5tYXJrZXJHcm91cC5hZGRDaGlsZChsaW5lKTtcclxuICAgICAgICByZXR1cm4gbGluZTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY29uc3QgbWFya2VyID0gZnVuY3Rpb24ocG9pbnQ6IHBhcGVyLlBvaW50LCBsYWJlbDogc3RyaW5nKTogcGFwZXIuSXRlbSB7XHJcbiAgICAgICAgLy9sZXQgbWFya2VyID0gcGFwZXIuU2hhcGUuQ2lyY2xlKHBvaW50LCAxMCk7XHJcbiAgICAgICAgbGV0IG1hcmtlciA9IG5ldyBwYXBlci5Qb2ludFRleHQocG9pbnQpO1xyXG4gICAgICAgIG1hcmtlci5mb250U2l6ZSA9IDM2O1xyXG4gICAgICAgIG1hcmtlci5jb250ZW50ID0gbGFiZWw7XHJcbiAgICAgICAgbWFya2VyLnN0cm9rZUNvbG9yID0gXCJyZWRcIjtcclxuICAgICAgICBtYXJrZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgICAgLy9QYXBlckhlbHBlcnMubWFya2VyR3JvdXAuYWRkQ2hpbGQobWFya2VyKTtcclxuICAgICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjb25zdCBzaW1wbGlmeSA9IGZ1bmN0aW9uKHBhdGg6IHBhcGVyLlBhdGhJdGVtLCB0b2xlcmFuY2U/OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAocGF0aC5jbGFzc05hbWUgPT09ICdDb21wb3VuZFBhdGgnKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2YgcGF0aC5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgUGFwZXJIZWxwZXJzLnNpbXBsaWZ5KDxwYXBlci5QYXRoSXRlbT5wLCB0b2xlcmFuY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgKDxwYXBlci5QYXRoPnBhdGgpLnNpbXBsaWZ5KHRvbGVyYW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmluZCBzZWxmIG9yIG5lYXJlc3QgYW5jZXN0b3Igc2F0aXNmeWluZyB0aGUgcHJlZGljYXRlLlxyXG4gICAgICovXHJcbiAgICBleHBvcnQgY29uc3QgZmluZFNlbGZPckFuY2VzdG9yID0gZnVuY3Rpb24oaXRlbTogcGFwZXIuSXRlbSwgcHJlZGljYXRlOiAoaTogcGFwZXIuSXRlbSkgPT4gYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChwcmVkaWNhdGUoaXRlbSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQYXBlckhlbHBlcnMuZmluZEFuY2VzdG9yKGl0ZW0sIHByZWRpY2F0ZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogRmluZCBuZWFyZXN0IGFuY2VzdG9yIHNhdGlzZnlpbmcgdGhlIHByZWRpY2F0ZS5cclxuICAgICAqL1xyXG4gICAgZXhwb3J0IGNvbnN0IGZpbmRBbmNlc3RvciA9IGZ1bmN0aW9uKGl0ZW06IHBhcGVyLkl0ZW0sIHByZWRpY2F0ZTogKGk6IHBhcGVyLkl0ZW0pID0+IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBwcmlvcjogcGFwZXIuSXRlbTtcclxuICAgICAgICBsZXQgY2hlY2tpbmcgPSBpdGVtLnBhcmVudDtcclxuICAgICAgICB3aGlsZSAoY2hlY2tpbmcgJiYgY2hlY2tpbmcgIT09IHByaW9yKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoY2hlY2tpbmcpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tpbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcHJpb3IgPSBjaGVja2luZztcclxuICAgICAgICAgICAgY2hlY2tpbmcgPSBjaGVja2luZy5wYXJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb3JuZXJzIG9mIHRoZSByZWN0LCBjbG9ja3dpc2Ugc3RhcnRpbmcgZnJvbSB0b3BMZWZ0XHJcbiAgICAgKi9cclxuICAgIGV4cG9ydCBjb25zdCBjb3JuZXJzID0gZnVuY3Rpb24ocmVjdDogcGFwZXIuUmVjdGFuZ2xlKTogcGFwZXIuUG9pbnRbXSB7XHJcbiAgICAgICAgcmV0dXJuIFtyZWN0LnRvcExlZnQsIHJlY3QudG9wUmlnaHQsIHJlY3QuYm90dG9tUmlnaHQsIHJlY3QuYm90dG9tTGVmdF07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogdGhlIG1pZHBvaW50IGJldHdlZW4gdHdvIHBvaW50c1xyXG4gICAgICovXHJcbiAgICBleHBvcnQgY29uc3QgbWlkcG9pbnQgPSBmdW5jdGlvbihhOiBwYXBlci5Qb2ludCwgYjogcGFwZXIuUG9pbnQpIHtcclxuICAgICAgICByZXR1cm4gYi5zdWJ0cmFjdChhKS5kaXZpZGUoMikuYWRkKGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjb25zdCBjbG9uZVNlZ21lbnQgPSBmdW5jdGlvbihzZWdtZW50OiBwYXBlci5TZWdtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBwYXBlci5TZWdtZW50KHNlZ21lbnQucG9pbnQsIHNlZ21lbnQuaGFuZGxlSW4sIHNlZ21lbnQuaGFuZGxlT3V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgYW4gaXRlbSBkcmFnZ2FibGUsIGFkZGluZyByZWxhdGVkIGV2ZW50cy5cclxuICAgICAqL1xyXG4gICAgZXhwb3J0IGNvbnN0IGFkZFNtYXJ0RHJhZyA9IGZ1bmN0aW9uKGl0ZW06IHBhcGVyLkl0ZW0pIHtcclxuICAgICAgICBpdGVtLmlzU21hcnREcmFnZ2FibGUgPSB0cnVlO1xyXG5cclxuICAgICAgICBpdGVtLm9uKHBhcGVyLkV2ZW50VHlwZS5tb3VzZURyYWcsIGV2ID0+IHtcclxuICAgICAgICAgICAgbG9nKFwic21hcnREcmFnLm9uTW91c2VEcmFnXCIsIGl0ZW0sIGV2KTtcclxuICAgICAgICAgICAgaWYgKGV2LnNtYXJ0RHJhZ0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIldpbGwgbm90IGFzc2lnbiBzbWFydERyYWdJdGVtOiB2YWx1ZSB3YXMgYWxyZWFkeSBcIiArIGV2LnNtYXJ0RHJhZ0l0ZW0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXYuc21hcnREcmFnSXRlbSA9IGl0ZW07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghaXRlbS5pc1NtYXJ0RHJhZ2dpbmcpIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uaXNTbWFydERyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGxvZyhcImVtaXR0aW5nIHNtYXJ0RHJhZy5zbWFydERyYWdTdGFydFwiKTtcclxuICAgICAgICAgICAgICAgIGl0ZW0uZW1pdChFdmVudFR5cGUuc21hcnREcmFnU3RhcnQsIGV2KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaXRlbS5wb3NpdGlvbiA9IGl0ZW0ucG9zaXRpb24uYWRkKGV2LmRlbHRhKTtcclxuXHJcbiAgICAgICAgICAgIGxvZyhcImVtaXR0aW5nIHNtYXJ0RHJhZy5zbWFydERyYWdNb3ZlXCIpO1xyXG4gICAgICAgICAgICBpdGVtLmVtaXQoRXZlbnRUeXBlLnNtYXJ0RHJhZ01vdmUsIGV2KTtcclxuXHJcbiAgICAgICAgICAgIGV2LnN0b3AoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaXRlbS5vbihwYXBlci5FdmVudFR5cGUubW91c2VVcCwgZXYgPT4ge1xyXG4gICAgICAgICAgICBsb2coXCJzbWFydERyYWcub25Nb3VzZVVwXCIsIGl0ZW0sIGV2KTtcclxuICAgICAgICAgICAgaWYgKGV2LnNtYXJ0RHJhZ0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIldpbGwgbm90IGFzc2lnbiBzbWFydERyYWdJdGVtOiB2YWx1ZSB3YXMgYWxyZWFkeSBcIiArIGV2LnNtYXJ0RHJhZ0l0ZW0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXYuc21hcnREcmFnSXRlbSA9IGl0ZW07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpdGVtLmlzU21hcnREcmFnZ2luZykge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5pc1NtYXJ0RHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGxvZyhcImVtaXR0aW5nIHNtYXJ0RHJhZy5zbWFydERyYWdFbmRcIik7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmVtaXQoRXZlbnRUeXBlLnNtYXJ0RHJhZ0VuZCwgZXYpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbG9nKFwiZW1pdHRpbmcgc21hcnREcmFnLmNsaWNrV2l0aG91dERyYWdcIik7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmVtaXQoRXZlbnRUeXBlLmNsaWNrV2l0aG91dERyYWcsIGV2KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZXYuc3RvcCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjb25zdCBFdmVudFR5cGUgPSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRHJhZyBhY3Rpb24gaGFzIHN0YXJ0ZWQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc21hcnREcmFnU3RhcnQ6IFwic21hcnREcmFnU3RhcnRcIixcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEcmFnZ2VkIGl0ZW0gaGFzIG1vdmVkLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNtYXJ0RHJhZ01vdmU6IFwic21hcnREcmFnTW92ZVwiLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERyYWcgYWN0aW9uIGhhcyBlbmRlZC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBzbWFydERyYWdFbmQ6IFwic21hcnREcmFnRW5kXCIsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIG5vcm1hbCBjbGljayBldmVudCB3aWxsIGZpcmUgZXZlbiBhdCB0aGUgZW5kIG9mIGEgZHJhZy5cclxuICAgICAgICAgKiBUaGlzIGNsaWNrIGV2ZW50IGRvZXMgbm90LiBcclxuICAgICAgICAgKi9cclxuICAgICAgICBjbGlja1dpdGhvdXREcmFnOiBcImNsaWNrV2l0aG91dERyYWdcIlxyXG4gICAgfVxyXG59XHJcblxyXG5kZWNsYXJlIG1vZHVsZSBwYXBlciB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIEl0ZW0ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERyYWdnaW5nIGJlaGF2aW9yIGFkZGVkIGJ5IFBhcGVySGVscGVyczogaXMgdGhlIGl0ZW0gYmVpbmcgZHJhZ2dlZD9cclxuICAgICAgICAgKi9cclxuICAgICAgICBpc1NtYXJ0RHJhZ2dpbmc6IGJvb2xlYW47XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERyYWdnaW5nIGJlaGF2aW9yIGFkZGVkIGJ5IFBhcGVySGVscGVyczogaXMgdGhlIGl0ZW0gZHJhZ2dhYmxlP1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlzU21hcnREcmFnZ2FibGU6IGJvb2xlYW47XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBUb29sRXZlbnQge1xyXG4gICAgICAgIHNtYXJ0RHJhZ0l0ZW06IEl0ZW07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUGFwZXJNb3VzZUV2ZW50IHtcclxuICAgICAgICBzbWFydERyYWdJdGVtOiBJdGVtO1xyXG4gICAgfVxyXG59IiwiXHJcbnR5cGUgSXRlbUNoYW5nZUhhbmRsZXIgPSAoZmxhZ3M6IFBhcGVyTm90aWZ5LkNoYW5nZUZsYWcpID0+IHZvaWQ7XHJcbnR5cGUgQ2FsbGJhY2sgPSAoKSA9PiB2b2lkO1xyXG5cclxuZGVjbGFyZSBtb2R1bGUgcGFwZXIge1xyXG4gICAgaW50ZXJmYWNlIEl0ZW0ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFN1YnNjcmliZSB0byBhbGwgY2hhbmdlcyBpbiBpdGVtLiBSZXR1cm5zIHVuLXN1YnNjcmliZSBmdW5jdGlvbi5cclxuICAgICAgICAgKi9cclxuICAgICAgICBzdWJzY3JpYmUoaGFuZGxlcjogSXRlbUNoYW5nZUhhbmRsZXIpOiBDYWxsYmFjaztcclxuICAgICAgICBcclxuICAgICAgICBfY2hhbmdlZChmbGFnczogUGFwZXJOb3RpZnkuQ2hhbmdlRmxhZyk6IHZvaWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbm5hbWVzcGFjZSBQYXBlck5vdGlmeSB7XHJcblxyXG4gICAgZXhwb3J0IGVudW0gQ2hhbmdlRmxhZyB7XHJcbiAgICAgICAgLy8gQW55dGhpbmcgYWZmZWN0aW5nIHRoZSBhcHBlYXJhbmNlIG9mIGFuIGl0ZW0sIGluY2x1ZGluZyBHRU9NRVRSWSxcclxuICAgICAgICAvLyBTVFJPS0UsIFNUWUxFIGFuZCBBVFRSSUJVVEUgKGV4Y2VwdCBmb3IgdGhlIGludmlzaWJsZSBvbmVzOiBsb2NrZWQsIG5hbWUpXHJcbiAgICAgICAgQVBQRUFSQU5DRSA9IDB4MSxcclxuICAgICAgICAvLyBBIGNoYW5nZSBpbiB0aGUgaXRlbSdzIGNoaWxkcmVuXHJcbiAgICAgICAgQ0hJTERSRU4gPSAweDIsXHJcbiAgICAgICAgLy8gQSBjaGFuZ2Ugb2YgdGhlIGl0ZW0ncyBwbGFjZSBpbiB0aGUgc2NlbmUgZ3JhcGggKHJlbW92ZWQsIGluc2VydGVkLFxyXG4gICAgICAgIC8vIG1vdmVkKS5cclxuICAgICAgICBJTlNFUlRJT04gPSAweDQsXHJcbiAgICAgICAgLy8gSXRlbSBnZW9tZXRyeSAocGF0aCwgYm91bmRzKVxyXG4gICAgICAgIEdFT01FVFJZID0gMHg4LFxyXG4gICAgICAgIC8vIE9ubHkgc2VnbWVudChzKSBoYXZlIGNoYW5nZWQsIGFuZCBhZmZlY3RlZCBjdXJ2ZXMgaGF2ZSBhbHJlYWR5IGJlZW5cclxuICAgICAgICAvLyBub3RpZmllZC4gVGhpcyBpcyB0byBpbXBsZW1lbnQgYW4gb3B0aW1pemF0aW9uIGluIF9jaGFuZ2VkKCkgY2FsbHMuXHJcbiAgICAgICAgU0VHTUVOVFMgPSAweDEwLFxyXG4gICAgICAgIC8vIFN0cm9rZSBnZW9tZXRyeSAoZXhjbHVkaW5nIGNvbG9yKVxyXG4gICAgICAgIFNUUk9LRSA9IDB4MjAsXHJcbiAgICAgICAgLy8gRmlsbCBzdHlsZSBvciBzdHJva2UgY29sb3IgLyBkYXNoXHJcbiAgICAgICAgU1RZTEUgPSAweDQwLFxyXG4gICAgICAgIC8vIEl0ZW0gYXR0cmlidXRlczogdmlzaWJsZSwgYmxlbmRNb2RlLCBsb2NrZWQsIG5hbWUsIG9wYWNpdHksIGNsaXBNYXNrIC4uLlxyXG4gICAgICAgIEFUVFJJQlVURSA9IDB4ODAsXHJcbiAgICAgICAgLy8gVGV4dCBjb250ZW50XHJcbiAgICAgICAgQ09OVEVOVCA9IDB4MTAwLFxyXG4gICAgICAgIC8vIFJhc3RlciBwaXhlbHNcclxuICAgICAgICBQSVhFTFMgPSAweDIwMCxcclxuICAgICAgICAvLyBDbGlwcGluZyBpbiBvbmUgb2YgdGhlIGNoaWxkIGl0ZW1zXHJcbiAgICAgICAgQ0xJUFBJTkcgPSAweDQwMCxcclxuICAgICAgICAvLyBUaGUgdmlldyBoYXMgYmVlbiB0cmFuc2Zvcm1lZFxyXG4gICAgICAgIFZJRVcgPSAweDgwMFxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNob3J0Y3V0cyB0byBvZnRlbiB1c2VkIENoYW5nZUZsYWcgdmFsdWVzIGluY2x1ZGluZyBBUFBFQVJBTkNFXHJcbiAgICBleHBvcnQgZW51bSBDaGFuZ2VzIHtcclxuICAgICAgICAvLyBDSElMRFJFTiBhbHNvIGNoYW5nZXMgR0VPTUVUUlksIHNpbmNlIHJlbW92aW5nIGNoaWxkcmVuIGZyb20gZ3JvdXBzXHJcbiAgICAgICAgLy8gY2hhbmdlcyBib3VuZHMuXHJcbiAgICAgICAgQ0hJTERSRU4gPSBDaGFuZ2VGbGFnLkNISUxEUkVOIHwgQ2hhbmdlRmxhZy5HRU9NRVRSWSB8IENoYW5nZUZsYWcuQVBQRUFSQU5DRSxcclxuICAgICAgICAvLyBDaGFuZ2luZyB0aGUgaW5zZXJ0aW9uIGNhbiBjaGFuZ2UgdGhlIGFwcGVhcmFuY2UgdGhyb3VnaCBwYXJlbnQncyBtYXRyaXguXHJcbiAgICAgICAgSU5TRVJUSU9OID0gQ2hhbmdlRmxhZy5JTlNFUlRJT04gfCBDaGFuZ2VGbGFnLkFQUEVBUkFOQ0UsXHJcbiAgICAgICAgR0VPTUVUUlkgPSBDaGFuZ2VGbGFnLkdFT01FVFJZIHwgQ2hhbmdlRmxhZy5BUFBFQVJBTkNFLFxyXG4gICAgICAgIFNFR01FTlRTID0gQ2hhbmdlRmxhZy5TRUdNRU5UUyB8IENoYW5nZUZsYWcuR0VPTUVUUlkgfCBDaGFuZ2VGbGFnLkFQUEVBUkFOQ0UsXHJcbiAgICAgICAgU1RST0tFID0gQ2hhbmdlRmxhZy5TVFJPS0UgfCBDaGFuZ2VGbGFnLlNUWUxFIHwgQ2hhbmdlRmxhZy5BUFBFQVJBTkNFLFxyXG4gICAgICAgIFNUWUxFID0gQ2hhbmdlRmxhZy5TVFlMRSB8IENoYW5nZUZsYWcuQVBQRUFSQU5DRSxcclxuICAgICAgICBBVFRSSUJVVEUgPSBDaGFuZ2VGbGFnLkFUVFJJQlVURSB8IENoYW5nZUZsYWcuQVBQRUFSQU5DRSxcclxuICAgICAgICBDT05URU5UID0gQ2hhbmdlRmxhZy5DT05URU5UIHwgQ2hhbmdlRmxhZy5HRU9NRVRSWSB8IENoYW5nZUZsYWcuQVBQRUFSQU5DRSxcclxuICAgICAgICBQSVhFTFMgPSBDaGFuZ2VGbGFnLlBJWEVMUyB8IENoYW5nZUZsYWcuQVBQRUFSQU5DRSxcclxuICAgICAgICBWSUVXID0gQ2hhbmdlRmxhZy5WSUVXIHwgQ2hhbmdlRmxhZy5BUFBFQVJBTkNFXHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEluamVjdCBJdGVtLnN1YnNjcmliZVxyXG4gICAgICAgIGNvbnN0IGl0ZW1Qcm90byA9ICg8YW55PnBhcGVyKS5JdGVtLnByb3RvdHlwZTtcclxuICAgICAgICBpdGVtUHJvdG8uc3Vic2NyaWJlID0gZnVuY3Rpb24oaGFuZGxlcjogSXRlbUNoYW5nZUhhbmRsZXIpOiBDYWxsYmFjayB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fc3Vic2NyaWJlcnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N1YnNjcmliZXJzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3N1YnNjcmliZXJzLmluZGV4T2YoaGFuZGxlcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdWJzY3JpYmVycy5wdXNoKGhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSB0aGlzLl9zdWJzY3JpYmVycy5pbmRleE9mKGhhbmRsZXIsIDApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdWJzY3JpYmVycy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXcmFwIEl0ZW0ucmVtb3ZlXHJcbiAgICAgICAgY29uc3QgaXRlbVJlbW92ZSA9IGl0ZW1Qcm90by5yZW1vdmU7XHJcbiAgICAgICAgaXRlbVByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpdGVtUmVtb3ZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N1YnNjcmliZXJzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFdyYXAgUHJvamVjdC5fY2hhbmdlZFxyXG4gICAgICAgIGNvbnN0IHByb2plY3RQcm90byA9IDxhbnk+cGFwZXIuUHJvamVjdC5wcm90b3R5cGU7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdENoYW5nZWQgPSBwcm9qZWN0UHJvdG8uX2NoYW5nZWQ7XHJcbiAgICAgICAgcHJvamVjdFByb3RvLl9jaGFuZ2VkID0gZnVuY3Rpb24oZmxhZ3M6IENoYW5nZUZsYWcsIGl0ZW06IHBhcGVyLkl0ZW0pIHtcclxuICAgICAgICAgICAgcHJvamVjdENoYW5nZWQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnMgPSAoPGFueT5pdGVtKS5fc3Vic2NyaWJlcnM7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Vicykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHMgb2Ygc3Vicykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzLmNhbGwoaXRlbSwgZmxhZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gZGVzY3JpYmUoZmxhZ3M6IENoYW5nZUZsYWcpIHtcclxuICAgICAgICBsZXQgZmxhZ0xpc3Q6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgXy5mb3JPd24oQ2hhbmdlRmxhZywgKHZhbHVlLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCh0eXBlb2YgdmFsdWUpID09PSBcIm51bWJlclwiICYmICh2YWx1ZSAmIGZsYWdzKSkge1xyXG4gICAgICAgICAgICAgICAgZmxhZ0xpc3QucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZsYWdMaXN0LmpvaW4oJyB8ICcpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZShpdGVtOiBwYXBlci5JdGVtLCBmbGFnczogQ2hhbmdlRmxhZyk6IFxyXG4gICAgICAgIFJ4Lk9ic2VydmFibGU8Q2hhbmdlRmxhZz4gXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHVuc3ViOiAoKSA9PiB2b2lkO1xyXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm48Q2hhbmdlRmxhZz4oXHJcbiAgICAgICAgICAgIGFkZEhhbmRsZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgdW5zdWIgPSBpdGVtLnN1YnNjcmliZShmID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZihmICYgZmxhZ3Mpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRIYW5kbGVyKGYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgcmVtb3ZlSGFuZGxlciA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZih1bnN1Yil7XHJcbiAgICAgICAgICAgICAgICAgICAgdW5zdWIoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5QYXBlck5vdGlmeS5pbml0aWFsaXplKCk7XHJcbiIsIlxyXG5tb2R1bGUgcGFwZXIge1xyXG5cclxuICAgIGV4cG9ydCB2YXIgRXZlbnRUeXBlID0ge1xyXG4gICAgICAgIGZyYW1lOiBcImZyYW1lXCIsXHJcbiAgICAgICAgbW91c2VEb3duOiBcIm1vdXNlZG93blwiLFxyXG4gICAgICAgIG1vdXNlVXA6IFwibW91c2V1cFwiLFxyXG4gICAgICAgIG1vdXNlRHJhZzogXCJtb3VzZWRyYWdcIixcclxuICAgICAgICBjbGljazogXCJjbGlja1wiLFxyXG4gICAgICAgIGRvdWJsZUNsaWNrOiBcImRvdWJsZWNsaWNrXCIsXHJcbiAgICAgICAgbW91c2VNb3ZlOiBcIm1vdXNlbW92ZVwiLFxyXG4gICAgICAgIG1vdXNlRW50ZXI6IFwibW91c2VlbnRlclwiLFxyXG4gICAgICAgIG1vdXNlTGVhdmU6IFwibW91c2VsZWF2ZVwiXHJcbiAgICB9XHJcblxyXG59IiwiXHJcbi8vIGNsYXNzIE9sZFRvcGljPFQ+IHtcclxuXHJcbi8vICAgICBwcml2YXRlIF9jaGFubmVsOiBJQ2hhbm5lbERlZmluaXRpb248T2JqZWN0PjtcclxuLy8gICAgIHByaXZhdGUgX25hbWU6IHN0cmluZztcclxuXHJcbi8vICAgICBjb25zdHJ1Y3RvcihjaGFubmVsOiBJQ2hhbm5lbERlZmluaXRpb248T2JqZWN0PiwgdG9waWM6IHN0cmluZykge1xyXG4vLyAgICAgICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xyXG4vLyAgICAgICAgIHRoaXMuX25hbWUgPSB0b3BpYztcclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBvYnNlcnZlKCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xyXG4vLyAgICAgICAgIHJldHVybiA8UnguT2JzZXJ2YWJsZTxUPj50aGlzLl9jaGFubmVsLm9ic2VydmUodGhpcy5fbmFtZSk7XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgcHVibGlzaChkYXRhOiBUKSB7XHJcbi8vICAgICAgICAgdGhpcy5fY2hhbm5lbC5wdWJsaXNoKHRoaXMuX25hbWUsIGRhdGEpO1xyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIHN1YnNjcmliZShjYWxsYmFjazogSUNhbGxiYWNrPFQ+KTogSVN1YnNjcmlwdGlvbkRlZmluaXRpb248VD4ge1xyXG4vLyAgICAgICAgIHJldHVybiB0aGlzLl9jaGFubmVsLnN1YnNjcmliZSh0aGlzLl9uYW1lLCBjYWxsYmFjayk7XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgcHJvdGVjdGVkIHN1YnRvcGljKG5hbWUpOiBDaGFubmVsVG9waWM8VD4ge1xyXG4vLyAgICAgICAgIHJldHVybiBuZXcgQ2hhbm5lbFRvcGljPFQ+KHRoaXMuX2NoYW5uZWwsIHRoaXMuX25hbWUgKyAnLicgKyBuYW1lKTtcclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBwcm90ZWN0ZWQgc3VidG9waWNPZjxVIGV4dGVuZHMgVD4obmFtZSk6IENoYW5uZWxUb3BpYzxVPiB7XHJcbi8vICAgICAgICAgcmV0dXJuIG5ldyBDaGFubmVsVG9waWM8VT4odGhpcy5fY2hhbm5lbCwgdGhpcy5fbmFtZSArICcuJyArIG5hbWUpO1xyXG4vLyAgICAgfVxyXG4vLyB9XHJcbiIsIlxyXG5pbnRlcmZhY2UgSVBvc3RhbCB7XHJcbiAgICBvYnNlcnZlOiAob3B0aW9uczogUG9zdGFsT2JzZXJ2ZU9wdGlvbnMpID0+IFJ4Lk9ic2VydmFibGU8YW55PjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFBvc3RhbE9ic2VydmVPcHRpb25zIHtcclxuICAgIGNoYW5uZWw6IHN0cmluZztcclxuICAgIHRvcGljOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQ2hhbm5lbERlZmluaXRpb248VD4ge1xyXG4gICAgb2JzZXJ2ZSh0b3BpYzogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxUPjtcclxufVxyXG5cclxucG9zdGFsLm9ic2VydmUgPSBmdW5jdGlvbihvcHRpb25zOiBQb3N0YWxPYnNlcnZlT3B0aW9ucykge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGNoYW5uZWwgPSBvcHRpb25zLmNoYW5uZWw7XHJcbiAgICB2YXIgdG9waWMgPSBvcHRpb25zLnRvcGljO1xyXG5cclxuICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm4oXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkSGFuZGxlcihoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjaGFubmVsOiBjaGFubmVsLFxyXG4gICAgICAgICAgICAgICAgdG9waWM6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGgsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZnVuY3Rpb24gZGVsSGFuZGxlcihfLCBzdWIpIHtcclxuICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufTtcclxuXHJcbi8vIGFkZCBvYnNlcnZlIHRvIENoYW5uZWxEZWZpbml0aW9uXHJcbig8YW55PnBvc3RhbCkuQ2hhbm5lbERlZmluaXRpb24ucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbih0b3BpYzogc3RyaW5nKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybihcclxuICAgICAgICBmdW5jdGlvbiBhZGRIYW5kbGVyKGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlbGYuYnVzLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjaGFubmVsOiBzZWxmLmNoYW5uZWwsXHJcbiAgICAgICAgICAgICAgICB0b3BpYzogdG9waWMsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogaCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmdW5jdGlvbiBkZWxIYW5kbGVyKF8sIHN1Yikge1xyXG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59O1xyXG4iLCJcclxuY29uc3QgcmggPSBSZWFjdC5jcmVhdGVFbGVtZW50O1xyXG4iLCJcclxuYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50PFQ+IHtcclxuICAgIGFic3RyYWN0IHJlbmRlcihkYXRhOiBUKTogVk5vZGU7XHJcbn0iLCJcclxuaW50ZXJmYWNlIFJlYWN0aXZlRG9tQ29tcG9uZW50IHtcclxuICAgIGRvbSQ6IFJ4Lk9ic2VydmFibGU8Vk5vZGU+O1xyXG59XHJcblxyXG5jbGFzcyBSZWFjdGl2ZURvbSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXIgYSByZWFjdGl2ZSBjb21wb25lbnQgd2l0aGluIGNvbnRhaW5lci5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHJlbmRlclN0cmVhbShcclxuICAgICAgICBkb20kOiBSeC5PYnNlcnZhYmxlPFZOb2RlPixcclxuICAgICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50XHJcbiAgICApOiBSeC5PYnNlcnZhYmxlPFZOb2RlPiB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBjb250YWluZXIuaWQ7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQ6IEhUTUxFbGVtZW50IHwgVk5vZGUgPSBjb250YWluZXI7XHJcbiAgICAgICAgY29uc3Qgc2luayA9IG5ldyBSeC5TdWJqZWN0PFZOb2RlPigpO1xyXG4gICAgICAgIGRvbSQuc3Vic2NyaWJlKGRvbSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCFkb20pIHJldHVybjtcclxuLy9jb25zb2xlLmxvZygncmVuZGVyaW5nIGRvbScsIGRvbSk7IC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gcmV0YWluIElEXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGNoZWQgPSBwYXRjaChjdXJyZW50LCBkb20pO1xyXG4gICAgICAgICAgICBpZihpZCAmJiAhcGF0Y2hlZC5lbG0uaWQpe1xyXG4gICAgICAgICAgICAgICAgcGF0Y2hlZC5lbG0uaWQgPSBpZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY3VycmVudCA9IHBhdGNoZWQ7XHJcbiAgICAgICAgICAgIHNpbmsub25OZXh0KDxWTm9kZT5jdXJyZW50KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gc2luaztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlciBhIHJlYWN0aXZlIGNvbXBvbmVudCB3aXRoaW4gY29udGFpbmVyLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIGNvbXBvbmVudDogUmVhY3RpdmVEb21Db21wb25lbnQsXHJcbiAgICAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFZOb2RlXHJcbiAgICApOiBSeC5PYnNlcnZhYmxlPFZOb2RlPiB7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBjb250YWluZXI7XHJcbiAgICAgICAgbGV0IHNpbmsgPSBuZXcgUnguU3ViamVjdDxWTm9kZT4oKTtcclxuICAgICAgICBjb21wb25lbnQuZG9tJC5zdWJzY3JpYmUoZG9tID0+IHtcclxuICAgICAgICAgICAgaWYoIWRvbSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gcGF0Y2goY3VycmVudCwgZG9tKTtcclxuICAgICAgICAgICAgc2luay5vbk5leHQoPFZOb2RlPmN1cnJlbnQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBzaW5rO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVyIHdpdGhpbiBjb250YWluZXIgd2hlbmV2ZXIgc291cmNlIGNoYW5nZXMuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBsaXZlUmVuZGVyPFQ+KFxyXG4gICAgICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBWTm9kZSxcclxuICAgICAgICBzb3VyY2U6IFJ4Lk9ic2VydmFibGU8VD4sXHJcbiAgICAgICAgcmVuZGVyOiAobmV4dDogVCkgPT4gVk5vZGVcclxuICAgICk6IFJ4Lk9ic2VydmFibGU8Vk5vZGU+IHtcclxuICAgICAgICBsZXQgY3VycmVudCA9IGNvbnRhaW5lcjtcclxuICAgICAgICBsZXQgc2luayA9IG5ldyBSeC5TdWJqZWN0PFZOb2RlPigpO1xyXG4gICAgICAgIHNvdXJjZS5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBub2RlID0gcmVuZGVyKGRhdGEpO1xyXG4gICAgICAgICAgICBpZighbm9kZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gcGF0Y2goY3VycmVudCwgbm9kZSk7XHJcbiAgICAgICAgICAgIHNpbmsub25OZXh0KDxWTm9kZT5jdXJyZW50KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gc2luaztcclxuICAgIH1cclxuXHJcbn0iLCIvLyBjb25zdCBBbWF0aWNVcmwgPSAnaHR0cDovL2ZvbnRzLmdzdGF0aWMuY29tL3MvYW1hdGljc2MvdjgvSURua1JUUEdjclNWbzUwVXlZTks3eTNVU0JuU3Zwa29wUWFVUi0ycjdpVS50dGYnO1xyXG4vLyBjb25zdCBSb2JvdG8xMDAgPSAnaHR0cDovL2ZvbnRzLmdzdGF0aWMuY29tL3Mvcm9ib3RvL3YxNS83TXlncVRlMnpzOVlrUDBhZEE5UVFRLnR0Zic7XHJcbi8vIGNvbnN0IFJvYm90bzUwMCA9ICdmb250cy9Sb2JvdG8tNTAwLnR0Zic7XHJcbi8vIGNvbnN0IFJvYm90bzkwMCA9IFwiaHR0cDovL2ZvbnRzLmdzdGF0aWMuY29tL3Mvcm9ib3RvL3YxNS9IMXZCMzRuT0tXWHF6S290cTI1cGNnLnR0ZlwiO1xyXG4vLyBjb25zdCBPcGVuU2Fuc1JlZ3VsYXIgPSBcImZvbnRzL09wZW5TYW5zL09wZW5TYW5zLVJlZ3VsYXIudHRmXCI7XHJcbi8vIGNvbnN0IE9wZW5TYW5zRXh0cmFCb2xkID0gXCJmb250cy9PcGVuU2Fucy9PcGVuU2Fucy1FeHRyYUJvbGQudHRmXCI7XHJcbi8vIGNvbnN0IEFxdWFmaW5hU2NyaXB0ID0gJ2ZvbnRzL0FndWFmaW5hU2NyaXB0LVJlZ3VsYXIvQWd1YWZpbmFTY3JpcHQtUmVndWxhci50dGYnXHJcbi8vIGNvbnN0IE5vcmljYW4gPSBcImh0dHA6Ly9mb250cy5nc3RhdGljLmNvbS9zL25vcmljYW4vdjQvU0huU3FoWUFXRzVzWlRXY1B6RUhpZy50dGZcIjtcclxuXHJcbmNsYXNzIEFwcENvbnRyb2xsZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHN0b3JlOiBTdG9yZSxcclxuICAgICAgICBza2V0Y2hFZGl0b3I6IFNrZXRjaEVkaXRvcixcclxuICAgICAgICBzZWxlY3RlZEl0ZW1FZGl0b3I6IFNlbGVjdGVkSXRlbUVkaXRvcikge1xyXG5cclxuICAgICAgICBjb25zdCBhY3Rpb25zID0gc3RvcmUuYWN0aW9ucywgZXZlbnRzID0gc3RvcmUuZXZlbnRzO1xyXG5cclxuICAgICAgICBhY3Rpb25zLnN1YnNjcmliZSh4ID0+IGNvbnNvbGUubG9nKHgpKTtcclxuICAgICAgICBldmVudHMuc3Vic2NyaWJlKHggPT4gY29uc29sZS5sb2coeCkpO1xyXG5cclxuICAgICAgICBsZXQgd29ya3NwYWNlQ29udHJvbGxlcjogV29ya3NwYWNlQ29udHJvbGxlcjtcclxuICAgICAgICBldmVudHMuYXBwLmZvbnRMb2FkZWQub2JzZXJ2ZSgpLmZpcnN0KCkuc3Vic2NyaWJlKG0gPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgd29ya3NwYWNlQ29udHJvbGxlciA9IG5ldyBXb3Jrc3BhY2VDb250cm9sbGVyKHN0b3JlLCBtLmRhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZXZlbnRzLmFwcC5yZXRhaW5lZFN0YXRlTG9hZEF0dGVtcHRDb21wbGV0ZS5zdWJzY3JpYmUobSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW0uZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIGF1dG9zYXZlIGRhdGEgbG9hZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9ucy5za2V0Y2guY3JlYXRlLmRpc3BhdGNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9ucy50ZXh0QmxvY2suYWRkLmRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRleHQ6IFwiRklERExFU1RJQ0tTXCIsIHRleHRDb2xvcjogXCJsaWdodGJsdWVcIiwgZm9udFNpemU6IDEyOCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tc2F2ZSBpbiBvbmUgbGluZTogZ290dGEgbG92ZSBpdC5cclxuICAgICAgICAgICAgICAgIGV2ZW50cy5hcHAucmV0YWluZWRTdGF0ZUNoYW5nZWQub2JzZXJ2ZSgpLmRlYm91bmNlKDgwMCkuc3Vic2NyaWJlKHN0YXRlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zLmFwcC5zYXZlUmV0YWluZWRTdGF0ZS5kaXNwYXRjaCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgYWN0aW9ucy5hcHAubG9hZFJldGFpbmVkU3RhdGUuZGlzcGF0Y2goKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZXZlbnRzLnNrZXRjaC5sb2FkZWQuc3Vic2NyaWJlKGV2ID0+XHJcbiAgICAgICAgICAgICQoXCIjbWFpbkNhbnZhc1wiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGV2LmRhdGEuYmFja2dyb3VuZENvbG9yKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGV2ZW50cy5za2V0Y2guYXR0ckNoYW5nZWQuc3Vic2NyaWJlKGV2ID0+XHJcbiAgICAgICAgICAgICQoXCIjbWFpbkNhbnZhc1wiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGV2LmRhdGEuYmFja2dyb3VuZENvbG9yKVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG59IiwiXHJcbmNsYXNzIEFjdGlvbnMgZXh0ZW5kcyBUeXBlZENoYW5uZWwuQ2hhbm5lbCB7XHJcbiAgICBcclxuICAgIGFwcCA9IHsgICAgICAgXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW5zdHJ1Y3RzIFN0b3JlIHRvIGxvYWQgcmV0YWluZWQgc3RhdGUgZnJvbSBsb2NhbCBzdG9yYWdlLCBpZiBpdCBleGlzdHMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbG9hZFJldGFpbmVkU3RhdGU6IHRoaXMudG9waWM8dm9pZD4oXCJhcHAubG9hZFJldGFpbmVkU3RhdGVcIiksXHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW5zdHJ1Y3RzIFN0b3JlIHRvIHNhdmUgcmV0YWluZWQgc3RhdGUgdG8gbG9jYWwgc3RvcmFnZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBzYXZlUmV0YWluZWRTdGF0ZTogdGhpcy50b3BpYzx2b2lkPihcImFwcC5zYXZlUmV0YWluZWRTdGF0ZVwiKSxcclxuICAgICAgICBcclxuICAgICAgICBsb2FkRm9udDogdGhpcy50b3BpYzxzdHJpbmc+KFwiYXBwLmxvYWRGb250XCIpXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBkZXNpZ25lciA9IHtcclxuICAgICAgICB6b29tVG9GaXQ6IHRoaXMudG9waWM8SXRlbVNlbGVjdGlvbj4oXCJkZXNpZ25lci56b29tVG9GaXRcIilcclxuICAgIH1cclxuICAgIFxyXG4gICAgc2tldGNoID0ge1xyXG4gICAgICAgIGNyZWF0ZTogdGhpcy50b3BpYzxTa2V0Y2g+KFwic2tldGNoLmNyZWF0ZVwiKSxcclxuICAgICAgICBhdHRyVXBkYXRlOiB0aGlzLnRvcGljPFNrZXRjaD4oXCJza2V0Y2guYXR0cnVwZGF0ZVwiKSxcclxuICAgICAgICBzZXRFZGl0aW5nSXRlbTogdGhpcy50b3BpYzxQb3NpdGlvbmVkSXRlbT4oXCJza2V0Y2guc2V0RWRpdGluZ0l0ZW1cIiksXHJcbiAgICAgICAgc2V0U2VsZWN0aW9uOiB0aGlzLnRvcGljPEl0ZW1TZWxlY3Rpb24+KFwic2tldGNoLnNldHNlbGVjdGlvblwiKSxcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRleHRCbG9jayA9IHtcclxuICAgICAgICBhZGQ6IHRoaXMudG9waWM8VGV4dEJsb2NrPihcInRleHRibG9jay5hZGRcIiksXHJcbiAgICAgICAgdXBkYXRlQXR0cjogdGhpcy50b3BpYzxUZXh0QmxvY2s+KFwidGV4dGJsb2NrLnVwZGF0ZUF0dHJcIiksXHJcbiAgICAgICAgdXBkYXRlQXJyYW5nZTogdGhpcy50b3BpYzxUZXh0QmxvY2s+KFwidGV4dGJsb2NrLnVwZGF0ZUFycmFuZ2VcIiksXHJcbiAgICAgICAgcmVtb3ZlOiB0aGlzLnRvcGljPFRleHRCbG9jaz4oXCJ0ZXh0YmxvY2sucmVtb3ZlXCIpXHJcbiAgICB9O1xyXG4gICAgXHJcbn1cclxuXHJcbmNsYXNzIEV2ZW50cyBleHRlbmRzIFR5cGVkQ2hhbm5lbC5DaGFubmVsIHtcclxuICAgIFxyXG4gICAgYXBwID0ge1xyXG4gICAgICAgIHJlc291cmNlc1JlYWR5OiB0aGlzLnRvcGljPGJvb2xlYW4+KFwiYXBwLnJlc291cmNlc1JlYWR5XCIpLFxyXG4gICAgICAgIHJldGFpbmVkU3RhdGVMb2FkQXR0ZW1wdENvbXBsZXRlOiB0aGlzLnRvcGljPGJvb2xlYW4+KFwiYXBwLnJldGFpbmVkU3RhdGVMb2FkQXR0ZW1wdENvbXBsZXRlXCIpLFxyXG4gICAgICAgIHJldGFpbmVkU3RhdGVDaGFuZ2VkOiB0aGlzLnRvcGljPFJldGFpbmVkU3RhdGU+KFwiYXBwLnJldGFpbmVkU3RhdGVDaGFuZ2VkXCIpLFxyXG4gICAgICAgIGZvbnRMb2FkZWQ6IHRoaXMudG9waWM8b3BlbnR5cGUuRm9udD4oXCJhcHAuZm9udExvYWRlZFwiKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBkZXNpZ25lciA9IHtcclxuICAgICAgICB6b29tVG9GaXRSZXF1ZXN0ZWQ6IHRoaXMudG9waWM8dm9pZD4oXCJkZXNpZ25lci56b29tVG9GaXRSZXF1ZXN0ZWRcIilcclxuICAgIH07XHJcbiAgICBcclxuICAgIHNrZXRjaCA9IHtcclxuICAgICAgICBsb2FkZWQ6IHRoaXMudG9waWM8U2tldGNoPihcInNrZXRjaC5sb2FkZWRcIiksXHJcbiAgICAgICAgYXR0ckNoYW5nZWQ6IHRoaXMudG9waWM8U2tldGNoPihcInNrZXRjaC5hdHRyQ2hhbmdlZFwiKSxcclxuICAgICAgICBlZGl0aW5nSXRlbUNoYW5nZWQ6IHRoaXMudG9waWM8UG9zaXRpb25lZEl0ZW0+KFwic2tldGNoLmVkaXRpbmdJdGVtQ2hhbmdlZFwiKSxcclxuICAgICAgICBzZWxlY3Rpb25DaGFuZ2VkOiB0aGlzLnRvcGljPEl0ZW1TZWxlY3Rpb24+KFwic2tldGNoLnNlbGVjdGlvbkNoYW5nZWRcIiksXHJcbiAgICAgICAgc2F2ZUxvY2FsUmVxdWVzdGVkOiB0aGlzLnRvcGljPEl0ZW1TZWxlY3Rpb24+KFwic2tldGNoLnNhdmVsb2NhbC5zYXZlTG9jYWxSZXF1ZXN0ZWRcIilcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRleHRibG9jayA9IHtcclxuICAgICAgICBhZGRlZDogdGhpcy50b3BpYzxUZXh0QmxvY2s+KFwidGV4dGJsb2NrLmFkZGVkXCIpLFxyXG4gICAgICAgIGF0dHJDaGFuZ2VkOiB0aGlzLnRvcGljPFRleHRCbG9jaz4oXCJ0ZXh0YmxvY2suYXR0cmNoYW5nZWRcIiksXHJcbiAgICAgICAgYXJyYW5nZUNoYW5nZWQ6IHRoaXMudG9waWM8VGV4dEJsb2NrPihcInRleHRibG9jay5hcnJhbmdlY2hhbmdlZFwiKSxcclxuICAgICAgICByZW1vdmVkOiB0aGlzLnRvcGljPFRleHRCbG9jaz4oXCJ0ZXh0YmxvY2sucmVtb3ZlZFwiKSxcclxuICAgICAgICBsb2FkZWQ6IHRoaXMudG9waWM8VGV4dEJsb2NrPihcInRleHRibG9jay5sb2FkZWRcIiksXHJcbiAgICB9O1xyXG4gICAgXHJcbn1cclxuXHJcbmNsYXNzIENoYW5uZWxzIHtcclxuICAgIGFjdGlvbnM6IEFjdGlvbnMgPSBuZXcgQWN0aW9ucygpO1xyXG4gICAgZXZlbnRzOiBFdmVudHMgPSBuZXcgRXZlbnRzKCk7XHJcbn1cclxuIiwiXHJcbmNsYXNzIEZvbnRGYW1pbGllc0xvYWRlciB7XHJcblxyXG4gICAgbG9hZExpc3RMb2NhbChjYWxsYmFjazogKGZhbWlsaWVzOiBGb250RmFtaWx5W10pID0+IHZvaWQpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiZm9udHMvZ29vZ2xlLWZvbnRzLmpzb25cIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZTogeyBraW5kOiBzdHJpbmcsIGl0ZW1zOiBGb250RmFtaWx5W10gfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UuaXRlbXMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogKHhociwgc3RhdHVzLCBlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJnb29nbGUtZm9udHMuanNvblwiLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWRMaXN0UmVtb3RlKGNhbGxiYWNrOiAoZmFtaWxpZXM6IEZvbnRGYW1pbHlbXSkgPT4gdm9pZCkge1xyXG4gICAgICAgIHZhciB1cmwgPSAnaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vd2ViZm9udHMvdjEvd2ViZm9udHM/JztcclxuICAgICAgICB2YXIga2V5ID0gJ2tleT1BSXphU3lCSGpWNl9qNFlFRnBmZWhYT3RBVExvRERGZFpiallDRkEnO1xyXG4gICAgICAgIHZhciBzb3J0ID0gXCJwb3B1bGFyaXR5XCI7XHJcbiAgICAgICAgdmFyIG9wdCA9ICdzb3J0PScgKyBzb3J0ICsgJyYnO1xyXG4gICAgICAgIHZhciByZXEgPSB1cmwgKyBvcHQgKyBrZXk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogcmVxLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlOiB7IGtpbmQ6IHN0cmluZywgaXRlbXM6IEZvbnRGYW1pbHlbXSB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZS5pdGVtcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiAoeGhyLCBzdGF0dXMsIGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih1cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZEZvclByZXZpZXcoZmFtaWxpZXM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBjaHVuayBvZiBfLmNodW5rKGZhbWlsaWVzLCAxMCkpIHtcclxuICAgICAgICAgICAgV2ViRm9udC5sb2FkKHtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZ29vZ2xlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmFtaWxpZXM6IDxzdHJpbmdbXT5jaHVuayxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5XCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiXHJcbnR5cGUgUGFyc2VkRm9udExvYWRlZCA9ICh1cmw6IHN0cmluZywgZm9udDogb3BlbnR5cGUuRm9udCkgPT4gdm9pZDsgXHJcblxyXG5jbGFzcyBQYXJzZWRGb250cyB7XHJcblxyXG4gICAgZm9udHM6IHsgW3VybDogc3RyaW5nXTogb3BlbnR5cGUuRm9udDsgfSA9IHt9O1xyXG5cclxuICAgIHByaXZhdGUgX2ZvbnRMb2FkZWQ6IFBhcnNlZEZvbnRMb2FkZWQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZm9udExvYWRlZDogUGFyc2VkRm9udExvYWRlZCl7XHJcbiAgICAgICAgdGhpcy5fZm9udExvYWRlZCA9IGZvbnRMb2FkZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KGZvbnRVcmw6IHN0cmluZywgb25SZWFkeTogUGFyc2VkRm9udExvYWRlZCA9IG51bGwpIHtcclxuICAgICAgICBsZXQgZm9udCA9IHRoaXMuZm9udHNbZm9udFVybF07XHJcblxyXG4gICAgICAgIGlmIChmb250KSB7XHJcbiAgICAgICAgICAgIG9uUmVhZHkgJiYgb25SZWFkeShmb250VXJsLCBmb250KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3BlbnR5cGUubG9hZChmb250VXJsLCAoZXJyLCBmb250KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9udHNbZm9udFVybF0gPSBmb250O1xyXG4gICAgICAgICAgICAgICAgb25SZWFkeSAmJiBvblJlYWR5KGZvbnRVcmwsIGZvbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZm9udExvYWRlZChmb250VXJsLCBmb250KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiXHJcbi8qKlxyXG4gKiBUaGUgc2luZ2xldG9uIFN0b3JlIGNvbnRyb2xzIGFsbCBhcHBsaWNhdGlvbiBzdGF0ZS5cclxuICogTm8gcGFydHMgb3V0c2lkZSBvZiB0aGUgU3RvcmUgbW9kaWZ5IGFwcGxpY2F0aW9uIHN0YXRlLlxyXG4gKiBDb21tdW5pY2F0aW9uIHdpdGggdGhlIFN0b3JlIGlzIGRvbmUgdGhyb3VnaCBtZXNzYWdlIENoYW5uZWxzOiBcclxuICogICAtIEFjdGlvbnMgY2hhbm5lbCB0byBzZW5kIGludG8gdGhlIFN0b3JlLFxyXG4gKiAgIC0gRXZlbnRzIGNoYW5uZWwgdG8gcmVjZWl2ZSBub3RpZmljYXRpb24gZnJvbSB0aGUgU3RvcmUuXHJcbiAqIE9ubHkgdGhlIFN0b3JlIGNhbiByZWNlaXZlIGFjdGlvbiBtZXNzYWdlcy5cclxuICogT25seSB0aGUgU3RvcmUgY2FuIHNlbmQgZXZlbnQgbWVzc2FnZXMuXHJcbiAqIFRoZSBTdG9yZSBjYW5ub3Qgc2VuZCBhY3Rpb25zIG9yIGxpc3RlbiB0byBldmVudHMgKHRvIGF2b2lkIGxvb3BzKS5cclxuICogTWVzc2FnZXMgYXJlIHRvIGJlIHRyZWF0ZWQgYXMgaW1tdXRhYmxlLlxyXG4gKiBBbGwgbWVudGlvbnMgb2YgdGhlIFN0b3JlIGNhbiBiZSBhc3N1bWVkIHRvIG1lYW4sIG9mIGNvdXJzZSxcclxuICogICBcIlRoZSBTdG9yZSBhbmQgaXRzIHN1Yi1jb21wb25lbnRzLlwiXHJcbiAqL1xyXG5jbGFzcyBTdG9yZSB7XHJcblxyXG4gICAgc3RhdGljIFJPQk9UT181MDBfTE9DQUwgPSAnZm9udHMvUm9ib3RvLTUwMC50dGYnO1xyXG4gICAgc3RhdGljIEFVVE9TQVZFX0tFWSA9IFwiRmlkZGxlc3RpY2tzLnJldGFpbmVkU3RhdGVcIjtcclxuICAgIHN0YXRpYyBERUZBVUxUX0ZPTlRfTkFNRSA9IFwiUm9ib3RvXCI7XHJcblxyXG4gICAgc3RhdGUgPSB7XHJcbiAgICAgICAgcmV0YWluZWQ6IDxSZXRhaW5lZFN0YXRlPntcclxuICAgICAgICAgICAgc2tldGNoOiB0aGlzLmNyZWF0ZVNrZXRjaCgpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkaXNwb3NhYmxlOiA8RGlzcG9zYWJsZVN0YXRlPnt9XHJcbiAgICB9XHJcbiAgICByZXNvdXJjZXMgPSB7XHJcbiAgICAgICAgZm9udEZhbWlsaWVzOiA8RGljdGlvbmFyeTxGb250RmFtaWx5Pj57fSxcclxuICAgICAgICBwYXJzZWRGb250czogbmV3IFBhcnNlZEZvbnRzKCh1cmwsIGZvbnQpID0+IFxyXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5hcHAuZm9udExvYWRlZC5kaXNwYXRjaChmb250KSlcclxuICAgIH1cclxuICAgIGFjdGlvbnMgPSBuZXcgQWN0aW9ucygpO1xyXG4gICAgZXZlbnRzID0gbmV3IEV2ZW50cygpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dXBTdWJzY3JpcHRpb25zKCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9hZFJlc291cmNlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldHVwU3Vic2NyaXB0aW9ucygpIHtcclxuICAgICAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5hY3Rpb25zLCBldmVudHMgPSB0aGlzLmV2ZW50cztcclxuXHJcbiAgICAgICAgLy8gLS0tLS0gQXBwIC0tLS0tXHJcblxyXG4gICAgICAgIGFjdGlvbnMuYXBwLmxvYWRSZXRhaW5lZFN0YXRlLm9ic2VydmUoKVxyXG4gICAgICAgICAgICAvLyBXYXJuaW5nOiBzdWJzY3JpYmluZyB0byBldmVudCB3aXRoaW4gU3RvcmUgLSBjcmF6eSBvciBub3Q/P1xyXG4gICAgICAgICAgICAvLyB3YWl0IHRvIGxvYWQgdW50aWwgcmVzb3VyY2VzIGFyZSByZWFkeVxyXG4gICAgICAgICAgICAucGF1c2FibGVCdWZmZXJlZChldmVudHMuYXBwLnJlc291cmNlc1JlYWR5Lm9ic2VydmUoKS5tYXAobSA9PiBtLmRhdGEpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG0gPT4ge1xyXG4gICAgICAgICAgICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFsb2NhbFN0b3JhZ2UgfHwgIWxvY2FsU3RvcmFnZS5nZXRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBub3Qgc3VwcG9ydGVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oU3RvcmUuQVVUT1NBVkVfS0VZKTtcclxuICAgICAgICAgICAgaWYgKHNhdmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkZWQgPSA8UmV0YWluZWRTdGF0ZT5KU09OLnBhcnNlKHNhdmVkKTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWQgJiYgbG9hZGVkLnNrZXRjaCAmJiBsb2FkZWQuc2tldGNoLnRleHRCbG9ja3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBkYXRhIHNlZW1zIGxlZ2l0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5yZXRhaW5lZCA9IGxvYWRlZDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaC5sb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudHMuc2tldGNoLmxvYWRlZC5kaXNwYXRjaCh0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YiBvZiB0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaC50ZXh0QmxvY2tzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy50ZXh0YmxvY2subG9hZGVkLmRpc3BhdGNoKHRiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLmRlc2lnbmVyLnpvb21Ub0ZpdFJlcXVlc3RlZC5kaXNwYXRjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUucmV0YWluZWQuc2tldGNoLmxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZXZlbnRzLmFwcC5yZXRhaW5lZFN0YXRlTG9hZEF0dGVtcHRDb21wbGV0ZS5kaXNwYXRjaChzdWNjZXNzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYWN0aW9ucy5hcHAuc2F2ZVJldGFpbmVkU3RhdGUuc3Vic2NyaWJlKG0gPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZSB8fCAhbG9jYWxTdG9yYWdlLmdldEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIG5vdCBzdXBwb3J0ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oU3RvcmUuQVVUT1NBVkVfS0VZLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLnJldGFpbmVkKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFjdGlvbnMuYXBwLmxvYWRGb250LnN1YnNjcmliZShtID0+IFxyXG4gICAgICAgICAgICB0aGlzLnJlc291cmNlcy5wYXJzZWRGb250cy5nZXQobS5kYXRhKSk7XHJcblxyXG4gICAgICAgIC8vIC0tLS0tIERlc2lnbmVyIC0tLS0tXHJcblxyXG4gICAgICAgIGFjdGlvbnMuZGVzaWduZXIuem9vbVRvRml0LnN1YnNjcmliZShtID0+IHtcclxuICAgICAgICAgICAgZXZlbnRzLmRlc2lnbmVyLnpvb21Ub0ZpdFJlcXVlc3RlZC5kaXNwYXRjaChudWxsKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvLyAtLS0tLSBTa2V0Y2ggLS0tLS1cclxuXHJcbiAgICAgICAgYWN0aW9ucy5za2V0Y2guY3JlYXRlXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKG0pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUucmV0YWluZWQuc2tldGNoID0gdGhpcy5jcmVhdGVTa2V0Y2goKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGNoID0gbS5kYXRhIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgcGF0Y2guYmFja2dyb3VuZENvbG9yID0gcGF0Y2guYmFja2dyb3VuZENvbG9yIHx8ICcjZjZmM2ViJztcclxuICAgICAgICAgICAgICAgIHRoaXMuYXNzaWduKHRoaXMuc3RhdGUucmV0YWluZWQuc2tldGNoLCBwYXRjaCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZXZlbnRzLnNrZXRjaC5sb2FkZWQuZGlzcGF0Y2godGhpcy5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gpO1xyXG4gICAgICAgICAgICAgICAgZXZlbnRzLmRlc2lnbmVyLnpvb21Ub0ZpdFJlcXVlc3RlZC5kaXNwYXRjaCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVzb3VyY2VzLnBhcnNlZEZvbnRzLmdldCh0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaC5kZWZhdWx0Rm9udERlc2MudXJsKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLmRpc3Bvc2FibGUuZWRpdGluZ0l0ZW0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VkUmV0YWluZWRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYWN0aW9ucy5za2V0Y2guYXR0clVwZGF0ZVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXNzaWduKHRoaXMuc3RhdGUucmV0YWluZWQuc2tldGNoLCBldi5kYXRhKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50cy5za2V0Y2guYXR0ckNoYW5nZWQuZGlzcGF0Y2goXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VkUmV0YWluZWRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYWN0aW9ucy5za2V0Y2guc2V0RWRpdGluZ0l0ZW0uc3Vic2NyaWJlKG0gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRCbG9jayhtLmRhdGEuaXRlbUlkKTtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLmVkaXRpbmdJdGVtID0ge1xyXG4gICAgICAgICAgICAgICAgaXRlbUlkOiBtLmRhdGEuaXRlbUlkLFxyXG4gICAgICAgICAgICAgICAgaXRlbVR5cGU6IFwiVGV4dEJsb2NrXCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtOiBpdGVtLFxyXG4gICAgICAgICAgICAgICAgY2xpZW50WDogbS5kYXRhLmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICBjbGllbnRZOiBtLmRhdGEuY2xpZW50WVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBldmVudHMuc2tldGNoLmVkaXRpbmdJdGVtQ2hhbmdlZC5kaXNwYXRjaChcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlzcG9zYWJsZS5lZGl0aW5nSXRlbSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFjdGlvbnMuc2tldGNoLnNldFNlbGVjdGlvbi5zdWJzY3JpYmUobSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChtLmRhdGEuaXRlbVR5cGUgJiYgbS5kYXRhLml0ZW1UeXBlICE9PSBcIlRleHRCbG9ja1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBgVW5oYW5kbGVkIHR5cGUgJHttLnR5cGV9YDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKChtLmRhdGEgJiYgbS5kYXRhLml0ZW1JZClcclxuICAgICAgICAgICAgICAgID09PSAodGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvbiAmJiB0aGlzLnN0YXRlLmRpc3Bvc2FibGUuc2VsZWN0aW9uLml0ZW1JZCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvbiA9IDxJdGVtU2VsZWN0aW9uPntcclxuICAgICAgICAgICAgICAgIGl0ZW1JZDogbS5kYXRhLml0ZW1JZCxcclxuICAgICAgICAgICAgICAgIGl0ZW1UeXBlOiBtLmRhdGEuaXRlbVR5cGUsXHJcbiAgICAgICAgICAgICAgICBwcmlvclNlbGVjdGlvbkl0ZW1JZDogdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgJiYgdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvbi5pdGVtSWRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZXZlbnRzLnNrZXRjaC5zZWxlY3Rpb25DaGFuZ2VkLmRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5kaXNwb3NhYmxlLnNlbGVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAvLyAtLS0tLSBUZXh0QmxvY2sgLS0tLS1cclxuXHJcbiAgICAgICAgYWN0aW9ucy50ZXh0QmxvY2suYWRkXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhdGNoID0gZXYuZGF0YTtcclxuICAgICAgICAgICAgICAgIGlmICghcGF0Y2gudGV4dCB8fCAhcGF0Y2gudGV4dC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgYmxvY2sgPSB7IF9pZDogbmV3aWQoKSB9IGFzIFRleHRCbG9jaztcclxuICAgICAgICAgICAgICAgIHRoaXMuYXNzaWduKGJsb2NrLCBwYXRjaCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWJsb2NrLmZvbnRTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZm9udFNpemUgPSAxMjg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWJsb2NrLnRleHRDb2xvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLnRleHRDb2xvciA9IFwiZ3JheVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYmxvY2suZm9udERlc2MpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaC5kZWZhdWx0Rm9udERlc2MgPSBibG9jay5mb250RGVzYztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZm9udERlc2MgPSB0aGlzLnN0YXRlLnJldGFpbmVkLnNrZXRjaC5kZWZhdWx0Rm9udERlc2M7XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gudGV4dEJsb2Nrcy5wdXNoKGJsb2NrKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50cy50ZXh0YmxvY2suYWRkZWQuZGlzcGF0Y2goYmxvY2spO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VkUmV0YWluZWRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYWN0aW9ucy50ZXh0QmxvY2sudXBkYXRlQXR0clxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBibG9jayA9IHRoaXMuZ2V0QmxvY2soZXYuZGF0YS5faWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJsb2NrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGNoID0gPFRleHRCbG9jaz57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGV2LmRhdGEudGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBldi5kYXRhLmJhY2tncm91bmRDb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbG9yOiBldi5kYXRhLnRleHRDb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udERlc2M6IGV2LmRhdGEuZm9udERlc2MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBldi5kYXRhLmZvbnRTaXplXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFzc2lnbihibG9jaywgcGF0Y2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGJsb2NrLmZvbnREZXNjKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0ZS5yZXRhaW5lZC5za2V0Y2guZGVmYXVsdEZvbnREZXNjID0gYmxvY2suZm9udERlc2M7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy50ZXh0YmxvY2suYXR0ckNoYW5nZWQuZGlzcGF0Y2goYmxvY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlZFJldGFpbmVkU3RhdGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFjdGlvbnMudGV4dEJsb2NrLnJlbW92ZVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBkaWREZWxldGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIF8ucmVtb3ZlKHRoaXMuc3RhdGUucmV0YWluZWQuc2tldGNoLnRleHRCbG9ja3MsIHRiID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGIuX2lkID09PSBldi5kYXRhLl9pZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWREZWxldGUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChkaWREZWxldGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudHMudGV4dGJsb2NrLnJlbW92ZWQuZGlzcGF0Y2goeyBfaWQ6IGV2LmRhdGEuX2lkIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmRpc3Bvc2FibGUuZWRpdGluZ0l0ZW0uaXRlbUlkID09IGV2LmRhdGEuX2lkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuZGlzcG9zYWJsZS5lZGl0aW5nSXRlbSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHMuc2tldGNoLmVkaXRpbmdJdGVtQ2hhbmdlZC5kaXNwYXRjaCh0aGlzLnN0YXRlLmRpc3Bvc2FibGUuZWRpdGluZ0l0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZWRSZXRhaW5lZFN0YXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhY3Rpb25zLnRleHRCbG9jay51cGRhdGVBcnJhbmdlXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZXYgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJsb2NrID0gdGhpcy5nZXRCbG9jayhldi5kYXRhLl9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmxvY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBibG9jay5wb3NpdGlvbiA9IGV2LmRhdGEucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2sub3V0bGluZSA9IGV2LmRhdGEub3V0bGluZTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudHMudGV4dGJsb2NrLmFycmFuZ2VDaGFuZ2VkLmRpc3BhdGNoKGJsb2NrKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZWRSZXRhaW5lZFN0YXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWRSZXNvdXJjZXMoKSB7XHJcbiAgICAgICAgY29uc3QgbG9hZGVyID0gbmV3IEZvbnRGYW1pbGllc0xvYWRlcigpO1xyXG4gICAgICAgIGxvYWRlci5sb2FkTGlzdExvY2FsKGZhbWlsaWVzID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGljdCA9IHRoaXMucmVzb3VyY2VzLmZvbnRGYW1pbGllcztcclxuICAgICAgICAgICAgZm9yIChjb25zdCBmYW1pbHlHcm91cCBvZiBmYW1pbGllcykge1xyXG4gICAgICAgICAgICAgICAgZGljdFtmYW1pbHlHcm91cC5mYW1pbHldID0gZmFtaWx5R3JvdXA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBsb2FkIGZvbnRzIGludG8gYnJvd3NlciBmb3IgcHJldmlld1xyXG4gICAgICAgICAgICBsb2FkZXIubG9hZEZvclByZXZpZXcoZmFtaWxpZXMubWFwKGYgPT4gZi5mYW1pbHkpKTtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXMucGFyc2VkRm9udHMuZ2V0KFN0b3JlLlJPQk9UT181MDBfTE9DQUwpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuYXBwLnJlc291cmNlc1JlYWR5LmRpc3BhdGNoKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZWRSZXRhaW5lZFN0YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLmFwcC5yZXRhaW5lZFN0YXRlQ2hhbmdlZC5kaXNwYXRjaCh0aGlzLnN0YXRlLnJldGFpbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3NpZ248VD4oZGVzdDogVCwgc291cmNlOiBUKSB7XHJcbiAgICAgICAgXy5tZXJnZShkZXN0LCBzb3VyY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZVNrZXRjaCgpOiBTa2V0Y2gge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGRlZmF1bHRGb250RGVzYzoge1xyXG4gICAgICAgICAgICAgICAgZmFtaWx5OiBcIlJvYm90b1wiLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgdXJsOiBTdG9yZS5ST0JPVE9fNTAwX0xPQ0FMIFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0ZXh0QmxvY2tzOiA8VGV4dEJsb2NrW10+W11cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0QmxvY2soaWQ6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBfLmZpbmQodGhpcy5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gudGV4dEJsb2NrcywgdGIgPT4gdGIuX2lkID09PSBpZCk7XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbnR5cGUgQWN0aW9uVHlwZXMgPSBcclxuICAgIFwic2tldGNoLmNyZWF0ZVwiXHJcbiAgICB8IFwic2tldGNoLnVwZGF0ZVwiXHJcbiAgICB8IFwidGV4dGJsb2NrLmFkZFwiXHJcbiAgICB8IFwidGV4dGJsb2NrLnVwZGF0ZVwiO1xyXG5cclxudHlwZSBFdmVudFR5cGVzID1cclxuICAgIFwic2tldGNoLmxvYWRlZFwiXHJcbiAgICB8IFwic2tldGNoLmNoYW5nZWRcIlxyXG4gICAgfCBcInRleHRibG9jay5hZGRlZFwiXHJcbiAgICB8IFwidGV4dGJsb2NrLmNoYW5nZWRcIjtcclxuIiwiXHJcbmludGVyZmFjZSBSZXRhaW5lZFN0YXRlIHtcclxuICAgIHNrZXRjaDogU2tldGNoO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGlzcG9zYWJsZVN0YXRlIHtcclxuICAgIGVkaXRpbmdJdGVtPzogUG9zaXRpb25lZEl0ZW07XHJcbiAgICBzZWxlY3Rpb24/OiBJdGVtU2VsZWN0aW9uO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgU2tldGNoIHtcclxuICAgIGJhY2tncm91bmRDb2xvcj86IHN0cmluZztcclxuICAgIGRlZmF1bHRGb250RGVzYz86IEZvbnREZXNjcmlwdGlvbjtcclxuICAgIHRleHRCbG9ja3M/OiBUZXh0QmxvY2tbXTtcclxuICAgIGxvYWRpbmc/OiBib29sZWFuO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRm9udEZhbWlseSB7XHJcbiAgICBraW5kPzogc3RyaW5nO1xyXG4gICAgZmFtaWx5Pzogc3RyaW5nO1xyXG4gICAgY2F0ZWdvcnk/OiBzdHJpbmc7XHJcbiAgICB2YXJpYW50cz86IHN0cmluZ1tdO1xyXG4gICAgc3Vic2V0cz86IHN0cmluZ1tdO1xyXG4gICAgdmVyc2lvbj86IHN0cmluZztcclxuICAgIGxhc3RNb2RpZmllZD86IHN0cmluZztcclxuICAgIGZpbGVzPzogeyBbdmFyaWFudDogc3RyaW5nXSA6IHN0cmluZzsgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEZvbnREZXNjcmlwdGlvbiB7XHJcbiAgICBmYW1pbHk6IHN0cmluZztcclxuICAgIGNhdGVnb3J5OiBzdHJpbmc7XHJcbiAgICB2YXJpYW50OiBzdHJpbmc7XHJcbiAgICB1cmw6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFBvc2l0aW9uZWRJdGVtIHtcclxuICAgIGl0ZW1JZD86IHN0cmluZztcclxuICAgIGl0ZW1UeXBlPzogc3RyaW5nO1xyXG4gICAgaXRlbT86IE9iamVjdDtcclxuICAgIGNsaWVudFg/OiBudW1iZXI7XHJcbiAgICBjbGllbnRZPzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSXRlbVNlbGVjdGlvbiB7XHJcbiAgICBpdGVtSWQ/OiBzdHJpbmc7XHJcbiAgICBpdGVtVHlwZT86IHN0cmluZztcclxuICAgIHByaW9yU2VsZWN0aW9uSXRlbUlkPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVGV4dEJsb2NrIGV4dGVuZHMgQmxvY2tBcnJhbmdlbWVudCB7XHJcbiAgICBfaWQ/OiBzdHJpbmc7XHJcbiAgICB0ZXh0Pzogc3RyaW5nO1xyXG4gICAgdGV4dENvbG9yPzogc3RyaW5nO1xyXG4gICAgYmFja2dyb3VuZENvbG9yPzogc3RyaW5nO1xyXG4gICAgZm9udERlc2M/OiBGb250RGVzY3JpcHRpb247XHJcbiAgICBmb250U2l6ZT86IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIEJsb2NrQXJyYW5nZW1lbnQge1xyXG4gICAgcG9zaXRpb24/OiBudW1iZXJbXSxcclxuICAgIG91dGxpbmU/OiB7XHJcbiAgICAgICAgdG9wOiBQYXRoUmVjb3JkLFxyXG4gICAgICAgIGJvdHRvbTogUGF0aFJlY29yZFxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW50ZXJmYWNlIEJhY2tncm91bmRBY3Rpb25TdGF0dXMge1xyXG4gICAgYWN0aW9uPzogT2JqZWN0O1xyXG4gICAgcmVqZWN0ZWQ/OiBib29sZWFuO1xyXG4gICAgZXJyb3I/OiBib29sZWFuXHJcbiAgICBtZXNzYWdlPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUGF0aFJlY29yZCB7XHJcbiAgICBzZWdtZW50czogU2VnbWVudFJlY29yZFtdO1xyXG59XHJcblxyXG4vKipcclxuICogU2luZ2xlLXBvaW50IHNlZ21lbnRzIGFyZSBzdG9yZWQgYXMgbnVtYmVyWzJdXHJcbiAqL1xyXG50eXBlIFNlZ21lbnRSZWNvcmQgPSBBcnJheTxQb2ludFJlY29yZD4gfCBBcnJheTxudW1iZXI+O1xyXG5cclxudHlwZSBQb2ludFJlY29yZCA9IEFycmF5PG51bWJlcj47XHJcbiIsIlxyXG5jbGFzcyBDb2xvclBpY2tlciB7XHJcbiAgICBzdGF0aWMgc2V0dXAoZWxlbSwgb25DaGFuZ2UpIHtcclxuICAgICAgICBsZXQgc2VsID0gPGFueT4kKGVsZW0pO1xyXG4gICAgICAgICg8YW55PiQoZWxlbSkpLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBwcmVmZXJyZWRGb3JtYXQ6IFwiaGV4XCIsXHJcbiAgICAgICAgICAgIHNob3dCdXR0b25zOiBmYWxzZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93UGFsZXR0ZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd1NlbGVjdGlvblBhbGV0dGU6IHRydWUsXHJcbiAgICAgICAgICAgIHBhbGV0dGU6IFtcclxuICAgICAgICAgICAgICAgIFtcIiMwMDBcIiwgXCIjNDQ0XCIsIFwiIzY2NlwiLCBcIiM5OTlcIiwgXCIjY2NjXCIsIFwiI2VlZVwiLCBcIiNmM2YzZjNcIiwgXCIjZmZmXCJdLFxyXG4gICAgICAgICAgICAgICAgW1wiI2YwMFwiLCBcIiNmOTBcIiwgXCIjZmYwXCIsIFwiIzBmMFwiLCBcIiMwZmZcIiwgXCIjMDBmXCIsIFwiIzkwZlwiLCBcIiNmMGZcIl0sXHJcbiAgICAgICAgICAgICAgICBbXCIjZjRjY2NjXCIsIFwiI2ZjZTVjZFwiLCBcIiNmZmYyY2NcIiwgXCIjZDllYWQzXCIsIFwiI2QwZTBlM1wiLCBcIiNjZmUyZjNcIiwgXCIjZDlkMmU5XCIsIFwiI2VhZDFkY1wiXSxcclxuICAgICAgICAgICAgICAgIFtcIiNlYTk5OTlcIiwgXCIjZjljYjljXCIsIFwiI2ZmZTU5OVwiLCBcIiNiNmQ3YThcIiwgXCIjYTJjNGM5XCIsIFwiIzlmYzVlOFwiLCBcIiNiNGE3ZDZcIiwgXCIjZDVhNmJkXCJdLFxyXG4gICAgICAgICAgICAgICAgW1wiI2UwNjY2NlwiLCBcIiNmNmIyNmJcIiwgXCIjZmZkOTY2XCIsIFwiIzkzYzQ3ZFwiLCBcIiM3NmE1YWZcIiwgXCIjNmZhOGRjXCIsIFwiIzhlN2NjM1wiLCBcIiNjMjdiYTBcIl0sXHJcbiAgICAgICAgICAgICAgICBbXCIjYzAwXCIsIFwiI2U2OTEzOFwiLCBcIiNmMWMyMzJcIiwgXCIjNmFhODRmXCIsIFwiIzQ1ODE4ZVwiLCBcIiMzZDg1YzZcIiwgXCIjNjc0ZWE3XCIsIFwiI2E2NGQ3OVwiXSxcclxuICAgICAgICAgICAgICAgIFtcIiM5MDBcIiwgXCIjYjQ1ZjA2XCIsIFwiI2JmOTAwMFwiLCBcIiMzODc2MWRcIiwgXCIjMTM0ZjVjXCIsIFwiIzBiNTM5NFwiLCBcIiMzNTFjNzVcIiwgXCIjNzQxYjQ3XCJdLFxyXG4gICAgICAgICAgICAgICAgW1wiIzYwMFwiLCBcIiM3ODNmMDRcIiwgXCIjN2Y2MDAwXCIsIFwiIzI3NGUxM1wiLCBcIiMwYzM0M2RcIiwgXCIjMDczNzYzXCIsIFwiIzIwMTI0ZFwiLCBcIiM0YzExMzBcIl1cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlS2V5OiBcInNrZXRjaHRleHRcIixcclxuICAgICAgICAgICAgY2hhbmdlOiBvbkNoYW5nZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgc3RhdGljIHNldChlbGVtOiBIVE1MRWxlbWVudCwgdmFsdWU6IHN0cmluZyl7XHJcbiAgICAgICAgKDxhbnk+JChlbGVtKSkuc3BlY3RydW0oXCJzZXRcIiwgdmFsdWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzdGF0aWMgZGVzdHJveShlbGVtKXtcclxuICAgICAgICg8YW55PiQoZWxlbSkpLnNwZWN0cnVtKFwiZGVzdHJveVwiKTtcclxuICAgIH1cclxufSIsIlxyXG5kZWNsYXJlIHZhciBSZWFjdFNlbGVjdDtcclxuXHJcbmludGVyZmFjZSBGb250UGlja2VyUHJvcHMge1xyXG4gICAgc3RvcmU6IFN0b3JlOyAgICBcclxuICAgIHNlbGVjdGlvbj86IEZvbnREZXNjcmlwdGlvbjtcclxuICAgIHNlbGVjdGlvbkNoYW5nZWQ6IChzZWxlY3Rpb246IEZvbnREZXNjcmlwdGlvbikgPT4gdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIEZvbnRQaWNrZXJTdGF0ZSB7XHJcbiAgICBmYW1pbHlPYmplY3Q/OiBGb250RmFtaWx5O1xyXG4gICAgdmFyaWFudD86IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgRm9udFBpY2tlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxGb250UGlja2VyUHJvcHMsIEZvbnRQaWNrZXJTdGF0ZT4ge1xyXG4gICAgXHJcbiAgICBwcmV2aWV3Rm9udFNpemUgPSBcIjI4cHhcIjtcclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IocHJvcHM6IEZvbnRQaWNrZXJQcm9wcyl7XHJcbiAgICAgICAgc3VwZXIocHJvcHMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcclxuICAgICAgICBcclxuICAgICAgICBpZih0aGlzLnByb3BzLnNlbGVjdGlvbil7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZmFtaWx5T2JqZWN0ID0gdGhpcy5wcm9wcy5zdG9yZS5yZXNvdXJjZXMuZm9udEZhbWlsaWVzW3RoaXMucHJvcHMuc2VsZWN0aW9uLmZhbWlseV07XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUudmFyaWFudCA9IHRoaXMucHJvcHMuc2VsZWN0aW9uLnZhcmlhbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgY29uc3QgZmFtaWx5T3B0aW9uUmVuZGVyID0gKG9wdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmb250RmFtaWx5ID0gb3B0aW9uLnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gcmgoXCJkaXZcIiwge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb250RmFtaWx5LFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiB0aGlzLnByZXZpZXdGb250U2l6ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBbZm9udEZhbWlseV0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgdmFyaWFudE9wdGlvblJlbmRlciA9IChvcHRpb24pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZm9udFZhcmlhbnQgPSBvcHRpb24udmFsdWU7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gPGFueT5Gb250SGVscGVycy5nZXRDc3NTdHlsZSh0aGlzLnN0YXRlLmZhbWlseU9iamVjdC5mYW1pbHksIGZvbnRWYXJpYW50KTtcclxuICAgICAgICAgICAgc3R5bGUuZm9udFNpemUgPSB0aGlzLnByZXZpZXdGb250U2l6ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHJoKFwiZGl2XCIsIHsgc3R5bGUgfSwgXHJcbiAgICAgICAgICAgICAgIFtgJHt0aGlzLnN0YXRlLmZhbWlseU9iamVjdC5mYW1pbHl9ICR7b3B0aW9uLnZhbHVlfWBdKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiByaChcImRpdlwiLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcImZvbnQtcGlja2VyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFtcclxuICAgICAgICAgICAgcmgoUmVhY3RTZWxlY3QsIHsgXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImZvbnQtZmFtaWx5XCIsIFxyXG4gICAgICAgICAgICAgICAga2V5OiBcImZvbnQtZmFtaWx5XCIsXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiZm9udC1mYW1pbHlcIiwgXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5zdGF0ZS5mYW1pbHlPYmplY3QgJiYgdGhpcy5zdGF0ZS5mYW1pbHlPYmplY3QuZmFtaWx5LFxyXG4gICAgICAgICAgICAgICAgY2xlYXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMuZ2V0RmFtaWx5T3B0aW9ucygpLCBcclxuICAgICAgICAgICAgICAgIG9wdGlvblJlbmRlcmVyOiBmYW1pbHlPcHRpb25SZW5kZXIsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZVJlbmRlcmVyOiBmYW1pbHlPcHRpb25SZW5kZXIsXHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogKGYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmYW1pbHlPYmplY3QgPSB0aGlzLnByb3BzLnN0b3JlLnJlc291cmNlcy5mb250RmFtaWxpZXNbZl07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyaWFudCA9IF8ubGFzdChmYW1pbHlPYmplY3QudmFyaWFudHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih2ID0+IHYuaW5kZXhPZihcIml0YWxpY1wiKSA8IDApKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHlPYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnRcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHRoaXMuc2VuZFNlbGVjdGlvbkNoYW5nZWQoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAvLyBvbmx5IHNob3cgZm9yIG11bHRpcGxlIHZhcmlhbnRzXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZmFtaWx5T2JqZWN0ICYmIHRoaXMuc3RhdGUuZmFtaWx5T2JqZWN0LnZhcmlhbnRzLmxlbmd0aCA+IDEgJiZcclxuICAgICAgICAgICAgcmgoUmVhY3RTZWxlY3QsIHsgXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImZvbnQtdmFyaWFudFwiLCBcclxuICAgICAgICAgICAgICAgIGtleTogXCJmb250LXZhcmlhbnRcIixcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogXCJmb250LXZhcmlhbnRcIiwgXHJcbiAgICAgICAgICAgICAgICBjbGVhcmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuc3RhdGUudmFyaWFudCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMuc3RhdGUuZmFtaWx5T2JqZWN0ICYmIHRoaXMuc3RhdGUuZmFtaWx5T2JqZWN0LnZhcmlhbnRzLm1hcCh2ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdiwgbGFiZWw6IHYgfTtcclxuICAgICAgICAgICAgICAgIH0pLCBcclxuICAgICAgICAgICAgICAgIG9wdGlvblJlbmRlcmVyOiB2YXJpYW50T3B0aW9uUmVuZGVyLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVSZW5kZXJlcjogdmFyaWFudE9wdGlvblJlbmRlcixcclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlOiAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseU9iamVjdDogdGhpcy5zdGF0ZS5mYW1pbHlPYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6IHZhbHVlIFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnNlbmRTZWxlY3Rpb25DaGFuZ2VkKCkgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZW5kU2VsZWN0aW9uQ2hhbmdlZCgpe1xyXG4gICAgICAgIHRoaXMucHJvcHMuc2VsZWN0aW9uQ2hhbmdlZChcclxuICAgICAgICAgICAgRm9udEhlbHBlcnMuZ2V0RGVzY3JpcHRpb24odGhpcy5zdGF0ZS5mYW1pbHlPYmplY3QsIHRoaXMuc3RhdGUudmFyaWFudCkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIGdldEZhbWlseU9wdGlvbnMoKTogeyB2YWx1ZTogRm9udEZhbWlseSwgbGFiZWw6IHN0cmluZ31bXSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IF8udmFsdWVzKHRoaXMucHJvcHMuc3RvcmUucmVzb3VyY2VzLmZvbnRGYW1pbGllcylcclxuICAgICAgICAgICAgLm1hcCgoZm9udEZhbWlseTogRm9udEZhbWlseSkgPT4gXHJcbiAgICAgICAgICAgICAgICB7IHJldHVybiB7IHZhbHVlOiBmb250RmFtaWx5LmZhbWlseSwgbGFiZWw6IGZvbnRGYW1pbHkuZmFtaWx5IH07IH0pO1xyXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5jbGFzcyBTZWxlY3RlZEl0ZW1FZGl0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHN0b3JlOiBTdG9yZSkge1xyXG5cclxuICAgICAgICBjb25zdCBkb20kID0gc3RvcmUuZXZlbnRzLm1lcmdlVHlwZWQ8UG9zaXRpb25lZEl0ZW0+KCBcclxuICAgICAgICAgICAgICAgIHN0b3JlLmV2ZW50cy5za2V0Y2guZWRpdGluZ0l0ZW1DaGFuZ2VkLFxyXG4gICAgICAgICAgICAgICAgc3RvcmUuZXZlbnRzLnNrZXRjaC5sb2FkZWRcclxuICAgICAgICAgICAgKS5tYXAoaSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWkuZGF0YSB8fCAhaS5kYXRhLml0ZW1JZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdiNlZGl0b3JPdmVybGF5JyxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpLmRhdGEuaXRlbVR5cGUgIT09ICdUZXh0QmxvY2snKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBibG9jayA9IGkuZGF0YS5pdGVtIGFzIFRleHRCbG9jaztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYjZWRpdG9yT3ZlcmxheScsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogaS5kYXRhLmNsaWVudFggKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogaS5kYXRhLmNsaWVudFkgKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiei1pbmRleFwiOiAxXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBuZXcgVGV4dEJsb2NrRWRpdG9yKHN0b3JlKS5yZW5kZXIoYmxvY2spXHJcbiAgICAgICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIFJlYWN0aXZlRG9tLnJlbmRlclN0cmVhbShkb20kLCBjb250YWluZXIpO1xyXG5cclxuICAgIH1cclxufVxyXG4iLCJcclxuY2xhc3MgU2tldGNoRWRpdG9yIGV4dGVuZHMgQ29tcG9uZW50PFNrZXRjaD4ge1xyXG5cclxuICAgIF9zdG9yZTogU3RvcmU7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgc3RvcmU6IFN0b3JlKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2tldGNoRG9tJCA9IHN0b3JlLmV2ZW50cy5tZXJnZShcclxuICAgICAgICAgICAgc3RvcmUuZXZlbnRzLnNrZXRjaC5sb2FkZWQsXHJcbiAgICAgICAgICAgIHN0b3JlLmV2ZW50cy5za2V0Y2guYXR0ckNoYW5nZWQpXHJcbiAgICAgICAgICAgIC5tYXAobSA9PiB0aGlzLnJlbmRlcihzdG9yZS5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gpKTtcclxuICAgICAgICBSZWFjdGl2ZURvbS5yZW5kZXJTdHJlYW0oc2tldGNoRG9tJCwgY29udGFpbmVyKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKHNrZXRjaDogU2tldGNoKSB7XHJcbiAgICAgICAgcmV0dXJuIGgoXCJkaXZcIiwgW1xyXG4gICAgICAgICAgICBoKFwibGFiZWxcIiwgXCJBZGQgdGV4dDogXCIpLFxyXG4gICAgICAgICAgICBoKFwiaW5wdXQuYWRkLXRleHRcIiwge1xyXG4gICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICBrZXlwcmVzczogKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldi53aGljaCA9PT0gMTMgfHwgZXYua2V5Q29kZSA9PT0gMTMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBldi50YXJnZXQgJiYgZXYudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcmUuYWN0aW9ucy50ZXh0QmxvY2suYWRkLmRpc3BhdGNoKHsgdGV4dDogdGV4dCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldi50YXJnZXQudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiUHJlc3MgW0VudGVyXSB0byBhZGRcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gaChcImRpdi5mb250LXBpY2tlci1jb250YWluZXJcIixcclxuICAgICAgICAgICAgLy8gICAgIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBob29rOiB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluc2VydDogKHZub2RlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICBjb25zdCBwcm9wczogRm9udFBpY2tlclByb3BzID0ge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIHN0b3JlOiB0aGlzLl9zdG9yZSxcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNrZXRjaC5kZWZhdWx0Rm9udERlc2MsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uQ2hhbmdlZDogKGRlZmF1bHRGb250RGVzYykgPT4ge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZS5hY3Rpb25zLnNrZXRjaC5hdHRyVXBkYXRlLmRpc3BhdGNoKHsgZGVmYXVsdEZvbnREZXNjIH0pO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICBSZWFjdERPTS5yZW5kZXIocmgoRm9udFBpY2tlciwgcHJvcHMpLCB2bm9kZS5lbG0pO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gKSwgICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGgoXCJsYWJlbFwiLCBcIkJhY2tncm91bmQ6IFwiKSxcclxuICAgICAgICAgICAgaChcImlucHV0LmJhY2tncm91bmQtY29sb3JcIixcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInRleHRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNrZXRjaC5iYWNrZ3JvdW5kQ29sb3JcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGhvb2s6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0OiAodm5vZGUpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xvclBpY2tlci5zZXR1cChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2bm9kZS5lbG0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZS5hY3Rpb25zLnNrZXRjaC5hdHRyVXBkYXRlLmRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yICYmIGNvbG9yLnRvSGV4U3RyaW5nKCkgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlOiAob2xkVm5vZGUsIHZub2RlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xvclBpY2tlci5zZXQodm5vZGUuZWxtLCBza2V0Y2guYmFja2dyb3VuZENvbG9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveTogKHZub2RlKSA9PiBDb2xvclBpY2tlci5kZXN0cm95KHZub2RlLmVsbSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgICAgIEJvb3RTY3JpcHQuZHJvcGRvd24oe1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwic2tldGNoTWVudVwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogXCJGaWRkbGVcIixcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBcIk5ld1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQ3JlYXRlIG5ldyBza2V0Y2hcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0aGlzLl9zdG9yZS5hY3Rpb25zLnNrZXRjaC5jcmVhdGUuZGlzcGF0Y2goKVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBcIlpvb20gdG8gZml0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJGaXQgc2tldGNoIGNvbnRlbnRzIGluIHZpZXdcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiAoKSA9PiB0aGlzLl9zdG9yZS5hY3Rpb25zLmRlc2lnbmVyLnpvb21Ub0ZpdC5kaXNwYXRjaCgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG4iLCJjbGFzcyBUZXh0QmxvY2tFZGl0b3IgZXh0ZW5kcyBDb21wb25lbnQ8VGV4dEJsb2NrPiB7XHJcbiAgICBzdG9yZTogU3RvcmU7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc3RvcmU6IFN0b3JlKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnN0b3JlID0gc3RvcmU7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKHRleHRCbG9jazogVGV4dEJsb2NrKTogVk5vZGUge1xyXG4gICAgICAgIGxldCB1cGRhdGUgPSB0YiA9PiB7XHJcbiAgICAgICAgICAgIHRiLl9pZCA9IHRleHRCbG9jay5faWQ7XHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmUuYWN0aW9ucy50ZXh0QmxvY2sudXBkYXRlQXR0ci5kaXNwYXRjaCh0Yik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gaChcImRpdi50ZXh0LWJsb2NrLWVkaXRvclwiLFxyXG4gICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgaChcInRleHRhcmVhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRleHRCbG9jay50ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl1cDogZSA9PiB1cGRhdGUoeyB0ZXh0OiBlLnRhcmdldC52YWx1ZSB9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZTogZSA9PiB1cGRhdGUoeyB0ZXh0OiBlLnRhcmdldC52YWx1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSksXHJcblxyXG4gICAgICAgICAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaChcImRpdi5mb250LWNvbG9yLWljb24uZm9yZVwiLCB7fSwgXCJBXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKFwiaW5wdXQudGV4dC1jb2xvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJUZXh0IGNvbG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0ZXh0QmxvY2sudGV4dENvbG9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydDogKHZub2RlKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29sb3JQaWNrZXIuc2V0dXAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm5vZGUuZWxtLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0+IHVwZGF0ZSh7IHRleHRDb2xvcjogY29sb3IgJiYgY29sb3IudG9IZXhTdHJpbmcoKSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveTogKHZub2RlKSA9PiBDb2xvclBpY2tlci5kZXN0cm95KHZub2RlLmVsbSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIF0pLFxyXG5cclxuICAgICAgICAgICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoXCJkaXYuZm9udC1jb2xvci1pY29uLmJhY2tcIiwge30sIFwiQVwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaChcImlucHV0LmJhY2tncm91bmQtY29sb3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInRleHRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQmFja2dyb3VuZCBjb2xvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdGV4dEJsb2NrLmJhY2tncm91bmRDb2xvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9vazoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnQ6ICh2bm9kZSkgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbG9yUGlja2VyLnNldHVwKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZub2RlLmVsbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9PiB1cGRhdGUoeyBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yICYmIGNvbG9yLnRvSGV4U3RyaW5nKCkgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3k6ICh2bm9kZSkgPT4gQ29sb3JQaWNrZXIuZGVzdHJveSh2bm9kZS5lbG0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuXHJcbiAgICAgICAgICAgICAgICBoKFwiYnV0dG9uLmRlbGV0ZS10ZXh0YmxvY2suYnRuLmJ0bi1kYW5nZXJcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJEZWxldGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IGUgPT4gdGhpcy5zdG9yZS5hY3Rpb25zLnRleHRCbG9jay5yZW1vdmUuZGlzcGF0Y2godGV4dEJsb2NrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoXCJzcGFuLmdseXBoaWNvbi5nbHlwaGljb24tdHJhc2hcIilcclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgICAgIGgoXCJkaXYuZm9udC1waWNrZXItY29udGFpbmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob29rOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnQ6ICh2bm9kZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzOiBGb250UGlja2VyUHJvcHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlOiB0aGlzLnN0b3JlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHRleHRCbG9jay5mb250RGVzYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uQ2hhbmdlZDogKGZvbnREZXNjKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGUoeyBmb250RGVzYyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3RET00ucmVuZGVyKHJoKEZvbnRQaWNrZXIsIHByb3BzKSwgdm5vZGUuZWxtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgICAgIGgoXCJkaXYuZW5kLWNvbnRyb2xzXCIsIHt9LFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG59IiwiXHJcbmNsYXNzIFdvcmtzcGFjZUNvbnRyb2xsZXIge1xyXG5cclxuICAgIHN0YXRpYyBURVhUX0NIQU5HRV9SRU5ERVJfVEhST1RUTEVfTVMgPSA1MDA7XHJcbiAgICBzdGF0aWMgQkxPQ0tfQk9VTkRTX0NIQU5HRV9USFJPVFRMRV9NUyA9IDUwMDtcclxuXHJcbiAgICBkZWZhdWx0U2l6ZSA9IG5ldyBwYXBlci5TaXplKDUwMDAwLCA0MDAwMCk7XHJcbiAgICBkZWZhdWx0U2NhbGUgPSAwLjAyO1xyXG5cclxuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwcm9qZWN0OiBwYXBlci5Qcm9qZWN0O1xyXG4gICAgZmFsbGJhY2tGb250OiBvcGVudHlwZS5Gb250O1xyXG4gICAgdmlld1pvb206IFZpZXdab29tO1xyXG5cclxuICAgIHByaXZhdGUgX3N0b3JlOiBTdG9yZTtcclxuICAgIHByaXZhdGUgX3NrZXRjaDogU2tldGNoO1xyXG4gICAgcHJpdmF0ZSBfdGV4dEJsb2NrSXRlbXM6IHsgW3RleHRCbG9ja0lkOiBzdHJpbmddOiBUZXh0V2FycCB9ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc3RvcmU6IFN0b3JlLCBmYWxsYmFja0ZvbnQ6IG9wZW50eXBlLkZvbnQpIHtcclxuICAgICAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xyXG4gICAgICAgIHRoaXMuZmFsbGJhY2tGb250ID0gZmFsbGJhY2tGb250O1xyXG4gICAgICAgIHBhcGVyLnNldHRpbmdzLmhhbmRsZVNpemUgPSAxO1xyXG5cclxuICAgICAgICB0aGlzLmNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbkNhbnZhcycpO1xyXG4gICAgICAgIHBhcGVyLnNldHVwKHRoaXMuY2FudmFzKTtcclxuICAgICAgICB0aGlzLnByb2plY3QgPSBwYXBlci5wcm9qZWN0O1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdab29tID0gbmV3IFZpZXdab29tKHRoaXMucHJvamVjdCk7XHJcbiAgICAgICAgY29uc3QgY2xlYXJTZWxlY3Rpb24gPSAoZXY6IHBhcGVyLlBhcGVyTW91c2VFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBzdG9yZS5hY3Rpb25zLnNrZXRjaC5zZXRTZWxlY3Rpb24uZGlzcGF0Y2goe30pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXBlci52aWV3Lm9uKHBhcGVyLkV2ZW50VHlwZS5jbGljaywgY2xlYXJTZWxlY3Rpb24pO1xyXG4gICAgICAgIHBhcGVyLnZpZXcub24oUGFwZXJIZWxwZXJzLkV2ZW50VHlwZS5zbWFydERyYWdTdGFydCwgY2xlYXJTZWxlY3Rpb24pO1xyXG5cclxuICAgICAgICBzdG9yZS5ldmVudHMuc2tldGNoLmxvYWRlZC5zdWJzY3JpYmUoXHJcbiAgICAgICAgICAgIGV2ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NrZXRjaCA9IGV2LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3QuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdC5kZXNlbGVjdEFsbCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGV4dEJsb2NrSXRlbXMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHN0b3JlLmV2ZW50cy5tZXJnZVR5cGVkKFxyXG4gICAgICAgICAgICBzdG9yZS5ldmVudHMudGV4dGJsb2NrLmFkZGVkLFxyXG4gICAgICAgICAgICBzdG9yZS5ldmVudHMudGV4dGJsb2NrLmxvYWRlZFxyXG4gICAgICAgICkuc3Vic2NyaWJlKFxyXG4gICAgICAgICAgICBldiA9PiB0aGlzLmFkZEJsb2NrKGV2LmRhdGEpKTtcclxuXHJcbiAgICAgICAgc3RvcmUuZXZlbnRzLnRleHRibG9jay5hdHRyQ2hhbmdlZFxyXG4gICAgICAgICAgICAub2JzZXJ2ZSgpXHJcbiAgICAgICAgICAgIC50aHJvdHRsZShXb3Jrc3BhY2VDb250cm9sbGVyLlRFWFRfQ0hBTkdFX1JFTkRFUl9USFJPVFRMRV9NUylcclxuICAgICAgICAgICAgLnN1YnNjcmliZShtID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtID0gdGhpcy5fdGV4dEJsb2NrSXRlbXNbbS5kYXRhLl9pZF07XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRCbG9jayA9IG0uZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSB0ZXh0QmxvY2sudGV4dDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGV4dEJsb2NrLmZvbnREZXNjICYmIHRleHRCbG9jay5mb250RGVzYy51cmwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHVzaCBpbiBmb250IHdoZW4gcmVhZHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmUucmVzb3VyY2VzLnBhcnNlZEZvbnRzLmdldCh0ZXh0QmxvY2suZm9udERlc2MudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHVybCwgZm9udCkgPT4gaXRlbS5mb250ID0gZm9udCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY3VzdG9tU3R5bGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiB0ZXh0QmxvY2suZm9udFNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogdGV4dEJsb2NrLnRleHRDb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0ZXh0QmxvY2suYmFja2dyb3VuZENvbG9yXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RvcmUuZXZlbnRzLnRleHRibG9jay5yZW1vdmVkLnN1YnNjcmliZShtID0+IHtcclxuICAgICAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLl90ZXh0QmxvY2tJdGVtc1ttLmRhdGEuX2lkXTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fdGV4dEJsb2NrSXRlbXNbbS5kYXRhLl9pZF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3RvcmUuZXZlbnRzLnNrZXRjaC5zZWxlY3Rpb25DaGFuZ2VkLnN1YnNjcmliZShtID0+IHtcclxuICAgICAgICAgICAgaWYgKCFtLmRhdGEgfHwgIW0uZGF0YS5pdGVtSWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdC5kZXNlbGVjdEFsbCgpO1xyXG4gICAgICAgICAgICAgICAgc3RvcmUuZXZlbnRzLnNrZXRjaC5lZGl0aW5nSXRlbUNoYW5nZWQuZGlzcGF0Y2goe30pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgaXRlbSA9IG0uZGF0YS5pdGVtSWQgJiYgdGhpcy5fdGV4dEJsb2NrSXRlbXNbbS5kYXRhLml0ZW1JZF07XHJcbiAgICAgICAgICAgIGlmIChpdGVtICYmICFpdGVtLnNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3QuZGVzZWxlY3RBbGwoKTtcclxuICAgICAgICAgICAgICAgIHN0b3JlLmV2ZW50cy5za2V0Y2guZWRpdGluZ0l0ZW1DaGFuZ2VkLmRpc3BhdGNoKHt9KTtcclxuICAgICAgICAgICAgICAgIGl0ZW0uc2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHN0b3JlLmV2ZW50cy5kZXNpZ25lci56b29tVG9GaXRSZXF1ZXN0ZWQuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy56b29tVG9GaXQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB6b29tVG9GaXQoKSB7XHJcbiAgICAgICAgbGV0IGJvdW5kczogcGFwZXIuUmVjdGFuZ2xlO1xyXG4gICAgICAgIF8uZm9yT3duKHRoaXMuX3RleHRCbG9ja0l0ZW1zLCAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICBib3VuZHMgPSBib3VuZHNcclxuICAgICAgICAgICAgICAgID8gYm91bmRzLnVuaXRlKGl0ZW0uYm91bmRzKVxyXG4gICAgICAgICAgICAgICAgOiBpdGVtLmJvdW5kcztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFib3VuZHMpIHtcclxuICAgICAgICAgICAgYm91bmRzID0gbmV3IHBhcGVyLlJlY3RhbmdsZShuZXcgcGFwZXIuUG9pbnQoMCwgMCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRTaXplLm11bHRpcGx5KHRoaXMuZGVmYXVsdFNjYWxlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnZpZXdab29tLnpvb21Ubyhib3VuZHMuc2NhbGUoMS4wNSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEJsb2NrKHRleHRCbG9jazogVGV4dEJsb2NrKSB7XHJcbiAgICAgICAgaWYgKCF0ZXh0QmxvY2spIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0ZXh0QmxvY2suX2lkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3JlY2VpdmVkIGJsb2NrIHdpdGhvdXQgaWQnLCB0ZXh0QmxvY2spO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLl90ZXh0QmxvY2tJdGVtc1t0ZXh0QmxvY2suX2lkXTtcclxuICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVjZWl2ZWQgYWRkQmxvY2sgZm9yIGJsb2NrIHRoYXQgaXMgYWxyZWFkeSBsb2FkZWRcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBib3VuZHM6IHsgdXBwZXI6IHBhcGVyLlNlZ21lbnRbXSwgbG93ZXI6IHBhcGVyLlNlZ21lbnRbXSB9O1xyXG5cclxuICAgICAgICBpZiAodGV4dEJsb2NrLm91dGxpbmUpIHtcclxuICAgICAgICAgICAgY29uc3QgbG9hZFNlZ21lbnQgPSAocmVjb3JkOiBTZWdtZW50UmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb2ludCA9IHJlY29yZFswXTtcclxuICAgICAgICAgICAgICAgIGlmIChwb2ludCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBwYXBlci5TZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgcGFwZXIuUG9pbnQocmVjb3JkWzBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkWzFdICYmIG5ldyBwYXBlci5Qb2ludChyZWNvcmRbMV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWNvcmRbMl0gJiYgbmV3IHBhcGVyLlBvaW50KHJlY29yZFsyXSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU2luZ2xlLXBvaW50IHNlZ21lbnRzIGFyZSBzdG9yZWQgYXMgbnVtYmVyWzJdXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHBhcGVyLlNlZ21lbnQobmV3IHBhcGVyLlBvaW50KHJlY29yZCkpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBib3VuZHMgPSB7XHJcbiAgICAgICAgICAgICAgICB1cHBlcjogdGV4dEJsb2NrLm91dGxpbmUudG9wLnNlZ21lbnRzLm1hcChsb2FkU2VnbWVudCksXHJcbiAgICAgICAgICAgICAgICBsb3dlcjogdGV4dEJsb2NrLm91dGxpbmUuYm90dG9tLnNlZ21lbnRzLm1hcChsb2FkU2VnbWVudClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGl0ZW0gPSBuZXcgVGV4dFdhcnAoXHJcbiAgICAgICAgICAgIHRoaXMuZmFsbGJhY2tGb250LFxyXG4gICAgICAgICAgICB0ZXh0QmxvY2sudGV4dCxcclxuICAgICAgICAgICAgYm91bmRzLFxyXG4gICAgICAgICAgICB0ZXh0QmxvY2suZm9udFNpemUsIHtcclxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiB0ZXh0QmxvY2suZm9udFNpemUsXHJcbiAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IHRleHRCbG9jay50ZXh0Q29sb3IgfHwgXCJyZWRcIiwgICAgLy8gdGV4dENvbG9yIHNob3VsZCBoYXZlIGJlZW4gc2V0IGVsc2V3aGVyZSBcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGV4dEJsb2NrLmJhY2tncm91bmRDb2xvclxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRleHRCbG9jay5mb250RGVzYyAmJiB0ZXh0QmxvY2suZm9udERlc2MudXJsKSB7XHJcbiAgICAgICAgICAgIC8vIHB1c2ggaW4gZm9udCB3aGVuIHJlYWR5XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3JlLnJlc291cmNlcy5wYXJzZWRGb250cy5nZXQodGV4dEJsb2NrLmZvbnREZXNjLnVybCxcclxuICAgICAgICAgICAgICAgICh1cmwsIGZvbnQpID0+IGl0ZW0uZm9udCA9IGZvbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0ZXh0QmxvY2sub3V0bGluZSAmJiB0ZXh0QmxvY2sucG9zaXRpb24pIHtcclxuICAgICAgICAgICAgaXRlbS5wb3NpdGlvbiA9IG5ldyBwYXBlci5Qb2ludCh0ZXh0QmxvY2sucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VuZEVkaXRBY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvckF0ID0gdGhpcy5wcm9qZWN0LnZpZXcucHJvamVjdFRvVmlldyhcclxuICAgICAgICAgICAgICAgIFBhcGVySGVscGVycy5taWRwb2ludChpdGVtLmJvdW5kcy50b3BMZWZ0LCBpdGVtLmJvdW5kcy5jZW50ZXIpKTtcclxuICAgICAgICAgICAgdGhpcy5fc3RvcmUuYWN0aW9ucy5za2V0Y2guc2V0RWRpdGluZ0l0ZW0uZGlzcGF0Y2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbUlkOiB0ZXh0QmxvY2suX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1UeXBlOiBcIlRleHRCbG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudFg6IGVkaXRvckF0LngsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50WTogZWRpdG9yQXQueVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaXRlbS5vbihQYXBlckhlbHBlcnMuRXZlbnRUeXBlLmNsaWNrV2l0aG91dERyYWcsIGV2ID0+IHtcclxuICAgICAgICAgICAgaXRlbS5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHNlbmRFZGl0QWN0aW9uKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzZWxlY3QgaXRlbVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmUuYWN0aW9ucy5za2V0Y2guc2V0U2VsZWN0aW9uLmRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgIHsgaXRlbUlkOiB0ZXh0QmxvY2suX2lkLCBpdGVtVHlwZTogXCJUZXh0QmxvY2tcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpdGVtLm9uKFBhcGVySGVscGVycy5FdmVudFR5cGUuc21hcnREcmFnU3RhcnQsIGV2ID0+IHtcclxuICAgICAgICAgICAgaXRlbS5icmluZ1RvRnJvbnQoKTtcclxuICAgICAgICAgICAgaWYgKCFpdGVtLnNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZS5hY3Rpb25zLnNrZXRjaC5zZXRTZWxlY3Rpb24uZGlzcGF0Y2goXHJcbiAgICAgICAgICAgICAgICAgICAgeyBpdGVtSWQ6IHRleHRCbG9jay5faWQsIGl0ZW1UeXBlOiBcIlRleHRCbG9ja1wiIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGl0ZW0ub24oUGFwZXJIZWxwZXJzLkV2ZW50VHlwZS5zbWFydERyYWdFbmQsIGV2ID0+IHtcclxuICAgICAgICAgICAgbGV0IGJsb2NrID0gPFRleHRCbG9jaz50aGlzLmdldEJsb2NrQXJyYW5nZW1lbnQoaXRlbSk7XHJcbiAgICAgICAgICAgIGJsb2NrLl9pZCA9IHRleHRCbG9jay5faWQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3JlLmFjdGlvbnMudGV4dEJsb2NrLnVwZGF0ZUFycmFuZ2UuZGlzcGF0Y2goYmxvY2spO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBpdGVtQ2hhbmdlJCA9IFBhcGVyTm90aWZ5Lm9ic2VydmUoaXRlbSwgUGFwZXJOb3RpZnkuQ2hhbmdlRmxhZy5HRU9NRVRSWSk7XHJcbiAgICAgICAgaXRlbUNoYW5nZSRcclxuICAgICAgICAgICAgLmRlYm91bmNlKFdvcmtzcGFjZUNvbnRyb2xsZXIuQkxPQ0tfQk9VTkRTX0NIQU5HRV9USFJPVFRMRV9NUylcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmxvY2sgPSA8VGV4dEJsb2NrPnRoaXMuZ2V0QmxvY2tBcnJhbmdlbWVudChpdGVtKTtcclxuICAgICAgICAgICAgICAgIGJsb2NrLl9pZCA9IHRleHRCbG9jay5faWQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZS5hY3Rpb25zLnRleHRCbG9jay51cGRhdGVBcnJhbmdlLmRpc3BhdGNoKGJsb2NrKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGl0ZW0uZGF0YSA9IHRleHRCbG9jay5faWQ7XHJcbiAgICAgICAgaWYgKCF0ZXh0QmxvY2sucG9zaXRpb24pIHtcclxuICAgICAgICAgICAgaXRlbS5wb3NpdGlvbiA9IHRoaXMucHJvamVjdC52aWV3LmJvdW5kcy5wb2ludC5hZGQoXHJcbiAgICAgICAgICAgICAgICBuZXcgcGFwZXIuUG9pbnQoaXRlbS5ib3VuZHMud2lkdGggLyAyLCBpdGVtLmJvdW5kcy5oZWlnaHQgLyAyKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQoNTApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fdGV4dEJsb2NrSXRlbXNbdGV4dEJsb2NrLl9pZF0gPSBpdGVtO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCF0aGlzLl9zdG9yZS5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gubG9hZGluZ1xyXG4gICAgICAgICAgICAmJiB0aGlzLl9zdG9yZS5zdGF0ZS5yZXRhaW5lZC5za2V0Y2gudGV4dEJsb2Nrcy5sZW5ndGggPD0gMSkge1xyXG4gICAgICAgICAgICAvLyBvcGVuIGVkaXRvciBmb3IgbmV3bHkgYWRkZWQgYmxvY2tcclxuICAgICAgICAgICAgc2VuZEVkaXRBY3Rpb24oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRCbG9ja0FycmFuZ2VtZW50KGl0ZW06IFRleHRXYXJwKTogQmxvY2tBcnJhbmdlbWVudCB7XHJcbiAgICAgICAgLy8gZXhwb3J0IHJldHVybnMgYW4gYXJyYXkgd2l0aCBpdGVtIHR5cGUgYW5kIHNlcmlhbGl6ZWQgb2JqZWN0OlxyXG4gICAgICAgIC8vICAgW1wiUGF0aFwiLCBQYXRoUmVjb3JkXVxyXG4gICAgICAgIGNvbnN0IHRvcCA9IDxQYXRoUmVjb3JkPml0ZW0udXBwZXIuZXhwb3J0SlNPTih7IGFzU3RyaW5nOiBmYWxzZSB9KVsxXTtcclxuICAgICAgICBjb25zdCBib3R0b20gPSA8UGF0aFJlY29yZD5pdGVtLmxvd2VyLmV4cG9ydEpTT04oeyBhc1N0cmluZzogZmFsc2UgfSlbMV07XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBbaXRlbS5wb3NpdGlvbi54LCBpdGVtLnBvc2l0aW9uLnldLFxyXG4gICAgICAgICAgICBvdXRsaW5lOiB7IHRvcCwgYm90dG9tIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJcclxuZGVjbGFyZSB2YXIgc29sdmU6IChhOiBhbnksIGI6IGFueSwgZmFzdDogYm9vbGVhbikgPT4gdm9pZDtcclxuXHJcbmNsYXNzIFBlcnNwZWN0aXZlVHJhbnNmb3JtIHtcclxuICAgIFxyXG4gICAgc291cmNlOiBRdWFkO1xyXG4gICAgZGVzdDogUXVhZDtcclxuICAgIHBlcnNwOiBhbnk7XHJcbiAgICBtYXRyaXg6IG51bWJlcltdO1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcihzb3VyY2U6IFF1YWQsIGRlc3Q6IFF1YWQpe1xyXG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xyXG4gICAgICAgIHRoaXMuZGVzdCA9IGRlc3Q7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5tYXRyaXggPSBQZXJzcGVjdGl2ZVRyYW5zZm9ybS5jcmVhdGVNYXRyaXgoc291cmNlLCBkZXN0KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gR2l2ZW4gYSA0eDQgcGVyc3BlY3RpdmUgdHJhbnNmb3JtYXRpb24gbWF0cml4LCBhbmQgYSAyRCBwb2ludCAoYSAyeDEgdmVjdG9yKSxcclxuICAgIC8vIGFwcGxpZXMgdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBieSBjb252ZXJ0aW5nIHRoZSBwb2ludCB0byBob21vZ2VuZW91c1xyXG4gICAgLy8gY29vcmRpbmF0ZXMgYXQgej0wLCBwb3N0LW11bHRpcGx5aW5nLCBhbmQgdGhlbiBhcHBseWluZyBhIHBlcnNwZWN0aXZlIGRpdmlkZS5cclxuICAgIHRyYW5zZm9ybVBvaW50KHBvaW50OiBwYXBlci5Qb2ludCk6IHBhcGVyLlBvaW50IHtcclxuICAgICAgICBsZXQgcDMgPSBQZXJzcGVjdGl2ZVRyYW5zZm9ybS5tdWx0aXBseSh0aGlzLm1hdHJpeCwgW3BvaW50LngsIHBvaW50LnksIDAsIDFdKTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IHBhcGVyLlBvaW50KHAzWzBdIC8gcDNbM10sIHAzWzFdIC8gcDNbM10pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0YXRpYyBjcmVhdGVNYXRyaXgoc291cmNlOiBRdWFkLCB0YXJnZXQ6IFF1YWQpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHNvdXJjZVBvaW50cyA9IFtcclxuICAgICAgICAgICAgW3NvdXJjZS5hLngsIHNvdXJjZS5hLnldLCBcclxuICAgICAgICAgICAgW3NvdXJjZS5iLngsIHNvdXJjZS5iLnldLCBcclxuICAgICAgICAgICAgW3NvdXJjZS5jLngsIHNvdXJjZS5jLnldLCBcclxuICAgICAgICAgICAgW3NvdXJjZS5kLngsIHNvdXJjZS5kLnldXTtcclxuICAgICAgICBsZXQgdGFyZ2V0UG9pbnRzID0gW1xyXG4gICAgICAgICAgICBbdGFyZ2V0LmEueCwgdGFyZ2V0LmEueV0sIFxyXG4gICAgICAgICAgICBbdGFyZ2V0LmIueCwgdGFyZ2V0LmIueV0sIFxyXG4gICAgICAgICAgICBbdGFyZ2V0LmMueCwgdGFyZ2V0LmMueV0sIFxyXG4gICAgICAgICAgICBbdGFyZ2V0LmQueCwgdGFyZ2V0LmQueV1dO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAodmFyIGEgPSBbXSwgYiA9IFtdLCBpID0gMCwgbiA9IHNvdXJjZVBvaW50cy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcclxuICAgICAgICAgICAgdmFyIHMgPSBzb3VyY2VQb2ludHNbaV0sIHQgPSB0YXJnZXRQb2ludHNbaV07XHJcbiAgICAgICAgICAgIGEucHVzaChbc1swXSwgc1sxXSwgMSwgMCwgMCwgMCwgLXNbMF0gKiB0WzBdLCAtc1sxXSAqIHRbMF1dKSwgYi5wdXNoKHRbMF0pO1xyXG4gICAgICAgICAgICBhLnB1c2goWzAsIDAsIDAsIHNbMF0sIHNbMV0sIDEsIC1zWzBdICogdFsxXSwgLXNbMV0gKiB0WzFdXSksIGIucHVzaCh0WzFdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBYID0gc29sdmUoYSwgYiwgdHJ1ZSk7IFxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIFhbMF0sIFhbM10sIDAsIFhbNl0sXHJcbiAgICAgICAgICAgIFhbMV0sIFhbNF0sIDAsIFhbN10sXHJcbiAgICAgICAgICAgICAgIDAsICAgIDAsIDEsICAgIDAsXHJcbiAgICAgICAgICAgIFhbMl0sIFhbNV0sIDAsICAgIDFcclxuICAgICAgICBdLm1hcChmdW5jdGlvbih4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHggKiAxMDAwMDApIC8gMTAwMDAwO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBvc3QtbXVsdGlwbHkgYSA0eDQgbWF0cml4IGluIGNvbHVtbi1tYWpvciBvcmRlciBieSBhIDR4MSBjb2x1bW4gdmVjdG9yOlxyXG4gICAgLy8gWyBtMCBtNCBtOCAgbTEyIF0gICBbIHYwIF0gICBbIHggXVxyXG4gICAgLy8gWyBtMSBtNSBtOSAgbTEzIF0gKiBbIHYxIF0gPSBbIHkgXVxyXG4gICAgLy8gWyBtMiBtNiBtMTAgbTE0IF0gICBbIHYyIF0gICBbIHogXVxyXG4gICAgLy8gWyBtMyBtNyBtMTEgbTE1IF0gICBbIHYzIF0gICBbIHcgXVxyXG4gICAgc3RhdGljIG11bHRpcGx5KG1hdHJpeCwgdmVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgbWF0cml4WzBdICogdmVjdG9yWzBdICsgbWF0cml4WzRdICogdmVjdG9yWzFdICsgbWF0cml4WzggXSAqIHZlY3RvclsyXSArIG1hdHJpeFsxMl0gKiB2ZWN0b3JbM10sXHJcbiAgICAgICAgICAgIG1hdHJpeFsxXSAqIHZlY3RvclswXSArIG1hdHJpeFs1XSAqIHZlY3RvclsxXSArIG1hdHJpeFs5IF0gKiB2ZWN0b3JbMl0gKyBtYXRyaXhbMTNdICogdmVjdG9yWzNdLFxyXG4gICAgICAgICAgICBtYXRyaXhbMl0gKiB2ZWN0b3JbMF0gKyBtYXRyaXhbNl0gKiB2ZWN0b3JbMV0gKyBtYXRyaXhbMTBdICogdmVjdG9yWzJdICsgbWF0cml4WzE0XSAqIHZlY3RvclszXSxcclxuICAgICAgICAgICAgbWF0cml4WzNdICogdmVjdG9yWzBdICsgbWF0cml4WzddICogdmVjdG9yWzFdICsgbWF0cml4WzExXSAqIHZlY3RvclsyXSArIG1hdHJpeFsxNV0gKiB2ZWN0b3JbM11cclxuICAgICAgICBdO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBRdWFkIHtcclxuICAgIGE6IHBhcGVyLlBvaW50O1xyXG4gICAgYjogcGFwZXIuUG9pbnQ7XHJcbiAgICBjOiBwYXBlci5Qb2ludDtcclxuICAgIGQ6IHBhcGVyLlBvaW50O1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3RvcihhOiBwYXBlci5Qb2ludCwgYjogcGFwZXIuUG9pbnQsIGM6IHBhcGVyLlBvaW50LCBkOiBwYXBlci5Qb2ludCl7XHJcbiAgICAgICAgdGhpcy5hID0gYTtcclxuICAgICAgICB0aGlzLmIgPSBiO1xyXG4gICAgICAgIHRoaXMuYyA9IGM7XHJcbiAgICAgICAgdGhpcy5kID0gZDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgc3RhdGljIGZyb21SZWN0YW5nbGUocmVjdDogcGFwZXIuUmVjdGFuZ2xlKXtcclxuICAgICAgICByZXR1cm4gbmV3IFF1YWQoXHJcbiAgICAgICAgICAgIHJlY3QudG9wTGVmdCxcclxuICAgICAgICAgICAgcmVjdC50b3BSaWdodCxcclxuICAgICAgICAgICAgcmVjdC5ib3R0b21MZWZ0LFxyXG4gICAgICAgICAgICByZWN0LmJvdHRvbVJpZ2h0XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgc3RhdGljIGZyb21Db29yZHMoY29vcmRzOiBudW1iZXJbXSkgOiBRdWFkIHtcclxuICAgICAgICByZXR1cm4gbmV3IFF1YWQoXHJcbiAgICAgICAgICAgIG5ldyBwYXBlci5Qb2ludChjb29yZHNbMF0sIGNvb3Jkc1sxXSksXHJcbiAgICAgICAgICAgIG5ldyBwYXBlci5Qb2ludChjb29yZHNbMl0sIGNvb3Jkc1szXSksXHJcbiAgICAgICAgICAgIG5ldyBwYXBlci5Qb2ludChjb29yZHNbNF0sIGNvb3Jkc1s1XSksXHJcbiAgICAgICAgICAgIG5ldyBwYXBlci5Qb2ludChjb29yZHNbNl0sIGNvb3Jkc1s3XSlcclxuICAgICAgICApXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFzQ29vcmRzKCk6IG51bWJlcltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB0aGlzLmEueCwgdGhpcy5hLnksXHJcbiAgICAgICAgICAgIHRoaXMuYi54LCB0aGlzLmIueSxcclxuICAgICAgICAgICAgdGhpcy5jLngsIHRoaXMuYy55LFxyXG4gICAgICAgICAgICB0aGlzLmQueCwgdGhpcy5kLnlcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG59IiwiXHJcbmNsYXNzIER1YWxCb3VuZHNQYXRoV2FycCBleHRlbmRzIHBhcGVyLkdyb3VwIHtcclxuXHJcbiAgICBzdGF0aWMgUE9JTlRTX1BFUl9QQVRIID0gMjAwO1xyXG5cclxuICAgIHByaXZhdGUgX3NvdXJjZTogcGFwZXIuQ29tcG91bmRQYXRoO1xyXG4gICAgcHJpdmF0ZSBfdXBwZXI6IFN0cmV0Y2hQYXRoO1xyXG4gICAgcHJpdmF0ZSBfbG93ZXI6IFN0cmV0Y2hQYXRoO1xyXG4gICAgcHJpdmF0ZSBfd2FycGVkOiBwYXBlci5Db21wb3VuZFBhdGg7XHJcbiAgICBwcml2YXRlIF9vdXRsaW5lOiBwYXBlci5QYXRoO1xyXG4gICAgcHJpdmF0ZSBfY3VzdG9tU3R5bGU6IFNrZXRjaEl0ZW1TdHlsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBzb3VyY2U6IHBhcGVyLkNvbXBvdW5kUGF0aCxcclxuICAgICAgICBib3VuZHM/OiB7IHVwcGVyOiBwYXBlci5TZWdtZW50W10sIGxvd2VyOiBwYXBlci5TZWdtZW50W10gfSxcclxuICAgICAgICBjdXN0b21TdHlsZT86IFNrZXRjaEl0ZW1TdHlsZSkge1xyXG5cclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICAvLyAtLSBidWlsZCBjaGlsZHJlbiAtLVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHNvdXJjZTtcclxuICAgICAgICB0aGlzLl9zb3VyY2UudmlzaWJsZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoYm91bmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwcGVyID0gbmV3IFN0cmV0Y2hQYXRoKGJvdW5kcy51cHBlcik7XHJcbiAgICAgICAgICAgIHRoaXMuX2xvd2VyID0gbmV3IFN0cmV0Y2hQYXRoKGJvdW5kcy5sb3dlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBwZXIgPSBuZXcgU3RyZXRjaFBhdGgoW1xyXG4gICAgICAgICAgICAgICAgbmV3IHBhcGVyLlNlZ21lbnQoc291cmNlLmJvdW5kcy50b3BMZWZ0KSxcclxuICAgICAgICAgICAgICAgIG5ldyBwYXBlci5TZWdtZW50KHNvdXJjZS5ib3VuZHMudG9wUmlnaHQpXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgICB0aGlzLl9sb3dlciA9IG5ldyBTdHJldGNoUGF0aChbXHJcbiAgICAgICAgICAgICAgICBuZXcgcGFwZXIuU2VnbWVudChzb3VyY2UuYm91bmRzLmJvdHRvbUxlZnQpLFxyXG4gICAgICAgICAgICAgICAgbmV3IHBhcGVyLlNlZ21lbnQoc291cmNlLmJvdW5kcy5ib3R0b21SaWdodClcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbnRyb2xCb3VuZHNPcGFjaXR5ID0gMC43NTtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBwZXIudmlzaWJsZSA9IHRoaXMuc2VsZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5fbG93ZXIudmlzaWJsZSA9IHRoaXMuc2VsZWN0ZWQ7XHJcblxyXG4gICAgICAgIHRoaXMuX291dGxpbmUgPSBuZXcgcGFwZXIuUGF0aCh7IGNsb3NlZDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGlzLnVwZGF0ZU91dGxpbmVTaGFwZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl93YXJwZWQgPSBuZXcgcGFwZXIuQ29tcG91bmRQYXRoKHNvdXJjZS5wYXRoRGF0YSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVXYXJwZWQoKTtcclxuXHJcbiAgICAgICAgLy8gLS0gYWRkIGNoaWxkcmVuIC0tXHJcblxyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGRyZW4oW3RoaXMuX291dGxpbmUsIHRoaXMuX3dhcnBlZCwgdGhpcy5fdXBwZXIsIHRoaXMuX2xvd2VyXSk7XHJcblxyXG4gICAgICAgIC8vIC0tIGFzc2lnbiBzdHlsZSAtLVxyXG5cclxuICAgICAgICB0aGlzLmN1c3RvbVN0eWxlID0gY3VzdG9tU3R5bGUgfHwge1xyXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogXCJsaWdodGdyYXlcIlxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIFBhcGVySGVscGVycy5hZGRTbWFydERyYWcodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIC0tIHNldCB1cCBvYnNlcnZlcnMgLS1cclxuXHJcbiAgICAgICAgY29uc3QgaGFuZGxlUGF0aENoYW5nZSA9IChwYXRoOiBwYXBlci5QYXRoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT3V0bGluZVNoYXBlKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlV2FycGVkKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2NoYW5nZWQoUGFwZXJOb3RpZnkuQ2hhbmdlRmxhZy5HRU9NRVRSWSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl91cHBlci5wYXRoQ2hhbmdlZC5zdWJzY3JpYmUoaGFuZGxlUGF0aENoYW5nZSk7XHJcbiAgICAgICAgdGhpcy5fbG93ZXIucGF0aENoYW5nZWQuc3Vic2NyaWJlKGhhbmRsZVBhdGhDaGFuZ2UpO1xyXG5cclxuICAgICAgICB0aGlzLnN1YnNjcmliZShmbGFncyA9PiB7XHJcbiAgICAgICAgICAgIGlmIChmbGFncyAmIFBhcGVyTm90aWZ5LkNoYW5nZUZsYWcuQVRUUklCVVRFKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXBwZXIudmlzaWJsZSAhPT0gdGhpcy5zZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwcGVyLnZpc2libGUgPSB0aGlzLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvd2VyLnZpc2libGUgPSB0aGlzLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldCB1cHBlcigpOiBwYXBlci5QYXRoIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdXBwZXIucGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbG93ZXIoKTogcGFwZXIuUGF0aCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvd2VyLnBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNvdXJjZSgpOiBwYXBlci5Db21wb3VuZFBhdGgge1xyXG4gICAgICAgIHJldHVybiA8cGFwZXIuQ29tcG91bmRQYXRoPnRoaXMuX3NvdXJjZS5jbG9uZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBzb3VyY2UodmFsdWU6IHBhcGVyLkNvbXBvdW5kUGF0aCkge1xyXG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMudXBkYXRlV2FycGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGN1c3RvbVN0eWxlKCk6IFNrZXRjaEl0ZW1TdHlsZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1c3RvbVN0eWxlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBjdXN0b21TdHlsZSh2YWx1ZTogU2tldGNoSXRlbVN0eWxlKSB7XHJcbiAgICAgICAgdGhpcy5fY3VzdG9tU3R5bGUgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLl93YXJwZWQuc3R5bGUgPSB2YWx1ZTtcclxuICAgICAgICBpZiAodmFsdWUuYmFja2dyb3VuZENvbG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX291dGxpbmUuZmlsbENvbG9yID0gdmFsdWUuYmFja2dyb3VuZENvbG9yO1xyXG4gICAgICAgICAgICB0aGlzLl9vdXRsaW5lLm9wYWNpdHkgPSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX291dGxpbmUuZmlsbENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICB0aGlzLl9vdXRsaW5lLm9wYWNpdHkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXQgY29udHJvbEJvdW5kc09wYWNpdHkodmFsdWU6IG51bWJlcil7XHJcbiAgICAgICAgdGhpcy5fdXBwZXIub3BhY2l0eSA9IHRoaXMuX2xvd2VyLm9wYWNpdHkgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVdhcnBlZCgpIHtcclxuICAgICAgICBsZXQgb3J0aE9yaWdpbiA9IHRoaXMuX3NvdXJjZS5ib3VuZHMudG9wTGVmdDtcclxuICAgICAgICBsZXQgb3J0aFdpZHRoID0gdGhpcy5fc291cmNlLmJvdW5kcy53aWR0aDtcclxuICAgICAgICBsZXQgb3J0aEhlaWdodCA9IHRoaXMuX3NvdXJjZS5ib3VuZHMuaGVpZ2h0O1xyXG5cclxuICAgICAgICBsZXQgcHJvamVjdGlvbiA9IFBhcGVySGVscGVycy5kdWFsQm91bmRzUGF0aFByb2plY3Rpb24oXHJcbiAgICAgICAgICAgIHRoaXMuX3VwcGVyLnBhdGgsIHRoaXMuX2xvd2VyLnBhdGgpO1xyXG4gICAgICAgIGxldCB0cmFuc2Zvcm0gPSBuZXcgUGF0aFRyYW5zZm9ybShwb2ludCA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwb2ludDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgcmVsYXRpdmUgPSBwb2ludC5zdWJ0cmFjdChvcnRoT3JpZ2luKTtcclxuICAgICAgICAgICAgbGV0IHVuaXQgPSBuZXcgcGFwZXIuUG9pbnQoXHJcbiAgICAgICAgICAgICAgICByZWxhdGl2ZS54IC8gb3J0aFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgcmVsYXRpdmUueSAvIG9ydGhIZWlnaHQpO1xyXG4gICAgICAgICAgICBsZXQgcHJvamVjdGVkID0gcHJvamVjdGlvbih1bml0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHByb2plY3RlZDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9zb3VyY2UuY2hpbGRyZW5cclxuICAgICAgICAgICAgLm1hcChpdGVtID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSA8cGFwZXIuUGF0aD5pdGVtO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeFBvaW50cyA9IFBhcGVySGVscGVycy50cmFjZVBhdGhBc1BvaW50cyhwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIER1YWxCb3VuZHNQYXRoV2FycC5QT0lOVFNfUEVSX1BBVEgpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChwID0+IHRyYW5zZm9ybS50cmFuc2Zvcm1Qb2ludChwKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4UGF0aCA9IG5ldyBwYXBlci5QYXRoKHtcclxuICAgICAgICAgICAgICAgICAgICBzZWdtZW50czogeFBvaW50cyxcclxuICAgICAgICAgICAgICAgICAgICBjbG9zZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvY2t3aXNlOiBwYXRoLmNsb2Nrd2lzZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvL3hQYXRoLnNpbXBsaWZ5KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geFBhdGg7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fd2FycGVkLnJlbW92ZUNoaWxkcmVuKCk7XHJcbiAgICAgICAgdGhpcy5fd2FycGVkLmFkZENoaWxkcmVuKG5ld1BhdGhzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZU91dGxpbmVTaGFwZSgpIHtcclxuICAgICAgICBjb25zdCBsb3dlciA9IG5ldyBwYXBlci5QYXRoKHRoaXMuX2xvd2VyLnBhdGguc2VnbWVudHMpO1xyXG4gICAgICAgIGxvd2VyLnJldmVyc2UoKTtcclxuICAgICAgICB0aGlzLl9vdXRsaW5lLnNlZ21lbnRzID0gdGhpcy5fdXBwZXIucGF0aC5zZWdtZW50cy5jb25jYXQobG93ZXIuc2VnbWVudHMpO1xyXG4gICAgICAgIGxvd2VyLnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5jbGFzcyBQYXRoSGFuZGxlIGV4dGVuZHMgcGFwZXIuR3JvdXAge1xyXG5cclxuICAgIHN0YXRpYyBNQVJLRVJfUkFESVVTID0gODtcclxuICAgIHN0YXRpYyBEUkFHX1RIUkVTSE9MRCA9IDM7XHJcblxyXG4gICAgcHJpdmF0ZSBfbWFya2VyOiBwYXBlci5TaGFwZTtcclxuICAgIHByaXZhdGUgX3NlZ21lbnQ6IHBhcGVyLlNlZ21lbnQ7XHJcbiAgICBwcml2YXRlIF9jdXJ2ZTogcGFwZXIuQ3VydmU7XHJcbiAgICBwcml2YXRlIF9zbW9vdGhlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2N1cnZlU3BsaXQgPSBuZXcgT2JzZXJ2YWJsZUV2ZW50PG51bWJlcj4oKTtcclxuICAgIHByaXZhdGUgX2N1cnZlQ2hhbmdlVW5zdWI6ICgpID0+IHZvaWQ7XHJcbiAgICBwcml2YXRlIGRyYWdnaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGF0dGFjaDogcGFwZXIuU2VnbWVudCB8IHBhcGVyLkN1cnZlKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uOiBwYXBlci5Qb2ludDtcclxuICAgICAgICBsZXQgcGF0aDogcGFwZXIuUGF0aDtcclxuICAgICAgICBpZiAoYXR0YWNoIGluc3RhbmNlb2YgcGFwZXIuU2VnbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWdtZW50ID0gPHBhcGVyLlNlZ21lbnQ+YXR0YWNoO1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuX3NlZ21lbnQucG9pbnQ7XHJcbiAgICAgICAgICAgIHBhdGggPSB0aGlzLl9zZWdtZW50LnBhdGg7XHJcbiAgICAgICAgfSBlbHNlIGlmIChhdHRhY2ggaW5zdGFuY2VvZiBwYXBlci5DdXJ2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJ2ZSA9IDxwYXBlci5DdXJ2ZT5hdHRhY2g7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gdGhpcy5fY3VydmUuZ2V0UG9pbnRBdCh0aGlzLl9jdXJ2ZS5sZW5ndGggKiAwLjUpO1xyXG4gICAgICAgICAgICBwYXRoID0gdGhpcy5fY3VydmUucGF0aDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBcImF0dGFjaCBtdXN0IGJlIFNlZ21lbnQgb3IgQ3VydmVcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX21hcmtlciA9IHBhcGVyLlNoYXBlLkNpcmNsZShwb3NpdGlvbiwgUGF0aEhhbmRsZS5NQVJLRVJfUkFESVVTKTtcclxuICAgICAgICB0aGlzLl9tYXJrZXIuc3Ryb2tlQ29sb3IgPSBcImJsdWVcIjtcclxuICAgICAgICB0aGlzLl9tYXJrZXIuZmlsbENvbG9yID0gXCJ3aGl0ZVwiO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5fbWFya2VyKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlZ21lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZUFzU2VnbWVudCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGVBc0N1cnZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBQYXBlckhlbHBlcnMuYWRkU21hcnREcmFnKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLm9uKFBhcGVySGVscGVycy5FdmVudFR5cGUuc21hcnREcmFnU3RhcnQsIGV2ID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnZlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzcGxpdCB0aGUgY3VydmUsIHB1cGF0ZSB0byBzZWdtZW50IGhhbmRsZVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJ2ZUNoYW5nZVVuc3ViKCk7ICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VnbWVudCA9IG5ldyBwYXBlci5TZWdtZW50KHRoaXMuY2VudGVyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnZlSWR4ID0gdGhpcy5fY3VydmUuaW5kZXg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJ2ZS5wYXRoLmluc2VydChcclxuICAgICAgICAgICAgICAgICAgICBjdXJ2ZUlkeCArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VnbWVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnZlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVBc1NlZ21lbnQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VydmVTcGxpdC5ub3RpZnkoY3VydmVJZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMub24oUGFwZXJIZWxwZXJzLkV2ZW50VHlwZS5zbWFydERyYWdNb3ZlLCBldiA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zZWdtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWdtZW50LnBvaW50ID0gdGhpcy5jZW50ZXI7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc21vb3RoZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWdtZW50LnNtb290aCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMub24oUGFwZXJIZWxwZXJzLkV2ZW50VHlwZS5jbGlja1dpdGhvdXREcmFnLCBldiA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zZWdtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNtb290aGVkID0gIXRoaXMuc21vb3RoZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5fY3VydmVDaGFuZ2VVbnN1YiA9IHBhdGguc3Vic2NyaWJlKGZsYWdzID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnZlICYmICF0aGlzLl9zZWdtZW50IFxyXG4gICAgICAgICAgICAgICAgJiYgKGZsYWdzICYgUGFwZXJOb3RpZnkuQ2hhbmdlRmxhZy5TRUdNRU5UUykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyID0gdGhpcy5fY3VydmUuZ2V0UG9pbnRBdCh0aGlzLl9jdXJ2ZS5sZW5ndGggKiAwLjUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldCBzbW9vdGhlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc21vb3RoZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHNtb290aGVkKHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5fc21vb3RoZWQgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlZ21lbnQuc21vb3RoKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VnbWVudC5oYW5kbGVJbiA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlZ21lbnQuaGFuZGxlT3V0ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGN1cnZlU3BsaXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnZlU3BsaXQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNlbnRlcigpOiBwYXBlci5Qb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGNlbnRlcihwb2ludDogcGFwZXIuUG9pbnQpIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9pbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdHlsZUFzU2VnbWVudCgpIHtcclxuICAgICAgICB0aGlzLl9tYXJrZXIub3BhY2l0eSA9IDAuODtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0eWxlQXNDdXJ2ZSgpIHtcclxuICAgICAgICB0aGlzLl9tYXJrZXIub3BhY2l0eSA9IDAuMztcclxuICAgIH1cclxuXHJcbn0iLCJcclxuY2xhc3MgUGF0aFNlY3Rpb24gaW1wbGVtZW50cyBwYXBlci5DdXJ2ZWxpa2Uge1xyXG4gICAgcGF0aDogcGFwZXIuUGF0aDtcclxuICAgIG9mZnNldDogbnVtYmVyO1xyXG4gICAgbGVuZ3RoOiBudW1iZXI7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKHBhdGg6IHBhcGVyLlBhdGgsIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcil7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcclxuICAgICAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgZ2V0UG9pbnRBdChvZmZzZXQ6IG51bWJlcil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aC5nZXRQb2ludEF0KG9mZnNldCArIHRoaXMub2Zmc2V0KTtcclxuICAgIH1cclxufSIsIlxyXG5jbGFzcyBQYXRoVHJhbnNmb3JtIHtcclxuICAgIHBvaW50VHJhbnNmb3JtOiAocG9pbnQ6IHBhcGVyLlBvaW50KSA9PiBwYXBlci5Qb2ludDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwb2ludFRyYW5zZm9ybTogKHBvaW50OiBwYXBlci5Qb2ludCkgPT4gcGFwZXIuUG9pbnQpIHtcclxuICAgICAgICB0aGlzLnBvaW50VHJhbnNmb3JtID0gcG9pbnRUcmFuc2Zvcm07XHJcbiAgICB9XHJcblxyXG4gICAgdHJhbnNmb3JtUG9pbnQocG9pbnQ6IHBhcGVyLlBvaW50KTogcGFwZXIuUG9pbnQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvaW50VHJhbnNmb3JtKHBvaW50KTtcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2Zvcm1QYXRoSXRlbShwYXRoOiBwYXBlci5QYXRoSXRlbSkge1xyXG4gICAgICAgIGlmIChwYXRoLmNsYXNzTmFtZSA9PT0gJ0NvbXBvdW5kUGF0aCcpIHtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1Db21wb3VuZFBhdGgoPHBhcGVyLkNvbXBvdW5kUGF0aD5wYXRoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zZm9ybVBhdGgoPHBhcGVyLlBhdGg+cGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyYW5zZm9ybUNvbXBvdW5kUGF0aChwYXRoOiBwYXBlci5Db21wb3VuZFBhdGgpIHtcclxuICAgICAgICBmb3IgKGxldCBwIG9mIHBhdGguY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1QYXRoKDxwYXBlci5QYXRoPnApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2Zvcm1QYXRoKHBhdGg6IHBhcGVyLlBhdGgpIHtcclxuICAgICAgICBmb3IgKGxldCBzZWdtZW50IG9mIHBhdGguc2VnbWVudHMpIHtcclxuICAgICAgICAgICAgbGV0IG9yaWdQb2ludCA9IHNlZ21lbnQucG9pbnQ7XHJcbiAgICAgICAgICAgIGxldCBuZXdQb2ludCA9IHRoaXMudHJhbnNmb3JtUG9pbnQoc2VnbWVudC5wb2ludCk7XHJcbiAgICAgICAgICAgIG9yaWdQb2ludC54ID0gbmV3UG9pbnQueDtcclxuICAgICAgICAgICAgb3JpZ1BvaW50LnkgPSBuZXdQb2ludC55O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG4iLCJcclxuY2xhc3MgU3RyZXRjaFBhdGggZXh0ZW5kcyBwYXBlci5Hcm91cCB7XHJcblxyXG4gICAgcHJpdmF0ZSBfcGF0aDogcGFwZXIuUGF0aDtcclxuICAgIHByaXZhdGUgX3BhdGhDaGFuZ2VkID0gbmV3IE9ic2VydmFibGVFdmVudDxwYXBlci5QYXRoPigpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNlZ21lbnRzOiBwYXBlci5TZWdtZW50W10sIHN0eWxlPzogcGFwZXIuU3R5bGUpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYXRoID0gbmV3IHBhcGVyLlBhdGgoc2VnbWVudHMpO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5fcGF0aCk7XHJcblxyXG4gICAgICAgIGlmKHN0eWxlKXtcclxuICAgICAgICAgICAgdGhpcy5fcGF0aC5zdHlsZSA9IHN0eWxlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3BhdGguc3Ryb2tlQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG4gICAgICAgICAgICB0aGlzLl9wYXRoLnN0cm9rZVdpZHRoID0gNjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGNvbnN0IHMgb2YgdGhpcy5fcGF0aC5zZWdtZW50cyl7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkU2VnbWVudEhhbmRsZShzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGNvbnN0IGMgb2YgdGhpcy5fcGF0aC5jdXJ2ZXMpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZEN1cnZlSGFuZGxlKGMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgZ2V0IHBhdGgoKTogcGFwZXIuUGF0aCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGdldCBwYXRoQ2hhbmdlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcGF0aENoYW5nZWQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByaXZhdGUgYWRkU2VnbWVudEhhbmRsZShzZWdtZW50OiBwYXBlci5TZWdtZW50KXtcclxuICAgICAgICB0aGlzLmFkZEhhbmRsZShuZXcgUGF0aEhhbmRsZShzZWdtZW50KSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByaXZhdGUgYWRkQ3VydmVIYW5kbGUoY3VydmU6IHBhcGVyLkN1cnZlKXtcclxuICAgICAgICBsZXQgaGFuZGxlID0gbmV3IFBhdGhIYW5kbGUoY3VydmUpO1xyXG4gICAgICAgIGhhbmRsZS5jdXJ2ZVNwbGl0LnN1YnNjcmliZU9uZShjdXJ2ZUlkeCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ3VydmVIYW5kbGUodGhpcy5fcGF0aC5jdXJ2ZXNbY3VydmVJZHhdKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRDdXJ2ZUhhbmRsZSh0aGlzLl9wYXRoLmN1cnZlc1tjdXJ2ZUlkeCArIDFdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmFkZEhhbmRsZShoYW5kbGUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIGFkZEhhbmRsZShoYW5kbGU6IFBhdGhIYW5kbGUpe1xyXG4gICAgICAgIGhhbmRsZS52aXNpYmxlID0gdGhpcy52aXNpYmxlO1xyXG4gICAgICAgIGhhbmRsZS5vbihQYXBlckhlbHBlcnMuRXZlbnRUeXBlLnNtYXJ0RHJhZ01vdmUsIGV2ID0+IHtcclxuICAgICAgICAgICB0aGlzLl9wYXRoQ2hhbmdlZC5ub3RpZnkodGhpcy5fcGF0aCk7IFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGhhbmRsZS5vbihQYXBlckhlbHBlcnMuRXZlbnRUeXBlLmNsaWNrV2l0aG91dERyYWcsIGV2ID0+IHtcclxuICAgICAgICAgICB0aGlzLl9wYXRoQ2hhbmdlZC5ub3RpZnkodGhpcy5fcGF0aCk7IFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZChoYW5kbGUpOyAgICAgICAgXHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbi8qKlxyXG4gKiBNZWFzdXJlcyBvZmZzZXRzIG9mIHRleHQgZ2x5cGhzLlxyXG4gKi9cclxuY2xhc3MgVGV4dFJ1bGVyIHtcclxuICAgIFxyXG4gICAgZm9udEZhbWlseTogc3RyaW5nO1xyXG4gICAgZm9udFdlaWdodDogbnVtYmVyO1xyXG4gICAgZm9udFNpemU6IG51bWJlcjtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBjcmVhdGVQb2ludFRleHQgKHRleHQpOiBwYXBlci5JdGVtIHtcclxuICAgICAgICB2YXIgcG9pbnRUZXh0ID0gbmV3IHBhcGVyLlBvaW50VGV4dCgpO1xyXG4gICAgICAgIHBvaW50VGV4dC5jb250ZW50ID0gdGV4dDtcclxuICAgICAgICBwb2ludFRleHQuanVzdGlmaWNhdGlvbiA9IFwiY2VudGVyXCI7XHJcbiAgICAgICAgaWYodGhpcy5mb250RmFtaWx5KXtcclxuICAgICAgICAgICAgcG9pbnRUZXh0LmZvbnRGYW1pbHkgPSB0aGlzLmZvbnRGYW1pbHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoaXMuZm9udFdlaWdodCl7XHJcbiAgICAgICAgICAgIHBvaW50VGV4dC5mb250V2VpZ2h0ID0gdGhpcy5mb250V2VpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmZvbnRTaXplKXtcclxuICAgICAgICAgICAgcG9pbnRUZXh0LmZvbnRTaXplID0gdGhpcy5mb250U2l6ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHBvaW50VGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUZXh0T2Zmc2V0cyh0ZXh0KXtcclxuICAgICAgICAvLyBNZWFzdXJlIGdseXBocyBpbiBwYWlycyB0byBjYXB0dXJlIHdoaXRlIHNwYWNlLlxyXG4gICAgICAgIC8vIFBhaXJzIGFyZSBjaGFyYWN0ZXJzIGkgYW5kIGkrMS5cclxuICAgICAgICB2YXIgZ2x5cGhQYWlycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBnbHlwaFBhaXJzW2ldID0gdGhpcy5jcmVhdGVQb2ludFRleHQodGV4dC5zdWJzdHJpbmcoaSwgaSsxKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEZvciBlYWNoIGNoYXJhY3RlciwgZmluZCBjZW50ZXIgb2Zmc2V0LlxyXG4gICAgICAgIHZhciB4T2Zmc2V0cyA9IFswXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIE1lYXN1cmUgdGhyZWUgY2hhcmFjdGVycyBhdCBhIHRpbWUgdG8gZ2V0IHRoZSBhcHByb3ByaWF0ZSBcclxuICAgICAgICAgICAgLy8gICBzcGFjZSBiZWZvcmUgYW5kIGFmdGVyIHRoZSBnbHlwaC5cclxuICAgICAgICAgICAgdmFyIHRyaWFkVGV4dCA9IHRoaXMuY3JlYXRlUG9pbnRUZXh0KHRleHQuc3Vic3RyaW5nKGkgLSAxLCBpICsgMSkpO1xyXG4gICAgICAgICAgICB0cmlhZFRleHQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTdWJ0cmFjdCBvdXQgaGFsZiBvZiBwcmlvciBnbHlwaCBwYWlyIFxyXG4gICAgICAgICAgICAvLyAgIGFuZCBoYWxmIG9mIGN1cnJlbnQgZ2x5cGggcGFpci5cclxuICAgICAgICAgICAgLy8gTXVzdCBiZSByaWdodCwgYmVjYXVzZSBpdCB3b3Jrcy5cclxuICAgICAgICAgICAgbGV0IG9mZnNldFdpZHRoID0gdHJpYWRUZXh0LmJvdW5kcy53aWR0aCBcclxuICAgICAgICAgICAgICAgIC0gZ2x5cGhQYWlyc1tpIC0gMV0uYm91bmRzLndpZHRoIC8gMiBcclxuICAgICAgICAgICAgICAgIC0gZ2x5cGhQYWlyc1tpXS5ib3VuZHMud2lkdGggLyAyO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIG9mZnNldCB3aWR0aCB0byBwcmlvciBvZmZzZXQuIFxyXG4gICAgICAgICAgICB4T2Zmc2V0c1tpXSA9IHhPZmZzZXRzW2kgLSAxXSArIG9mZnNldFdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBmb3IobGV0IGdseXBoUGFpciBvZiBnbHlwaFBhaXJzKXtcclxuICAgICAgICAgICAgZ2x5cGhQYWlyLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4geE9mZnNldHM7XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbmNsYXNzIFRleHRXYXJwIGV4dGVuZHMgRHVhbEJvdW5kc1BhdGhXYXJwIHtcclxuXHJcbiAgICBzdGF0aWMgREVGQVVMVF9GT05UX1NJWkUgPSA2NDtcclxuXHJcbiAgICBwcml2YXRlIF9mb250OiBvcGVudHlwZS5Gb250O1xyXG4gICAgcHJpdmF0ZSBfdGV4dDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBfZm9udFNpemU6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBmb250OiBvcGVudHlwZS5Gb250LFxyXG4gICAgICAgIHRleHQ6IHN0cmluZyxcclxuICAgICAgICBib3VuZHM/OiB7IHVwcGVyOiBwYXBlci5TZWdtZW50W10sIGxvd2VyOiBwYXBlci5TZWdtZW50W10gfSxcclxuICAgICAgICBmb250U2l6ZT86IG51bWJlcixcclxuICAgICAgICBzdHlsZT86IFNrZXRjaEl0ZW1TdHlsZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIWZvbnRTaXplKXtcclxuICAgICAgICAgICAgICAgIGZvbnRTaXplID0gVGV4dFdhcnAuREVGQVVMVF9GT05UX1NJWkU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhEYXRhID0gVGV4dFdhcnAuZ2V0UGF0aERhdGEoZm9udCwgdGV4dCwgZm9udFNpemUpOyBcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5ldyBwYXBlci5Db21wb3VuZFBhdGgocGF0aERhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgc3VwZXIocGF0aCwgYm91bmRzLCBzdHlsZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9mb250ID0gZm9udDtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dCA9IHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRleHQoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgdGV4dCh2YWx1ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5fdGV4dCA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMudXBkYXRlVGV4dFBhdGgoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZm9udFNpemUoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZm9udFNpemU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNldCBmb250U2l6ZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYoIXZhbHVlKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9mb250U2l6ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMudXBkYXRlVGV4dFBhdGgoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgZm9udCh2YWx1ZTogb3BlbnR5cGUuRm9udCl7XHJcbiAgICAgICAgaWYodmFsdWUgIT09IHRoaXMuX2ZvbnQpe1xyXG4gICAgICAgICAgICB0aGlzLl9mb250ID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVGV4dFBhdGgoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVUZXh0UGF0aCgpIHtcclxuICAgICAgICBjb25zdCBwYXRoRGF0YSA9IFRleHRXYXJwLmdldFBhdGhEYXRhKFxyXG4gICAgICAgICAgICB0aGlzLl9mb250LCB0aGlzLl90ZXh0LCB0aGlzLl9mb250U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBuZXcgcGFwZXIuQ29tcG91bmRQYXRoKHBhdGhEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBnZXRQYXRoRGF0YShmb250OiBvcGVudHlwZS5Gb250LFxyXG4gICAgICAgIHRleHQ6IHN0cmluZywgZm9udFNpemU/OiBzdHJpbmd8bnVtYmVyKTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgb3BlblR5cGVQYXRoID0gZm9udC5nZXRQYXRoKHRleHQsIDAsIDAsXHJcbiAgICAgICAgICAgIE51bWJlcihmb250U2l6ZSkgfHwgVGV4dFdhcnAuREVGQVVMVF9GT05UX1NJWkUpO1xyXG4gICAgICAgIHJldHVybiBvcGVuVHlwZVBhdGgudG9QYXRoRGF0YSgpO1xyXG4gICAgfVxyXG59IiwiXHJcbmNsYXNzIFZpZXdab29tIHtcclxuXHJcbiAgICBwcm9qZWN0OiBwYXBlci5Qcm9qZWN0O1xyXG4gICAgZmFjdG9yID0gMS4yNTtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfbWluWm9vbTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfbWF4Wm9vbTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfbW91c2VOYXRpdmVTdGFydDogcGFwZXIuUG9pbnQ7XHJcbiAgICBwcml2YXRlIF92aWV3Q2VudGVyU3RhcnQ6IHBhcGVyLlBvaW50O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb2plY3Q6IHBhcGVyLlByb2plY3QpIHtcclxuICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLnByb2plY3QudmlldztcclxuXHJcbiAgICAgICAgKDxhbnk+JCh2aWV3LmVsZW1lbnQpKS5tb3VzZXdoZWVsKChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBtb3VzZVBvc2l0aW9uID0gbmV3IHBhcGVyLlBvaW50KGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkpO1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZVpvb21DZW50ZXJlZChldmVudC5kZWx0YVksIG1vdXNlUG9zaXRpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZpZXcub24oXCJtb3VzZWRyYWdcIiwgZXYgPT4ge1xyXG4gICAgICAgICAgICBpZighdGhpcy5fdmlld0NlbnRlclN0YXJ0KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ZpZXdDZW50ZXJTdGFydCA9IHZpZXcuY2VudGVyO1xyXG4gICAgICAgICAgICAgICAgLy8gSGF2ZSB0byB1c2UgbmF0aXZlIG1vdXNlIG9mZnNldCwgYmVjYXVzZSBldi5kZWx0YSBcclxuICAgICAgICAgICAgICAgIC8vICBjaGFuZ2VzIGFzIHRoZSB2aWV3IGlzIHNjcm9sbGVkLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VOYXRpdmVTdGFydCA9IG5ldyBwYXBlci5Qb2ludChldi5ldmVudC5vZmZzZXRYLCBldi5ldmVudC5vZmZzZXRZKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2aWV3LmVtaXQoUGFwZXJIZWxwZXJzLkV2ZW50VHlwZS5zbWFydERyYWdTdGFydCwgZXYpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmF0aXZlRGVsdGEgPSBuZXcgcGFwZXIuUG9pbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgZXYuZXZlbnQub2Zmc2V0WCAtIHRoaXMuX21vdXNlTmF0aXZlU3RhcnQueCxcclxuICAgICAgICAgICAgICAgICAgICBldi5ldmVudC5vZmZzZXRZIC0gdGhpcy5fbW91c2VOYXRpdmVTdGFydC55XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgLy8gTW92ZSBpbnRvIHZpZXcgY29vcmRpbmF0ZXMgdG8gc3VicmFjdCBkZWx0YSxcclxuICAgICAgICAgICAgICAgIC8vICB0aGVuIGJhY2sgaW50byBwcm9qZWN0IGNvb3Jkcy5cclxuICAgICAgICAgICAgICAgIHZpZXcuY2VudGVyID0gdmlldy52aWV3VG9Qcm9qZWN0KCBcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnByb2plY3RUb1ZpZXcodGhpcy5fdmlld0NlbnRlclN0YXJ0KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJ0cmFjdChuYXRpdmVEZWx0YSkpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5lbWl0KFBhcGVySGVscGVycy5FdmVudFR5cGUuc21hcnREcmFnTW92ZSwgZXYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmlldy5vbihcIm1vdXNldXBcIiwgZXYgPT4ge1xyXG4gICAgICAgICAgICBpZih0aGlzLl9tb3VzZU5hdGl2ZVN0YXJ0KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlTmF0aXZlU3RhcnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmlld0NlbnRlclN0YXJ0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHZpZXcuZW1pdChQYXBlckhlbHBlcnMuRXZlbnRUeXBlLnNtYXJ0RHJhZ0VuZCwgZXYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHpvb20oKTogbnVtYmVye1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByb2plY3Qudmlldy56b29tO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB6b29tUmFuZ2UoKTogbnVtYmVyW10ge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy5fbWluWm9vbSwgdGhpcy5fbWF4Wm9vbV07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgem9vbSBsZXZlbC5cclxuICAgICAqIEByZXR1cm5zIHpvb20gbGV2ZWwgdGhhdCB3YXMgc2V0LCBvciBudWxsIGlmIGl0IHdhcyBub3QgY2hhbmdlZFxyXG4gICAgICovXHJcbiAgICBzZXRab29tQ29uc3RyYWluZWQoem9vbTogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICBpZih0aGlzLl9taW5ab29tKSB7XHJcbiAgICAgICAgICAgIHpvb20gPSBNYXRoLm1heCh6b29tLCB0aGlzLl9taW5ab29tKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5fbWF4Wm9vbSl7XHJcbiAgICAgICAgICAgIHpvb20gPSBNYXRoLm1pbih6b29tLCB0aGlzLl9tYXhab29tKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMucHJvamVjdC52aWV3O1xyXG4gICAgICAgIGlmKHpvb20gIT0gdmlldy56b29tKXtcclxuICAgICAgICAgICAgdmlldy56b29tID0gem9vbTtcclxuICAgICAgICAgICAgcmV0dXJuIHpvb207XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFpvb21SYW5nZShyYW5nZTogcGFwZXIuU2l6ZVtdKTogbnVtYmVyW10ge1xyXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLnByb2plY3QudmlldztcclxuICAgICAgICBjb25zdCBhU2l6ZSA9IHJhbmdlLnNoaWZ0KCk7XHJcbiAgICAgICAgY29uc3QgYlNpemUgPSByYW5nZS5zaGlmdCgpO1xyXG4gICAgICAgIGNvbnN0IGEgPSBhU2l6ZSAmJiBNYXRoLm1pbiggXHJcbiAgICAgICAgICAgIHZpZXcuYm91bmRzLmhlaWdodCAvIGFTaXplLmhlaWdodCwgICAgICAgICBcclxuICAgICAgICAgICAgdmlldy5ib3VuZHMud2lkdGggLyBhU2l6ZS53aWR0aCk7XHJcbiAgICAgICAgY29uc3QgYiA9IGJTaXplICYmIE1hdGgubWluKCBcclxuICAgICAgICAgICAgdmlldy5ib3VuZHMuaGVpZ2h0IC8gYlNpemUuaGVpZ2h0LCAgICAgICAgIFxyXG4gICAgICAgICAgICB2aWV3LmJvdW5kcy53aWR0aCAvIGJTaXplLndpZHRoKTtcclxuICAgICAgICBjb25zdCBtaW4gPSBNYXRoLm1pbihhLGIpO1xyXG4gICAgICAgIGlmKG1pbil7XHJcbiAgICAgICAgICAgIHRoaXMuX21pblpvb20gPSBtaW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KGEsYik7XHJcbiAgICAgICAgaWYobWF4KXtcclxuICAgICAgICAgICAgdGhpcy5fbWF4Wm9vbSA9IG1heDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFt0aGlzLl9taW5ab29tLCB0aGlzLl9tYXhab29tXTtcclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2Vab29tQ2VudGVyZWQoZGVsdGE6IG51bWJlciwgbW91c2VQb3M6IHBhcGVyLlBvaW50KSB7XHJcbiAgICAgICAgaWYgKCFkZWx0YSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLnByb2plY3QudmlldztcclxuICAgICAgICBjb25zdCBvbGRab29tID0gdmlldy56b29tO1xyXG4gICAgICAgIGNvbnN0IG9sZENlbnRlciA9IHZpZXcuY2VudGVyO1xyXG4gICAgICAgIGNvbnN0IHZpZXdQb3MgPSB2aWV3LnZpZXdUb1Byb2plY3QobW91c2VQb3MpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBuZXdab29tID0gZGVsdGEgPiAwXHJcbiAgICAgICAgICAgID8gdmlldy56b29tICogdGhpcy5mYWN0b3JcclxuICAgICAgICAgICAgOiB2aWV3Lnpvb20gLyB0aGlzLmZhY3RvcjtcclxuICAgICAgICBuZXdab29tID0gdGhpcy5zZXRab29tQ29uc3RyYWluZWQobmV3Wm9vbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoIW5ld1pvb20pe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB6b29tU2NhbGUgPSBvbGRab29tIC8gbmV3Wm9vbTtcclxuICAgICAgICBjb25zdCBjZW50ZXJBZGp1c3QgPSB2aWV3UG9zLnN1YnRyYWN0KG9sZENlbnRlcik7XHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdmlld1Bvcy5zdWJ0cmFjdChjZW50ZXJBZGp1c3QubXVsdGlwbHkoem9vbVNjYWxlKSlcclxuICAgICAgICAgICAgLnN1YnRyYWN0KG9sZENlbnRlcik7XHJcblxyXG4gICAgICAgIHZpZXcuY2VudGVyID0gdmlldy5jZW50ZXIuYWRkKG9mZnNldCk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB6b29tVG8ocmVjdDogcGFwZXIuUmVjdGFuZ2xlKXtcclxuICAgICAgICBjb25zdCB2aWV3ID0gdGhpcy5wcm9qZWN0LnZpZXc7XHJcbiAgICAgICAgdmlldy5jZW50ZXIgPSByZWN0LmNlbnRlcjtcclxuICAgICAgICB2aWV3Lnpvb20gPSBNYXRoLm1pbiggXHJcbiAgICAgICAgICAgIHZpZXcudmlld1NpemUuaGVpZ2h0IC8gcmVjdC5oZWlnaHQsIFxyXG4gICAgICAgICAgICB2aWV3LnZpZXdTaXplLndpZHRoIC8gcmVjdC53aWR0aCk7XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbmludGVyZmFjZSBTa2V0Y2hJdGVtU3R5bGUgZXh0ZW5kcyBwYXBlci5JU3R5bGUge1xyXG4gICAgYmFja2dyb3VuZENvbG9yPzogc3RyaW5nO1xyXG59XHJcbiIsIlxyXG5cclxuZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xyXG4gICAgXHJcbiAgICBjb25zdCBzdG9yZSA9IG5ldyBTdG9yZSgpO1xyXG4gICAgXHJcbiAgICBjb25zdCBza2V0Y2hFZGl0b3IgPSBuZXcgU2tldGNoRWRpdG9yKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXNpZ25lcicpLCBzdG9yZSk7XHJcbiAgICBjb25zdCBzZWxlY3RlZEl0ZW1FZGl0b3IgPSBuZXcgU2VsZWN0ZWRJdGVtRWRpdG9yKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdG9yT3ZlcmxheVwiKSwgc3RvcmUpO1xyXG4gICAgXHJcbiAgICBjb25zdCBhcHBDb250cm9sbGVyID0gbmV3IEFwcENvbnRyb2xsZXIoc3RvcmUsIHNrZXRjaEVkaXRvciwgc2VsZWN0ZWRJdGVtRWRpdG9yKTtcclxuXHJcbn1cclxuXHJcbmJvb3RzdHJhcCgpO1xyXG4iXX0=