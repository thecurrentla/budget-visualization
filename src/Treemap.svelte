<script>
  import { getContext } from "svelte";
  import { treemap, hierarchy, treemapBinary, treemapSquarify } from "d3-hierarchy";
  import { scaleLinear } from "d3-scale";
  import { some, isEqual } from "lodash";
  import { fade, fly } from "svelte/transition";
  import { descriptions } from "./data/data.json";

  export let root, formatDollars, breadcrumbHeight;

  const { data, width, height } = getContext("LayerCake");

  const enableLists = false;

  $: x = scaleLinear().domain([0, $width]).range([0, $width]);
  $: y = scaleLinear().domain([0, $height]).range([0, $height]);

  $: treeMapFn = treemap()
    .tile(treemapBinary)
    // .padding(1)
    // .paddingInner(5)
    // .paddingOuter(5)
    .round(false)
    .size([$width, $height]);
  // $: console.log($data);

  // Sort the data by value
  $: root = treeMapFn(
    hierarchy($data)
      .sum((d) => d.amount_num)
      .sort((a, b) => b.value - a.value)
  );
  // $: console.log(root);

  $: nodes = [root].concat(root.children).filter((d) => d.value > 0);
  // $: console.log(nodes);

  $: rootChildrenValues = root.children.map((d) => d.value);
  $: opacityScale = scaleLinear()
    .domain([Math.min(...rootChildrenValues), Math.max(...rootChildrenValues)])
    .range([0.5, 0.9]);

  // $: renderedNodes = root.children
  //   .concat(root)
  //   .concat(root.children.map((d) => d.children).flat());

  // $: descendants = treeMapFn(
  //   hierarchy($data)
  //     .sum((d) => d.budget)
  //     .sort((a, b) => b.value - a.value)
  // ).descendants();

  function getID(d, separator = " / ") {
    let id = [];
    id.push(d.data[0]);
    while (d.depth > 1) {
      d = d.parent;
      id.push(d.data[0]);
    }
    return id.reverse().join(separator);
  }

  function getSizeRatio(d, root) {
    return d.value / root.value;
  }

  function getSize(d, root) {
    // if (!isEqual(d, root)) {
    //   console.log(d.data[0]);
    //   console.log(d.value / root.value);
    // }

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
      case "Government":
        return "purple";
      case "Infrastructure":
        return "blue";
      case "Public Safety":
        return "red";
      case "Community":
        return "green";
      default:
        console.log(`No color found for ${category}.`);
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
      {@const height = isEqual(d, root) ? breadcrumbHeight : y(d.y1) - y(d.y0)}

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
        {#if d.depth > 0}
          <rect
            id={`rect-${i}`}
            {width}
            {height}
            class="rect-color"
            opacity={d.depth == 1 || root.children.length == 1 ? 1 : opacityScale(d.value)}
          />
        {/if}
        <foreignObject id={`rect-${i}-fg`} x={0} y={0} {width} {height}>
          <button
            class="wrapper"
            on:click={(event) => {
              if (event.target.tagName === "A") {
                return false;
              }
              console.log(d);

              if (isRoot) {
                zoomout(root);
              } else if (isBottomLevel) {
                return false;
              } else {
                zoomin(d);
              }
            }}
          >
            <header class="header">
              {#if hasParent(d) && isRoot}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  class="arrow back"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-5.904 2.803a.5.5 0 1 0 .707-.707L6.707 6h2.768a.5.5 0 1 0 0-1H5.5a.5.5 0 0 0-.5.5v3.975a.5.5 0 0 0 1 0V6.707l4.096 4.096z"
                  />
                </svg>
              {/if}
              <div class="title">
                {#if d.parent && !d.data[0]}
                  <div class="name">{d.data.name ? d.data.name : ""}</div>
                {:else if d.parent}
                  <div class="amount">{formatDollars(d.value)}</div>
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else}
                  <div class="amount">{formatDollars(d.value)}</div>
                  <div class="name">Total Budget</div>
                {/if}
              </div>
              {#if hasChildren(d) && !isRoot}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  class="arrow expand"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
                  />
                </svg>
              {/if}
            </header>
            {#if !isRoot && getSizeRatio(d, root) > 0.05}
              <div class="content">
                {#if isBottomLevel}
                  <div class="description">{d.data.amount ? d.data.amount : ""}</div>
                {/if}
                {#if metadata && metadata.description}
                  <div class="description">{metadata.description}</div>
                {/if}
                {#if enableLists && hasChildren(d)}
                  <div class="departments">
                    <p>Includes:</p>
                    <ul>
                      {#each d.children as child}
                        <li>{child.data[0]}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if metadata && metadata.link}
                  <div class="link">
                    <a href={metadata.link}>View More</a>
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
  button {
    appearance: none;
    background: none;
    border: none;

    cursor: pointer;

    text-align: left;

    display: block;
  }

  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    transition: all 500ms;
  }
  .node.clickable {
  }

  .node.active.depth-0 {
    cursor: default;
  }

  .node.active rect {
    transition: all 500ms;
  }
  .node.root .rect-color {
    fill: var(--theme-color-lightest, white);
  }

  .rect-color {
    fill: var(--theme-color-base);
  }
  .rect-stroke {
    fill: none;
    stroke: black;
    stroke-width: 2;
  }

  .wrapper {
    width: 100%;
    height: 100%;
    padding: 0;

    display: flex;
    flex-flow: column;
    align-items: flex-start;
    justify-content: flex-start;

    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.75), transparent);
    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(circle at 25% 0%, var(--theme-color-lighter), var(--theme-color-transparent)),
      radial-gradient(ellipse at 80% 120%, var(--theme-color-base), var(--theme-color-transparent));

    transition: background-size 250ms ease, background-color 250ms ease;
  }
  .wrapper:hover,
  .wrapper:focus {
    background-color: var(--theme-color-lighter);
    background-size: 125% 125%;
  }
  .wrapper:hover .arrow,
  .wrapper:focus .arrow {
    transform: scale(1.25);
  }

  .node.root .wrapper {
    background-color: white;
    background-image: none;
  }

  .node.root .wrapper:hover,
  .node.root .wrapper:focus {
    background-color: var(--theme-color-lighter);
  }

  .header,
  .content {
    padding: min(0.5rem, 0.5em) min(0.75rem, 0.75em);

    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    line-height: 1.3;
  }

  .header {
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: min(0.5rem, 0.5em) min(0.75rem, 0.75em);
    width: 100%;
  }
  .node.root .header {
    width: auto;
  }
  .content {
  }

  .arrow {
    transition: transform 250ms ease;
  }
  .arrow:first-child {
    margin-right: 0.5em;
  }
  .arrow:last-child {
    margin-left: 0.5em;
  }

  .title {
    flex-grow: 1;

    display: flex;
    flex-flow: row wrap;
    align-items: baseline;

    gap: 0.125em 0.5em;
    font-size: var(--title-font-size);
  }

  .name {
    font-weight: 700;
  }
  .amount {
    font-weight: 900;
  }

  .content {
    font-size: 0.9em;
    font-weight: 600;

    font-size: var(--content-font-size, 1em);
  }

  .content > * + * {
    margin-top: 0.75em;
  }

  .departments {
    font-size: 0.75em;
  }
  .departments ul,
  .departments li {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .departments li {
    margin: 0.25em;
  }

  .node.root {
    font-size: 1.25em;
    --title-font-size: 1.5em;
  }
  .node.size-xl {
    font-size: 1.2em;
    --title-font-size: 1.3em;
  }
  .node.size-lg {
    font-size: 1.1em;
    --title-font-size: 1.2em;
  }
  .node.size-md {
    font-size: 1.05em;
    --title-font-size: 1.1em;
  }
  .node.size-sm {
    font-size: 0.9em;
    --title-font-size: 1.1em;
  }
  .node.size-xs {
    font-size: 0.7em;
    --title-font-size: 1.1em;
  }
  .node.size-xxs {
    font-size: 0.6em;
    --title-font-size: 1.1em;
  }
</style>
