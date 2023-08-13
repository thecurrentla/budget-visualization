<script>
  import { getContext } from "svelte";
  import { fade, fly } from "svelte/transition";

  import { treemap, hierarchy, treemapBinary, treemapSquarify, treemapSlice, treemapDice } from "d3-hierarchy";
  import { scaleLinear } from "d3-scale";
  import { some, isEqual } from "lodash-es";

  import NodeLinks from "./NodeLinks.svelte";

  import descriptions from "./data/2023-descriptions.json";

  export let root, formatDollars, breadcrumbHeight;

  const { data, width, height } = getContext("LayerCake");

  $: x = scaleLinear().domain([0, $width]).range([0, $width]);
  $: y = scaleLinear().domain([0, $height]).range([0, $height]);

  $: treeMapFn = treemap().tile(treemapSquarify.ratio(0.5)).round(false).size([$width, $height]);
  // $: console.log($data);

  // Sort the data by value
  $: root = treeMapFn(
    hierarchy($data)
      .sum((d) => d.amount_num)
      .sort((a, b) => b.value - a.value)
  );
  // $: console.log(root);

  // Get rid of nodes with no value/a negative value
  $: nodes = [root].concat(root.children).filter((d) => d.value > 0);
  // $: console.log(nodes);

  $: rootChildrenValues = root.children.map((d) => d.value);

  // Define opacity scale for adjusting
  $: opacityScale = scaleLinear()
    .domain([Math.min(...rootChildrenValues), Math.max(...rootChildrenValues)])
    .range([0.9, 0.3]);

  // $: renderedNodes = root.children
  //   .concat(root)
  //   .concat(root.children.map((d) => d.children).flat());

  // $: descendants = treeMapFn(
  //   hierarchy($data)
  //     .sum((d) => d.budget)
  //     .sort((a, b) => b.value - a.value)
  // ).descendants();

  function getParents(elem, selector) {
    // Element.matches() polyfill
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;
        };
    }

    // Set up a parent array
    var parents = [];

    // Push each parent element to the array
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (selector) {
        if (elem.matches(selector)) {
          parents.push(elem);
        }
        continue;
      }
      parents.push(elem);
    }

    // Return our parent array if not empty
    if (parents.length > 0) {
      return parents;
    }

    return false;
  }

  function getID(d, separator = " / ") {
    let id = [];
    if (d.data[0] !== undefined) {
      id.push(d.data[0]);
    }

    while (d.depth > 1) {
      d = d.parent;
      if (d.data[0] !== undefined) {
        id.push(d.data[0]);
      }
    }

    let id_return = id.reverse().join(separator);
    return id_return;
  }

  function getSizeRatio(d, root) {
    return d.value / root.value;
  }

  function getSize(d, root) {
    const ratio = getSizeRatio(d, root);

    if (ratio === 1) {
      return "full";
    } else if (ratio > 0.5) {
      return "xl";
    } else if (ratio > 0.15) {
      return "lg";
    } else if (ratio > 0.075) {
      return "md";
    } else if (ratio > 0.035) {
      return "sm";
    } else if (ratio > 0.008) {
      return "xs";
    } else {
      return "xxs";
    }
  }

  function getColor(d) {
    const category = getCategory(d, 1);
    switch (category) {
      case "Utilities":
        return "yellow";
      case "Capital Improvements":
        return "blue";
      case "Infrastructure":
        return "green";
      case "Public Safety":
        return "red";
      case "Government":
        return "purple";
      case "Community":
        return "teal";
      default:
      // console.log(`No color found for ${category}.`);
    }

    return "teal";
  }

  function getColorHex(d) {
    const category = getCategory(d, 1);
    switch (category) {
      case "Utilities":
        return "#f8de00";
      case "Capital Improvements":
        return "#4dbfdf";
      case "Infrastructure":
        return "#79a240";
      case "Public Safety":
        return "#f27558";
      case "Government":
        return "#838bc5";
      case "Community":
        return "#6bbaca";
      default:
      // console.log(`No color found for ${category}.`);
    }

    return "teal";
  }

  function getCategory(d, depth) {
    while (d.depth > depth) d = d.parent;
    return d.data[0];
  }

  function hasParent(d) {
    // console.log(d);
    if (d.parent) {
      return true;
    }

    return false;
  }

  function hasChildren(d) {
    if (d.children && d.children.length > 1) {
      return true;
    }
    return false;
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    // console.log("zoomin");
    if (d.children && d.depth <= 5) {
      x = x.domain([d.x0, d.x1]);
      y = y.domain([d.y0, d.y1]);
      root = d;
      document.activeElement.blur();
    }
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    // console.log("zooming out");
    if (d.parent) {
      x.domain([d.parent.x0, d.parent.x1]);
      y.domain([d.parent.y0, d.parent.y1]);
      root = d.parent;
    }
  }
</script>

<g class="treemap-layer">
  {#each nodes as d, i (`${d.data[0]}-${d.depth}-${d.value}`)}
    {#if d.value > 0}
      {@const width = x(d.x1) - x(d.x0)}
      {@const height = isEqual(d, root) ? $height + breadcrumbHeight : y(d.y1) - y(d.y0)}

      {@const metadata = descriptions[getID(d)]}

      {@const isRoot = isEqual(d, root)}
      {@const isBottomLevel = getSizeRatio(d, root) === 1}
      {@const isClickable = isEqual(d, root) || (!isEqual(d, root) && getSizeRatio(d, root) !== 1)}

      <g
        class={`node depth-${d.depth} has-theme-${getColor(d)} size-${getSize(d, root)}`}
        class:root={isRoot}
        class:active={some(nodes, d)}
        class:clickable={isClickable}
        transform={isRoot ? `translate(0,${-breadcrumbHeight})` : `translate(${x(d.x0)},${y(d.y0)})`}
        transition:fade={{ duration: 500 }}
      >
        {#if d.depth > 0 && !isRoot}
          <rect id={`rect-${i}-color`} {width} {height} class="rect-color" fill={isRoot ? "white" : getColorHex(d)} />
          <rect
            id={`rect-${i}-gradient-1`}
            {width}
            {height}
            class="rect-gradient"
            fill={`url(#white-large)`}
            opacity={d.depth == 1 || root.children.length == 1 ? 1 : opacityScale(d.value)}
          />
          <rect id={`rect-${i}-gradient-2`} {width} {height} class="rect-gradient" fill={`url(#white-small)`} />
        {/if}
        <foreignObject id={`rect-${i}-fg`} x={0} y={0} {width} {height}>
          <button
            class="wrapper"
            style:min-height={isRoot ? breadcrumbHeight + "px" : ""}
            on:click={(event) => {
              if (event.target.tagName === "A" || getParents(event.target, "a[href]")) {
                return false;
              }

              if (isRoot) {
                zoomout(root);
              } else if (isBottomLevel) {
                return false;
              } else {
                zoomin(d);
              }
            }}
          >
            <header class="header" style:min-height={isRoot ? breadcrumbHeight + "px" : ""}>
              {#if hasParent(d) && isRoot}
                <svg xmlns="http://www.w3.org/2000/svg" class="title-icon title-icon--large" viewBox="0 0 16 16">
                  <use xlink:href="#icon-arrow-up-left-circle" />
                </svg>
              {/if}
              <div class="title">
                {#if d.parent && d.data.name}
                  <!-- A bottom level item -->
                  <div><span class="amount">{d.data.amount ? d.data.amount : ""}</span></div>
                {:else if isRoot && d.parent}
                  <!-- The current top level item, except for the starter item -->
                  <!-- <div class="amount">{formatDollars(d.value)}</div> There isn't enough room for this in a lot of screen sizes-->
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else if d.parent}
                  <!-- Standard items -->
                  <div class="amount">{formatDollars(d.value)}</div>
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else}
                  <!-- The starter item -->
                  <!-- <div class="amount">{formatDollars(d.value)}</div> -->
                  <div class="amount">$707m</div>
                  <div class="name">Total Budget</div>
                {/if}
              </div>
              {#if isRoot && !isBottomLevel}
                <!-- This would show the links in the title/"back" button bar -->
                <!-- {#if metadata && (metadata.budget_link || metadata.info_link)}
                  <div>
                    <NodeLinks {metadata} budgetLink={metadata.budget_link} infoLink={metadata.info_link} />
                  </div>
                {/if} -->
              {/if}
              {#if hasChildren(d) && !isRoot}
                <svg xmlns="http://www.w3.org/2000/svg" class="title-icon" viewBox="0 0 16 16">
                  <use xlink:href="#icon-arrows-angle-expand" />
                </svg>
              {/if}
            </header>
            {#if getSizeRatio(d, root) > 0.05}
              <div class="content">
                {#if metadata && metadata.description}
                  <div class="description">{metadata.description}</div>
                {/if}
                {#if metadata && (metadata.budget_link || metadata.info_link)}
                  <div>
                    <NodeLinks budgetLink={metadata.budget_link} infoLink={metadata.info_link} />
                  </div>
                {/if}
              </div>
            {/if}
          </button>
        </foreignObject>
      </g>
    {/if}
  {/each}
</g>

<style>
  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    transition: all 500ms;
  }
  .node:not(.clickable) button {
    cursor: auto;
  }
  .node.active.depth-0 button {
    cursor: default;
  }

  .node.active rect {
    transition: all 500ms;
  }

  .rect-color {
    stroke: var(--theme-color-darkest);
    stroke-width: 1;
  }
  .node.root .rect-color {
    stroke-width: 0;
  }

  .wrapper {
    /* for <button> reset */
    appearance: none;
    background: none;
    border: none;

    cursor: pointer;

    text-align: left;

    display: block;

    color: black;
  }
  .wrapper {
    width: 100%;
    height: 100%;
    padding: 0.5em;

    display: flex;
    flex-flow: column;
    align-items: flex-start;
    justify-content: flex-start;

    transition: background-color 250ms ease;
  }
  .wrapper:hover,
  .wrapper:focus {
    background-color: rgba(255, 255, 255, 0.4);
  }
  .wrapper:hover .title-icon,
  .wrapper:focus .title-icon {
    /* transform: scale(1.25); */
    /* had to comment out due to safari bug, try again sometime */
  }

  .node.root .wrapper {
    height: auto;
  }

  .node.root:not(.depth-0) .wrapper:hover,
  .node.root:not(.depth-0) .wrapper:focus {
    background-color: var(--theme-color-lightest);
  }

  .header,
  .content {
    /* padding: 0.5em; */
    /* padding: min(0.5rem, 0.5em); */

    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    line-height: 1.3;

    text-shadow: 0 0 2em white;
  }

  .header {
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    width: 100%;
  }
  .content {
    padding-top: 0.25em;
  }

  .title {
    flex-grow: 1;

    display: flex;
    flex-flow: row wrap;
    align-items: baseline;

    gap: 0.125em 0.5em;
    gap: 0.125em clamp(0.33em, 0.3em + 0.25vw, 0.5em);
    font-size: var(--title-font-size);
  }

  .title-icon {
    flex-shrink: 0;

    transition: all 250ms ease;
    transform-origin: center center;

    width: 1.125em;
    height: 1.125em;
  }
  .title-icon--large {
    width: 1.5em;
    height: 1.5em;
  }
  .title-icon:first-child {
    margin-right: 0.5em;
    margin-right: clamp(0.25em, 0.2em + 0.25vw, 0.5em);
  }
  .title-icon:last-child {
    margin-left: 0.5em;
    margin-left: clamp(0.25em, 0.2em + 0.25vw, 0.5em);
  }

  .node.root .wrapper {
    overflow-x: auto;
  }
  .node.root .name {
    white-space: nowrap;
  }

  .name {
    font-weight: 700;
    font-weight: 750;
  }
  .amount {
    font-weight: 900;
  }

  .content {
    font-weight: 600;
  }
  .content > * + * {
    margin-top: 0.75em;
    margin-top: clamp(0.5em, 0.4em + 0.25vw, 0.75em);
  }

  .node.root,
  .node.size-full {
    font-size: 1.25em;
    font-size: clamp(1.15em, 1.1em + 0.5vw, 1.25em);
    --title-font-size: 1.4em;
    --title-font-size: clamp(1.3em, 1.25em + 0.5vw, 1.5em);
  }
  .node.size-xl {
    font-size: 1.2em;
    font-size: clamp(1em, 0.9em + 0.4vw, 1.2em);
    --title-font-size: 1.25em;
    --title-font-size: clamp(1.2em, 1.15em + 0.4vw, 1.3em);
  }
  .node.size-lg {
    font-size: 1.1em;
    font-size: clamp(1em, 0.85em + 0.35vw, 1.1em);
    --title-font-size: 1.2em;
    --title-font-size: clamp(1.1em, 1.05em + 0.35vw, 1.2em);
  }
  .node.size-md {
    font-size: 1.05em;
    font-size: clamp(0.9em, 0.8em + 0.3vw, 1.05em);
    --title-font-size: 1.1em;
    --title-font-size: clamp(1em, 0.8em + 0.3vw, 1.1em);
  }
  .node.size-sm {
    font-size: 0.9em;
    font-size: clamp(0.8em, 0.7em + 0.25vw, 0.9em);
    --title-font-size: 1.1em;
    --title-font-size: clamp(1em, 0.8em + 0.3vw, 1.1em);
  }
  .node.size-xs {
    font-size: 0.7em;
    font-size: clamp(0.6em, 0.5em + 0.25vw, 0.7em);
    --title-font-size: 1.1em;
    --title-font-size: clamp(1em, 0.8em + 0.3vw, 1.1em);
  }
  .node.size-xxs {
    font-size: 0.6em;
    font-size: clamp(0.5em, 0.4em + 0.25vw, 0.6em);
    --title-font-size: 1.1em;
    --title-font-size: clamp(1em, 0.8em + 0.3vw, 1.1em);
  }
</style>
