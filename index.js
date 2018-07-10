/* eslint-env browser */

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

// NOTE: This page generates 2 jsdoc pages, one for the `GroupedHeader` cell renderer class and the other for the plug-in (API with `install` method).

'use strict';

var CLASS_NAME = 'GroupedHeader';

/**
 * @summary ~For detailed tutorial-style documentation, see the {@link https://github.com/core/wiki/Grouped+Column+Headers|wiki page}.~
 * _(Unfortunately this page is missing.)_
 *
 * @desc This page is about the `groupedHeader` plug-in.
 *
 * For the cell renderer installed by this plug-in, see {@link GroupedHeader}.
 *
 * #### Table of contents
 *
 * Method|Description
 * ------|-----------
 * {@link groupedHeader.install}|Installs the {@link GroupedHeader} cell renderer.
 * {@link groupedHeader.decorateBackgroundWithBottomBorder}|The default background decorator.
 * {@link groupedHeader.decorateBackgroundWithLinearGradient}|An alternative background decorator.
 *
 * @namespace groupedHeader
 */
var groupedHeader;

/** @typedef gradientStop
 * @type {Array}
 * @desc Consists of two elements:
 * 1. Element `[0]` (number): Stop position ranging from `0.0` (start of gradient) to `1.0` (end of gradient).
 * 2. Element `[1]` (string): CSS color spec in a string, one of:
 *  * color name (caution: some browsers may only accept the 16 HTML4 color names here)
 *  * #nnnnnn
 *  * rgb(r,g,b)
 *  * rgba(r,g,b,a)
 *  * hsl(h,s,l)
 *  * hsla(h,s,l,a)
 *
 *  Applied to the graphic context's {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|addColorStop} method.
 */

/** @typedef groupConfigObject
 * @type {object}
 * @summary Grouped header paint function `config` object overrides.
 * @desc Contains all of the regular paint function `config` object properties (see {@tutorial cell-renderer}).
 *
 * In addition, this object may contain the properties described below.
 *
 * Most of these properties (with some exceptions) may be "constructable":
 * That is, they may be functions and if so the function will be called and the property will take on the returned value.
 * Such functions are called once at the first column of each group with the cell renderer's `paint` function's {@link paintFunction|interface}.
 * The exceptions are properties that are already defined as methods (such as `paintBackground`).
 *
 * @property {paintFunction} [paintBackground=GroupedHeader#paintBackground]
 * Reference to the current background renderer for this grid's grouped column labels.
 * If omitted, uses {@link GroupedHeader#paintBackground|cell renderer's}.
 *
 * @property {function|number} [thickness]
 * Constant line thickness in pixels of the bottom border drawn when group config's (or cell renderer's) `paintBackground` is set to {@link groupedHeader.decorateBackgroundWithBottomBorder} (or a function that returns such a number).
 * If omitted, the bottom border will be drawn proportionally: Lowest-order nested group gets a 1-pixel thick border, with each higher-order group getting a progressively thicker border.
 *
 * @property {function|gradientStop[]} [gradientStops]
 * List of {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|gradient stops} that define the gradient (or a function that returns such a list).
 * Required when group config's (or cell renderer's) `paintBackground` is set to {@link groupedHeader.decorateBackgroundWithLinearGradient}.
 */

var prototypeGroupedHeader = {
    /**
     * @summary The grouped header paint function.
     * @desc This is the heart of the cell renderer.
     *
     * If you feel the urge to override this, you are on the wrong path! Write a new cell renderer instead.
     * @implements paintFunction
     * @default
     * @memberOf GroupedHeader#
     */
    paint: paintHeaderGroups,

    // Remaining are exclusive to `GroupedHeader` and do not override regular cell renderer members:

    /**
     * @summary Group header delimiter.
     * @desc String used within header strings to concatenate group label(s), always ending with actual header.
     * @type {string}
     * @default
     * @memberOf GroupedHeader#
     */
    delimiter: '|',

    /**
     * @summary An additional renderer for just the background.
     * @desc This is called by the `paint` function to paint the background before it calls the superclass's paint function to paint the foreground.
     * This will be overridden by similar definition in `groupConfig` for the current nesting level.
     * @implements paintFunction
     * @default
     * @memberOf GroupedHeader#
     */
    paintBackground: decorateBackgroundWithBottomBorder,

    /**
     * Height of header when flat (when there are no grouped columns).
     *
     * If the value is a string that ends with a `%` char, it is applied as a factor to the font size to get row height.
     * Otherwise it is assumed to be an integer row height.
     * In either case, the value is clamped to a minimum of 125% of the font size.
     * @type {string|number}
     * @default
     */
    flatHeight: '250%',

    /**
     * Height of each nested group label within a grouped header.
     *
     * The total header height therefore is this amount multiplied by the header group with the deepest nesting level.
     *
     * If the value is a string that ends with a `%` char, it is applied as a factor to the font size to get row height.
     * Otherwise it is assumed to be an integer row height.
     * In either case, the value is clamped to a minimum of 125% of the font size.
     * @type {string|number}
     * @default
     */
    nestedHeight: '160%',

    /**
     * Controls whether or not to draw the vertical rule lines between the column headers proper (_i.e.,_ the bottom row, _e.g.,_ the "leaf nodes" in a pivot).
     * Setting this to false will only draw vertical rule lines between group labels.
     * @todo Unimplemented. (Hypergrid knows how to render this use case when vc[i].bottom set to top of bottom row -- but this plugin does not currently set it.)
     * @type {boolean}
     * @default
     */
    columnHeaderLines: true,

    /**
     * Include group label widths in calculation of column width "autosizing." Otherwise just the column headers proper (_i.e.,_ the bottom row, _e.g.,_ the "leaf nodes" in a pivot) are considered and the group labels may be truncated.
     *
     * Note that this property is effective when grid property `config.headerTextWrapping` is falsy and only useful when grid property `config.columnAutosizing` is truthy.
     * @type {boolean}
     * @default
     */
    autosizeGroups: true,

    /**
     * @summary Grouped header configuration overrides.
     * @desc This array is a list of {@link groupConfigObject} objects, one for each nesting level, each of which may contain:
     * * An override for the background decorator
     * * Properties of proprietary interest to the background decorator
     * * Miscellaneous overrides for the cell renderer's `paint` function's regular `config` object properties (_e.g.,_ `color`)
     *
     * The properties contained in each `config` object pertain to the group labels and their background decorators only. They do not pertain to the actual column headers. Those appear below all the nested group headers and are rendered using the unaltered paint function's config object.
     *
     * You can list a separate object for each level of group header nesting, beginning with the highest-order group header.
     * However, note that if there are fewer of these objects in the list than the maximum depth of nested group headers, the list wraps (repeats).
     *
     * The default is a single-element array.
     * As a consequence of the wrapping feature described above, it therefore accommodates all levels of nested group headers.
     * The default consists of:
     * * `color` - A new color 50% lighter than `config.color` (the cell's "foreground" color).
     * * `gradientStops` - A gradient, 0% at top to 35% at bottom, of the above derived color.
     * @type {groupConfigObject[]}
     * @default
     * @memberOf GroupedHeader#
     */
    groupConfig: [{

        halign: 'center',

        thickness: 1, // used only by decorateBackgroundWithBottomBorder

        gradientStops: function(gc, config) { // used only by decorateBackgroundWithLinearGradient
            var bgcolor = this.backgroundColor || config.backgroundColor;
            return [
                [0, 'white'], // top
                [1, this.backgroundColor || config.backgroundColor]  // bottom
            ];
        }

    }]
};

/**
 * @summary Mix in the code necessary to support grouped column headers.
 * @desc Performs the following mix ins:
 * 1. Creates a new `GroupedHeader` cell renderer and registers it with the grid.
 * 2. Set all active header cells to use the GroupHeader cell renderer.
 * 3. Extend the behavior's {@link Behavior#setHeaders|setHeaders} method.
 * 4. Extend the behavior's {@link Behavior#isColumnReorderable} method, which tells the behavior not to allow dragging grouped columns.
 * 5. Sets the data model's {@link dataModel#groupHeaderDelimiter|groupHeaderDelimiter} property, which tells the data model to prepend the up and down sort arrows to the last item (actual column header) of the header string rather than the start of the header string (which is the highest-order group label).
 * @function
 * @param {Hypergrid} grid - Your instantiated grid object.
 * @param {object} options - Additions/overrides for the grid's singleton {@link GroupedHeader|GroupedHeader} instance.
 * @param {function|string} [options.CellRenderer='SimpleCell'] - Cell renderer superclass to extend from OR name of a registered cell renderer to extend from.
 * If omitted, uses the constructor of the cell renderer being used by the first currently active header cell.
 * @memberOf groupedHeader
 */
function installPlugin(grid, options) {
    options = options || {};

    // 1. Creates a new renderer and adds it to the grid.
    var CellRenderer = options.CellRenderer || 'SimpleCell';

    if (typeof CellRenderer === 'string') {
        CellRenderer = grid.cellRenderers.get(CellRenderer).constructor;
    }

    if (typeof CellRenderer !== 'function') {
        throw new grid.HypergridError('Expected `options.CellRenderer` to be a constructor or a registered cell redenderer.');
    }

    /**
     * This is the cell renderer.
     * @constructor
     */
    var GroupedHeader = CellRenderer.extend(CLASS_NAME, prototypeGroupedHeader);

    // Register the GroupedHeader cell renderer, which also instantiates it
    var cellRenderer = grid.cellRenderers.add(GroupedHeader);

    // autosize the final column group tree
    grid.addEventListener('fin-grid-rendered', function() {
        if (cellRenderer.tree) {
            autosizeTree(grid.behavior, cellRenderer.tree);
            grid.checkColumnAutosizing();
        }
    });

    // Set instance variables from `options` object, overriding values in above prototype
    Object.assign(cellRenderer, options);
    delete cellRenderer.CellRenderer;

    cellRenderer.visibleColumns = grid.renderer.visibleColumns;

    // 2. Set all column headers to use the GroupedHeader cell renderer
    grid.properties.columnHeaderRenderer = CLASS_NAME;

    // 3. Extend the behavior's `setHeaders` method.
    grid.behavior.setHeaders = setHeaders; // This override calls the superclass's implementation

    // 4. Extend the behavior's `isColumnReorderable` method.
    grid.behavior.isColumnReorderable = isColumnReorderable;

    // 5. Set the data model's `groupHeaderDelimiter` property (for placement of sort direction indicator)
    grid.behavior.dataModel.groupHeaderDelimiter = cellRenderer.delimiter;
}

/**
 * @summary Set the headers _and_ set the header row height.
 * @desc Convenience function to:
 * 1. Call the underlying {@link behaviors/JSON#setHeaders|setHeaders} method.
 * 2. Set the header row height based on the maximum group depth.
 * @this {Behavior}
 * @param {string[]|object} headers - The header labels. One of:
 * * _If an array:_ Must contain all headers in column order.
 * * _If a hash:_ May contain any headers, keyed by field name, in any order.
 * @memberOf groupedHeader
 */
function setHeaders(headers) {
    var originalMethodFromPrototype = Object.getPrototypeOf(this).setHeaders,
        groupedHeaderCellRenderer = this.grid.cellRenderers.get(CLASS_NAME),
        delimiter = groupedHeaderCellRenderer.delimiter,
        levels = this.columns.reduce(function(max, column) {
            return Math.max(column.header.split(delimiter).length, max);
        }, 0),
        headerRowHeight = getRowHeight(groupedHeaderCellRenderer, this.grid.properties, levels),
        headerDataModel = this.grid.behavior.subgrids.lookup.header;

    // 1. Call the original implementation to actually set the headers
    originalMethodFromPrototype.call(this, headers);

    // 2. Set the header row height based on the maximum group depth among all active columns.
    this.grid.setRowHeight(0, headerRowHeight, headerDataModel);
}

var REGEX_EXTRACT_PX_VALUE = /\b(\d+(\.\d+)?)px\b/;
function getRowHeight(groupedHeaderCellRenderer, gridProps, levels) {
    var m = gridProps.columnHeaderFont.match(REGEX_EXTRACT_PX_VALUE),
        fontHeight = m && m[1] || 4 / 5 * gridProps.defaultRowHeight;

    return levels === 1
        ? getHeight(groupedHeaderCellRenderer.flatHeight, fontHeight)
        : getHeight(groupedHeaderCellRenderer.nestedHeight, fontHeight) * levels;
}

var REGEX_EXTRACT_PER_CENTAGE = /^(\d+(\.\d+)?)%$/;
function getHeight(factor, multiplicand) {
    var m = factor.match(REGEX_EXTRACT_PER_CENTAGE);
    return m ? m[1] / 100 * multiplicand : factor;
}

/**
 * Prevent column moving when there are any grouped headers.
 * @returns {boolean}
 * @memberOf groupedHeader
 * @inner
 */
function isColumnReorderable() {
    var originalMethodFromPrototype = Object.getPrototypeOf(this).isColumnReorderable,
        isReorderable = originalMethodFromPrototype.call(this),
        groupedHeaderCellRenderer = this.grid.cellRenderers.get(CLASS_NAME),
        delimiter = groupedHeaderCellRenderer.delimiter;

    return (
        isReorderable &&
        !this.columns.find(function(column) { // but only if no grouped columns
            return column.getCellProperty(0, 'renderer') === CLASS_NAME && // header cell using GroupedHeader
                column.header.indexOf(delimiter) !== -1; // header is part of a group
        })
    );
}

/**
 * @summary This cell renderer's paint function.
 * @desc This function renders a grouped column header when both of the following are true:
 * * Cell is a header cell.
 * * Column's header string contains the `delimiter` string.
 * @type {function}
 * @memberOf GroupedHeader#
 */

/**
 * @summary The {@link GroupedHeader|GroupedHeader} cell renderer's `paint` function.
 * @desc This function is called by the Hypergrid renderer on every grid render, once for each column header from left to right.
 * Should be set on (and only on) all header cells — regardless of whether or not the header is part of a column group.
 * (See {@link groupedHeader.setHeaders} which does this for you.)
 *
 * ### Column Autosizing
 * Autosizing is performed by the renderer as it measures the rendered with of cell content, including the header cells. The original implementation (<= `1.1.2`) only considered the column headers proper (_i.e.,_ the bottom row, _e.g.,_ the "leaf nodes" in a pivot) in calculating the column width, which had the potential to truncate lengthy group labels that exceeded the sum of the column widths.
 *
 * As of `1.2.0,` if the new plugin property `this.autosizeGroups` is truthy _and_ `config.headerTextWrapping` is falsy, columns will be autosized to prevent truncation of group labels. The algorithm to accomplish this is complicated. First we build a lists of max widths for each level of grouping and for the columns as well.
 *
 * We do and re-do the above on each successive column, just as we do and re-do the group label renderering, because we cannot tell what's coming up and therefore cannot tell for certain when a column group ends. The resulting widths are set for all the preceding columns in the group.
 *
 * @implements paintFunction
 * @memberOf groupedHeader
 */
function paintHeaderGroups(gc, config) {
    var paint = this.super.paint,
        columnIndex = config.gridCell.x,
        values = config.value.split(this.delimiter), // each group header including column header
        groupCount = values.length, // group header levels above column header
        rect = config.bounds,
        bottom = rect.y + rect.height,
        bounds = Object.assign({}, rect), // save bounds for final column header render and resetting
        prevVisCol = this.visibleColumns.find(function(visCol) {
            return visCol.columnIndex === columnIndex - 1;
        });

    // Always paint the group header background as we may be repainting it with increasing widths
    config.prefillColor = null;

    // height of each level is the same, 1/levels of total height
    rect.height /= groupCount;

    // first build a tree (this.tree) representing the group nesting so far
    for (var g = 0, y = rect.y, node = this.tree, children; g < groupCount; g++, y += rect.height, children = node.children) {
        var value = values[g];
        var widen = false;
        if (g === 0) {
            if (
                columnIndex === 0 ||
                groupCount === 1 ||
                this.groupCount !== groupCount ||
                this.tree.value !== value
            ) {
                // if we're autosizing all group levels, walk previously built tree, adjusting column widths as needed
                if (columnIndex > 0 && this.tree && this.autosizeGroups) {
                    autosizeTree(config.grid.behavior, this.tree)
                }

                node = this.tree = {
                    value: value,
                    children: [],
                    left: bounds.x,
                    width: bounds.width
                };
                if (prevVisCol && !this.columnHeaderLines && groupCount === 1) {
                    prevVisCol.top = bottom;
                }
            } else {
                widen = true;
            }
        } else if ( // subgroup the same?
            g < groupCount - 1 && // is this subgroup level not the leaf level?
            (node = children[children.length - 1]) && // and did the previous column already create a subgroup at this level?
            node.value === value // and does it have same label as this column's?
        ) {
            widen = true; // same label, so just widen it
        } else /*if (g !== 0)*/ {
            node = {
                value: value,
                children: [],
                left: bounds.x,
                width: bounds.width
            };
            children.push(node);
        }

        if (widen) {
            node.width += config.gridLinesVWidth + bounds.width;
            if (prevVisCol) {
                prevVisCol.top = this.columnHeaderLines || g < groupCount - 2 ? y + rect.height : bottom;
            }
        }

        if (g < groupCount - 1) {
            // Always paint the group header background
            config.prefillColor = null;
        }
    }

    // walk down the right-most branch and render each level (re-rendering previously rendered group labels but wider this time)
    for (g = 0, node = this.tree; g < groupCount; g++, rect.y += rect.height, node = node.children[node.children.length - 1]) {

        rect.x = node.left;
        rect.width = node.width;

        var stash = {
                isColumnHovered: config.isColumnHovered,
                isSelected: config.isSelected
            },
            gcfg = this.groupConfig,
            len = gcfg && gcfg.length,
            isGroupLabel = g < groupCount - 1;

        if (isGroupLabel) {
            // Suppress hover and selection effects for group headers
            config.isColumnHovered = config.isSelected = false;

            if (len) {
                gcfg = gcfg[g % len]; // wrap if not enough elements
                Object.keys(gcfg).forEach(stasher, this);
            }

            var paintBackground = config.paintBackground || this.paintBackground;
            if (paintBackground) {
                if (typeof paintBackground !== 'function') {
                    paintBackground = groupedHeader[paintBackground];
                }
                if (typeof paintBackground !== 'function') {
                    throw 'Expected background paint function or name of registered background paint function.';
                }
                if (!paintBackground.overlay) {
                    config.prefillColor = config.backgroundColor;
                    paintBackground.call(this, gc, config);
                }
            }
        }

        config.value = node.value;
        paint.call(this, gc, config);
        node.minWidth = config.minWidth;
        node.columnIndex = columnIndex;

        if (isGroupLabel) {
            if (paintBackground && paintBackground.overlay) {
                paintBackground.call(this, gc, config);
            }
            Object.assign(config, stash);
        }
    }

    this.groupCount = groupCount; // todo could go at bottom

    // Restore to original shape for next render
    Object.assign(rect, bounds);

    function stasher(key) {
        stash[key] = config[key];
        var property = gcfg[key];
        if (key !== 'paintBackground' && typeof property === 'function') {
            property = property.call(this, gc, config);
        }
        config[key] = property;
    }
}

function autosizeTree(behavior, tree) {
    if (tree.children.length) {
        // walk tree to (1) factor preferredWidth into leaf nodes AND (2) widen superior nodes to accommodate children
        tree.minWidth = Math.max(tree.minWidth, walkSuperior(behavior, tree));

        // walk tree to widen subordinate nodes to their parent's width
        walkSubordinate(behavior, tree);
    }
}

function walkSuperior(behavior, node) {
    if (node.children.length) {
        return node.children.reduce(function (sum, child) {
            sum += child.minWidth = Math.max(child.minWidth, walkSuperior(behavior, child));
            return sum;
        }, 0);
    } else {
        return node.minWidth = Math.max(node.minWidth, behavior.getActiveColumn(node.columnIndex).properties.preferredWidth);
    }
}

function walkSubordinate(behavior, node) {
    var childrenWidth = node.children.reduce(function(sum, child) { return sum + child.minWidth; }, 0),
        padding = (node.minWidth - childrenWidth) / node.children.length;

    node.children.forEach(function(child) {
        child.minWidth += padding;

        if (child.children.length) {
            walkSubordinate(behavior, child);
        } else {
            var column = behavior.getActiveColumn(child.columnIndex);
            column.properties.preferredWidth = child.minWidth;
        }
    });
}

var regexRGBA = /^rgba|^transparent$/;

/**
 * @summary Draw vertical gradient behind group label.
 * @desc _Do not call this function directly._
 *
 * Supply a reference to this function in the options object (first plug-in parameter):
 * * {@link GroupedHeader#paintBackground options.paintBackground}
 * * One or more elements in a {@link GroupedHeader#groupConfig options.groupConfig} array
 *
 * For example:
 * ```js
 * myGrid.installPlugins([
 *     [groupedHeaderPlugin, { paintBackground: groupedHeaderPlugin.decorateBackgroundWithLinearGradient }]
 * ]);
 * ```
 *
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function decorateBackgroundWithLinearGradient(gc, config) {
    var isTransparent,
        bounds = config.bounds,
        grad = gc.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height);

    (config.gradientStops || this.gradientStops).forEach(function(stop) {
        isTransparent = isTransparent || regexRGBA.test(stop);
        grad.addColorStop.apply(grad, stop);
    });

    if (isTransparent) {
        gc.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    gc.cache.fillStyle = grad;
    gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

/**

 * @summary Draw underscore under group label.
 * @desc _Do not call this function directly._
 *
 * Supply a reference to this function in the options object (first plug-in parameter):
 * * {@link GroupedHeader#paintBackground options.paintBackground}
 * * One or more elements in a {@link GroupedHeader#groupConfig options.groupConfig} array
 *
 * For example:
 * ```js
 * myGrid.installPlugins([
 *     [groupedHeaderPlugin, { paintBackground: groupedHeaderPlugin.decorateBackgroundWithBottomBorder }]
 * ]);
 * ```
 *
 * Albeit: The above is actually the default setting for the paintBackground option.
 *
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function decorateBackgroundWithBottomBorder(gc, config) {
    var bounds = config.bounds,
        thickness = config.thickness ||
            this.groupCount - this.groupIndex; // when `thickness` undefined, higher-order groups get progressively thicker borders

    gc.cache.fillStyle = config.gridLinesVColor;
    gc.fillRect(bounds.x, bounds.y + bounds.height - thickness, bounds.width, thickness);
}

decorateBackgroundWithBottomBorder.overlay = true;

module.exports = groupedHeader = {
    name: 'groupedHeader',
    install: installPlugin,
    decorateBackgroundWithBottomBorder: decorateBackgroundWithBottomBorder,
    decorateBackgroundWithLinearGradient: decorateBackgroundWithLinearGradient
};
