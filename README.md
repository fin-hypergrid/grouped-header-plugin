_Compatible with Hypergrid versions 1.3.0 and later. Non-overlaid background rendering requires 2.0.2 or later._

Th grouped header plug-in groups columns together by rendering hierarchical headers.

For example the column headers "Birth City" and "Birth Country" could be grouped under the label "Birth Place." To do this, install the plug-in and set the headers of the two columns to both contain the group label, as follows:

```js
    grid.behavior.columns.birthCity.header = 'Birth Place|City';
    grid.behavior.columns.birthCountry.header = 'Birth Place|Country';
```

This renders the two column headers something like this:
```
|   Birth Place  |
| City | Country |
```

Groups can be nested as well, so long as the resulting hierarchy is balanced. For example, if you also had "Birth Month" and "Birth Year," you could set up a nested hierarchy as follows:

```js
    grid.behavior.columns.birthCity.header = 'Birth Data|Where|City';
    grid.behavior.columns.birthCountry.header = 'Birth Data|Where|Country';
    grid.behavior.columns.birthMonth.header = 'Birth Data|When|Month';
    grid.behavior.columns.birthYear.header = 'Birth Data|When|Year';
```

This renders the four column headers something like this:
```
|            Birth Data         |
|     Where      |      When    |
| City | Country | Month | Year |
```

The following is an unbalanced hierarchy:

```js
    grid.behavior.columns.birthCity.header = 'Birth Data|Where|City';
    grid.behavior.columns.birthCountry.header = 'Birth Data|Where|Country';
    grid.behavior.columns.birthYear.header = 'Birth Data|Year';
```

Previous versions did not correctly render unbalanced hierarchies such as the above. The problem is the calculation of the vertical space required for each nesting level. The current version (`1.2.0`) will render unbalanced hierarchies as separate hierarchies, something like this:

```js
|   Birth Data   | Birth Data |
|     Where      |            |
| City | Country |    Year    |
```

This is not ideal and a future version may correct this problem.

### Installation
The plug-in is installed in the usual way. That is, either at grid instantiation in the `plugins` option or soon thereafter using `grid.installPlugins(pluginList)`, where `pluginsList` is a list of plug-in specs to add to the grid. For example:
```
var pluginList = [
    require('fin-hypergrid-grouped-header-plugin') // a plug-in spec
];
var grid = new Hypergrid({
    plugins: pluginList
});
// or:
var grid = new Hypergrid;
grid.installPlugins(pluginsList);
```
#### Installation options
Each plug-in may have installation arguments. To specify these arguments, make the plug-in spec an array with the first element the plug-in object and the remaining elements its arguments. For example, the grouped headers plug-in may take a single optional argument, an options object:
```js
var groupingOptions = {
    delimiter: '~'
}
var pluginList = [
    [ require('fin-hypergrid-grouped-header-plugin'), groupingOptions ]
];
```
This plug-in's options simply override the default values of the properties of the same name. For example, the above specifies the `delimiter` option, which overrides the value of the `delimiter` plug-in property.

This plug-in's properties are actually properties of the cell renderer it installs and can also be set explicitly, after installation:
```js
var groupedHeader = grid.cellRenderers.get('GroupedHeader');
groupedHeader.delimiter = '~';
```

### Plug-in properties
This plug-in has the following properties. As mentioned above, these are actually properties of the cell rendererer. The values of these properties which may be overridden as described above.

#### `delimiter`
_Default:_ `'|'`

This is the character that appears between the group levels in column header strings.

#### `paintBackground`

An additional renderer to paint a background behind — or to overlay a foreground on top of — the group labels.

This is called by the cell renderer to:
* If the function has a truthy `overlay` property: The superclass's paint function is called to paint the background (as needed) and the foreground _after which_ this paint function is called to paint an overlay on top of it. Used by `decorateBackgroundWithBottomBorder` to paint an bottom border.
* Otherwise called to paint the background _before_ it calls the superclass's paint function to paint the foreground.  Used by `decorateBackgroundWithLinearGradient` to paint an gradient behind the group label.

In the latter case, `config.prefillColor` is set to `config.backgroundColor` before calling. This signals the superclass's paint function not to paint its own background. Therefore this will only work correctly if the superclass's paint function respects `config.prefillColor` (as does the `SimpleCell` cell renderer's paint function).

As with all these properties, this one too may be overridden in `groupConfig` for the current nesting level.

#### `flatHeight`
_Default:_ `'250%'`

This specifies the height of header row when flat (when there are no grouped columns).

If the value is a string that ends with a `%` char, it is applied as a factor to the font size to get row height. Otherwise it is assumed to be an integer row height. In either case, the value is clamped to a minimum of 125% of the font size.

#### `nestedHeight`
_Default:_ `'160%'`

This specifies the height of each nested group label within a grouped header.

The total header height therefore is this amount multiplied by the header group with the deepest nesting level.

If the value is a string that ends with a `%` char, it is applied as a factor to the font size to get row height. Otherwise it is assumed to be an integer row height. In either case, the value is clamped to a minimum of 125% of the font size.

#### `autosizeGroups`
_Default:_ `true`

Column headers are included in column autosizing calculations. When this property is truthy, the plug-in runs an algorithm to include group label width in the calculations as well. Setting `autosizeGroups` to falsy will result in group labels being truncated if the sum of the widths of the columns under it are not wide enough to accommodate it fully. This algorithm gives a generally acceptable result, adding width to columns as needed to reveal the entire group label. Be warned however that the algorithm does not consider the width of the data, which may result in some columns being wider than necessary.

#### `groupConfig`
_Default:_ (See the code.)

This property is an array of configuartion override objects to be applied per grouping level. The overrides are applied to the `config` object handed to the cell renderer. Each element of the array is applied to each successively deeper grouping level. Note that these values have the potential to override _just for the current nesting level_ the other properties described above.

It is applied only to the group labels and _not_ to the column header proper (the final, "leaf" node of the hierarchy, such as "City" in the examples above).

For example, referring to the example above ("Birth Data|Where|City"), to make the top group label "Birth Data" grey, and the secondary label ("Where") darker grey:
```js
{
    groupConfig: [
        { color: '#888' }
        { color: '#555' }
    ]
}
```
When a property value is a function, the value is the return value of the function. The function is called with two parameters, `gc` and `config`; the calling context is the cell renderer.

The array is dereferenced "modulo" meaning that if there are fewer elements than there are grouping levels, the list "wraps around." The typical use case for this feature would be a single-element array applied to all levels.

#### Custom properties
Custom properties can be added for use by a `paintBackground` function. For example, the included `decorateBackgroundWithLinearGradient` function gets its list of gradient stops from a custom `gradientStops` property. For example, to fade The default list which fades the background from the background color at the bottom of the label's rectangle to white at the top:
```js
        gradientStops: function(gc, config) {
            return [
                [0, 'white'], // top
                [1, this.backgroundColor || config.backgroundColor]  // bottom
            ];
        }
```
(The only reason this is a function rather than a literal is for access to `this` and `config` at run-time.)

Note that `this.backgroundColor` refers to another custom property to be used when defined rather than `config.backgroundColor` (which is often white so not useful here).
